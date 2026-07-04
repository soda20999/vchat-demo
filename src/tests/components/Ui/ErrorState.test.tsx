import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorState } from '@/components/Ui/ErrorState';

describe('ErrorState', () => {
  it('renders default error copy', () => {
    render(<ErrorState />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('出了点问题')).toBeTruthy();
    expect(screen.getByText('当前内容加载失败，请稍后再试。')).toBeTruthy();
  });

  it('runs primary and secondary actions', () => {
    const retry = vi.fn();
    const back = vi.fn();

    render(
      <ErrorState
        title="加载失败"
        description="无法读取会话"
        action={{ label: '重试', onClick: retry }}
        secondaryAction={{ label: '返回', onClick: back }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    fireEvent.click(screen.getByRole('button', { name: '返回' }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(back).toHaveBeenCalledTimes(1);
  });
});
