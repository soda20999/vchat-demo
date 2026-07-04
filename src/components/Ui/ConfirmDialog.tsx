'use client';

import { Icon } from '@iconify/react';
import { useEffect, useId, type ReactNode } from 'react';

type ConfirmDialogVariant = 'default' | 'danger';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
};

const variantClasses: Record<ConfirmDialogVariant, string> = {
  default:
    'border-blue-400/35 bg-blue-500/15 text-blue-100 hover:border-blue-300/60 hover:bg-blue-500/25',
  danger:
    'border-red-400/35 bg-red-500/15 text-red-100 shadow-[0_0_20px_rgba(248,113,113,0.14)] hover:border-red-300/60 hover:bg-red-500/25',
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'default',
  loading = false,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onOpenChange, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={() => {
        if (!loading) onOpenChange(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-lg border border-white/10 bg-[#202123] p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-100">
            <Icon
              icon={variant === 'danger' ? 'lucide:triangle-alert' : 'lucide:circle-help'}
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-gray-100">
              {title}
            </h2>
            {description ? (
              <div className="mt-2 text-sm leading-6 text-gray-400">{description}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]}`}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Icon icon="lucide:loader-2" className="h-3.5 w-3.5 animate-spin" />
                处理中
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
