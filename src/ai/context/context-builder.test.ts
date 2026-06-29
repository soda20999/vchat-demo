import { describe, expect, it } from 'vitest';

import { buildChatContext, shouldSummarizeContext } from './context-builder';

describe('buildChatContext', () => {
  it('includes the current question and direct-answer guidance for new conversations', () => {
    const context = buildChatContext({
      modelName: 'deepseek-v4-pro',
      currentContent: '介绍苹果',
      historyMessages: [],
      memories: [],
      options: {
        memoryEnabled: true,
        summaryEnabled: true,
        relevantHistoryEnabled: true,
      },
    });

    expect(context).toContain('[Current Question]\nUser: 介绍苹果');
    expect(context).toContain('Answer the current user question directly');
    expect(context).toContain('If no relevant context is available');
    expect(context).not.toContain('based on the context below');
  });

  it('respects system prompt, memory, summary, and relevant history options', () => {
    const historyMessages = [
      { type: 'question' as const, content: '我喜欢晚上学习' },
      { type: 'answer' as const, content: '记住了，你偏好晚间学习。' },
      { type: 'question' as const, content: '无关问题' },
      { type: 'answer' as const, content: '无关回答' },
    ];

    const context = buildChatContext({
      modelName: 'unknown-model',
      currentContent: '什么时候适合学习',
      systemPrompt: '保持简洁',
      summary: '用户正在制定复习计划。',
      memories: [{ content: '用户喜欢晚上学习。' }],
      historyMessages,
      options: {
        recentTurns: 1,
      },
    });

    expect(context).toContain('[System]\n保持简洁');
    expect(context).toContain('[Long-term Memories]\n- 用户喜欢晚上学习。');
    expect(context).toContain('[Conversation Summary]\n用户正在制定复习计划。');
    expect(context).toContain('[Relevant History]\nUser: 我喜欢晚上学习');
    expect(context).toContain('[Recent Messages]\nUser: 无关问题\nAssistant: 无关回答');
  });

  it('omits disabled sections and adds image guidance for image questions', () => {
    const context = buildChatContext({
      modelName: 'unknown-model',
      currentContent: '',
      currentImage: 'data:image/png',
      summary: 'summary',
      memories: [{ content: 'memory' }],
      historyMessages: [{ type: 'question', content: 'old history' }],
      options: {
        memoryEnabled: false,
        summaryEnabled: false,
        relevantHistoryEnabled: false,
      },
    });

    expect(context).not.toContain('[Long-term Memories]');
    expect(context).not.toContain('[Conversation Summary]');
    expect(context).not.toContain('[Relevant History]');
    expect(context).toContain('[Current Question]\nUser: [Image]');
    expect(context).toContain('The user also uploaded an image');
  });
});

describe('shouldSummarizeContext', () => {
  it('uses the model policy message threshold', () => {
    expect(shouldSummarizeContext('unknown-model', 15)).toBe(false);
    expect(shouldSummarizeContext('unknown-model', 16)).toBe(true);
    expect(shouldSummarizeContext('deepseek-v4-pro', 19)).toBe(false);
    expect(shouldSummarizeContext('deepseek-v4-pro', 20)).toBe(true);
  });
});
