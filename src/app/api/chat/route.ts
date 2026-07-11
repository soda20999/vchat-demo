import { buildChatContext, shouldSummarizeContext } from '@/ai/context/context-builder';
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
import {
  createChatRequestGuard,
  type ChatGovernanceGuard,
} from '@/lib/redis/chat-governance';
import { logger } from '@/lib/logger';
import type { ChatStreamEvent } from '@/lib/sse-stream';
import { ChatPromptSettings, sendMessageSchema } from '@/types/api';

export const runtime = 'nodejs';

const providerIdCache = new Map<string, number | null>();
const providerModelMap: Record<string, string[]> = {
  deepseek: ['deepseek-v4-pro'],
  qwen: ['qwen-plus', 'qwen-turbo'],
};

function inferProviderName(model: string) {
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('qwen')) return 'qwen';
  return '';
}

function getFallbackModel() {
  const availableProvider = getAvailableProviders()[0];
  return availableProvider ? providerModelMap[availableProvider]?.[0] || '' : '';
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

function resolvePromptSettings(promptSettings?: ChatPromptSettings) {
  const template = promptSettings?.templateId
    ? getPromptTemplate(promptSettings.templateId)
    : undefined;
  const defaults = template?.defaultParams;

  return {
    systemPrompt: promptSettings?.systemPrompt || template?.systemPrompt,
    modelParams: {
      temperature: promptSettings?.temperature ?? defaults?.temperature,
      topP: promptSettings?.topP ?? defaults?.topP,
      maxTokens: promptSettings?.maxTokens ?? defaults?.maxTokens,
    },
  };
}

function isAbortError(error: unknown) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
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
  const startedAt = Date.now();
  let governanceGuard: Extract<ChatGovernanceGuard, { allowed: true }> | undefined;
  let logContext: Record<string, unknown> = {
    scope: 'api.chat',
    streamStatus: 'started',
  };

  try {
    const parseResult = sendMessageSchema.safeParse(await request.json());
    if (!parseResult.success) {
      return streamErrorResponse(parseResult.error.issues[0]?.message || 'Invalid chat request');
    }

    const body = parseResult.data;
    const content = body.content;
    const image = body.image;
    const requestedModel = body.model;
    const model = normalizeModel(requestedModel);
    const providerName = (body.providerName || inferProviderName(model)).trim();
    const userId = getRequestUserId(request);
    const requestId = body.requestId || request.headers.get('idempotency-key')?.trim() || null;
    const requestedConversationId =
      typeof body.conversationId === 'number' && body.conversationId > 0
        ? body.conversationId
        : null;
    logContext = {
      ...logContext,
      userId,
      requestedConversationId,
      requestedModel,
      model,
      providerName,
      requestId,
      hasImage: Boolean(image),
      contentLength: content.length,
      memoryEnabled: body.contextOptions?.memoryEnabled !== false,
      summaryEnabled: body.contextOptions?.summaryEnabled !== false,
      relevantHistoryEnabled: body.contextOptions?.relevantHistoryEnabled !== false,
      recentTurns: body.contextOptions?.recentTurns,
      templateId: body.promptSettings?.templateId,
      temperature: body.promptSettings?.temperature,
      topP: body.promptSettings?.topP,
      maxTokens: body.promptSettings?.maxTokens,
    };

    if (!userId) return streamErrorResponse('Unauthorized');
    if (!requestedModel) return streamErrorResponse('Model is required');
    if (!model) return streamErrorResponse('No available model is configured');
    if (!content && !image) {
      return streamErrorResponse('Message content is required');
    }
    if (!providerName) return streamErrorResponse('Provider is required');

    const guard = await createChatRequestGuard({
      userId,
      model,
      providerName,
      conversationId: requestedConversationId,
      content,
      image,
      requestId,
      idempotencyKey: request.headers.get('idempotency-key'),
    });
    if (!guard.allowed) return streamErrorResponse(guard.message, guard.status ?? 409);
    governanceGuard = guard;

    logger.info('Chat request started', logContext);

    const provider = getAIProvider(providerName);
    const cachedProviderId = requestedConversationId ? null : await getProviderId(providerName);

    let conversation = requestedConversationId
      ? await conversationService.getUserConversation(requestedConversationId, userId)
      : undefined;

    if (!conversation) {
      conversation = await conversationService.createConversation(
        model,
        cachedProviderId ?? null,
        buildConversationTitle(content, image),
        userId,
      );
    }
    logContext = {
      ...logContext,
      conversationId: conversation.id,
      conversationCreated: !requestedConversationId,
    };

    const historyMessages = await messageService.getConversationMessages(conversation.id);
    const memories =
      body.contextOptions?.memoryEnabled === false || !content
        ? []
        : await memoryService.getRelevantMemories(userId, content).catch((memoryError) => {
            logger.warn('Load relevant memories failed', {
              ...logContext,
              error: memoryError,
            });
            return [];
          });
    logContext = {
      ...logContext,
      historyCount: historyMessages.length,
      memoryHitCount: memories.length,
    };
    const { systemPrompt, modelParams } = resolvePromptSettings(body.promptSettings);

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

    const userMessage = await messageService.createMessage(
      conversation.id,
      content,
      'question',
      'finished',
      image,
    );
    const aiMessage = await messageService.createMessage(
      conversation.id,
      '',
      'answer',
      'loading',
    );

    await conversationService.touchConversation(conversation.id);
    logContext = {
      ...logContext,
      userMessageId: userMessage.id,
      aiMessageId: aiMessage.id,
    };

    let aiContent = '';
    const encodeEvent = (event: ChatStreamEvent) => encodeStreamEvent(event);

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
        const releaseGovernance = async () => {
          await governanceGuard?.release();
          governanceGuard = undefined;
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
            modelParams,
            { signal: request.signal },
          );

          await Promise.all([
            messageService.updateMessage(aiMessage.id, {
              content: aiContent,
              status: 'finished',
            }),
            conversationService.touchConversation(conversation.id),
          ]);
          enqueueEvent({ type: 'done', content: aiContent });
          logger.info('Chat stream finished', {
            ...logContext,
            streamStatus: 'done',
            outputLength: aiContent.length,
            durationMs: Date.now() - startedAt,
          });
          closeStream();
          await releaseGovernance();

          if (body.contextOptions?.memoryEnabled !== false) {
            void memoryService.saveUserMemory(userId, content).catch((memoryError) => {
              logger.warn('Save user memory failed', {
                ...logContext,
                error: memoryError,
              });
            });
          }

          if (
            body.contextOptions?.summaryEnabled !== false &&
            shouldSummarizeContext(model, historyMessages.length + 2)
          ) {
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
                conversationService.updateConversationSummary(conversation.id, summary),
              )
              .catch((summaryError) => {
                logger.warn('Summarize conversation failed', {
                  ...logContext,
                  error: summaryError,
                });
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
            logger.info('Chat stream aborted', {
              ...logContext,
              streamStatus: 'aborted',
              outputLength: aiContent.length,
              durationMs: Date.now() - startedAt,
            });
            closeStream();
            await releaseGovernance();
            return;
          }

          try {
            await markAiMessageError(aiMessage.id, aiContent, conversation.id);
          } catch (cleanupError) {
            logger.error('Stream error cleanup failed', {
              ...logContext,
              error: cleanupError,
            });
          }

          logger.error('Chat stream failed', {
            ...logContext,
            streamStatus: 'error',
            outputLength: aiContent.length,
            durationMs: Date.now() - startedAt,
            error,
          });
          enqueueEvent({
            type: 'error',
            message: getErrorMessage(error, 'AI response failed'),
          });
          closeStream();
          await releaseGovernance();
        }
      },
    });

    return streamResponse(stream);
  } catch (error) {
    await governanceGuard?.release();
    logger.error('Chat request failed', {
      ...logContext,
      streamStatus: 'error',
      durationMs: Date.now() - startedAt,
      error,
    });
    return streamErrorResponse(getErrorMessage(error));
  }
}

async function markAiMessageError(aiMessageId: number, content: string, conversationId: number) {
  await Promise.all([
    messageService.updateMessage(aiMessageId, {
      content,
      status: 'error',
    }),
    conversationService.touchConversation(conversationId),
  ]);
}
