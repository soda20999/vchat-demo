'use client';

import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import type { Message } from '@/types';

interface MarkdownBlockProps {
  content: string;
  status?: Message['status'];
}

/**
 * React Component: Markdown 渲染块
 * 支持 Markdown 语法和流式输出光标
 */
export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({
  content,
  status,
}) => {
  const md = useMemo(
    () =>
      new MarkdownIt({
        html: true,
        breaks: false,
        linkify: true,
      }),
    []
  );

  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let html = md.render(content);

    // 流式输出的光标处理
    if (status === 'streaming') {
      const cursorHtml = `<span class="inline-block w-1.5 h-4 ml-1 bg-green-700 animate-pulse align-middle"></span>`;
      if (html.endsWith('</p>\n')) {
        html = html.replace(/<\/p>\n$/, `${cursorHtml}</p>\n`);
      } else {
        html += cursorHtml;
      }
    }

    return html;
  }, [content, status, md]);

  return (
    <div
      className="prose prose-invert prose-base max-w-none
                text-[17px] leading-[2.2] text-[#f2f2f2]
                prose-p:my-6 prose-p:leading-[2.2] prose-p:text-[#f2f2f2]
                prose-li:my-6 prose-li:leading-[2.2] prose-li:text-[#f2f2f2]
                prose-ul:my-6 prose-ul:pl-8
                prose-ol:my-6 prose-ol:pl-8
                prose-ul:marker:text-[#d8d8d8] prose-ol:marker:text-[#d8d8d8]
                prose-headings:my-8 prose-headings:font-bold prose-headings:text-white
                prose-h1:text-[1.9rem] prose-h2:text-[1.55rem] prose-h3:text-[1.28rem] prose-h4:text-[1.12rem]
                prose-strong:font-semibold prose-strong:text-white
                prose-a:text-[#7ee787] prose-a:no-underline
                prose-code:rounded prose-code:bg-[#0d0d0d] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-gray-300 prose-code:font-mono
                prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#1e1f23]
                prose-blockquote:my-6 prose-blockquote:border-l-[#7ee787] prose-blockquote:pl-5 prose-blockquote:text-[#d9d9d9]
                prose-hr:hidden"

      dangerouslySetInnerHTML={{ __html: renderedHtml }}
      style={{
        all: 'revert',
      } as React.CSSProperties}
    />
  );
};
