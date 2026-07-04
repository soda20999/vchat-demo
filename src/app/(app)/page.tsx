'use client';

// 文件作用：渲染首页聊天界面，负责模型选择、快捷开始、消息列表和输入框。
import React, { useEffect } from 'react';

import { MessageInput } from '@/components/Chat/MessageInput';
import { MessageList } from '@/components/Chat/MessageList';
import { LifeQuickStart } from '@/components/Prompt/LifeQuickStart';
import { ProviderSelect } from '@/components/Provider/ProviderSelecter';
import { useChatStore } from '@/stores/chatStore';

/**
 * Home page
 */
export default function HomePage() {
  const messages = useChatStore((state) => state.messages);
  const providers = useChatStore((state) => state.providers);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const updateSelectedModel = useChatStore((state) => state.updateSelectedModel);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const switchConversation = useChatStore((state) => state.switchConversation);

  // handleSendMessage：接收输入框提交的消息内容并转交给聊天状态。
  const handleSendMessage = async (payload: { content: string; image?: string }) => {
    await sendMessage(payload);
  };

  useEffect(() => {
    void switchConversation(0);
  }, [switchConversation]);

  return (
    <div className="mx-auto flex h-full w-full flex-col">
      {(messages?.length || 0) > 0 ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <MessageList />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 min-h-0">
          <div className="w-full max-w-xl">
            <ProviderSelect
              providers={providers}
              value={selectedModel}
              onChange={updateSelectedModel}
            />
            <LifeQuickStart />
          </div>
        </div>
      )}

      <div className="flex flex-none items-center py-4">
        <MessageInput selectedModel={selectedModel} conversationId={0} onSend={handleSendMessage} />
      </div>
    </div>
  );
}
