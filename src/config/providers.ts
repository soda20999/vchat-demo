import type { Provider } from '@/types';

const now = new Date();

export const LOCAL_PROVIDERS: Provider[] = [
  {
    id: 1,
    name: 'qwen',
    title: 'Qwen',
    desc: 'Default Qwen models',
    models: ['qwen-plus', 'qwen-turbo'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    name: 'deepseek',
    title: 'DeepSeek',
    desc: 'Default DeepSeek models',
    models: ['deepseek-v4-pro'],
    createdAt: now,
    updatedAt: now,
  },
];
