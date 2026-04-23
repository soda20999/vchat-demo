import type { Provider } from '@/types';

const now = new Date();

export const LOCAL_PROVIDERS: Provider[] = [
  {
    id: 1,
    name: 'gemini',
    title: 'Google Gemini',
    desc: 'Default Gemini models',
    models: ['gemini-3-flash-preview', 'gemini-2.0-pro'],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    name: 'deepseek',
    title: 'DeepSeek',
    desc: 'Default DeepSeek models',
    models: ['deepseek-chat'],
    createdAt: now,
    updatedAt: now,
  },
];
