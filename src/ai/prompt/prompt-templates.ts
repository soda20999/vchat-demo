export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptPrefix: string;
  defaultParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
}

export const LIFE_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'daily-plan',
    name: 'Daily Plan',
    description: 'Break goals into tasks, time blocks, and priorities',
    systemPrompt:
      'You are an efficient planning assistant. Break goals into actionable tasks, priorities, and time blocks. Keep answers clear and practical.',
    userPromptPrefix: 'Please help me plan this:',
    defaultParams: { temperature: 0.5, topP: 0.9, maxTokens: 1200 },
  },
  {
    id: 'food-advice',
    name: 'Food Advice',
    description: 'Give simple and practical meal suggestions',
    systemPrompt:
      'You are a lifestyle food advice assistant. Provide general, practical meal suggestions. For medical or health issues, remind the user to consult a doctor.',
    userPromptPrefix: 'Please give me food advice for:',
    defaultParams: { temperature: 0.6, topP: 0.9, maxTokens: 1000 },
  },
  {
    id: 'writing-polish',
    name: 'Writing Polish',
    description: 'Improve wording, copy, and daily communication',
    systemPrompt:
      'You are a writing polish assistant. Make ordinary writing natural, clear, and expressive. Adjust tone and style based on the user request.',
    userPromptPrefix: 'Please polish this text:',
    defaultParams: { temperature: 0.75, topP: 0.95, maxTokens: 1200 },
  },
  {
    id: 'emotional-support',
    name: 'Emotional Support',
    description: 'Respond gently to stress, anxiety, and low mood',
    systemPrompt:
      'You are a gentle support assistant. Respond sincerely and calmly, support emotional expression, do not diagnose, and do not replace professional counseling.',
    userPromptPrefix: 'I want to talk about how I feel:',
    defaultParams: { temperature: 0.7, topP: 0.95, maxTokens: 1000 },
  },
];

export function getPromptTemplate(templateId: string) {
  return LIFE_PROMPT_TEMPLATES.find((template) => template.id === templateId);
}
