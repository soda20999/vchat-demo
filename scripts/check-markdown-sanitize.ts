import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { sanitizeMarkdownHtml } from '../src/lib/markdown-sanitize';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitize = (html: string) => sanitizeMarkdownHtml(DOMPurify, html);

const unsafeHtml = [
  '<h2 onclick="alert(1)">标题</h2>',
  '<script>alert(1)</script>',
  '<p><a href="javascript:alert(1)" onclick="alert(2)">bad</a></p>',
  '<iframe src="https://example.com"></iframe>',
  '<svg><animate onbegin="alert(1)" /></svg>',
].join('');

const cleanedUnsafeHtml = sanitize(unsafeHtml);

assert.equal(cleanedUnsafeHtml.includes('<script'), false);
assert.equal(cleanedUnsafeHtml.includes('onclick'), false);
assert.equal(cleanedUnsafeHtml.includes('javascript:'), false);
assert.equal(cleanedUnsafeHtml.includes('<iframe'), false);
assert.equal(cleanedUnsafeHtml.includes('<svg'), false);
assert.equal(cleanedUnsafeHtml.includes('标题'), true);

const safeHtml = [
  '<div class="my-5 overflow-x-auto">',
  '<table class="min-w-full">',
  '<thead><tr><th class="px-4">Name</th></tr></thead>',
  '<tbody><tr><td class="px-4">VChat</td></tr></tbody>',
  '</table>',
  '</div>',
  '<p><a href="https://example.com" title="Example" target="_blank" rel="noopener noreferrer">safe</a></p>',
  '<span class="inline-block animate-pulse"></span>',
].join('');

const cleanedSafeHtml = sanitize(safeHtml);

assert.equal(cleanedSafeHtml.includes('<table'), true);
assert.equal(cleanedSafeHtml.includes('class="min-w-full"'), true);
assert.equal(cleanedSafeHtml.includes('href="https://example.com"'), true);
assert.equal(cleanedSafeHtml.includes('target="_blank"'), true);
assert.equal(cleanedSafeHtml.includes('rel="noopener noreferrer"'), true);
assert.equal(
  cleanedSafeHtml.includes('<span class="inline-block animate-pulse"></span>'),
  true
);

const blockedProtocolHtml = sanitize(
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">data</a><a href="mailto:test@example.com">mail</a><a href="tel:+123456">tel</a>'
);

assert.equal(blockedProtocolHtml.includes('data:text/html'), false);
assert.equal(blockedProtocolHtml.includes('href="mailto:test@example.com"'), true);
assert.equal(blockedProtocolHtml.includes('href="tel:+123456"'), true);

console.log('Markdown sanitize checks passed');
