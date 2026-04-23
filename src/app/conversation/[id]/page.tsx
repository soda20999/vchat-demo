'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

import { MessageInput } from '@/components/Chat/MessageInput';
import { MessageList } from '@/components/Chat/MessageList';
import { useChatStore } from '@/stores/chatStore';

const formatTime = (date: Date | undefined): string => {
  if (!date) return '';

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d
    .getHours()
    .toString()
    .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function ConversationPage() {
  const params = useParams();
  const conversationId = useMemo(
    () => Number.parseInt(params?.id as string, 10),
    [params?.id]
  );

  const conversations = useChatStore((state) => state.conversations);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const selectedModel = useChatStore((state) => state.selectedModel);

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversationId, conversations]
  );

  const formattedUpdateTime = useMemo(
    () => formatTime(currentConversation?.updatedAt),
    [currentConversation?.updatedAt]
  );

  useEffect(() => {
    if (conversationId > 0) {
      void switchConversation(conversationId);
    }
  }, [conversationId, switchConversation]);

  return (
    <div className="h-screen flex flex-col">
      <div className="h-[10%] bg-gray-200 border-b border-gray-300 flex items-center justify-between px-3 flex-shrink-0">
        <h3 className="text-gray-900 font-semibold">
          {currentConversation?.title || '未知对话'}
        </h3>
        <span className="text-sm text-gray-500">{formattedUpdateTime}</span>
      </div>

      <div className="flex-1 w-[80%] mx-auto overflow-y-auto pt-2">
        <MessageList />
      </div>

      <div className="h-[15%] w-[80%] mx-auto flex items-center flex-shrink-0">
        <MessageInput
          selectedModel={selectedModel}
          conversationId={conversationId}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
