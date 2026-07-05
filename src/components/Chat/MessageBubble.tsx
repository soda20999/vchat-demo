'use client';

import React from 'react';

import { MessageBubbleView } from '@/components/Chat/MessageBubbleView';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/types';

type MessageBubbleProps = {
  message: Message;
};

export const MessageBubble = React.memo(function MessageBubble({ message }: MessageBubbleProps) {
  const stopGeneration = useChatStore((state) => state.stopGeneration);
  const retryAnswer = useChatStore((state) => state.retryAnswer);

  return (
    <MessageBubbleView
      message={message}
      onStop={stopGeneration}
      onRetry={() => void retryAnswer(message.id)}
    />
  );
});
