import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/Ui/ConfirmDialog';

const DEFAULT_DIALOG_PROPS = {
  title: '确认退出',
  onOpenChange: vi.fn(),
  onConfirm: vi.fn(),
};

function renderDialog(props: Partial<ComponentProps<typeof ConfirmDialog>> = {}) {
  const mergedProps = {
    ...DEFAULT_DIALOG_PROPS,
    open: true,
    ...props,
  };

  return render(<ConfirmDialog {...mergedProps} />);
}

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('runs confirm and cancel callbacks', () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    renderDialog({
      description: '退出后需要重新登录。',
      confirmText: '退出',
      cancelText: '再想想',
      variant: 'danger',
      onOpenChange,
      onConfirm,
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '退出' }));
    fireEvent.click(screen.getByRole('button', { name: '再想想' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes with Escape when not loading', () => {
    const onOpenChange = vi.fn();

    renderDialog({ title: '确认删除', onOpenChange });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps open while loading', () => {
    const onOpenChange = vi.fn();

    renderDialog({ loading: true, cancelText: '取消', onOpenChange });

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(screen.getByRole('presentation'));
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
