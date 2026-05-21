import { NextRequest } from 'next/server';

import * as conversationService from '@/db/service/conversation';
import { requireAuth, validateRequestBody } from '@/lib/api-handler';
import { jsonExceptionResponse, jsonSuccessResponse } from '@/lib/api-error';
import {
  createConversationSchema,
  type CreateConversationPayload,
} from '@/lib/validators';

export async function GET(req: NextRequest) {
  try {
    const { userId, error } = await requireAuth(req);
    if (error) return error;

    const conversations = await conversationService.getUserConversations(userId!);

    return jsonSuccessResponse(conversations, 'Conversations fetched');
  } catch (error) {
    return jsonExceptionResponse(error, 'GET /api/conversations error');
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

    return jsonSuccessResponse(conversation, 'Conversation created');
  } catch (error) {
    return jsonExceptionResponse(error, 'POST /api/conversations error');
  }
}
