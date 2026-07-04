'use client';

// 文件作用：渲染指定会话详情页，展示会话标题、更新时间、消息列表和输入框。
import React, { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

import { MessageInput } from '@/components/Chat/MessageInput';
import { MessageList } from '@/components/Chat/MessageList';
import { formatRelativeTime } from '@/lib/date-time';
import { useChatStore } from '@/stores/chatStore';

// 函数名：ConversationPage；简单介绍：根据路由中的 id 加载并展示对应会话；参数变量名：params、conversationId。
export default function ConversationPage() {
  const params = useParams();
  const conversationId = useMemo(() => Number.parseInt(params?.id as string, 10), [params?.id]);

  const conversations = useChatStore((state) => state.conversations);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const selectedModel = useChatStore((state) => state.selectedModel);

  const currentConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversationId, conversations],
  );

  const formattedUpdateTime = useMemo(
    () =>
      formatRelativeTime(currentConversation?.updatedAt, {
        fallback: '',
        withSpaces: true,
      }),
    [currentConversation?.updatedAt],
  );

  useEffect(() => {
    if (conversationId > 0) {
      void switchConversation(conversationId);
    }
  }, [conversationId, switchConversation]);

  return (
    <div className="h-screen flex flex-col">
      <div className="h-[10%] bg-gray-200 border-b border-gray-300 flex items-center justify-between px-3 flex-shrink-0">
        <h3 className="text-gray-900 font-semibold">{currentConversation?.title || '未知对话'}</h3>
        <span className="text-sm text-gray-500">{formattedUpdateTime}</span>
      </div>

      <div className="min-h-0 flex-1 pt-2">
        <MessageList />
      </div>

      <div className="flex flex-shrink-0 items-center py-4">
        <MessageInput
          selectedModel={selectedModel}
          conversationId={conversationId}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
