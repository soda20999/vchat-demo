'use client';

// 文件作用：把 AI 回复中的 Markdown 文本渲染成 HTML，并处理流式输出光标和表格样式。
import React, { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import type { Message } from '@/types';
import { sanitizeMarkdownHtml } from '@/lib/markdown-sanitize';
import { applyMarkdownTableStyles } from './Table';

interface MarkdownBlockProps {
  // content：需要渲染的 Markdown 原文。
  content: string;
  // status：消息状态，用于在流式输出时显示光标。
  status?: Message['status'];
}

const markdownContentClassName =
  'markdown-content prose prose-invert prose-base max-w-none text-[#f2f2f2] prose-p:my-5 prose-p:leading-loose prose-li:my-3 prose-li:leading-loose prose-ul:pl-8 prose-ol:pl-8 prose-headings:my-8 prose-headings:font-bold prose-headings:text-white prose-strong:text-white prose-a:text-[#7ee787] prose-code:rounded prose-code:bg-[#0d0d0d] prose-code:px-1.5 prose-code:py-0.5 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[#1e1f23] prose-blockquote:border-l-4 prose-blockquote:border-l-[#7ee787] prose-blockquote:pl-4 prose-hr:hidden';

const markdownParser = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

applyMarkdownTableStyles(markdownParser);
markdownParser.renderer.rules.hr = () => '';

// 函数名：MarkdownBlock；简单介绍：解析 Markdown 内容并输出带样式的富文本；参数变量名：content、status。
export const MarkdownBlock: React.FC<MarkdownBlockProps> = React.memo(({ content, status }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    let html = markdownParser.render(content);

    if (status === 'streaming') {
      const cursorHtml =
        '<span class="inline-block w-1.5 h-4 ml-1 bg-green-700 animate-pulse align-middle"></span>';
      html = html.endsWith('</p>\n')
        ? html.replace(/<\/p>\n$/, `${cursorHtml}</p>\n`)
        : html + cursorHtml;
    }

    return sanitizeMarkdownHtml(DOMPurify, html);
  }, [content, status]);

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
});

MarkdownBlock.displayName = 'MarkdownBlock';
