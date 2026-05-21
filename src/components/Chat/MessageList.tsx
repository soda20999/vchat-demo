'use client';

// 文件作用：渲染当前会话的消息列表，并使用虚拟滚动提升长对话性能。
import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MessageBubble } from './MessageBubble';
import { useChatStore } from '@/stores/chatStore';

/**
 * React Component: 消息列表
 * 显示当前对话的所有消息，自动滚动到最新消息
 */
// 函数名：MessageList；简单介绍：从聊天状态中读取 messages，按顺序渲染 MessageBubble，并自动跟随最新输出。
export const MessageList: React.FC = () => {
  const messages = useChatStore((state) => state.messages);

  return (
    <Virtuoso
      className="message-list h-full overflow-y-auto bg-transparent py-6"
      data={messages}
      followOutput="auto"
      increaseViewportBy={500}
      computeItemKey={(_, message) => message.id}
      itemContent={(_, message) => (
        <div className="mx-auto w-full max-w-4xl px-4">
          <MessageBubble message={message} />
        </div>
      )}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .message-list::-webkit-scrollbar { display: none; }
      `}</style>
    </Virtuoso>
  );
};
