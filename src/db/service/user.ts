import { db } from '../index';
import { users } from '../schema';
import { eq, desc } from 'drizzle-orm';
import type { NewUser, User } from '../schema';

/**
 * 根据邮箱查找用户
 */
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
}

/**
 * 根据用户 ID 查找用户
 */
export async function getUserById(id: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0];
}

/**
 * 根据用户名查找用户
 */
export async function getUserByUsername(username: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return result[0];
}

/**
 * 创建新用户
 */
export async function createUser(newUser: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(newUser).returning();
  return user;
}

/**
 * 更新用户信息（不包括密码和ID）
 */
export async function updateUser(
  id: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
) {
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  await db.update(users).set(updateData).where(eq(users.id, id));
}

/**
 * 更新用户密码
 */
export async function updateUserPassword(id: string, hashedPassword: string) {
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, id));
}

/**
 * 更新用户签名
 */
export async function updateUserSignature(id: string, signature: string) {
  await db
    .update(users)
    .set({ signature, updatedAt: new Date() })
    .where(eq(users.id, id));
}

/**
 * 更新用户名
 */
export async function updateUsername(id: string, username: string) {
  await db
    .update(users)
    .set({ username, updatedAt: new Date() })
    .where(eq(users.id, id));
}

/**
 * 删除用户
 */
export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

/**
 * 获取所有用户（仅用于管理端，按创建时间倒序）
 */
export async function getAllUsers(): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt));
}

/**
 * 检查邮箱是否已被注册
 */
export async function isEmailExists(email: string): Promise<boolean> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return !!result[0];
}

/**
 * 检查用户名是否已被使用
 */
export async function isUsernameExists(username: string): Promise<boolean> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return !!result[0];
}
