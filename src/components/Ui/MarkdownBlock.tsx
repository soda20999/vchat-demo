'use client';

import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import type { Message } from '@/types';
import { applyMarkdownTableStyles } from './Table';

interface MarkdownBlockProps {
  content: string;
  status?: Message['status'];
}

const markdownContentClassName =
  'markdown-content prose prose-invert prose-base max-w-none text-[#f2f2f2] prose-p:my-5 prose-p:leading-loose prose-li:my-3 prose-li:leading-loose prose-ul:pl-8 prose-ol:pl-8 prose-headings:my-8 prose-headings:font-bold prose-headings:text-white prose-strong:text-white prose-a:text-[#7ee787] prose-code:rounded prose-code:bg-[#0d0d0d] prose-code:px-1.5 prose-code:py-0.5 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#1e1f23] prose-blockquote:border-l-4 prose-blockquote:border-l-[#7ee787] prose-blockquote:pl-4 prose-hr:hidden';

/**
 * React Component: Markdown 渲染块
 * 支持 Markdown 语法和流式输出光标
 */
export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({
  content,
  status,
}) => {
  const md = useMemo(
    () => {
      const instance = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
      });

      applyMarkdownTableStyles(instance);
      return instance;
    },
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
    <>
      <div
        className={markdownContentClassName}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      <style jsx>{`
        .markdown-content :global(ol) {
          counter-reset: item;
          list-style: none;
          margin-left: 0;
          padding-left: 0;
        }

        .markdown-content :global(ol li) {
          position: relative;
          padding-left: 3.25rem;
        }

        .markdown-content :global(ol li::before) {
          content: counters(item, '.') '.';
          counter-increment: item;
          position: absolute;
          left: 0;
          top: 0;
          min-width: 2.25rem;
          color: #8f949c;
          font-size: 0.9em;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .markdown-content :global(ol li > ol) {
          margin-top: 0.75rem;
        }

        .markdown-content :global(li) {
          margin-top: 0.75rem !important;
          margin-bottom: 0.75rem !important;
        }

        .markdown-content :global(ul ul),
        .markdown-content :global(ol ol),
        .markdown-content :global(ul ol),
        .markdown-content :global(ol ul) {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
          padding-left: 1.5rem !important;
        }
      `}</style>
    </>
  );
};
