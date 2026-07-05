import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RoleRadialMenu } from '@/components/Chat/RoleRadialMenu';

const updatePromptSettings = vi.fn();

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (
    selector: (state: { updatePromptSettings: typeof updatePromptSettings }) => unknown,
  ) => selector({ updatePromptSettings }),
}));

describe('RoleRadialMenu', () => {
  it('opens four icon role buttons and shows role detail on hover', () => {
    render(<RoleRadialMenu />);

    fireEvent.click(screen.getByRole('button', { name: 'AI 角色' }));

    expect(screen.getByRole('button', { name: '饮食' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '出行' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '情绪' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '学习' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '健身' })).toBeNull();
    expect(screen.queryByRole('button', { name: '工作' })).toBeNull();

    fireEvent.mouseEnter(screen.getByRole('button', { name: '饮食' }));

    expect(screen.getByText('饮食规划助手')).toBeTruthy();
    expect(screen.getByText(/营养偏好/)).toBeTruthy();
    expect(screen.getByText(/一周轻食安排/)).toBeTruthy();
  });

  it('positions role detail above the hovered role button', () => {
    render(<RoleRadialMenu />);

    fireEvent.click(screen.getByRole('button', { name: 'AI 角色' }));
    fireEvent.mouseEnter(screen.getByRole('button', { name: '出行' }));

    const title = screen.getByText('出行规划助手');
    const detailPanel = title.parentElement?.parentElement;

    expect(detailPanel?.style.left).toContain('calc(50%');
    expect(detailPanel?.style.top).toContain('calc(50%');
    expect(detailPanel?.style.transform).toBe('translate(1.25rem, calc(-100% - 0.75rem))');
  });

  it('keeps role detail visible while moving inside the radial menu', () => {
    render(<RoleRadialMenu />);

    const triggerButton = screen.getByRole('button', { name: 'AI 角色' });
    fireEvent.click(triggerButton);
    const menuRoot = triggerButton.parentElement;
    const foodRole = screen.getByRole('button', { name: '饮食' });

    fireEvent.mouseEnter(foodRole);
    expect(screen.getByText('饮食规划助手')).toBeTruthy();

    fireEvent.mouseLeave(foodRole, { relatedTarget: triggerButton });
    expect(screen.getByText('饮食规划助手')).toBeTruthy();

    if (menuRoot) {
      fireEvent.mouseLeave(menuRoot);
    }
    expect(screen.queryByText('饮食规划助手')).toBeNull();
  });

  it('applies role prompt settings when a role is selected', () => {
    render(<RoleRadialMenu />);

    fireEvent.click(screen.getByRole('button', { name: 'AI 角色' }));
    fireEvent.click(screen.getByRole('button', { name: '情绪' }));

    expect(updatePromptSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'role-emotion',
        systemPrompt: expect.stringContaining('情绪支持'),
      }),
    );
  });
});
