import { asc, eq, sql } from 'drizzle-orm';
import { cosineDistance } from 'drizzle-orm/sql/functions/vector';

import { analyzeMemory } from '@/ai/memory/memory-analyzer';
import { buildMemoryEmbedding } from '@/ai/memory/memory-embedding';
import { db } from '../index';
import { userMemories } from '../schema';

export async function saveUserMemory(userId: string, text: string) {
  const draft = analyzeMemory(text);
  if (!draft) return;

  // 只保存带语义向量的记忆，检索时直接走 pgvector。
  const embedding = await buildMemoryEmbedding(draft.content);

  await db.insert(userMemories).values({
    userId,
    ...draft,
    embedding,
  });
}

export async function getRelevantMemories(userId: string, query: string, topK = 3) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userMemories)
    .where(eq(userMemories.userId, userId));

  if (count === 0) return [];

  const embedding = await buildMemoryEmbedding(query);
  const distance = cosineDistance(userMemories.embedding, embedding);

  const memories = await db
    .select()
    .from(userMemories)
    .where(eq(userMemories.userId, userId))
    .orderBy(asc(distance))
    .limit(topK);

  await Promise.all(
    memories.map((memory) =>
      db
        .update(userMemories)
        .set({ lastUsedAt: new Date(), updatedAt: new Date() })
        .where(eq(userMemories.id, memory.id))
    )
  );

  return memories;
}
