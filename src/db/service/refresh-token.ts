import { and, eq, lt } from 'drizzle-orm';

import { db } from '../index';
import { refreshTokens } from '../schema';
import type { RefreshToken } from '../schema';

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<RefreshToken> {
  const [refreshToken] = await db
    .insert(refreshTokens)
    .values({
      userId,
      tokenHash,
      expiresAt,
    })
    .returning();

  return refreshToken;
}

export async function getRefreshTokenByHash(
  tokenHash: string
): Promise<RefreshToken | undefined> {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  return result[0];
}

export async function getActiveRefreshTokenByHash(
  tokenHash: string
): Promise<RefreshToken | undefined> {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.isRevoked, false)
      )
    )
    .limit(1);

  return result[0];
}

export async function getUserRefreshTokens(
  userId: string
): Promise<RefreshToken[]> {
  return db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.userId, userId));
}

export async function revokeRefreshTokenById(id: number): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.id, id));
}

export async function revokeRefreshTokenByHash(
  tokenHash: string
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllUserRefreshTokens(
  userId: string
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ isRevoked: true })
    .where(eq(refreshTokens.userId, userId));
}

export async function deleteExpiredRefreshTokens(
  now: Date = new Date()
): Promise<void> {
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now));
}
