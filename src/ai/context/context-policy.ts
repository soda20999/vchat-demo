export interface ContextPolicy {
  // 摘要、相关历史、最近对话各自的 Token 预算。
  summaryBudgetTokens: number;
  relevantHistoryBudgetTokens: number;
  recentTurnsBudgetTokens: number;
  // 默认携带最近几轮对话，一问一答算一轮。
  recentTurns: number;
  // 消息数量达到该阈值后触发摘要。
  summarizeAfterMessages: number;
}

const DEFAULT_POLICY: ContextPolicy = {
  summaryBudgetTokens: 800,
  relevantHistoryBudgetTokens: 1500,
  recentTurnsBudgetTokens: 3500,
  recentTurns: 6,
  summarizeAfterMessages: 16,
};

const MODEL_CONTEXT_POLICIES: Record<string, ContextPolicy> = {
  'deepseek-v4-pro': {
    summaryBudgetTokens: 1200,
    relevantHistoryBudgetTokens: 3000,
    recentTurnsBudgetTokens: 7000,
    recentTurns: 8,
    summarizeAfterMessages: 20,
  },
  'qwen-plus': {
    summaryBudgetTokens: 2000,
    relevantHistoryBudgetTokens: 6000,
    recentTurnsBudgetTokens: 14000,
    recentTurns: 10,
    summarizeAfterMessages: 24,
  },
  'qwen-turbo': {
    summaryBudgetTokens: 2000,
    relevantHistoryBudgetTokens: 6000,
    recentTurnsBudgetTokens: 14000,
    recentTurns: 10,
    summarizeAfterMessages: 24,
  },
};

// 按模型名获取上下文策略，未知模型使用默认策略。
export function getContextPolicy(modelName: string): ContextPolicy {
  return MODEL_CONTEXT_POLICIES[modelName] ?? DEFAULT_POLICY;
}
