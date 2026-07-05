'use client';

import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { MessageBubbleView } from '@/components/Chat/MessageBubbleView';
import type { Message } from '@/types';

type MessageListViewProps = {
  messages: Message[];
  onStop: () => void;
  onRetry: (messageId: number) => void;
};

export function MessageListView({ messages, onStop, onRetry }: MessageListViewProps) {
  const scrollerRef = React.useRef<HTMLElement | null>(null);
  const shouldStickToBottomRef = React.useRef(true);
  const lastScrollTopRef = React.useRef(0);
  const lastMessageCountRef = React.useRef(messages.length);
  const [showJumpButton, setShowJumpButton] = React.useState(false);

  const setStickToBottom = React.useCallback((stickToBottom: boolean) => {
    if (shouldStickToBottomRef.current === stickToBottom) return;
    shouldStickToBottomRef.current = stickToBottom;
    setShowJumpButton(!stickToBottom);
  }, []);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;

      scroller.scrollTop = scroller.scrollHeight;
    });
  }, []);

  React.useLayoutEffect(() => {
    const hasNewMessage = messages.length !== lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (hasNewMessage) {
      setStickToBottom(true);
    }

    if (shouldStickToBottomRef.current || hasNewMessage) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, setStickToBottom]);

  return (
    <div className="relative h-full">
      <Virtuoso
        className="message-list h-full overflow-y-auto bg-transparent py-6"
        data={messages}
        scrollerRef={(element) => {
          scrollerRef.current = element instanceof HTMLElement ? element : null;
        }}
        onScrollCapture={(event) => {
          const scroller = event.currentTarget;
          const scrollTop = scroller.scrollTop;
          const distanceToBottom = scroller.scrollHeight - scrollTop - scroller.clientHeight;

          if (scrollTop < lastScrollTopRef.current - 2) {
            setStickToBottom(false);
          } else if (distanceToBottom < 80) {
            setStickToBottom(true);
          }

          lastScrollTopRef.current = scrollTop;
        }}
        onWheelCapture={(event) => {
          if (event.deltaY < 0) setStickToBottom(false);
        }}
        onTouchMoveCapture={(event) => {
          if (event.touches.length > 0) setStickToBottom(false);
        }}
        increaseViewportBy={500}
        skipAnimationFrameInResizeObserver
        computeItemKey={(_, message) => message.id}
        itemContent={(_, message) => (
          <div className="mx-auto w-full max-w-4xl px-4">
            <MessageBubbleView
              message={message}
              onStop={onStop}
              onRetry={() => onRetry(message.id)}
            />
          </div>
        )}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      />
      {showJumpButton ? (
        <button
          type="button"
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg"
          onClick={() => {
            setStickToBottom(true);
            scrollToBottom();
          }}
        >
          回到底部
        </button>
      ) : null}
      <style>{`
        .message-list::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
