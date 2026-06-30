import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Sidebar } from './Sidebar';

const replace = vi.fn();
const refresh = vi.fn();
const switchConversation = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

vi.mock('@/components/Chat/ConversationList', () => ({
  ConversationList: () => <div data-testid="conversation-list" />,
}));

vi.mock('@/stores/chatStore', () => ({
  useChatStore: (selector: (state: { switchConversation: typeof switchConversation }) => unknown) =>
    selector({ switchConversation }),
}));

describe('Sidebar settings menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ code: 200, data: { ok: true } }),
      })
    );
  });

  it('opens a settings panel with logout action', () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole('button', { name: '设置' }));

    expect(screen.getByRole('button', { name: '登出账号' })).toBeTruthy();
  });

  it('logs out from the settings panel and redirects to auth page', async () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole('button', { name: '设置' }));
    fireEvent.click(screen.getByRole('button', { name: '登出账号' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    });
    expect(refresh).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/auth');
  });
});
