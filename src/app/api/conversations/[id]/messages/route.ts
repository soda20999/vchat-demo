import { NextRequest } from 'next/server';

import * as conversationService from '@/db/service/conversation';
import * as messageService from '@/db/service/message';
import { requireAuth } from '@/lib/api-handler';
import {
  jsonErrorResponse,
  jsonExceptionResponse,
  jsonSuccessResponse,
} from '@/lib/api-error';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { userId, error } = await requireAuth(req);
    if (error) return error;

    const { id } = await context.params;
    const conversationId = Number(id);

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return jsonErrorResponse('Invalid conversation id', 403);
    }

    const conversation = await conversationService.getUserConversation(
      conversationId,
      userId!
    );

    if (!conversation) {
      return jsonErrorResponse('Conversation not found or access denied', 403);
    }

    const messages = await messageService.getConversationMessages(conversationId);

    return jsonSuccessResponse(messages, 'Messages fetched');
  } catch (error) {
    return jsonExceptionResponse(
      error,
      'GET /api/conversations/[id]/messages error'
    );
  }
}
