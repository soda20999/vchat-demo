import { NextRequest, NextResponse } from 'next/server';

import * as conversationService from '@/db/service/conversation';
import {
  createdResponse,
  internalErrorResponse,
  successResponse,
} from '@/lib/server-response';
import { requireAuth, validateRequestBody } from '@/lib/api-handler';
import {
  createConversationSchema,
  type CreateConversationPayload,
} from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth(req);
    if (error) return error;

    const conversations = await conversationService.getUserConversations(userId!);

    return NextResponse.json(successResponse(conversations, 'Conversations fetched'), {
      status: 200,
    });
  } catch (error) {
    console.error('GET /api/conversations error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(internalErrorResponse(message), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, error: authError } = await requireAuth(req);
    if (authError) return authError;

    const { data, error: validationError } =
      await validateRequestBody<CreateConversationPayload>(
        req,
        createConversationSchema
      );
    if (validationError) return validationError;

    const conversation = await conversationService.createConversation(
      data!.selectedModel,
      data!.provideId ?? null,
      data!.title,
      userId!
    );

    return NextResponse.json(createdResponse(conversation, 'Conversation created'), {
      status: 201,
    });
  } catch (error) {
    console.error('POST /api/conversations error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(internalErrorResponse(message), { status: 500 });
  }
}
