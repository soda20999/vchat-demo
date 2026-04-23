'use client';

import React from 'react';
import { MessageBubble } from './MessageBubble';
import { useChatStore } from '@/stores/chatStore';
import { useChatScroll } from '@/hooks/useChatScroll';

/**
 * React Component: 消息列表
 * 显示当前对话的所有消息，自动滚动到最新消息
 */
export const MessageList: React.FC = () => {
  const messages = useChatStore((state) => state.messages);
  const { scrollContainer } = useChatScroll(messages);

  return (
    <div
      ref={scrollContainer}
      className="message-list h-full overflow-y-auto bg-[#141414] px-8 py-6"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .message-list::-webkit-scrollbar { display: none; }
      `}</style>
      
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
};
