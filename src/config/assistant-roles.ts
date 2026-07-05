export type RolePreset = {
  id: string;
  label: string;
  icon: string;
  title: string;
  description: string;
  example: string;
  colorClassName: string;
  glowClassName: string;
  systemPrompt: string;
  defaultParams: {
    temperature: number;
    topP: number;
    maxTokens: number;
  };
};

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'role-food',
    label: '饮食',
    icon: 'lucide:utensils',
    title: '饮食规划助手',
    description: '按口味、预算、时间和营养偏好给出日常饮食建议。',
    example: '例如：一周轻食安排、晚餐搭配、忌口替代方案。',
    colorClassName: 'bg-emerald-500 hover:bg-emerald-400',
    glowClassName: 'shadow-[0_0_28px_rgba(16,185,129,0.45)]',
    systemPrompt:
      '你是饮食规划助手。根据用户的口味、预算、时间、营养偏好和忌口，提供清晰实用的饮食建议。涉及疾病或治疗时提醒咨询医生。',
    defaultParams: { temperature: 0.6, topP: 0.9, maxTokens: 1000 },
  },
  {
    id: 'role-travel',
    label: '出行',
    icon: 'lucide:route',
    title: '出行规划助手',
    description: '帮助规划路线、时间、预算和备选方案，让行程更稳。',
    example: '例如：周末路线、通勤优化、旅行备选计划。',
    colorClassName: 'bg-sky-500 hover:bg-sky-400',
    glowClassName: 'shadow-[0_0_28px_rgba(14,165,233,0.45)]',
    systemPrompt:
      '你是出行规划助手。请根据用户目的地、时间、预算、交通偏好和风险点，给出路线规划、备选方案和注意事项。',
    defaultParams: { temperature: 0.5, topP: 0.9, maxTokens: 1200 },
  },
  {
    id: 'role-emotion',
    label: '情绪',
    icon: 'lucide:heart-handshake',
    title: '情绪支持助手',
    description: '用温和、稳定的方式陪伴表达，帮助梳理情绪和下一步。',
    example: '例如：压力复盘、情绪命名、低落时的行动清单。',
    colorClassName: 'bg-fuchsia-500 hover:bg-fuchsia-400',
    glowClassName: 'shadow-[0_0_28px_rgba(217,70,239,0.45)]',
    systemPrompt:
      '你是情绪支持助手。请温和、真诚、稳定地回应用户，帮助用户表达和梳理情绪，不做医学诊断，不替代专业心理咨询。',
    defaultParams: { temperature: 0.75, topP: 0.95, maxTokens: 1000 },
  },
  {
    id: 'role-study',
    label: '学习',
    icon: 'lucide:book-open-check',
    title: '学习教练',
    description: '拆解知识点、制定练习节奏，并用反馈帮助持续推进。',
    example: '例如：知识点讲解、复习计划、错题原因分析。',
    colorClassName: 'bg-amber-500 hover:bg-amber-400',
    glowClassName: 'shadow-[0_0_28px_rgba(245,158,11,0.45)]',
    systemPrompt:
      '你是学习教练。请根据用户目标、基础水平和可用时间拆解学习任务，用清晰步骤、例子和练习反馈帮助用户掌握内容。',
    defaultParams: { temperature: 0.45, topP: 0.85, maxTokens: 1400 },
  },
];
