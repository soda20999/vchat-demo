import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db/service/user', () => ({
  createUser: vi.fn(),
  isEmailExists: vi.fn(),
  isUsernameExists: vi.fn(),
}));

vi.mock('@/lib/auth/password', () => ({
  hashPassword: vi.fn(() => 'hashed-password'),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const userService = await import('@/db/service/user');
const { POST } = await import('./route');

function createRegisterRequest() {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: 'alice',
      email: 'alice@example.com',
      password: 'Password123!',
    }),
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.isEmailExists).mockResolvedValue(false);
    vi.mocked(userService.isUsernameExists).mockResolvedValue(false);
    vi.mocked(userService.createUser).mockResolvedValue({
      id: '21b961b0-5808-4a66-899b-2ae020f4dd4d',
      username: 'alice',
      email: 'alice@example.com',
      password: 'hashed-password',
      signature: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('returns 409 when the database reports a duplicate email', async () => {
    vi.mocked(userService.createUser).mockRejectedValue({
      code: '23505',
      constraint_name: 'users_email_unique',
      message: 'duplicate key value violates unique constraint "users_email_unique"',
    });

    const response = await POST(createRegisterRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.message).toBe('Email already exists');
  });

  it('returns 409 when the database reports a duplicate username', async () => {
    vi.mocked(userService.createUser).mockRejectedValue({
      code: '23505',
      constraint_name: 'users_username_unique',
      message: 'duplicate key value violates unique constraint "users_username_unique"',
    });

    const response = await POST(createRegisterRequest());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.message).toBe('Username already exists');
  });

  it('hides database details for unexpected registration failures', async () => {
    vi.mocked(userService.createUser).mockRejectedValue(
      new Error('select * from users failed with password hash details')
    );

    const response = await POST(createRegisterRequest());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Register failed');
  });
});
