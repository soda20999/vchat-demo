import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders an accessible icon button with tooltip text', () => {
    render(<IconButton icon="lucide:settings" label="设置" />);

    expect(screen.getByRole('button', { name: '设置' })).toBeTruthy();
    expect(screen.getByText('设置')).toBeTruthy();
  });

  it('runs click handler and disables while loading', () => {
    const onClick = vi.fn();
    const { rerender } = render(<IconButton icon="lucide:send" label="发送" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: '发送' }));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<IconButton icon="lucide:send" label="发送" loading onClick={onClick} />);
    expect((screen.getByRole('button', { name: '发送' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
