import { estimateMessageTokens } from './token-estimator';

export type RankableMessage = {
  type: 'question' | 'answer';
  content: string;
  image?: string | null;
};

// 从当前问题提取关键词：英文按词，中文按相邻双字片段。
function extractKeywords(text: string) {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[a-z0-9_]{2,}/g) ?? [];
  const cjkRuns = normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? [];
  const cjkPairs = cjkRuns.flatMap((run) =>
    Array.from({ length: Math.max(0, run.length - 1) }, (_, index) =>
      run.slice(index, index + 2)
    )
  );

  return Array.from(new Set([...words, ...cjkPairs])).slice(0, 24);
}

// 根据关键词命中、消息角色、图片和新近程度计算相关性。
function scoreMessage(
  message: RankableMessage,
  keywords: string[],
  index: number,
  total: number
) {
  const content = message.content.toLowerCase();
  const keywordScore =
    keywords.filter((keyword) => content.includes(keyword)).length * 3;
  const roleScore = message.type === 'question' ? 2 : 0;
  const imageScore = message.image ? 1 : 0;
  const recencyScore = total > 1 ? index / (total - 1) : 0;

  return keywordScore + roleScore + imageScore + recencyScore;
}

// 在 Token 预算内选出相关历史，并恢复成原始时间顺序。
export function pickRelevantMessages(
  messages: RankableMessage[],
  currentContent: string,
  budgetTokens: number
) {
  const keywords = extractKeywords(currentContent);
  let usedTokens = 0;

  if (keywords.length === 0) return [];

  return messages
    .map((message, index) => ({
      message,
      index,
      score: scoreMessage(message, keywords, index, messages.length),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .filter((item) => {
      const tokens = estimateMessageTokens(item.message);
      if (usedTokens + tokens > budgetTokens) return false;
      usedTokens += tokens;
      return true;
    })
    .sort((a, b) => a.index - b.index)
    .map((item) => item.message);
}
