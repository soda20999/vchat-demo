import { getAIProvider } from '@/ai/provider-factory';
import * as conversationService from '@/db/service/conversation';
import * as messageService from '@/db/service/message';
import * as providerService from '@/db/service/provide';

export const runtime = 'nodejs';

const providerIdCache = new Map<string, number | null>();

interface ChatRequestBody {
  conversationId?: number | null;
  content?: string;
  image?: string;
  model?: string;
  providerName?: string;
}

function inferProviderName(model: string) {
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('gemini')) return 'gemini';
  return '';
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
    const model = body.model?.trim() || '';
    const providerName = (body.providerName || inferProviderName(model)).trim();
    const userId = getRequestUserId(request);
    const requestedConversationId =
      typeof body.conversationId === 'number' && body.conversationId > 0
        ? body.conversationId
        : null;

    if (!userId) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!model) {
      return Response.json({ message: 'Model is required' }, { status: 400 });
    }

    if (!content && !image) {
      return Response.json(
        { message: 'Message content is required' },
        { status: 400 }
      );
    }

    if (!providerName) {
      return Response.json({ message: 'Provider is required' }, { status: 400 });
    }

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

    const encoder = new TextEncoder();
    let aiContent = '';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          await provider.streamChat(
            content,
            model,
            null,
            (chunk) => {
              aiContent += chunk;
              controller.enqueue(encoder.encode(chunk));
            },
            image
          );

          await Promise.all([
            messageService.updateMessage(aiMessage.id, {
              content: aiContent,
              status: 'finished',
            }),
            conversationService.touchConversation(conversation.id),
          ]);
          controller.close();
        } catch (error) {
          await Promise.all([
            messageService.updateMessage(aiMessage.id, {
              content: aiContent,
              status: 'finished',
            }),
            conversationService.touchConversation(conversation.id),
          ]);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'x-conversation-id': String(conversation.id),
        'x-conversation-title': encodeURIComponent(conversation.title),
        'x-user-message-id': String(userMessage.id),
        'x-ai-message-id': String(aiMessage.id),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return Response.json({ message }, { status: 500 });
  }
}
