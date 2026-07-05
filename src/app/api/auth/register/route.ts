import { NextRequest } from 'next/server';

import * as userService from '@/db/service/user';
import { hashPassword } from '@/lib/auth/password';
import { validateRequestBody } from '@/lib/api-handler';
import { jsonErrorResponse, jsonSuccessResponse } from '@/lib/api-error';
import { registerSchema, type RegisterPayload } from '@/lib/validators';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

function getDatabaseConstraint(error: unknown) {
  if (!error || typeof error !== 'object') return '';

  const candidate = error as {
    constraint?: unknown;
    constraint_name?: unknown;
    message?: unknown;
  };

  return String(candidate.constraint_name ?? candidate.constraint ?? candidate.message ?? '')
    .toLowerCase();
}

function isUniqueViolation(error: unknown) {
  return !!error && typeof error === 'object' && (error as { code?: unknown }).code === '23505';
}

export async function POST(req: NextRequest) {
  const { data, error } = await validateRequestBody<RegisterPayload>(req, registerSchema);
  if (error) return error;

  if (await userService.isEmailExists(data!.email)) {
    return jsonErrorResponse('Email already exists', 409);
  }

  if (await userService.isUsernameExists(data!.username)) {
    return jsonErrorResponse('Username already exists', 409);
  }

  let user;
  try {
    user = await userService.createUser({
      username: data!.username,
      email: data!.email,
      password: hashPassword(data!.password),
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      const constraint = getDatabaseConstraint(error);

      if (constraint.includes('email')) {
        return jsonErrorResponse('Email already exists', 409);
      }

      if (constraint.includes('username')) {
        return jsonErrorResponse('Username already exists', 409);
      }
    }

    logger.error('Register failed', {
      scope: 'api.auth.register',
      error,
    });
    return jsonErrorResponse('Register failed', 500);
  }

  return jsonSuccessResponse(
    {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        signature: user.signature,
      },
    },
    'Register successful'
  );
}
