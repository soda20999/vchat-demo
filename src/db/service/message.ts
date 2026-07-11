import { asc, eq } from 'drizzle-orm';

import { db } from '../index';
import { messages } from '../schema';
import type { Message } from '../schema';

export async function getConversationMessages(
  conversationId: number
): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt), asc(messages.id));
}

export async function getMessageById(
  messageId: number
): Promise<Message | undefined> {
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  return result[0];
}

export async function createMessage(
  conversationId: number,
  content: string,
  type: 'question' | 'answer',
  status: 'loading' | 'streaming' | 'finished' | 'error' = 'finished',
  image?: string
): Promise<Message> {
  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      content,
      type,
      status,
      image,
    })
    .returning();

  return message;
}

export async function updateMessageContent(
  messageId: number,
  content: string
): Promise<void> {
  await db.update(messages).set({ content }).where(eq(messages.id, messageId));
}

export async function updateMessageStatus(
  messageId: number,
  status: 'loading' | 'streaming' | 'finished' | 'error'
): Promise<void> {
  await db.update(messages).set({ status }).where(eq(messages.id, messageId));
}

export async function updateMessage(
  messageId: number,
  updates: {
    content?: string;
    status?: 'loading' | 'streaming' | 'finished' | 'error';
  }
): Promise<void> {
  if (Object.keys(updates).length === 0) return;
  await db.update(messages).set(updates).where(eq(messages.id, messageId));
}

export async function deleteMessage(messageId: number): Promise<void> {
  await db.delete(messages).where(eq(messages.id, messageId));
}
