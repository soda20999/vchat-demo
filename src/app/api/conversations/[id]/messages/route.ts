import { NextRequest, NextResponse } from 'next/server';

import * as conversationService from '@/db/service/conversation';
import * as messageService from '@/db/service/message';
import { requireAuth } from '@/lib/api-handler';
import {
  forbiddenResponse,
  internalErrorResponse,
  successResponse,
} from '@/lib/server-response';

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
      return NextResponse.json(forbiddenResponse('Invalid conversation id'), {
        status: 403,
      });
    }

    const conversation = await conversationService.getUserConversation(
      conversationId,
      userId!
    );

    if (!conversation) {
      return NextResponse.json(
        forbiddenResponse('Conversation not found or access denied'),
        { status: 403 }
      );
    }

    const messages = await messageService.getConversationMessages(conversationId);

    return NextResponse.json(successResponse(messages, 'Messages fetched'), {
      status: 200,
    });
  } catch (error) {
    console.error('GET /api/conversations/[id]/messages error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(internalErrorResponse(message), { status: 500 });
  }
}
