'use client';

// 文件作用：在根布局中执行客户端初始化，负责进入非认证页时加载聊天基础数据。
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useChatStore } from '@/stores/chatStore';

// 函数名：RootLayoutInitializer；简单介绍：根据当前路径决定是否初始化聊天状态。
export function RootLayoutInitializer() {
  const pathname = usePathname();
  const initialize = useChatStore((state) => state.initialize);

  useEffect(() => {
    if (pathname === '/auth') return;
    void initialize();
  }, [initialize, pathname]);

  return null;
}
