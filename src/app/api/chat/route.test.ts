import { beforeEach, describe, expect, it, vi } from 'vitest';

const streamChat = vi.fn();
const createChatRequestGuard = vi.fn();
const releaseGovernance = vi.fn();

vi.mock('@/ai/provider-factory', () => ({
  getAIProvider: vi.fn(() => ({ streamChat })),
  getAvailableProviders: vi.fn(() => ['deepseek']),
}));

vi.mock('@/ai/context/summarizer', () => ({
  summarizeMessages: vi.fn(),
}));

vi.mock('@/db/service/conversation', () => ({
  createConversation: vi.fn(async () => ({
    id: 7,
    title: 'hello',
    summary: 'old summary',
  })),
  getUserConversation: vi.fn(),
  touchConversation: vi.fn(),
  updateConversationSummary: vi.fn(),
}));

vi.mock('@/db/service/memory', () => ({
  getRelevantMemories: vi.fn(),
  saveUserMemory: vi.fn(),
}));

vi.mock('@/db/service/message', () => ({
  createMessage: vi.fn(),
  getConversationMessages: vi.fn(async () => []),
  updateMessage: vi.fn(),
}));

vi.mock('@/db/service/provide', () => ({
  getProviderByName: vi.fn(async () => ({ id: 3 })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/redis/chat-governance', () => ({
  createChatRequestGuard,
}));

const DEFAULT_CHAT_BODY = {
  content: '今晚吃什么',
  model: 'deepseek-v4-pro',
  providerName: 'deepseek',
};
const memoryService = await import('@/db/service/memory');
const messageService = await import('@/db/service/message');
const summarizer = await import('@/ai/context/summarizer');
const { POST } = await import('./route');

function createChatRequest(body: object, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'user-1',
      ...headers,
    },
    body: JSON.stringify({ ...DEFAULT_CHAT_BODY, ...body }),
  });
}

async function readStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder();
  let output = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return output;
    output += decoder.decode(value);
  }
}

function mockSuccessfulStream() {
  streamChat.mockImplementation(async (_prompt, _model, _schema, onChunk) => {
    onChunk?.('ok');
    return { answer: 'ok' };
  });
}

function expectStreamOptions(options: object) {
  expect(streamChat.mock.calls[0][5]).toMatchObject(options);
}

describe('POST /api/chat prompt settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(memoryService.getRelevantMemories).mockResolvedValue([]);
    vi.mocked(memoryService.saveUserMemory).mockResolvedValue(undefined);
    vi.mocked(messageService.createMessage)
      .mockResolvedValueOnce({ id: 11 } as never)
      .mockResolvedValueOnce({ id: 12 } as never);
    createChatRequestGuard.mockResolvedValue({
      allowed: true,
      release: releaseGovernance,
    });
    releaseGovernance.mockResolvedValue(undefined);
    mockSuccessfulStream();
  });

  it('uses backend role template defaults and respects disabled memory/summary switches', async () => {
    const response = await POST(
      createChatRequest({
        contextOptions: {
          memoryEnabled: false,
          summaryEnabled: false,
        },
        promptSettings: {
          templateId: 'role-food',
        },
      }),
    );

    await readStream(response);

    expect(streamChat).toHaveBeenCalled();
    expect(streamChat.mock.calls[0][0]).toContain('[System]');
    expect(streamChat.mock.calls[0][0]).toContain('food');
    expectStreamOptions({
      temperature: expect.any(Number),
      topP: expect.any(Number),
      maxTokens: expect.any(Number),
    });
    expect(memoryService.getRelevantMemories).not.toHaveBeenCalled();
    expect(memoryService.saveUserMemory).not.toHaveBeenCalled();
    expect(summarizer.summarizeMessages).not.toHaveBeenCalled();
    expect(createChatRequestGuard).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
      })
    );
    expect(messageService.createMessage).toHaveBeenNthCalledWith(
      1,
      7,
      expect.any(String),
      'question',
      'finished',
      undefined,
    );
    expect(messageService.createMessage).toHaveBeenNthCalledWith(
      2,
      7,
      '',
      'answer',
      'loading',
    );
    expect(releaseGovernance).toHaveBeenCalled();
  });

  it('passes body requestId to the Redis chat guard', async () => {
    const response = await POST(
      createChatRequest(
        { requestId: 'body-request-1' },
        { 'idempotency-key': 'header-request-1' },
      ),
    );

    await readStream(response);

    expect(createChatRequestGuard).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'body-request-1',
        idempotencyKey: 'header-request-1',
      }),
    );
  });

  it('keeps legacy requests without requestId compatible', async () => {
    const response = await POST(createChatRequest({}));

    await readStream(response);

    expect(response.status).toBe(200);
    expect(createChatRequestGuard).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: null,
        idempotencyKey: null,
      }),
    );
    expect(streamChat).toHaveBeenCalled();
  });

  it('lets frontend prompt settings override backend template defaults', async () => {
    const response = await POST(
      createChatRequest({
        content: '帮我复习',
        promptSettings: {
          templateId: 'role-study',
          systemPrompt: 'Custom system prompt',
          temperature: 1.2,
          topP: 0.4,
          maxTokens: 321,
        },
      }),
    );

    const output = await readStream(response);

    expect(streamChat, output).toHaveBeenCalled();
    expect(streamChat.mock.calls[0][0]).toContain('[System]\nCustom system prompt');
    expect(streamChat.mock.calls[0][5]).toEqual({
      temperature: 1.2,
      topP: 0.4,
      maxTokens: 321,
    });
  });

  it('rejects overloaded AI requests before database writes and model calls', async () => {
    createChatRequestGuard.mockResolvedValue({
      allowed: false,
      message: 'AI request rate limit exceeded',
      status: 409,
    });

    const response = await POST(createChatRequest({}));
    const output = await readStream(response);

    expect(output).toContain('AI request rate limit exceeded');
    expect(response.status).toBe(409);
    expect(messageService.createMessage).not.toHaveBeenCalled();
    expect(streamChat).not.toHaveBeenCalled();
    expect(releaseGovernance).not.toHaveBeenCalled();
  });

  it('returns 409 and the conversation lock message when the same conversation is replying', async () => {
    createChatRequestGuard.mockResolvedValue({
      allowed: false,
      message: '当前会话正在回复中，请稍后再发送',
      status: 409,
    });

    const response = await POST(createChatRequest({ conversationId: 8 }));
    const output = await readStream(response);

    expect(response.status).toBe(409);
    expect(output).toContain('当前会话正在回复中，请稍后再发送');
    expect(messageService.createMessage).not.toHaveBeenCalled();
    expect(streamChat).not.toHaveBeenCalled();
    expect(releaseGovernance).not.toHaveBeenCalled();
  });

  it('releases governance when the AI provider fails during streaming', async () => {
    streamChat.mockRejectedValue(new Error('model failed'));

    const response = await POST(createChatRequest({}));
    const output = await readStream(response);

    expect(output).toContain('model failed');
    expect(releaseGovernance).toHaveBeenCalledTimes(1);
    expect(messageService.updateMessage).toHaveBeenCalledWith(
      12,
      expect.objectContaining({ status: 'error' }),
    );
  });

  it('releases governance when database preparation fails after the guard is acquired', async () => {
    vi.mocked(messageService.getConversationMessages).mockRejectedValueOnce(
      new Error('history failed'),
    );

    const response = await POST(createChatRequest({}));
    const output = await readStream(response);

    expect(output).toContain('history failed');
    expect(releaseGovernance).toHaveBeenCalledTimes(1);
    expect(streamChat).not.toHaveBeenCalled();
  });
});
