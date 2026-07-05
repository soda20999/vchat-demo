'use client';

import { Icon } from '@iconify/react';
import dynamic from 'next/dynamic';
import React, { useMemo } from 'react';

import { MessageActions } from '@/components/Chat/MessageActions';
import { formatRelativeTime } from '@/lib/date-time';
import type { Message } from '@/types';

const MarkdownBlock = dynamic(
  () => import('../Ui/MarkdownBlock').then((mod) => mod.MarkdownBlock),
  {
    loading: () => <div className="my-3 h-5 w-32 animate-pulse rounded bg-white/10" />,
  },
);

type MessageBubbleViewProps = {
  message: Message;
  onStop: () => void;
  onRetry: () => void;
};

export const MessageBubbleView = React.memo(function MessageBubbleView({
  message,
  onStop,
  onRetry,
}: MessageBubbleViewProps) {
  const isQuestion = message.type === 'question';
  const isError = message.status === 'error';
  const isGenerating = message.status === 'streaming' || message.status === 'loading';
  const isLoadingOnly = message.status === 'loading' && !message.content;
  const hasAnswerContent = Boolean(message.content) || isGenerating || isError;
  const formattedTime = useMemo(() => formatRelativeTime(message.createdAt), [message.createdAt]);

  return (
    <div className={`mb-8 flex w-full ${isQuestion ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex min-w-0 flex-col ${isQuestion ? 'max-w-[72%] items-end' : 'w-full items-start'}`}
      >
        <div className="mb-2 px-1 text-xs text-gray-500">{formattedTime}</div>

        {isQuestion ? (
          <div className="rounded-3xl rounded-tr-md border border-white/10 bg-[#2a2b2f] px-5 py-3 text-[15px] leading-8 text-white shadow-sm">
            {message.image ? (
              <img
                src={message.image}
                alt="message"
                className="mb-3 max-w-full rounded-2xl border border-white/10"
              />
            ) : null}
            {message.content ? (
              <div className="whitespace-pre-wrap break-all">{message.content}</div>
            ) : null}
          </div>
        ) : (
          <div className="w-full px-2">
            {isLoadingOnly ? (
              <div className="p-2 text-[#7ee787]">
                <Icon icon="line-md:loading-loop" width="24" height="24" />
              </div>
            ) : null}

            {hasAnswerContent ? (
              <div className="rounded-2xl px-1 py-1 text-white">
                <MarkdownBlock content={message.content} status={message.status} />
                {isError ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    <Icon icon="lucide:circle-alert" className="h-4 w-4" />
                    <span>AI response interrupted. The generated content was kept.</span>
                  </div>
                ) : null}
                <div className="mt-2 flex gap-2 text-xs text-gray-400">
                  <MessageActions isGenerating={isGenerating} onStop={onStop} onRetry={onRetry} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});
