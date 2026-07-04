'use client';

import type { ReactNode } from 'react';

type ChatToolbarProps = {
  start?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
  className?: string;
  label?: string;
};

export function ChatToolbar({
  start,
  end,
  children,
  className = '',
  label = '聊天工具栏',
}: ChatToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={label}
      className={`flex flex-wrap items-center justify-between gap-3 ${className}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {start}
        {children}
      </div>
      {end ? <div className="flex items-center gap-2">{end}</div> : null}
    </div>
  );
}
