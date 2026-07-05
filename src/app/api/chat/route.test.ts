import { beforeEach, describe, expect, it, vi } from 'vitest';

const streamChat = vi.fn();

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

const DEFAULT_CHAT_BODY = {
  content: '今晚吃什么',
  model: 'deepseek-v4-pro',
  providerName: 'deepseek',
};
const memoryService = await import('@/db/service/memory');
const messageService = await import('@/db/service/message');
const summarizer = await import('@/ai/context/summarizer');
const { POST } = await import('./route');

function createChatRequest(body: object) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-user-id': 'user-1',
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
});
