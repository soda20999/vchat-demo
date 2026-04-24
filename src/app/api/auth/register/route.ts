import { NextRequest, NextResponse } from 'next/server';

import * as userService from '@/db/service/user';
import { hashPassword } from '@/lib/auth/password';
import { validateRequestBody } from '@/lib/api-handler';
import { createdResponse } from '@/lib/server-response';
import { registerSchema, type RegisterPayload } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { data, error } = await validateRequestBody<RegisterPayload>(req, registerSchema);
  if (error) return error;

  if (await userService.isEmailExists(data!.email)) {
    return NextResponse.json(
      { code: 409, message: 'Email already exists', timestamp: Date.now() },
      { status: 409 }
    );
  }

  if (await userService.isUsernameExists(data!.username)) {
    return NextResponse.json(
      { code: 409, message: 'Username already exists', timestamp: Date.now() },
      { status: 409 }
    );
  }

  const user = await userService.createUser({
    username: data!.username,
    email: data!.email,
    password: hashPassword(data!.password),
  });

  return NextResponse.json(
    createdResponse(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          signature: user.signature,
        },
      },
      'Register successful'
    ),
    { status: 201 }
  );
}
