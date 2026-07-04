/**
 * Conversation types
 */
export interface Conversation {
  id: number;
  title: string;
  summary?: string | null;
  selectedModel: string;
  provideId: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversationDto = Omit<Conversation, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export interface CreateConversationPayload {
  title: string;
  selectedModel: string;
  provideId?: number | null;
}

export interface UpdateConversationPayload {
  title?: string;
  selectedModel?: string;
}

export interface ConversationUIState extends Conversation {
  isOptimistic?: boolean;
  isLoading?: boolean;
}

export type ConversationProps = Conversation;
