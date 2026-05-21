import {
  buildChatContext,
  shouldSummarizeContext,
} from '@/ai/context/context-builder';
import { summarizeMessages } from '@/ai/context/summarizer';
import { getPromptTemplate } from '@/ai/prompt/prompt-templates';
import { getAIProvider, getAvailableProviders } from '@/ai/provider-factory';
import * as conversationService from '@/db/service/conversation';
import * as memoryService from '@/db/service/memory';
import * as messageService from '@/db/service/message';
import * as providerService from '@/db/service/provide';
import {
  encodeStreamEvent,
  getErrorMessage,
  streamErrorResponse,
  streamResponse,
  writeStreamError,
} from '@/lib/api-error';

export const runtime = 'nodejs';

const providerIdCache = new Map<string, number | null>();
const providerModelMap: Record<string, string[]> = {
  deepseek: ['deepseek-v4-pro'],
  qwen: ['qwen-plus', 'qwen-turbo'],
};

interface ChatRequestBody {
  conversationId?: number | null;
  content?: string;
  image?: string;
  model?: string;
  providerName?: string;
  contextOptions?: {
    memoryEnabled?: boolean;
    summaryEnabled?: boolean;
    relevantHistoryEnabled?: boolean;
    recentTurns?: number;
  };
  promptSettings?: {
    templateId?: string;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  };
}

type ChatStreamEvent =
  | { type: 'delta'; content: string }
  | { type: 'done'; content: string }
  | { type: 'error'; message: string };

function inferProviderName(model: string) {
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('qwen')) return 'qwen';
  return '';
}

function getFallbackModel() {
  const availableProvider = getAvailableProviders()[0];
  return availableProvider
    ? providerModelMap[availableProvider]?.[0] || ''
    : '';
}

function normalizeModel(model: string) {
  return inferProviderName(model) ? model : getFallbackModel();
}

function getRequestUserId(request: Request) {
  return request.headers.get('x-user-id')?.trim() || '';
}

function buildConversationTitle(content: string, image?: string) {
  if (content) return content.slice(0, 50);
  if (image) return '[Image]';
  return 'New Chat';
}

async function getProviderId(providerName: string) {
  if (providerIdCache.has(providerName)) {
    return providerIdCache.get(providerName) ?? null;
  }

  const providerRecord = await providerService.getProviderByName(providerName);
  const providerId = providerRecord?.id ?? null;
  providerIdCache.set(providerName, providerId);
  return providerId;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const content = body.content?.trim() || '';
    const image = body.image;
    const requestedModel = body.model?.trim() || '';
    const model = normalizeModel(requestedModel);
    const providerName = (body.providerName || inferProviderName(model)).trim();
    const userId = getRequestUserId(request);
    const requestedConversationId =
      typeof body.conversationId === 'number' && body.conversationId > 0
        ? body.conversationId
        : null;

    if (!userId) return streamErrorResponse('Unauthorized');
    if (!requestedModel) return streamErrorResponse('Model is required');
    if (!model) return streamErrorResponse('No available model is configured');
    if (!content && !image) {
      return streamErrorResponse('Message content is required');
    }
    if (!providerName) return streamErrorResponse('Provider is required');

    const provider = getAIProvider(providerName);
    const cachedProviderId = requestedConversationId
      ? null
      : await getProviderId(providerName);

    let conversation = requestedConversationId
      ? await conversationService.getUserConversation(
          requestedConversationId,
          userId
        )
      : undefined;

    if (!conversation) {
      conversation = await conversationService.createConversation(
        model,
        cachedProviderId ?? null,
        buildConversationTitle(content, image),
        userId
      );
    }

    const historyMessages = await messageService.getConversationMessages(
      conversation.id
    );
    const memories =
      body.contextOptions?.memoryEnabled === false || !content
        ? []
        : await memoryService.getRelevantMemories(userId, content).catch(
            (memoryError) => {
              console.error('Load relevant memories failed:', memoryError);
              return [];
            }
          );
    const template = body.promptSettings?.templateId
      ? getPromptTemplate(body.promptSettings.templateId)
      : undefined;
    const systemPrompt =
      body.promptSettings?.systemPrompt || template?.systemPrompt;

    const chatContext = buildChatContext({
      modelName: model,
      currentContent: content,
      currentImage: image,
      summary: conversation.summary,
      systemPrompt,
      memories,
      historyMessages: historyMessages.map((message) => ({
        type: message.type,
        content: message.content,
        image: message.image,
      })),
      options: body.contextOptions,
    });

    const [userMessage, aiMessage] = await Promise.all([
      messageService.createMessage(
        conversation.id,
        content,
        'question',
        'finished',
        image
      ),
      messageService.createMessage(conversation.id, '', 'answer', 'loading'),
    ]);

    await conversationService.touchConversation(conversation.id);

    let aiContent = '';
    const encodeEvent = (event: ChatStreamEvent) =>
      encodeStreamEvent(event);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          await provider.streamChat(
            chatContext,
            model,
            null,
            (chunk) => {
              aiContent += chunk;
              controller.enqueue(encodeEvent({ type: 'delta', content: chunk }));
            },
            image,
            body.promptSettings
          );

          await Promise.all([
            messageService.updateMessage(aiMessage.id, {
              content: aiContent,
              status: 'finished',
            }),
            conversationService.touchConversation(conversation.id),
          ]);
          controller.enqueue(encodeEvent({ type: 'done', content: aiContent }));
          controller.close();

          void memoryService.saveUserMemory(userId, content).catch((memoryError) => {
            console.error('Save user memory failed:', memoryError);
          });

          if (shouldSummarizeContext(model, historyMessages.length + 2)) {
            const messagesForSummary = [
              ...historyMessages,
              { type: 'question' as const, content, image },
              { type: 'answer' as const, content: aiContent },
            ];

            void summarizeMessages({
              provider,
              modelName: model,
              previousSummary: conversation.summary,
              messages: messagesForSummary,
            })
              .then((summary) =>
                conversationService.updateConversationSummary(
                  conversation.id,
                  summary
                )
              )
              .catch((summaryError) => {
                console.error('Summarize conversation failed:', summaryError);
              });
          }
        } catch (error) {
          await writeStreamError(
            controller,
            error,
            'AI response failed',
            () =>
              markAiMessageError(aiMessage.id, aiContent, conversation.id)
          );
        }
      },
    });

    return streamResponse(stream, {
      'x-conversation-id': String(conversation.id),
      'x-conversation-title': encodeURIComponent(conversation.title),
      'x-user-message-id': String(userMessage.id),
      'x-ai-message-id': String(aiMessage.id),
    });
  } catch (error) {
    return streamErrorResponse(getErrorMessage(error));
  }
}

async function markAiMessageError(
  aiMessageId: number,
  content: string,
  conversationId: number
) {
  await Promise.all([
    messageService.updateMessage(aiMessageId, {
      content,
      status: 'error',
    }),
    conversationService.touchConversation(conversationId),
  ]);
}
