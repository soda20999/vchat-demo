import {
  createSseParser,
  encodeSseEventText,
  isChatStreamEvent,
  parseSseFrame,
  type ChatStreamEvent,
} from '../src/lib/sse-stream';
import { consumeChatStream } from '../src/lib/chat-stream-client';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);

  assert(
    actualText === expectedText,
    `${message}\nExpected: ${expectedText}\nActual:   ${actualText}`
  );
}

const delta: ChatStreamEvent = { type: 'delta', content: 'hello' };
const metadata: ChatStreamEvent = {
  type: 'metadata',
  conversationId: 12,
  conversationTitle: 'hello',
  userMessageId: 34,
  aiMessageId: 35,
};
const encodedMetadata = encodeSseEventText(metadata);

assert(
  encodedMetadata.startsWith('event: metadata\ndata: '),
  'SSE metadata event should include event name and data line'
);
assertDeepEqual(
  parseSseFrame<ChatStreamEvent>(encodedMetadata),
  metadata,
  'Metadata frame should parse back to the original event'
);
assert(
  isChatStreamEvent(parseSseFrame<unknown>(encodedMetadata)),
  'Parsed metadata frame should pass the shared chat stream event guard'
);

const encodedDelta = encodeSseEventText(delta);

assert(
  encodedDelta.startsWith('event: delta\ndata: '),
  'SSE event should include event name and data line'
);
assert(encodedDelta.endsWith('\n\n'), 'SSE event should end with a blank line');
assertDeepEqual(
  parseSseFrame<ChatStreamEvent>(encodedDelta),
  delta,
  'Single SSE frame should parse back to the original event'
);

const parser = createSseParser<ChatStreamEvent>();
const firstFrame = encodeSseEventText(metadata).replace(/\n/g, '\r\n');
const secondFrame = encodeSseEventText(delta);
const firstBatch = parser.push(`${firstFrame}${secondFrame.slice(0, 8)}`);
const secondBatch = parser.push(secondFrame.slice(8));

assertDeepEqual(
  firstBatch,
  [metadata],
  'Parser should emit metadata as the first complete CRLF frame'
);
assertDeepEqual(
  secondBatch,
  [delta],
  'Parser should emit frame completed by the next chunk'
);

const finalBatch = parser.flush();
assertDeepEqual(finalBatch, [], 'Parser flush should not emit empty tail data');

const multilineFrame = [
  'event: delta',
  'data: {"type":"delta",',
  'data: "content":"line"}',
  '',
  '',
].join('\n');
assertDeepEqual(
  parseSseFrame<ChatStreamEvent>(multilineFrame),
  { type: 'delta', content: 'line' },
  'Parser should join multiple data lines before JSON parsing'
);

const badFrame = ['event: delta', 'data: not json', '', ''].join('\n');
assert(
  parseSseFrame<ChatStreamEvent>(badFrame) === null,
  'Invalid JSON frame should be ignored'
);

async function collectStreamEvents(chunks: string[]) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });

  const events: ChatStreamEvent[] = [];
  const invalidEvents: unknown[] = [];
  let deltaText = '';

  await consumeChatStream(stream, {
    onEvent: (event) => events.push(event),
    onDelta: (event) => {
      deltaText += event.content;
    },
    onInvalidEvent: (event) => invalidEvents.push(event),
  });

  return { events, invalidEvents, deltaText };
}

async function runConsumerChecks() {
  const done: ChatStreamEvent = { type: 'done', content: 'hello world' };
  const unknownFrame = encodeSseEventText({
    type: 'usage',
    totalTokens: 12,
  });

  const streamText = [
    encodeSseEventText(metadata),
    encodeSseEventText({ type: 'delta', content: 'hello ' }),
    unknownFrame,
    encodeSseEventText({ type: 'delta', content: 'world' }),
    encodeSseEventText(done),
  ].join('');

  const result = await collectStreamEvents([
    streamText.slice(0, 17),
    streamText.slice(17, -3),
    streamText.slice(-3),
  ]);

  assertDeepEqual(
    result.events,
    [
      metadata,
      { type: 'delta', content: 'hello ' },
      { type: 'delta', content: 'world' },
      done,
    ],
    'Chat stream consumer should emit valid chat events in order across split chunks'
  );
  assert(
    result.deltaText === 'hello world',
    'Chat stream consumer should route delta events to onDelta'
  );
  assert(
    result.invalidEvents.length === 1,
    'Chat stream consumer should report parsed but unsupported events'
  );

  let errorMessage = '';
  await consumeChatStream(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            encodeSseEventText({ type: 'error', message: 'boom' })
          )
        );
        controller.close();
      },
    }),
    {
      onError: (event) => {
        errorMessage = event.message;
      },
    }
  );

  assert(
    errorMessage === 'boom',
    'Chat stream consumer should route error events to onError'
  );
}

runConsumerChecks()
  .then(() => {
    console.log('SSE stream checks passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
