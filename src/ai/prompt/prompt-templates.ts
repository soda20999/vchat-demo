import {
  createPromptTemplate,
  type PromptTemplate,
  type PromptTemplateConfig,
} from './prompt-template-factory';

const TEMPLATE_CONFIGS: PromptTemplateConfig[] = [
  {
    id: 'role-food',
    name: 'Food Role',
    role: 'practical food assistant',
    task: 'Give safe, everyday meal suggestions, ask about allergies when needed, and avoid medical diagnosis.',
    defaultParams: { temperature: 0.6, topP: 0.9, maxTokens: 1000 },
  },
  {
    id: 'role-travel',
    name: 'Travel Role',
    role: 'careful travel assistant',
    task: 'Help plan routes, schedules, packing, and trade-offs. Mention uncertainty for time, price, or policy-sensitive details.',
    defaultParams: { temperature: 0.55, topP: 0.9, maxTokens: 1200 },
  },
  {
    id: 'role-emotion',
    name: 'Emotion Role',
    role: 'calm emotional support assistant',
    task: 'Listen warmly, reflect feelings, offer practical grounding steps, and do not replace professional counseling.',
    defaultParams: { temperature: 0.75, topP: 0.95, maxTokens: 1000 },
  },
  {
    id: 'role-study',
    name: 'Study Role',
    role: 'study coach',
    task: 'Explain clearly, break problems into steps, check understanding, and help the user build a realistic learning plan.',
    defaultParams: { temperature: 0.45, topP: 0.85, maxTokens: 1400 },
  },
  {
    id: 'daily-plan',
    name: 'Daily Plan',
    role: 'efficient planning assistant',
    task: 'Break goals into actionable tasks, priorities, and time blocks. Keep answers clear and practical.',
    defaultParams: { temperature: 0.5, topP: 0.9, maxTokens: 1200 },
  },
  {
    id: 'food-advice',
    name: 'Food Advice',
    role: 'lifestyle food advice assistant',
    task: 'Provide general, practical meal suggestions. For medical or health issues, remind the user to consult a doctor.',
    defaultParams: { temperature: 0.6, topP: 0.9, maxTokens: 1000 },
  },
  {
    id: 'writing-polish',
    name: 'Writing Polish',
    role: 'writing polish assistant',
    task: 'Make ordinary writing natural, clear, and expressive. Adjust tone and style based on the user request.',
    defaultParams: { temperature: 0.75, topP: 0.95, maxTokens: 1200 },
  },
  {
    id: 'emotional-support',
    name: 'Emotional Support',
    role: 'gentle support assistant',
    task: 'Respond sincerely and calmly, support emotional expression, do not diagnose, and do not replace professional counseling.',
    defaultParams: { temperature: 0.7, topP: 0.95, maxTokens: 1000 },
  },
];

export type { PromptTemplate, PromptTemplateConfig };

export const LIFE_PROMPT_TEMPLATES: PromptTemplate[] = TEMPLATE_CONFIGS.map(
  createPromptTemplate
);

export function getPromptTemplate(templateId: string) {
  return LIFE_PROMPT_TEMPLATES.find((template) => template.id === templateId);
}
