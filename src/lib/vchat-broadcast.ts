export type VchatBroadcastEventType =
  | 'conversation:updated'
  | 'message:created'
  | 'message:finished'
  | 'auth:logout';

export type VchatBroadcastEvent = {
  type: VchatBroadcastEventType;
  sourceId: string;
  conversationId?: number;
  messageId?: number;
};

const CHANNEL_NAME = 'vchat';
let sourceId: string | null = null;

function getSourceId() {
  sourceId ??= crypto.randomUUID();
  return sourceId;
}

function createChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

export function broadcastVchatEvent(event: Omit<VchatBroadcastEvent, 'sourceId'>) {
  const channel = createChannel();
  if (!channel) return;

  channel.postMessage({ ...event, sourceId: getSourceId() });
  channel.close();
}

export function subscribeVchatEvents(handler: (event: VchatBroadcastEvent) => void) {
  const channel = createChannel();
  if (!channel) return () => undefined;

  channel.onmessage = (message) => {
    const event = message.data as VchatBroadcastEvent;
    if (!event || event.sourceId === getSourceId()) return;
    handler(event);
  };

  return () => channel.close();
}
