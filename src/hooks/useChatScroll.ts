/**
 * React Hook: 聊天滚动管理
 * 自动滚动到最新消息（当在底部时）
 */

import { useRef, useEffect } from 'react';

interface UseChatScrollOptions {
  threshold?: number; // 距离底部多少像素时自动滚动，默认 200px
}

export function useChatScroll(dataSource: any[], options?: UseChatScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const threshold = options?.threshold ?? 200;

  /**
   * 滚动到底部
   */
  const scrollToBottom = () => {
    // 使用 setTimeout 确保 DOM 更新完成
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const isAtBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

        if (isAtBottom) {
          // 平滑滚动到底部
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
        }
      }
    }, 0);
  };

  // 监听数据源变化，自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [dataSource]);

  return { scrollContainer: scrollContainerRef, scrollToBottom };
}
