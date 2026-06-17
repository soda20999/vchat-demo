import { getContextPolicy } from './context-policy';
import { pickRelevantMessages } from './message-ranker';
import { estimateMessageTokens, estimateTextTokens } from './token-estimator';

type ContextMessage = {
  type: 'question' | 'answer';
  content: string;
  image?: string | null;
};

type MemoryContext = {
  content: string;
};

interface BuildContextInput {
  modelName: string;
  currentContent: string;
  currentImage?: string | null;
  summary?: string | null;
  systemPrompt?: string | null;
  memories?: MemoryContext[];
  historyMessages: ContextMessage[];
  options?: {
    memoryEnabled?: boolean;
    summaryEnabled?: boolean;
    relevantHistoryEnabled?: boolean;
    recentTurns?: number;
  };
}

function roleLabel(type: ContextMessage['type']) {
  return type === 'question' ? 'User' : 'Assistant';
}

function formatMessages(messages: ContextMessage[]) {
  return messages
    .map((message) => `${roleLabel(message.type)}: ${message.content || '[Image]'}`)
    .join('\n');
}

// 选取最近若干轮消息，同时不超过最近对话 Token 预算。
function pickRecentMessages(
  messages: ContextMessage[],
  modelName: string,
  inputRecentTurns?: number
) {
  const policy = getContextPolicy(modelName);
  const recentTurns = Math.max(1, inputRecentTurns ?? policy.recentTurns);
  const candidates = messages.slice(-recentTurns * 2);
  const picked: ContextMessage[] = [];
  let usedTokens = 0;

  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const message = candidates[i];
    const tokens = estimateMessageTokens(message);
    if (usedTokens + tokens > policy.recentTurnsBudgetTokens) break;

    picked.unshift(message);
    usedTokens += tokens;
  }

  return picked;
}

// 组装最终 Prompt：系统提示、长期记忆、摘要、相关历史、最近消息、当前问题。
export function buildChatContext(input: BuildContextInput) {
  const policy = getContextPolicy(input.modelName);
  const options = input.options ?? {};
  const parts: string[] = [];

  if (input.systemPrompt?.trim()) {
    parts.push(`[System]\n${input.systemPrompt.trim()}`);
  }

  parts.push(
    [
      'Answer the current user question directly.',
      'Use any provided memories, summaries, or history only as optional reference.',
      'If no relevant context is available, rely on the current question and general knowledge.',
      'Do not ask the user for context unless the current question itself is ambiguous.',
    ].join(' ')
  );

  if (options.memoryEnabled !== false && input.memories?.length) {
    parts.push(
      `\n[Long-term Memories]\n${input.memories
        .map((memory) => `- ${memory.content}`)
        .join('\n')}`
    );
  }

  if (
    options.summaryEnabled !== false &&
    input.summary &&
    estimateTextTokens(input.summary) <= policy.summaryBudgetTokens
  ) {
    parts.push(`\n[Conversation Summary]\n${input.summary}`);
  }

  const recentMessages = pickRecentMessages(
    input.historyMessages,
    input.modelName,
    options.recentTurns
  );
  const recentSet = new Set(recentMessages);
  const olderMessages = input.historyMessages.filter(
    (message) => !recentSet.has(message)
  );
  const relevantMessages =
    options.relevantHistoryEnabled === false
      ? []
      : pickRelevantMessages(
          olderMessages,
          input.currentContent,
          policy.relevantHistoryBudgetTokens
        );

  if (relevantMessages.length > 0) {
    parts.push(`\n[Relevant History]\n${formatMessages(relevantMessages)}`);
  }

  if (recentMessages.length > 0) {
    parts.push(`\n[Recent Messages]\n${formatMessages(recentMessages)}`);
  }

  parts.push(
    `\n[Current Question]\nUser: ${input.currentContent || '[Image]'}${
      input.currentImage ? '\nThe user also uploaded an image. Consider the image when answering.' : ''
    }`
  );

  return parts.join('\n');
}

// 达到消息数量阈值后，后台异步生成会话摘要。
export function shouldSummarizeContext(
  modelName: string,
  messageCount: number
) {
  return messageCount >= getContextPolicy(modelName).summarizeAfterMessages;
}
