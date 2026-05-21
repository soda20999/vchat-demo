interface TokenEstimateInput {
  content?: string | null;
  image?: string | null;
}

const IMAGE_TOKEN_COST = 1200;

// 粗略估算文本 Token：中文按字、英文按词、符号折半计算。
export function estimateTextTokens(text = '') {
  if (!text.trim()) return 0;

  const codeBlocks = text.match(/```[\s\S]*?```/g) ?? [];
  const codeTokens = codeBlocks.join('').length * 0.35;
  const plainText = text.replace(/```[\s\S]*?```/g, ' ');
  const cjkTokens = (plainText.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const wordTokens = (plainText.match(/[a-zA-Z0-9_]+/g) ?? []).length;
  const symbolTokens = Math.ceil(
    plainText.replace(/[\u4e00-\u9fff\w\s]/g, '').length / 2
  );

  return Math.ceil(codeTokens + cjkTokens + wordTokens + symbolTokens);
}

// 单条消息估算：文本 + 图片成本 + 角色分隔开销。
export function estimateMessageTokens(message: TokenEstimateInput) {
  return (
    estimateTextTokens(message.content ?? '') +
    (message.image ? IMAGE_TOKEN_COST : 0) +
    8
  );
}
