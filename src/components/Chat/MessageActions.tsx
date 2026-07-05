'use client';

import { Icon } from '@iconify/react';

type MessageActionsProps = {
  isGenerating: boolean;
  onStop: () => void;
  onRetry: () => void;
};

export function MessageActions({ isGenerating, onStop, onRetry }: MessageActionsProps) {
  const icon = isGenerating ? 'lucide:square' : 'lucide:rotate-cw';
  const label = isGenerating ? 'Stop' : 'Retry';

  return (
    <button
      type="button"
      onClick={isGenerating ? onStop : onRetry}
      className="flex items-center gap-1 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white"
    >
      <Icon icon={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
