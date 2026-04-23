'use client';

import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';

/**
 * 客户端组件：应用初始化
 * 处理 store 初始化和 Electron API 调用
 */
export function RootLayoutInitializer() {
  const initialize = useChatStore((state) => state.initialize);

  useEffect(() => {
    const initializeApp = async () => {
      // 从 Electron 获取所有对话（可选）
      try {
        if (typeof window !== 'undefined' && (window as any).electron?.chatConversation) {
          const data = await (window as any).electron.chatConversation.getAllConversations();
          if (data) {
            console.log('Conversations loaded from Electron:', data);
          }
        }
      } catch (error) {
        console.error('Failed to load conversations from Electron:', error);
      }

      // 初始化 store（加载用户的对话列表）
      await initialize('test-user-001');
    };

    initializeApp();
  }, [initialize]);

  return null;
}
