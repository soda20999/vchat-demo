import type { AIProvider } from '../interface';

type SummaryMessage = {
  type: 'question' | 'answer';
  content: string;
  image?: string | null;
};

// 将消息列表转成摘要模型容易理解的对话文本。
function formatMessages(messages: SummaryMessage[]) {
  return messages
    .map((message) => {
      const role = message.type === 'question' ? 'User' : 'Assistant';
      const imageNote = message.image ? ' [with image]' : '';
      return `${role}${imageNote}: ${message.content || '[Image only]'}`;
    })
    .join('\n');
}

// 生成长对话摘要，后续作为压缩上下文注入 Prompt。
export async function summarizeMessages(input: {
  provider: AIProvider;
  modelName: string;
  previousSummary?: string | null;
  messages: SummaryMessage[];
}) {
  if (input.messages.length === 0) return input.previousSummary || '';

  const prompt = `
Summarize the conversation for future context.
Keep user goals, decisions, constraints, project facts, and unresolved tasks.
Be concise. Do not add new facts.

Previous summary:
${input.previousSummary || 'None'}

Messages:
${formatMessages(input.messages)}
`.trim();

  const result = await input.provider.streamChat(prompt, input.modelName);
  return result.answer.trim();
}
