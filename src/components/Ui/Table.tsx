'use client';

import type MarkdownIt from 'markdown-it';

const classes = {
  wrapper: 'my-5 overflow-x-auto rounded-2xl border border-white/10',
  table: 'min-w-full border-collapse bg-[#141414] text-left text-sm text-[#e8e8e8]',
  thead: 'bg-white/5',
  row: 'border-b border-white/10 last:border-b-0',
  head: 'px-4 py-3 font-semibold text-white',
  cell: 'px-4 py-3 align-top text-[#d6d6d6]',
};

export const applyMarkdownTableStyles = (md: MarkdownIt) => {
  md.renderer.rules.table_open = () =>
    `<div class="${classes.wrapper}"><table class="${classes.table}">`;
  md.renderer.rules.table_close = () => '</table></div>';
  md.renderer.rules.thead_open = () => `<thead class="${classes.thead}">`;
  md.renderer.rules.tr_open = () => `<tr class="${classes.row}">`;
  md.renderer.rules.th_open = () => `<th class="${classes.head}">`;
  md.renderer.rules.td_open = () => `<td class="${classes.cell}">`;
};

