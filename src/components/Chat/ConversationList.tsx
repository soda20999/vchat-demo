'use client';

// 文件作用：渲染侧边栏里的会话列表，支持点击切换当前会话。
import { Icon } from '@iconify/react';
import React from 'react';

import { SidebarButton } from '@/components/Ui/SidebarButton';
import { useChatStore } from '@/stores/chatStore';

type ConversationItemProps = {
  // active：当前项是否为正在查看的会话。
  active: boolean;
  // title：会话标题。
  title: string;
  // onClick：点击会话项时触发的切换函数。
  onClick: () => void;
};

/**
 * 函数名：ConversationItem
 * 简单介绍：展示单个会话条目，并根据 active 显示选中样式。
 */
const ConversationItem = React.memo(
  ({ active, title, onClick }: ConversationItemProps) => (
    <SidebarButton
      onClick={onClick}
      active={active}
      suffix={<Icon icon="lucide:pin" className="h-3.5 w-3.5 text-[#bdbdbd]" />}
      className="px-2.5"
      textClassName="font-medium"
    >
      {title}
    </SidebarButton>
  )
);

ConversationItem.displayName = 'ConversationItem';

/**
 * React Component: 对话列表
 * 显示所有保存的对话，支持点击切换对话
 */
// 函数名：ConversationList；简单介绍：展示所有保存的会话，点击后通过 switchConversation 切换上下文。
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
        <ConversationItem
          key={item.id}
          active={currentConversationId === item.id}
          title={item.title}
          onClick={() => handleSelectConversation(item.id)}
        />
      ))}
    </div>
  );
};
