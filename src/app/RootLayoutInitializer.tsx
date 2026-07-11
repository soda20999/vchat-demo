'use client';

// 文件作用：在根布局中执行客户端初始化，负责进入非认证页时加载聊天基础数据。
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { subscribeVchatEvents } from '@/lib/vchat-broadcast';
import { useChatStore } from '@/stores/chatStore';

// 函数名：RootLayoutInitializer；简单介绍：根据当前路径决定是否初始化聊天状态。
export function RootLayoutInitializer() {
  const pathname = usePathname();
  const router = useRouter();
  const initialize = useChatStore((state) => state.initialize);
  const refreshConversations = useChatStore((state) => state.refreshConversations);
  const switchConversation = useChatStore((state) => state.switchConversation);
  const currentConversationId = useChatStore((state) => state.currentConversationId);

  useEffect(() => {
    if (pathname === '/auth') return;
    void initialize();
  }, [initialize, pathname]);

  useEffect(() => {
    return subscribeVchatEvents((event) => {
      if (event.type === 'auth:logout') {
        router.refresh();
        router.replace('/auth');
        return;
      }

      if (event.type === 'conversation:updated') {
        void refreshConversations();
      }

      if (
        typeof event.conversationId === 'number' &&
        event.conversationId === currentConversationId &&
        (event.type === 'message:created' || event.type === 'message:finished')
      ) {
        void switchConversation(event.conversationId);
      }
    });
  }, [currentConversationId, refreshConversations, router, switchConversation]);

  return null;
}
