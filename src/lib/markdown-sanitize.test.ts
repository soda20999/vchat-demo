import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

import { sanitizeMarkdownHtml } from './markdown-sanitize';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (html: string) => sanitizeMarkdownHtml(DOMPurify, html);

describe('sanitizeMarkdownHtml', () => {
  it('removes scripts, event handlers, unsafe protocols, and embedded content', () => {
    const cleaned = sanitize(
      [
        '<h2 onclick="alert(1)">标题</h2>',
        '<script>alert(1)</script>',
        '<p><a href="javascript:alert(1)" onclick="alert(2)">bad</a></p>',
        '<iframe src="https://example.com"></iframe>',
        '<svg><animate onbegin="alert(1)" /></svg>',
      ].join('')
    );

    expect(cleaned).toContain('标题');
    expect(cleaned).not.toContain('<script');
    expect(cleaned).not.toContain('onclick');
    expect(cleaned).not.toContain('javascript:');
    expect(cleaned).not.toContain('<iframe');
    expect(cleaned).not.toContain('<svg');
  });

  it('keeps markdown-rendered table, link, and utility class markup', () => {
    const cleaned = sanitize(
      [
        '<div class="my-5 overflow-x-auto">',
        '<table class="min-w-full">',
        '<thead><tr><th class="px-4">Name</th></tr></thead>',
        '<tbody><tr><td class="px-4">VChat</td></tr></tbody>',
        '</table>',
        '</div>',
        '<p><a href="https://example.com" title="Example" target="_blank" rel="noopener noreferrer">safe</a></p>',
        '<span class="inline-block animate-pulse"></span>',
      ].join('')
    );

    expect(cleaned).toContain('<table');
    expect(cleaned).toContain('class="min-w-full"');
    expect(cleaned).toContain('href="https://example.com"');
    expect(cleaned).toContain('target="_blank"');
    expect(cleaned).toContain('rel="noopener noreferrer"');
    expect(cleaned).toContain('<span class="inline-block animate-pulse"></span>');
  });

  it('blocks data URLs while allowing mail and phone links', () => {
    const cleaned = sanitize(
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">data</a><a href="mailto:test@example.com">mail</a><a href="tel:+123456">tel</a>'
    );

    expect(cleaned).not.toContain('data:text/html');
    expect(cleaned).toContain('href="mailto:test@example.com"');
    expect(cleaned).toContain('href="tel:+123456"');
  });
});
