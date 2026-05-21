import { NextRequest } from 'next/server';

import * as userService from '@/db/service/user';
import { hashPassword } from '@/lib/auth/password';
import { validateRequestBody } from '@/lib/api-handler';
import { jsonErrorResponse, jsonSuccessResponse } from '@/lib/api-error';
import { registerSchema, type RegisterPayload } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { data, error } = await validateRequestBody<RegisterPayload>(req, registerSchema);
  if (error) return error;

  if (await userService.isEmailExists(data!.email)) {
    return jsonErrorResponse('Email already exists', 409);
  }

  if (await userService.isUsernameExists(data!.username)) {
    return jsonErrorResponse('Username already exists', 409);
  }

  const user = await userService.createUser({
    username: data!.username,
    email: data!.email,
    password: hashPassword(data!.password),
  });

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
