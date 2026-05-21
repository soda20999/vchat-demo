import type {
  Conversation,
  Message,
  Provider,
  CreateConversationPayload,
  UpdateConversationPayload,
  CreateMessagePayload,
} from '../types';

const API_BASE = '/api';
const DEFAULT_USER_ID = 'test-user-001';

interface ApiEnvelope<T> {
  code?: number;
  data: T;
  message?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  userId: string = DEFAULT_USER_ID
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || (data.code !== undefined && data.code !== 200)) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data;
}

export async function fetchConversations(
  userId?: string
): Promise<Conversation[]> {
  return apiRequest(`/conversations`, undefined, userId);
}

export async function fetchConversation(
  id: number,
  userId?: string
): Promise<{ conversation: Conversation; messages: Message[] }> {
  return apiRequest(`/conversations/${id}`, undefined, userId);
}

export async function createConversation(
  payload: CreateConversationPayload,
  userId?: string
): Promise<Conversation> {
  return apiRequest(
    `/conversations`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userId
  );
}

export async function updateConversation(
  id: number,
  payload: UpdateConversationPayload,
  userId?: string
): Promise<Conversation> {
  return apiRequest(
    `/conversations/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    userId
  );
}

export async function deleteConversation(
  id: number,
  userId?: string
): Promise<void> {
  return apiRequest(
    `/conversations/${id}`,
    {
      method: 'DELETE',
    },
    userId
  );
}

export async function fetchConversationMessages(
  conversationId: number,
  userId?: string
): Promise<Message[]> {
  return apiRequest(`/conversations/${conversationId}/messages`, undefined, userId);
}

export async function createMessage(
  payload: CreateMessagePayload,
  userId?: string
): Promise<Message> {
  return apiRequest(
    `/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userId
  );
}

export async function fetchProviders(): Promise<Provider[]> {
  return apiRequest(`/providers`);
}

export async function sendMessageStream(
  payload: {
    conversationId?: number | null;
    content: string;
    model: string;
    image?: string;
    providerName?: string;
  },
  onChunk?: (chunk: string) => void,
  userId?: string
): Promise<string> {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId || DEFAULT_USER_ID,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(errorPayload?.message || 'Send message failed');
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onChunk?.(chunk);
    }

    const tail = decoder.decode();
    if (tail) {
      fullText += tail;
      onChunk?.(tail);
    }
  } finally {
    reader.releaseLock();
  }

  return fullText;
}
