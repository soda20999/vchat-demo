'use client';

// 文件作用：渲染聊天中的单条消息气泡，包括用户提问、AI 回复、图片、加载态和重试/停止操作。
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Icon } from '@iconify/react';
import type { Message } from '@/types';
import { formatRelativeTime } from '@/lib/date-time';
import { useChatStore } from '@/stores/chatStore';

const MarkdownBlock = dynamic(
  () => import('../Ui/MarkdownBlock').then((mod) => mod.MarkdownBlock),
  {
    loading: () => (
      <div className="my-3 h-5 w-32 animate-pulse rounded bg-white/10" />
    ),
  }
);

interface MessageBubbleProps {
  // message：当前要展示的一条聊天消息数据。
  message: Message;
}

interface ActionButtonProps {
  // isGenerating：是否正在生成回复，用来决定显示停止还是重试。
  isGenerating: boolean;
  // onStop：停止当前 AI 回复生成的回调函数。
  onStop: () => void;
  // onRetry：重新生成当前回复的回调函数。
  onRetry: () => void;
}

/**
 * 函数名：ActionButton
 * 简单介绍：根据消息生成状态显示“停止”或“重试”按钮。
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  isGenerating,
  onStop,
  onRetry,
}) => {
  const icon = isGenerating ? 'lucide:square' : 'lucide:rotate-cw';
  const label = isGenerating ? 'Stop' : 'Retry';

  return (
    <button
      type="button"
      onClick={isGenerating ? onStop : onRetry}
      className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white"
    >
      <Icon icon={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
};

/**
 * React Component: 消息气泡
 * 显示单条消息，支持文字和图片，区分问题和回答
 */
// 函数名：MessageBubble；简单介绍：展示单条聊天消息，并按提问/回答渲染不同布局；参数变量名：message。
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
  const isQuestion = useMemo(() => message.type === 'question', [message.type]);
  const isError = message.status === 'error';
  const isGenerating = message.status === 'streaming' || message.status === 'loading';
  const isLoadingOnly = message.status === 'loading' && !message.content;
  const hasAnswerContent = Boolean(message.content) || isGenerating || isError;
  const formattedTime = useMemo(
    () => formatRelativeTime(message.createdAt),
    [message.createdAt]
  );
  const stopGeneration = useChatStore((state) => state.stopGeneration);
  const retryAnswer = useChatStore((state) => state.retryAnswer);

  return (
    <div className={`mb-8 flex w-full ${isQuestion ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex min-w-0 flex-col ${isQuestion ? 'max-w-[72%] items-end' : 'w-full items-start'}`}>
        <div className="mb-2 px-1 text-xs text-gray-500">
          {formattedTime}
        </div>

        {isQuestion ? (
          <div className="rounded-3xl rounded-tr-md border border-white/10 bg-[#2a2b2f] px-5 py-3 text-[15px] leading-8 text-white shadow-sm">
            {message.image && (
              <img
                src={message.image}
                alt="message"
                className="mb-3 max-w-full rounded-2xl border border-white/10"
              />
            )}
            {message.content && (
              <div className="whitespace-pre-wrap break-all">{message.content}</div>
            )}
          </div>
        ) : (
          <div className="w-full px-2">
            {isLoadingOnly && (
              <div className="p-2 text-[#7ee787]">
                <Icon icon="line-md:loading-loop" width="24" height="24" />
              </div>
            )}

            {hasAnswerContent && (
              <div className="rounded-2xl px-1 py-1 text-white">
                <MarkdownBlock content={message.content} status={message.status} />
                {isError && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    <Icon icon="lucide:circle-alert" className="h-4 w-4" />
                    <span>AI response interrupted. The generated content was kept.</span>
                  </div>
                )}
                <div className="mt-2 flex gap-2 text-xs text-gray-400">
                  <ActionButton
                    isGenerating={isGenerating}
                    onStop={stopGeneration}
                    onRetry={() => void retryAnswer(message.id)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
