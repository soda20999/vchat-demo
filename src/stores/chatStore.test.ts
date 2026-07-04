import { describe, expect, it } from 'vitest';

import { hydrateConversation, hydrateMessage } from './chatStore';
import type { ConversationDto, MessageDto } from '@/types';

describe('chat store hydration', () => {
  it('hydrates conversation DTO date strings into UI Date objects', () => {
    const dto: ConversationDto = {
      id: 1,
      title: '测试会话',
      summary: null,
      selectedModel: 'qwen-plus',
      provideId: 1,
      userId: 'user-1',
      createdAt: '2026-07-04T08:00:00.000Z',
      updatedAt: '2026-07-04T08:10:00.000Z',
    };

    const conversation = hydrateConversation(dto);

    expect(conversation.createdAt).toBeInstanceOf(Date);
    expect(conversation.updatedAt).toBeInstanceOf(Date);
    expect(conversation.createdAt.toISOString()).toBe(dto.createdAt);
    expect(conversation.updatedAt.toISOString()).toBe(dto.updatedAt);
  });

  it('hydrates message DTO date strings into UI Date objects', () => {
    const dto: MessageDto = {
      id: 2,
      content: '你好',
      status: 'finished',
      conversationId: 1,
      type: 'answer',
      image: undefined,
      createdAt: '2026-07-04T08:20:00.000Z',
    };

    const message = hydrateMessage(dto);

    expect(message.createdAt).toBeInstanceOf(Date);
    expect(message.createdAt.toISOString()).toBe(dto.createdAt);
  });
});
