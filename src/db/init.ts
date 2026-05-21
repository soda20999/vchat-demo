import { count } from 'drizzle-orm';
import { db } from './index';
import { providers } from './schema';

export async function seedDatabase(): Promise<void> {
  try {
    const [providersResult] = await db
      .select({ value: count() })
      .from(providers);

    if (providersResult.value === 0) {
      console.log('--- DB Connect Success ---');

      await db.insert(providers).values([
        {
          name: 'qwen',
          title: 'Qwen',
          desc: 'OpenAI-compatible Qwen models.',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qwen',
          models: ['qwen-plus', 'qwen-turbo'],
        },
        {
          name: 'deepseek',
          title: 'DeepSeek',
          desc: 'OpenAI-compatible DeepSeek models.',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deepseek',
          models: ['deepseek-v4-pro'],
        },
      ]);
      console.log('--- Database Initialized Successfully ---');
    } else {
      console.log('--- Providers already exist, skipping seed ---');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
