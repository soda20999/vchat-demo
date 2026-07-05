import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  vector,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title'),
  desc: text('desc'),
  avatar: text('avatar'),
  models: jsonb('models').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    signature: text('signature').default('这个人很懒，什么都没有留下'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
  })
);

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  title: text('title').notNull().default('新对话'),
  summary: text('summary'),
  selectedModel: text('selected_model').notNull(),
  provideId: integer('provide_id').references(() => providers.id),
  userId: text('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable(
  'messages',
  {
    id: serial('id').primaryKey(),
    content: text('content').notNull(),
    status: text('status')
      .$type<'loading' | 'streaming' | 'finished' | 'error'>()
      .default('finished'),
    type: text('type').$type<'question' | 'answer'>().notNull(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    image: text('image'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    convIdx: index('conv_idx').on(table.conversationId),
  })
);

export const userMemories = pgTable(
  'user_memories',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    category: text('category')
      .$type<'food' | 'schedule' | 'emotion' | 'writing' | 'preference' | 'general'>()
      .default('general'),
    keywords: jsonb('keywords').$type<string[]>().notNull().default([]),
    embedding: vector('embedding', { dimensions: 1024 }).notNull(),
    weight: integer('weight').notNull().default(1),
    lastUsedAt: timestamp('last_used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    memoryUserIdx: index('memory_user_idx').on(table.userId),
    memoryCategoryIdx: index('memory_category_idx').on(table.category),
  })
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    isRevoked: boolean('is_revoked').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    refreshTokenUserIdx: index('refresh_token_user_idx').on(table.userId),
    refreshTokenHashIdx: index('refresh_token_hash_idx').on(table.tokenHash),
    refreshTokenExpiresIdx: index('refresh_token_expires_idx').on(
      table.expiresAt
    ),
  })
);

export type Provider = InferSelectModel<typeof providers>;
export type NewProvider = InferInsertModel<typeof providers>;

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Conversation = InferSelectModel<typeof conversations>;
export type NewConversation = InferInsertModel<typeof conversations>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type UserMemory = InferSelectModel<typeof userMemories>;
export type NewUserMemory = InferInsertModel<typeof userMemories>;

export type RefreshToken = InferSelectModel<typeof refreshTokens>;
export type NewRefreshToken = InferInsertModel<typeof refreshTokens>;
