import {
  createSseParser,
  isChatStreamEvent,
  type ChatStreamDeltaEvent,
  type ChatStreamDoneEvent,
  type ChatStreamErrorEvent,
  type ChatStreamEvent,
  type ChatStreamMetadataEvent,
} from './sse-stream';

export interface ChatStreamHandlers {
  onEvent?: (event: ChatStreamEvent) => void;
  onMetadata?: (event: ChatStreamMetadataEvent) => void;
  onDelta?: (event: ChatStreamDeltaEvent) => void;
  onDone?: (event: ChatStreamDoneEvent) => void;
  onError?: (event: ChatStreamErrorEvent) => void;
  onInvalidEvent?: (event: unknown) => void;
}

function dispatchChatStreamEvent(
  event: unknown,
  handlers: ChatStreamHandlers
) {
  if (!isChatStreamEvent(event)) {
    handlers.onInvalidEvent?.(event);
    return;
  }

  handlers.onEvent?.(event);

  if (event.type === 'metadata') {
    handlers.onMetadata?.(event);
    return;
  }

  if (event.type === 'delta') {
    handlers.onDelta?.(event);
    return;
  }

  if (event.type === 'done') {
    handlers.onDone?.(event);
    return;
  }

  handlers.onError?.(event);
}

export async function consumeChatStream(
  body: ReadableStream<Uint8Array>,
  handlers: ChatStreamHandlers
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const streamParser = createSseParser<unknown>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      for (const event of streamParser.push(
        decoder.decode(value, { stream: true })
      )) {
        dispatchChatStreamEvent(event, handlers);
      }
    }

    for (const event of streamParser.push(decoder.decode())) {
      dispatchChatStreamEvent(event, handlers);
    }

    for (const event of streamParser.flush()) {
      dispatchChatStreamEvent(event, handlers);
    }
  } finally {
    reader.releaseLock();
  }
}
