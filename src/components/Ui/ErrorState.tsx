'use client';

import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';

type ErrorStateAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type ErrorStateProps = {
  title?: string;
  description?: ReactNode;
  icon?: string;
  action?: ErrorStateAction;
  secondaryAction?: ErrorStateAction;
  compact?: boolean;
  className?: string;
};

export function ErrorState({
  title = '出了点问题',
  description = '当前内容加载失败，请稍后再试。',
  icon = 'lucide:circle-alert',
  action,
  secondaryAction,
  compact = false,
  className = '',
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className={`flex w-full flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.06] text-center ${
        compact ? 'gap-3 px-4 py-5' : 'gap-4 px-6 py-8'
      } ${className}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-300">
        <Icon icon={icon} className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="max-w-md space-y-1.5">
        <h2 className="text-sm font-semibold text-red-100">{title}</h2>
        {description ? (
          <div className="text-sm leading-6 text-red-100/70">{description}</div>
        ) : null}
      </div>

      {action || secondaryAction ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {secondaryAction ? (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {secondaryAction.label}
            </button>
          ) : null}

          {action ? (
            <button
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-2 text-sm font-semibold text-red-100 shadow-[0_0_18px_rgba(248,113,113,0.12)] transition hover:border-red-300/60 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
