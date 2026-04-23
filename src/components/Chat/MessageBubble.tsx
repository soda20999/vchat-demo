'use client';

import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { MarkdownBlock } from '../Ui/MarkdownBlock';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

/**
 * 格式化消息时间
 */
const formatMessageTime = (date: Date | undefined): string => {
  if (!date) return '刚刚';
  
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * React Component: 消息气泡
 * 显示单条消息，支持文字和图片，区分问题和回答
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isQuestion = useMemo(() => message.type === 'question', [message.type]);
  const formattedTime = useMemo(() => formatMessageTime(message.createdAt), [message.createdAt]);

  return (
    <div className={`flex mb-8 ${isQuestion ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col ${isQuestion ? 'items-end' : 'items-start'}`}>
        <div className="mb-2 px-1 text-xs text-gray-500">
          {formattedTime}
        </div>

        {isQuestion ? (
          <div className="max-w-[85%] rounded-3xl rounded-tr-md border border-white/10 bg-[#2a2b2f] px-5 py-3 text-[15px] leading-8 text-white shadow-sm">
            {message.image && (
              <img
                src={message.image}
                alt="message"
                className="mb-3 max-w-full rounded-2xl border border-white/10"
              />
            )}
            {message.content && (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-[900px] px-2">
            {message.status === 'loading' && !message.content && (
              <div className="p-2 text-[#7ee787]">
                <Icon icon="line-md:loading-loop" width="24" height="24" />
              </div>
            )}

            {(message.content || message.status === 'streaming') && (
              <div className="rounded-2xl px-1 py-1 text-white">
                <MarkdownBlock content={message.content} status={message.status} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
