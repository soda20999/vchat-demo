'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useChatStore } from '@/stores/chatStore';

export function RootLayoutInitializer() {
  const pathname = usePathname();
  const initialize = useChatStore((state) => state.initialize);

  useEffect(() => {
    if (pathname === '/auth') return;
    void initialize();
  }, [initialize, pathname]);

  return null;
}
