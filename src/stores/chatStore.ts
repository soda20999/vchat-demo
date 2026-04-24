import { create } from 'zustand';

import { LOCAL_PROVIDERS } from '@/config/providers';
import type { Conversation, Message, Provider } from '@/types';

let initializePromise: Promise<void> | null = null;
let historyRequestId = 0;

interface ApiEnvelope<T> {
  data: T;
}

interface ChatState {
  conversations: Conversation[];
  providers: Provider[];
  messages: Message[];
  currentConversationId: number | null;
  currentUserId: string | null;
  selectedModel: string;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  sendMessage: (payload: { content: string; image?: string }) => Promise<void>;
  addOptimisticConversation: (tempId: number, title: string) => void;
  resolveOptimisticConversation: (
    tempId: number,
    realId: number,
    title?: string
  ) => void;
  switchConversation: (id: number) => Promise<void>;
  updateSelectedModel: (model: string) => void;
  appendMessageChunk: (text: string) => void;
  updateMessageStatus: (messageId: number, status: Message['status']) => void;
  assignNewConversationId: (oldId: number, newId: number, title: string) => void;
}

function hydrateConversation(conversation: Conversation): Conversation {
  return {
    ...conversation,
    createdAt: new Date(conversation.createdAt),
    updatedAt: new Date(conversation.updatedAt),
  };
}

function hydrateMessage(message: Message): Message {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  };
}

async function fetchApi<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = (await response.json()) as ApiEnvelope<T> & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  providers: [],
  messages: [],
  currentConversationId: null,
  currentUserId: null,
  selectedModel: '',
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      try {
        const [conversationData, providerData] = await Promise.all([
          fetchApi<Conversation[]>('/api/conversations'),
          fetchApi<Provider[]>('/api/providers').catch(() => []),
        ]);

        const providers =
          providerData.length > 0 ? providerData : LOCAL_PROVIDERS;
        const conversations = conversationData.map(hydrateConversation);
        const selectedModel =
          get().selectedModel ||
          conversations[0]?.selectedModel ||
          providers[0]?.models?.[0] ||
          '';

        set({
          conversations,
          providers,
          selectedModel,
          currentUserId: 'authenticated-user',
          isInitialized: true,
        });
      } catch (error) {
        console.error('Store initialize failed:', error);
        set((state) => ({
          providers: state.providers.length > 0 ? state.providers : LOCAL_PROVIDERS,
          currentUserId: 'authenticated-user',
          isInitialized: true,
          selectedModel:
            state.selectedModel || LOCAL_PROVIDERS[0]?.models?.[0] || '',
        }));
      } finally {
        initializePromise = null;
      }
    })();

    return initializePromise;
  },

  sendMessage: async ({ content, image }) => {
    const state = get();
    const now = new Date();
    const trimmedContent = content.trim();

    if (!trimmedContent && !image) return;
    if (!state.selectedModel) {
      throw new Error('Please select a model first');
    }

    let conversationIdForUi = state.currentConversationId;

    if (conversationIdForUi === null) {
      const tempId = -Date.now();
      const displayTitle = trimmedContent
        ? trimmedContent.slice(0, 20)
        : '[Image]';
      get().addOptimisticConversation(tempId, displayTitle);
      set({ currentConversationId: tempId });
      conversationIdForUi = tempId;
    }

    const userMessage: Message = {
      id: Date.now(),
      type: 'question',
      content: trimmedContent,
      status: 'finished',
      conversationId: conversationIdForUi,
      image,
      createdAt: now,
    };

    const aiPlaceholder: Message = {
      id: Date.now() + 1,
      type: 'answer',
      content: '',
      status: 'loading',
      conversationId: conversationIdForUi,
      createdAt: now,
    };

    set((currentState) => ({
      messages: [...currentState.messages, userMessage, aiPlaceholder],
    }));

    const provider = state.providers.find((item) =>
      item.models?.includes(state.selectedModel)
    );

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId:
            typeof state.currentConversationId === 'number' &&
            state.currentConversationId > 0
              ? state.currentConversationId
              : undefined,
          content: trimmedContent,
          image,
          model: state.selectedModel,
          providerName: provider?.name,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Chat request failed';
        try {
          const errorJson = await response.json();
          errorMessage = errorJson?.message || errorMessage;
        } catch {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        }
        throw new Error(errorMessage);
      }

      const realConversationId = Number(
        response.headers.get('x-conversation-id')
      );
      const encodedTitle = response.headers.get('x-conversation-title');
      const realConversationTitle = encodedTitle
        ? decodeURIComponent(encodedTitle)
        : undefined;

      if (
        typeof conversationIdForUi === 'number' &&
        conversationIdForUi < 0 &&
        Number.isFinite(realConversationId) &&
        realConversationId > 0
      ) {
        get().assignNewConversationId(
          conversationIdForUi,
          realConversationId,
          realConversationTitle || trimmedContent.slice(0, 20)
        );
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        if (chunkText) {
          get().appendMessageChunk(chunkText);
        }
      }

      const lastChunk = decoder.decode();
      if (lastChunk) {
        get().appendMessageChunk(lastChunk);
      }

      get().updateMessageStatus(aiPlaceholder.id, 'finished');
    } catch (error) {
      console.error('Send message failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Chat request failed';
      get().appendMessageChunk(`\n\n[Error] ${errorMessage}`);
      get().updateMessageStatus(aiPlaceholder.id, 'finished');
    }
  },

  addOptimisticConversation: (tempId, title) => {
    const { selectedModel, currentUserId } = get();
    const now = new Date();

    const newConversation: Conversation = {
      id: tempId,
      title: title || 'New Chat',
      selectedModel,
      provideId: null,
      userId: currentUserId || '',
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
    }));
  },

  resolveOptimisticConversation: (tempId, realId, title) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === tempId
          ? {
              ...conversation,
              id: realId,
              title: title || conversation.title,
              updatedAt: new Date(),
            }
          : conversation
      ),
    }));
  },

  switchConversation: async (id) => {
    const { conversations } = get();

    if (id <= 0) {
      set((state) => ({
        currentConversationId: null,
        messages: [],
        selectedModel: state.selectedModel,
      }));
      return;
    }

    const requestId = ++historyRequestId;

    set((state) => {
      const currentConversation = conversations.find(
        (conversation) => conversation.id === id
      );

      return {
        currentConversationId: id,
        messages: [],
        selectedModel: currentConversation?.selectedModel || state.selectedModel,
      };
    });

    try {
      const history = await fetchApi<Message[]>(
        `/api/conversations/${id}/messages`
      );

      if (requestId !== historyRequestId) return;

      set({ messages: history.map(hydrateMessage) });
    } catch (error) {
      if (requestId !== historyRequestId) return;
      console.error('Load history failed:', error);
    }
  },

  updateSelectedModel: (model) => {
    set({ selectedModel: model });
  },

  appendMessageChunk: (text) => {
    set((state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (!lastMessage || lastMessage.type !== 'answer') {
        return state;
      }

      const nextMessages = [...state.messages];
      nextMessages[nextMessages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content + text,
        status: 'streaming',
      };

      return { messages: nextMessages };
    });
  },

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId ? { ...message, status } : message
      ),
    }));
  },

  assignNewConversationId: (oldId, newId, title) => {
    const { currentConversationId } = get();

    set((state) => ({
      currentConversationId:
        currentConversationId === oldId ? newId : currentConversationId,
      messages: state.messages.map((message) =>
        message.conversationId === oldId
          ? { ...message, conversationId: newId }
          : message
      ),
    }));

    get().resolveOptimisticConversation(oldId, newId, title);
  },
}));
