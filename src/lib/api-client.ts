import type {
  ApiErrorEnvelope,
  ApiResponseEnvelope,
  ConversationDto,
  MessageDto,
  Provider,
  CreateConversationPayload,
  UpdateConversationPayload,
  CreateMessagePayload,
  SendMessagePayload,
} from '../types';
import { consumeChatStream } from './chat-stream-client';

const API_BASE = '/api';
const DEFAULT_USER_ID = 'test-user-001';

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  userId: string = DEFAULT_USER_ID,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = (await response.json()) as ApiResponseEnvelope<T>;

  if (!response.ok || (data.code !== undefined && data.code !== 200)) {
    throw new Error(data.message || 'Request failed');
  }

  return data.data as T;
}

export async function fetchConversations(userId?: string): Promise<ConversationDto[]> {
  return apiRequest(`/conversations`, undefined, userId);
}

export async function fetchConversation(
  id: number,
  userId?: string,
): Promise<{ conversation: ConversationDto; messages: MessageDto[] }> {
  return apiRequest(`/conversations/${id}`, undefined, userId);
}

export async function createConversation(
  payload: CreateConversationPayload,
  userId?: string,
): Promise<ConversationDto> {
  return apiRequest(
    `/conversations`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userId,
  );
}

export async function updateConversation(
  id: number,
  payload: UpdateConversationPayload,
  userId?: string,
): Promise<ConversationDto> {
  return apiRequest(
    `/conversations/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    userId,
  );
}

export async function deleteConversation(id: number, userId?: string): Promise<void> {
  return apiRequest(
    `/conversations/${id}`,
    {
      method: 'DELETE',
    },
    userId,
  );
}

export async function fetchConversationMessages(
  conversationId: number,
  userId?: string,
): Promise<MessageDto[]> {
  return apiRequest(`/conversations/${conversationId}/messages`, undefined, userId);
}

export async function createMessage(
  payload: CreateMessagePayload,
  userId?: string,
): Promise<MessageDto> {
  return apiRequest(
    `/messages`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userId,
  );
}

export async function fetchProviders(): Promise<Provider[]> {
  return apiRequest(`/providers`);
}

export async function sendMessageStream(
  payload: SendMessagePayload,
  onChunk?: (chunk: string) => void,
  userId?: string,
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
    const errorPayload = (await response.json().catch(() => null)) as ApiErrorEnvelope | null;
    throw new Error(errorPayload?.message || 'Send message failed');
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  let fullText = '';

  await consumeChatStream(response.body, {
    onDelta: (event) => {
      fullText += event.content;
      onChunk?.(event.content);
    },
    onError: (event) => {
      throw new Error(event.message);
    },
  });

  return fullText;
}
