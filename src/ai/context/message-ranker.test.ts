import { describe, expect, it } from 'vitest';

import { pickRelevantMessages, type RankableMessage } from './message-ranker';

describe('pickRelevantMessages', () => {
  it('returns no history when the current question has no extractable keywords', () => {
    expect(
      pickRelevantMessages([{ type: 'question', content: 'hello world' }], 'a', 100)
    ).toEqual([]);
  });

  it('matches English keywords and returns selected messages in original order', () => {
    const messages: RankableMessage[] = [
      { type: 'question', content: 'Can PostgreSQL store vector data?' },
      { type: 'answer', content: 'I usually use PostgreSQL with pgvector.' },
      { type: 'answer', content: 'This unrelated message is newer.' },
    ];

    expect(pickRelevantMessages(messages, 'postgres pgvector setup', 100)).toEqual(
      [messages[0], messages[1]]
    );
  });

  it('matches adjacent Chinese keyword pairs', () => {
    const messages: RankableMessage[] = [
      { type: 'question', content: '我喜欢晚上学习' },
      { type: 'answer', content: '可以安排晚间复习计划' },
    ];

    expect(pickRelevantMessages(messages, '什么时候适合学习', 100)).toEqual([
      messages[0],
    ]);
  });

  it('skips messages that exceed the token budget', () => {
    const messages: RankableMessage[] = [
      { type: 'question', content: `postgres setup ${'x '.repeat(200)}` },
      { type: 'question', content: 'postgres' },
    ];

    expect(pickRelevantMessages(messages, 'postgres', 20)).toEqual([messages[1]]);
  });
});
