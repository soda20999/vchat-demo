import { describe, expect, it } from 'vitest';

import { hydrateConversation, hydrateMessage } from './chatStore';
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
});
