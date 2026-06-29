import { describe, expect, it } from 'vitest';

import {
  createMessageSchema,
  sendMessageSchema,
  updateUserProfileSchema,
} from './validators';

describe('validators', () => {
  it('accepts text-only and image-only chat messages after trimming content', () => {
    expect(
      sendMessageSchema.parse({
        content: '  你好  ',
        model: 'qwen-plus',
      })
    ).toMatchObject({
      content: '你好',
      model: 'qwen-plus',
    });

    expect(
      sendMessageSchema.parse({
        content: '   ',
        image: 'data:image/png;base64,abc',
        model: 'qwen-plus',
      })
    ).toMatchObject({
      content: '',
      image: 'data:image/png;base64,abc',
    });
  });

  it('rejects empty chat submissions without text or image', () => {
    expect(() =>
      sendMessageSchema.parse({
        content: '   ',
        model: 'qwen-plus',
      })
    ).toThrow(/Message content or image is required/);
  });

  it('defaults new message status to finished', () => {
    expect(
      createMessageSchema.parse({
        conversationId: 1,
        content: 'hello',
        type: 'question',
      })
    ).toMatchObject({
      status: 'finished',
    });
  });

  it('enforces profile field length constraints', () => {
    expect(updateUserProfileSchema.parse({ username: 'mu' })).toEqual({
      username: 'mu',
    });
    expect(() => updateUserProfileSchema.parse({ username: 'm' })).toThrow();
    expect(() =>
      updateUserProfileSchema.parse({ signature: 'x'.repeat(201) })
    ).toThrow();
  });
});
