import { db } from './index';
import { providers } from './schema';
import { count } from 'drizzle-orm';

/**
 * 初始化数据库数据（种子数据）
 * 如果 providers 表为空，则插入默认的 AI 模型提供商
 */
export async function seedDatabase(): Promise<void> {
  try {
    // 1. 检查表里是否有数据
    const [providersResult] = await db
      .select({ value: count() })
      .from(providers);

    if (providersResult.value === 0) {
      console.log('🚀 --- DB Connect Success ---');

      // 2. 插入默认的 AI 模型提供商
      await db.insert(providers).values([
        {
          name: 'google',
          title: 'Google Gemini',
          desc: '谷歌新一代 AI 模型，提供强大的多模态处理能力。',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=gemini',
          models: ['gemini-3-flash-preview', 'gemini-2.0-pro'],
        },
        {
          name: 'deepseek',
          title: '深度求索',
          desc: '国产大模型之光，极高性价比。',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=deepseek',
          models: ['deepseek-chat'],
        },
        {
          name: 'qwen',
          title: '通义千问',
          desc: '阿里自研大模型，具备极强的中文理解与生成能力。',
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qwen',
          models: ['qwen-turbo', 'qwen-long'],
        },
      ]);
      console.log('✅ --- Database Initialized Successfully ---');
    } else {
      console.log('⏭️  --- Providers already exist, skipping seed ---');
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}