import { afterEach, describe, expect, it, vi } from 'vitest';

import { hydrateConversation, hydrateMessage, useChatStore } from './chatStore';
import type { ConversationDto, MessageDto } from '@/types';

const broadcastVchatEvent = vi.fn();

vi.mock('@/lib/vchat-broadcast', () => ({
  broadcastVchatEvent: (...args: unknown[]) => broadcastVchatEvent(...args),
}));

function createConversationDto(overrides: Partial<ConversationDto> = {}): ConversationDto {
  return {
    id: 1,
    title: '测试会话',
    summary: null,
    selectedModel: 'qwen-plus',
    provideId: 1,
    userId: 'user-1',
    createdAt: '2026-07-04T08:00:00.000Z',
    updatedAt: '2026-07-04T08:10:00.000Z',
    ...overrides,
  };
}

function createMessageDto(overrides: Partial<MessageDto> = {}): MessageDto {
  return {
    id: 2,
    content: '你好',
    status: 'finished',
    conversationId: 1,
    type: 'answer',
    image: undefined,
    createdAt: '2026-07-04T08:20:00.000Z',
    ...overrides,
  };
}

function expectHydratedDate(date: Date, source: string) {
  expect(date).toBeInstanceOf(Date);
  expect(date.toISOString()).toBe(source);
}

afterEach(() => {
  vi.restoreAllMocks();
  broadcastVchatEvent.mockClear();
  useChatStore.setState({
    conversations: [],
    messages: [],
    currentConversationId: null,
    currentUserId: null,
    selectedModel: 'qwen-plus',
    isInitialized: false,
  });
});

function createEmptyStreamResponse() {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    }),
    { status: 200 },
  );
}

function createStreamResponse(events: Array<Record<string, unknown>>) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.close();
      },
    }),
    { status: 200 },
  );
}
function configureReadyChatStore() {
  useChatStore.setState({
    conversations: [hydrateConversation(createConversationDto({ id: 1, selectedModel: 'qwen-plus' }))],
    messages: [],
    currentConversationId: 1,
    selectedModel: 'qwen-plus',
  });
}
describe('chat store hydration', () => {
  it('hydrates conversation DTO date strings into UI Date objects', () => {
    const dto = createConversationDto();

    const conversation = hydrateConversation(dto);

    expectHydratedDate(conversation.createdAt, dto.createdAt);
    expectHydratedDate(conversation.updatedAt, dto.updatedAt);
  });

  it('hydrates message DTO date strings into UI Date objects', () => {
    const dto = createMessageDto();

    const message = hydrateMessage(dto);

    expectHydratedDate(message.createdAt, dto.createdAt);
  });

  it('keeps loaded history in chronological display order when switching conversations', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          code: 200,
          data: [
            createMessageDto({
              id: 11,
              type: 'answer',
              content: 'AI 回复',
              createdAt: '2026-07-04T08:20:00.001Z',
            }),
            createMessageDto({
              id: 12,
              type: 'question',
              content: '用户问题',
              createdAt: '2026-07-04T08:20:00.002Z',
            }),
          ],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );

    useChatStore.setState({
      conversations: [
        hydrateConversation(
          createConversationDto({
            id: 1,
            selectedModel: 'qwen-plus',
          }),
        ),
      ],
      messages: [],
      currentConversationId: null,
      selectedModel: 'qwen-plus',
    });

    try {
      await useChatStore.getState().switchConversation(1);

      expect(useChatStore.getState().messages.map((message) => message.type)).toEqual([
        'question',
        'answer',
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('chat store sendMessage', () => {
  it('adds a unique requestId to every chat request', async () => {
    configureReadyChatStore();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('request-1');
    const fetchMock = vi.fn<typeof fetch>(async () => createEmptyStreamResponse());
    vi.stubGlobal('fetch', fetchMock);

    await useChatStore.getState().sendMessage({ content: '你好' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toMatchObject({ requestId: 'request-1' });
    expect(init.headers).toMatchObject({ 'idempotency-key': 'request-1' });
  });


  it('shows a clear message when the chat api returns 409', async () => {
    configureReadyChatStore();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('request-409');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        new Response(JSON.stringify({ message: 'server conflict' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(useChatStore.getState().sendMessage({ content: 'conflict' })).rejects.toThrow(
      '当前会话正在回复中，请稍后再发送',
    );

    const answer = useChatStore.getState().messages.find((message) => message.type === 'answer');
    expect(answer?.status).toBe('error');
    expect(answer?.content).toContain('[Error] 当前会话正在回复中，请稍后再发送');
  });

  it('broadcasts message lifecycle events after metadata and done', async () => {
    configureReadyChatStore();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('request-broadcast');
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        createStreamResponse([
          {
            type: 'metadata',
            conversationId: 1,
            conversationTitle: 'Chat',
            userMessageId: 101,
            aiMessageId: 102,
          },
          { type: 'delta', content: 'answer' },
          { type: 'done', content: '' },
        ]),
      ),
    );

    await useChatStore.getState().sendMessage({ content: 'hello' });

    expect(broadcastVchatEvent).toHaveBeenCalledWith({
      type: 'message:created',
      conversationId: 1,
      messageId: 101,
    });
    expect(broadcastVchatEvent).toHaveBeenCalledWith({
      type: 'message:finished',
      conversationId: 1,
      messageId: 102,
    });
    expect(broadcastVchatEvent).toHaveBeenCalledWith({
      type: 'conversation:updated',
      conversationId: 1,
    });
  });

  it('ignores stream events after the user switches away from the request conversation', async () => {
    configureReadyChatStore();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('request-isolated');
    let resolveResponse: (response: Response) => void = () => undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    );

    const sending = useChatStore.getState().sendMessage({ content: 'hello' });
    useChatStore.setState({ currentConversationId: 2 });
    resolveResponse(createStreamResponse([{ type: 'delta', content: 'stale' }, { type: 'done', content: '' }]));
    await sending;

    const answer = useChatStore.getState().messages.find((message) => message.type === 'answer');
    expect(answer?.content).toBe('');
    expect(broadcastVchatEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'message:finished' }),
    );
  });

  it('ignores repeated sends while a request is still pending', async () => {
    configureReadyChatStore();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('request-1');

    let resolveResponse: (response: Response) => void = () => undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchMock = vi.fn<typeof fetch>(() => pendingResponse);
    vi.stubGlobal('fetch', fetchMock);

    const firstSend = useChatStore.getState().sendMessage({ content: '第一条' });
    await useChatStore.getState().sendMessage({ content: '第二条' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(useChatStore.getState().messages.filter((message) => message.type === 'question')).toHaveLength(1);

    resolveResponse(createEmptyStreamResponse());
    await firstSend;
  });
});
