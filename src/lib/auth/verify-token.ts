import { jwtVerify } from 'jose';

export type AccessTokenPayload = {
  userId: string;
  role: string;
};

function getAccessTokenSecret() {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is missing');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessTokenSecret());

  return {
    userId: String(payload.userId || ''),
    role: String(payload.role || ''),
  } satisfies AccessTokenPayload;
}
