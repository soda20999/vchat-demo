import { and, desc, eq } from 'drizzle-orm';

import { db } from '../index';
import { conversations, messages } from '../schema';

export async function getUserConversations(userId: string) {
  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getAllConversations() {
  return db.select().from(conversations);
}

export async function createConversation(
  selectedModel: string,
  provideId: number | null,
  title: string,
  userId: string
) {
  const [conversation] = await db
    .insert(conversations)
    .values({
      selectedModel,
      provideId,
      title,
      userId,
    })
    .returning();

  return conversation;
}

export async function updateConversationTitle(id: number, title: string) {
  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function updateConversationSummary(id: number, summary: string) {
  await db
    .update(conversations)
    .set({ summary, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function touchConversation(id: number) {
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  await db.delete(conversations).where(eq(conversations.id, id));
}

export async function getConversation(id: number) {
  const result = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  return result[0];
}

export async function getUserConversation(id: number, userId: string) {
  const result = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);

  return result[0];
}

export async function getConversationMessages(conversationId: number) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}
