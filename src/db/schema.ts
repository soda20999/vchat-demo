import { pgTable, text, timestamp, uuid, serial, jsonb, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// 1. Providers 表
export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title'),
  desc: text('desc'),
  avatar: text('avatar'),
  // Postgres 使用 jsonb 存储数组更高效
  models: jsonb('models').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Conversations 表 (增加了 userId 以支持多用户)
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default('新对话'),
  selectedModel: text('selected_model').notNull(),
  provideId: integer('provide_id').references(() => providers.id),
  // 核心：网页端必须关联用户
  userId: text('user_id').references(() => users.id), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Messages 表
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  status: text('status').$type<'loading' | 'finished' | 'streaming'>().default('finished'),
  type: text('type').$type<'question' | 'answer'>().notNull(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  convIdx: index('conv_idx').on(table.conversationId),
}));

// 4. Users 表
export const users = pgTable('users', {
  // Postgres 建议直接用 defaultRandom() 生成 UUID
  id: text('id').primaryKey().default('gen_random_uuid()'),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  signature: text('signature').default('这个人很懒，什么都没留下'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}));

// 导出类型定义
export type Provider = InferSelectModel<typeof providers>;
export type NewProvider = InferInsertModel<typeof providers>;

export type Conversation = InferSelectModel<typeof conversations>;
export type NewConversation = InferInsertModel<typeof conversations>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;