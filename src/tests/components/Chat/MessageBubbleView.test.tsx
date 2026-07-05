import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MessageBubbleView } from '@/components/Chat/MessageBubbleView';
import type { Message } from '@/types';

const baseMessage: Message = {
  id: 1,
  type: 'answer',
  status: 'finished',
  content: '测试回复',
  conversationId: 1,
  createdAt: new Date('2026-07-04T08:30:00.000Z'),
};

describe('MessageBubbleView', () => {
  it('calls retry for a finished answer', () => {
    const onRetry = vi.fn();

    render(<MessageBubbleView message={baseMessage} onStop={vi.fn()} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls stop for a generating answer', () => {
    const onStop = vi.fn();

    render(
      <MessageBubbleView
        message={{ ...baseMessage, status: 'streaming' }}
        onStop={onStop}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
