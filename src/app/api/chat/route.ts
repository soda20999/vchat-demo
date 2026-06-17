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
} from '@/lib/api-error';
import type { ChatStreamEvent } from '@/lib/sse-stream';

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

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException && error.name === 'AbortError'
  ) || (
    error instanceof Error && error.name === 'AbortError'
  );
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
        let isStreamClosed = false;
        const closeStream = () => {
          if (isStreamClosed) return;
          isStreamClosed = true;
          try {
            controller.close();
          } catch {
            // Client-side aborts can close the controller before server cleanup runs.
          }
        };
        const enqueueEvent = (event: ChatStreamEvent) => {
          if (isStreamClosed || request.signal.aborted) return;
          try {
            controller.enqueue(encodeEvent(event));
          } catch {
            isStreamClosed = true;
          }
        };

        try {
          enqueueEvent({
            type: 'metadata',
            conversationId: conversation.id,
            conversationTitle: conversation.title,
            userMessageId: userMessage.id,
            aiMessageId: aiMessage.id,
          });

          await provider.streamChat(
            chatContext,
            model,
            null,
            (chunk) => {
              if (request.signal.aborted) return;

              aiContent += chunk;
              enqueueEvent({ type: 'delta', content: chunk });
            },
            image,
            body.promptSettings,
            { signal: request.signal }
          );

          await Promise.all([
            messageService.updateMessage(aiMessage.id, {
              content: aiContent,
              status: 'finished',
            }),
            conversationService.touchConversation(conversation.id),
          ]);
          enqueueEvent({ type: 'done', content: aiContent });
          closeStream();

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
          if (request.signal.aborted || isAbortError(error)) {
            await Promise.all([
              messageService.updateMessage(aiMessage.id, {
                content: aiContent,
                status: 'finished',
              }),
              conversationService.touchConversation(conversation.id),
            ]);
            closeStream();
            return;
          }

          try {
            await markAiMessageError(aiMessage.id, aiContent, conversation.id);
          } catch (cleanupError) {
            console.error('Stream error cleanup failed:', cleanupError);
          }

          enqueueEvent({
            type: 'error',
            message: getErrorMessage(error, 'AI response failed'),
          });
          closeStream();
        }
      },
    });

    return streamResponse(stream);
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
