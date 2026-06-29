import { describe, expect, it } from 'vitest';

import { estimateMessageTokens, estimateTextTokens } from './token-estimator';

describe('estimateTextTokens', () => {
  it('returns zero for empty or whitespace-only text', () => {
    expect(estimateTextTokens('')).toBe(0);
    expect(estimateTextTokens('   \n\t')).toBe(0);
  });

  it('counts Chinese characters, English words, and symbols consistently', () => {
    expect(estimateTextTokens('你好 world!!')).toBe(4);
  });

  it('counts code blocks by approximate character length', () => {
    expect(estimateTextTokens('```ts\nconst a = 1\n```')).toBe(8);
  });
});

describe('estimateMessageTokens', () => {
  it('always includes role separator overhead', () => {
    expect(estimateMessageTokens({ content: '' })).toBe(8);
  });

  it('adds image token cost when an image is present', () => {
    expect(estimateMessageTokens({ content: '', image: 'data:image/png' })).toBe(
      1208
    );
  });
});
