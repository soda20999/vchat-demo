import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPage from './page';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

describe('SettingsPage', () => {
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

  it('logs out and redirects to auth page', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    });
    expect(refresh).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/auth');
  });

  it('shows an error and keeps the user on settings when logout fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Logout failed' }),
    } as Response);

    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: '退出登录' }));

    expect(await screen.findByText('Logout failed')).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
