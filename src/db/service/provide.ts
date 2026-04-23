import { db } from '../index';
import { providers } from '../schema';
import { eq } from 'drizzle-orm';
import type { NewProvider, Provider } from '../schema';

/**
 * 获取所有服务商
 */
export async function getAllProviders(): Promise<Provider[]> {
  return await db.select().from(providers);
}

/**
 * 根据 ID 获取服务商
 */
export async function getProviderById(id: number): Promise<Provider | undefined> {
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.id, id))
    .limit(1);
  return result[0];
}

/**
 * 根据名称获取服务商
 */
export async function getProviderByName(name: string): Promise<Provider | undefined> {
  const result = await db
    .select()
    .from(providers)
    .where(eq(providers.name, name))
    .limit(1);
  return result[0];
}

/**
 * 创建新服务商
 */
export async function createProvider(newProvider: NewProvider): Promise<Provider> {
  const [provider] = await db
    .insert(providers)
    .values(newProvider)
    .returning();
  return provider;
}

/**
 * 更新服务商信息
 */
export async function updateProvider(
  id: number,
  updates: Partial<Omit<Provider, 'id' | 'createdAt'>>
) {
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  await db.update(providers).set(updateData).where(eq(providers.id, id));
}

/**
 * 删除服务商
 */
export async function deleteProvider(id: number) {
  await db.delete(providers).where(eq(providers.id, id));
}

