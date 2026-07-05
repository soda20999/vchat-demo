'use client';

import { MessageListView } from '@/components/Chat/MessageListView';
import { useChatStore } from '@/stores/chatStore';

export function MessageListContainer() {
  const messages = useChatStore((state) => state.messages);
  const stopGeneration = useChatStore((state) => state.stopGeneration);
  const retryAnswer = useChatStore((state) => state.retryAnswer);

  return (
    <MessageListView
      messages={messages}
      onStop={stopGeneration}
      onRetry={(messageId) => void retryAnswer(messageId)}
    />
  );
}
