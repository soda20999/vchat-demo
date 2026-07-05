import { describe, expect, it } from 'vitest';

import { users } from './schema';

describe('users schema', () => {
  it('generates user ids in the application instead of using a literal SQL string', () => {
    const idColumn = users.id as unknown as {
      default: unknown;
      defaultFn?: () => string;
    };

    expect(idColumn.default).toBeUndefined();
    expect(idColumn.defaultFn).toBeTypeOf('function');
    expect(idColumn.defaultFn?.()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('enforces username uniqueness at the database schema layer', () => {
    expect(users.username.isUnique).toBe(true);
  });
});
