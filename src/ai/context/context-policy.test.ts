import { describe, expect, it } from 'vitest';

import { getContextPolicy } from './context-policy';

describe('getContextPolicy', () => {
  it('returns the default policy for unknown models', () => {
    expect(getContextPolicy('unknown-model')).toEqual({
      summaryBudgetTokens: 800,
      relevantHistoryBudgetTokens: 1500,
      recentTurnsBudgetTokens: 3500,
      recentTurns: 6,
      summarizeAfterMessages: 16,
    });
  });

  it('returns larger budgets for deepseek-v4-pro', () => {
    expect(getContextPolicy('deepseek-v4-pro')).toMatchObject({
      summaryBudgetTokens: 1200,
      relevantHistoryBudgetTokens: 3000,
      recentTurnsBudgetTokens: 7000,
      recentTurns: 8,
      summarizeAfterMessages: 20,
    });
  });

  it('uses the long-context policy for qwen models', () => {
    expect(getContextPolicy('qwen-plus')).toEqual(getContextPolicy('qwen-turbo'));
    expect(getContextPolicy('qwen-plus')).toMatchObject({
      relevantHistoryBudgetTokens: 6000,
      recentTurns: 10,
      summarizeAfterMessages: 24,
    });
  });
});
