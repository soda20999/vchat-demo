import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RoleRadialMenu } from '@/components/Chat/RoleRadialMenu';

const DEFAULT_PROMPT_SETTINGS = {
  templateId: '',
  systemPrompt: '',
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1200,
};
const updatePromptSettings = vi.fn();

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (
    selector: (state: { updatePromptSettings: typeof updatePromptSettings }) => unknown,
  ) => selector({ updatePromptSettings }),
}));

function renderRoleMenu(conversationId = 11) {
  return render(<RoleRadialMenu conversationId={conversationId} />);
}

function roleButton(name: string) {
  return screen.getByRole('button', { name });
}

function openRoleMenu() {
  fireEvent.click(roleButton('AI 角色'));
}

function selectRole(name: string) {
  openRoleMenu();
  fireEvent.click(roleButton(name));
}

function hoverRole(name: string) {
  fireEvent.mouseEnter(roleButton(name));
}

function expectLastPromptSettings(settings: object) {
  expect(updatePromptSettings).toHaveBeenLastCalledWith(settings);
}

describe('RoleRadialMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens four icon role buttons and shows role detail on hover', () => {
    renderRoleMenu();

    openRoleMenu();

    expect(roleButton('饮食')).toBeTruthy();
    expect(roleButton('出行')).toBeTruthy();
    expect(roleButton('情绪')).toBeTruthy();
    expect(roleButton('学习')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '健身' })).toBeNull();
    expect(screen.queryByRole('button', { name: '工作' })).toBeNull();

    hoverRole('饮食');

    expect(screen.getByText('饮食规划助手')).toBeTruthy();
    expect(screen.getByText(/营养偏好/)).toBeTruthy();
    expect(screen.getByText(/一周轻食安排/)).toBeTruthy();
  });

  it('positions role detail above the hovered role button', () => {
    renderRoleMenu(12);

    openRoleMenu();
    hoverRole('出行');

    const title = screen.getByText('出行规划助手');
    const detailPanel = title.parentElement?.parentElement;

    expect(detailPanel?.style.left).toContain('calc(50%');
    expect(detailPanel?.style.top).toContain('calc(50%');
    expect(detailPanel?.style.transform).toBe('translate(1.25rem, calc(-100% - 0.75rem))');
  });

  it('keeps role detail visible while moving inside the radial menu', () => {
    renderRoleMenu(13);

    const triggerButton = roleButton('AI 角色');
    openRoleMenu();
    const menuRoot = triggerButton.parentElement;
    const foodRole = roleButton('饮食');

    fireEvent.mouseEnter(foodRole);
    expect(screen.getByText('饮食规划助手')).toBeTruthy();

    fireEvent.mouseLeave(foodRole, { relatedTarget: triggerButton });
    expect(screen.getByText('饮食规划助手')).toBeTruthy();

    if (menuRoot) {
      fireEvent.mouseLeave(menuRoot);
    }
    expect(screen.queryByText('饮食规划助手')).toBeNull();
  });

  it('swaps the selected role slot with the default role button', () => {
    renderRoleMenu(14);

    selectRole('情绪');
    openRoleMenu();

    expect(roleButton('默认角色')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '情绪' })).toBeNull();
    expect(updatePromptSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'role-emotion',
        systemPrompt: expect.stringContaining('情绪支持'),
      }),
    );
  });

  it('resets to default role from the selected role slot', () => {
    renderRoleMenu(15);

    selectRole('学习');
    openRoleMenu();
    fireEvent.click(roleButton('默认角色'));

    expectLastPromptSettings(DEFAULT_PROMPT_SETTINGS);
  });

  it('remembers selected role per conversation only', () => {
    const { rerender } = renderRoleMenu(16);

    selectRole('出行');

    rerender(<RoleRadialMenu conversationId={17} />);
    expectLastPromptSettings(DEFAULT_PROMPT_SETTINGS);
    openRoleMenu();
    expect(screen.queryByRole('button', { name: '默认角色' })).toBeNull();

    openRoleMenu();
    rerender(<RoleRadialMenu conversationId={16} />);
    expectLastPromptSettings(expect.objectContaining({ templateId: 'role-travel' }));
    openRoleMenu();
    expect(roleButton('默认角色')).toBeTruthy();
  });
});
