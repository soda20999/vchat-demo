import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuthPage from './page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('AuthPage', () => {
  it('does not render unfinished agreement copy', () => {
    render(<AuthPage />);

    expect(screen.queryByText(/用户协议/)).toBeNull();
    expect(screen.queryByText(/隐私政策/)).toBeNull();
  });
});
