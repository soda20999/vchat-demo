export type MemoryCategory =
  | 'food'
  | 'schedule'
  | 'emotion'
  | 'writing'
  | 'preference'
  | 'general';

export interface MemoryDraft {
  content: string;
  category: MemoryCategory;
  keywords: string[];
}

const categoryWords: Record<MemoryCategory, string[]> = {
  food: ['吃', '饭', '晚餐', '午餐', '早餐', '外卖', '清淡', '减脂'],
  schedule: ['今天', '明天', '安排', '计划', '日程', '待办', '时间'],
  emotion: ['难过', '焦虑', '压力', '失眠', '开心', '聊天', '陪我'],
  writing: ['润色', '改写', '回复', '文案', '表达', '语气'],
  preference: ['喜欢', '不喜欢', '习惯', '经常', '偏好', '希望'],
  general: [],
};

const memoryTriggers = ['喜欢', '不喜欢', '习惯', '经常', '最近', '希望', '想要'];

export function analyzeMemory(text: string): MemoryDraft | null {
  const content = text.trim();
  if (content.length < 4 || !memoryTriggers.some((word) => content.includes(word))) {
    return null;
  }

  const entries = Object.entries(categoryWords) as [MemoryCategory, string[]][];
  const matched = entries
    .map(([category, words]) => ({
      category,
      keywords: words.filter((word) => content.includes(word)),
    }))
    .filter((item) => item.keywords.length > 0);

  const best = matched[0] || { category: 'general' as const, keywords: [] };

  return {
    content: `用户提到：${content.slice(0, 80)}`,
    category: best.category,
    keywords: best.keywords,
  };
}
