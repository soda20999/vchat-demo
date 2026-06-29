import { buildChatContext } from '../src/ai/context/context-builder';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

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

assert(
  context.includes('[Current Question]\nUser: 介绍苹果'),
  'Context should include the current user question'
);

assert(
  context.includes('Answer the current user question directly'),
  'Context should explicitly tell the model to answer the current question directly'
);

assert(
  context.includes('If no relevant context is available'),
  'Context should tell the model what to do when a new conversation has no extra context'
);

assert(
  !context.includes('based on the context below'),
  'Context should not imply that extra context is required before answering'
);

console.log('Chat context checks passed');
