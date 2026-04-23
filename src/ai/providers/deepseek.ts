import OpenAI from 'openai';
import { z } from 'zod';
import { AIProvider } from '../interface';

export class DeepSeekProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string = process.env.DEEPSEEK_API_KEY || '') {
    if (!apiKey) {
      throw new Error('DeepSeek API key is missing. Set DEEPSEEK_API_KEY in .env');
    }

    this.client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey,
    });
  }

  async streamChat(
    userPrompt: string,
    modelName: string = 'deepseek-chat',
    _schema?: z.ZodType | null,
    onChunk?: (text: string) => void,
    imageUrl?: string
  ): Promise<{ answer: string }> {
    let finalPrompt = userPrompt;

    if (imageUrl) {
      finalPrompt +=
        '\n[Note: the user uploaded an image, but the current DeepSeek model does not support image understanding. Please answer based on the text only.]';
    }

    const stream = await this.client.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: finalPrompt }],
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (!chunkText) continue;

      fullResponse += chunkText;
      onChunk?.(chunkText);
    }

    return { answer: fullResponse };
  }
}
