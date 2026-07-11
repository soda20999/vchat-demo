import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from '@/components/Chat/Sidebar';

const replace = vi.fn();
const refresh = vi.fn();
const switchConversation = vi.fn();
const broadcastVchatEvent = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

vi.mock('@/lib/vchat-broadcast', () => ({
  broadcastVchatEvent: (...args: unknown[]) => broadcastVchatEvent(...args),
}));

vi.mock('@/components/Chat/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list" />,
}));

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (selector: (state: { switchConversation: typeof switchConversation }) => unknown) =>
    selector({ switchConversation }),
}));

function mockLogoutSuccess() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: 200, data: { ok: true } }),
    }),
  );
}

function renderSidebar() {
  render(<Sidebar />);
}

function clickButton(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function openSettings() {
  clickButton('设置');
}

function requestLogout() {
  openSettings();
  clickButton('登出账号');
}

describe('Sidebar settings menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    broadcastVchatEvent.mockClear();
    mockLogoutSuccess();
  });

  it('opens a settings panel with logout action', () => {
    renderSidebar();

    openSettings();

    expect(screen.getByRole('button', { name: '登出账号' })).toBeTruthy();
  });

  it('logs out after confirmation and redirects to auth page', async () => {
    renderSidebar();

    requestLogout();
    clickButton('退出');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    });
    expect(broadcastVchatEvent).toHaveBeenCalledWith({ type: 'auth:logout' });
    expect(refresh).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/auth');
  });

  it('does not log out when the confirm dialog is cancelled', () => {
    renderSidebar();

    requestLogout();
    clickButton('取消');

    expect(fetch).not.toHaveBeenCalled();
  });

  it('starts a new conversation and closes the settings menu', async () => {
    renderSidebar();

    openSettings();
    expect(screen.getByRole('button', { name: '登出账号' })).toBeTruthy();

    clickButton('发起新对话');

    await waitFor(() => {
      expect(switchConversation).toHaveBeenCalledWith(0);
    });
    expect(screen.queryByRole('button', { name: '登出账号' })).toBeNull();
  });
});
