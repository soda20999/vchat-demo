import { describe, expect, it } from 'vitest';

import { hydrateConversation, hydrateMessage, useChatStore } from './chatStore';
import type { ConversationDto, MessageDto } from '@/types';

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
