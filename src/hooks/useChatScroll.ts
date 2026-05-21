import { useCallback, useLayoutEffect, useRef } from 'react';

interface UseChatScrollOptions {
  threshold?: number;
}

export function useChatScroll(dataSource: unknown[], options?: UseChatScrollOptions) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const threshold = options?.threshold ?? 200;

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    shouldStickToBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold;
  }, [threshold]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container || !shouldStickToBottomRef.current) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  }, []);

  useLayoutEffect(() => {
    scrollToBottom('auto');
  }, [dataSource, scrollToBottom]);

  return { scrollContainer: scrollContainerRef, scrollToBottom, handleScroll };
}
