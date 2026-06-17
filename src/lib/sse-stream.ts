const encoder = new TextEncoder();

export type SseEventLike = {
  type?: string;
};

export type ChatStreamMetadataEvent = {
  type: 'metadata';
  conversationId: number;
  conversationTitle: string;
  userMessageId: number;
  aiMessageId: number;
};

export type ChatStreamDeltaEvent = {
  type: 'delta';
  content: string;
};

export type ChatStreamDoneEvent = {
  type: 'done';
  content: string;
};

export type ChatStreamErrorEvent = {
  type: 'error';
  message: string;
  content?: string;
};

export type ChatStreamEvent =
  | ChatStreamMetadataEvent
  | ChatStreamDeltaEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isChatStreamEvent(value: unknown): value is ChatStreamEvent {
  if (!isRecord(value) || typeof value.type !== 'string') return false;

  if (value.type === 'metadata') {
    return (
      typeof value.conversationId === 'number' &&
      typeof value.conversationTitle === 'string' &&
      typeof value.userMessageId === 'number' &&
      typeof value.aiMessageId === 'number'
    );
  }

  if (value.type === 'delta' || value.type === 'done') {
    return typeof value.content === 'string';
  }

  if (value.type === 'error') {
    return (
      typeof value.message === 'string' &&
      (value.content === undefined || typeof value.content === 'string')
    );
  }

  return false;
}

export function encodeSseEventText<T extends SseEventLike>(event: T) {
  const eventName = event.type?.trim();
  const data = JSON.stringify(event);
  const lines: string[] = [];

  if (eventName) {
    lines.push(`event: ${eventName}`);
  }

  for (const line of data.split(/\r\n|\r|\n/)) {
    lines.push(`data: ${line}`);
  }

  return `${lines.join('\n')}\n\n`;
}

export function encodeSseEvent<T extends SseEventLike>(event: T) {
  return encoder.encode(encodeSseEventText(event));
}

export function parseSseFrame<T>(frame: string): T | null {
  const dataLines: string[] = [];

  for (const rawLine of frame.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    if (!rawLine || rawLine.startsWith(':')) continue;

    const separatorIndex = rawLine.indexOf(':');
    const field =
      separatorIndex === -1 ? rawLine : rawLine.slice(0, separatorIndex);
    let value = separatorIndex === -1 ? '' : rawLine.slice(separatorIndex + 1);

    if (value.startsWith(' ')) {
      value = value.slice(1);
    }

    if (field === 'data') {
      dataLines.push(value);
    }
  }

  if (dataLines.length === 0) return null;

  try {
    return JSON.parse(dataLines.join('\n')) as T;
  } catch {
    return null;
  }
}

function findFrameBoundary(buffer: string) {
  const match = /(?:\r\n|\r|\n){2}/.exec(buffer);

  if (!match || match.index === undefined) return null;

  return {
    index: match.index,
    length: match[0].length,
  };
}

export function createSseParser<T>() {
  let buffer = '';

  const drain = () => {
    const events: T[] = [];

    while (true) {
      const boundary = findFrameBoundary(buffer);
      if (!boundary) break;

      const frame = buffer.slice(0, boundary.index);
      buffer = buffer.slice(boundary.index + boundary.length);
      const event = parseSseFrame<T>(frame);

      if (event) {
        events.push(event);
      }
    }

    return events;
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      return drain();
    },
    flush() {
      if (!buffer.trim()) {
        buffer = '';
        return [] as T[];
      }

      buffer += '\n\n';
      return drain();
    },
  };
}
