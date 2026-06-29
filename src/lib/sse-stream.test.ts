import { describe, expect, it } from 'vitest';

import { consumeChatStream } from './chat-stream-client';
import {
  createSseParser,
  encodeSseEventText,
  isChatStreamEvent,
  parseSseFrame,
  type ChatStreamEvent,
} from './sse-stream';

const metadata: ChatStreamEvent = {
  type: 'metadata',
  conversationId: 12,
  conversationTitle: 'hello',
  userMessageId: 34,
  aiMessageId: 35,
};

const delta: ChatStreamEvent = { type: 'delta', content: 'hello' };

function streamFromChunks(chunks: string[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

describe('SSE stream helpers', () => {
  it('encodes named events and parses them back into chat events', () => {
    const encoded = encodeSseEventText(metadata);

    expect(encoded).toMatch(/^event: metadata\ndata: /);
    expect(encoded.endsWith('\n\n')).toBe(true);
    expect(parseSseFrame<ChatStreamEvent>(encoded)).toEqual(metadata);
    expect(isChatStreamEvent(parseSseFrame<unknown>(encoded))).toBe(true);
  });

  it('parses complete frames split across chunks and newline styles', () => {
    const parser = createSseParser<ChatStreamEvent>();
    const firstFrame = encodeSseEventText(metadata).replace(/\n/g, '\r\n');
    const secondFrame = encodeSseEventText(delta);

    expect(parser.push(`${firstFrame}${secondFrame.slice(0, 8)}`)).toEqual([
      metadata,
    ]);
    expect(parser.push(secondFrame.slice(8))).toEqual([delta]);
    expect(parser.flush()).toEqual([]);
  });

  it('joins multiline data fields and ignores invalid JSON frames', () => {
    const multilineFrame = [
      'event: delta',
      'data: {"type":"delta",',
      'data: "content":"line"}',
      '',
      '',
    ].join('\n');
    const badFrame = ['event: delta', 'data: not json', '', ''].join('\n');

    expect(parseSseFrame<ChatStreamEvent>(multilineFrame)).toEqual({
      type: 'delta',
      content: 'line',
    });
    expect(parseSseFrame<ChatStreamEvent>(badFrame)).toBeNull();
  });
});

describe('consumeChatStream', () => {
  it('dispatches valid events, deltas, errors, and unsupported parsed events', async () => {
    const done: ChatStreamEvent = { type: 'done', content: 'hello world' };
    const streamText = [
      encodeSseEventText(metadata),
      encodeSseEventText({ type: 'delta', content: 'hello ' }),
      encodeSseEventText({ type: 'usage', totalTokens: 12 }),
      encodeSseEventText({ type: 'delta', content: 'world' }),
      encodeSseEventText(done),
      encodeSseEventText({ type: 'error', message: 'boom' }),
    ].join('');

    const events: ChatStreamEvent[] = [];
    const invalidEvents: unknown[] = [];
    const errors: string[] = [];
    let deltaText = '';

    await consumeChatStream(
      streamFromChunks([
        streamText.slice(0, 17),
        streamText.slice(17, -3),
        streamText.slice(-3),
      ]),
      {
        onEvent: (event) => events.push(event),
        onDelta: (event) => {
          deltaText += event.content;
        },
        onError: (event) => errors.push(event.message),
        onInvalidEvent: (event) => invalidEvents.push(event),
      }
    );

    expect(events).toEqual([
      metadata,
      { type: 'delta', content: 'hello ' },
      { type: 'delta', content: 'world' },
      done,
      { type: 'error', message: 'boom' },
    ]);
    expect(deltaText).toBe('hello world');
    expect(errors).toEqual(['boom']);
    expect(invalidEvents).toHaveLength(1);
  });
});
