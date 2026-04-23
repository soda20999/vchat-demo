'use client';

import React, { useEffect } from 'react';

import { MessageInput } from '@/components/Chat/MessageInput';
import { MessageList } from '@/components/Chat/MessageList';
import { ProviderSelect } from '@/components/Provider/provider-select';
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

  const handleSendMessage = async (payload: {
    content: string;
    image?: string;
  }) => {
    await sendMessage(payload);
  };

  useEffect(() => {
    void switchConversation(0);
  }, [switchConversation]);

  return (
    <div className="w-[80%] mx-auto h-full flex flex-col">
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
          </div>
        </div>
      )}

      <div className="flex items-center flex-none py-4">
        <MessageInput
          selectedModel={selectedModel}
          conversationId={0}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
}
