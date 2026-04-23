'use client';

import { Icon } from '@iconify/react';
import React from 'react';

import { useChatStore } from '@/stores/chatStore';

/**
 * React Component: 对话列表
 * 显示所有保存的对话，支持点击切换对话
 */
export const ConversationList: React.FC = () => {
  const conversations = useChatStore((state) => state.conversations);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const currentConversationId = useChatStore((state) => state.currentConversationId);

  const handleSelectConversation = (id: number) => {
    if (currentConversationId === id) return;
    void switchConversation(id);
  };

  return (
    <div
      className="conversation-list h-full space-y-1 overflow-y-auto pr-1"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`
        .conversation-list::-webkit-scrollbar { display: none; }
      `}</style>
      {conversations.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSelectConversation(item.id)}
          className={`flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${
            currentConversationId === item.id
              ? 'bg-[#2a2a2a] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]'
              : 'hover:bg-[#262626]'
          }`}
        >
          <h2 className="flex-1 truncate text-[14px] font-medium leading-[1.35] text-[#d2d2d2]">
            {item.title}
          </h2>
          <Icon icon="lucide:pin" className="h-3.5 w-3.5 shrink-0 text-[#bdbdbd]" />
        </button>
      ))}
    </div>
  );
};
