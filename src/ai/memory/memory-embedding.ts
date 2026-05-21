const DASHSCOPE_EMBEDDING_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

const EMBEDDING_MODEL = 'text-embedding-v4';

interface DashScopeEmbeddingResponse {
  output?: {
    embeddings?: Array<{ embedding?: number[] }>;
  };
  message?: string;
}

// 调用阿里云 DashScope Embedding API，把文本转成 1024 维语义向量。
export async function buildMemoryEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('replace-with-')) {
    throw new Error('DASHSCOPE_API_KEY is missing. Set it in .env');
  }

  const response = await fetch(DASHSCOPE_EMBEDDING_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: { texts: [text] },
      parameters: { dimension: 1024, output_type: 'dense' },
    }),
  });

  const data = (await response.json()) as DashScopeEmbeddingResponse;
  const embedding = data.output?.embeddings?.[0]?.embedding;
  if (!response.ok || !embedding) {
    throw new Error(data.message || 'Failed to build memory embedding');
  }

  return embedding;
}
