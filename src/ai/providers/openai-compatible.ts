import OpenAI from 'openai';
import { z } from 'zod';
import { AIModelParams, AIProvider, AIStreamOptions } from '../interface';

interface OpenAICompatibleProviderOptions {
  apiKey: string;
  baseURL: string;
  providerName: string;
  envKey: string;
  defaultModel: string;
  imageFallbackNote: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  private client: OpenAI;
  private defaultModel: string;
  private imageFallbackNote: string;

  constructor(options: OpenAICompatibleProviderOptions) {
    if (!options.apiKey || options.apiKey.startsWith('replace-with-')) {
      throw new Error(
        `${options.providerName} API key is missing. Set ${options.envKey} in .env`
      );
    }

    this.client = new OpenAI({
      baseURL: options.baseURL,
      apiKey: options.apiKey,
    });
    this.defaultModel = options.defaultModel;
    this.imageFallbackNote = options.imageFallbackNote;
  }

  async streamChat(
    userPrompt: string,
    modelName: string = this.defaultModel,
    _schema?: z.ZodType | null,
    onChunk?: (text: string) => void,
    imageUrl?: string,
    params?: AIModelParams,
    options?: AIStreamOptions
  ): Promise<{ answer: string }> {
    const finalPrompt = imageUrl
      ? `${userPrompt}\n${this.imageFallbackNote}`
      : userPrompt;
    const signal = options?.signal;

    if (signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    const stream = await this.client.chat.completions.create(
      {
        model: modelName,
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: params?.temperature,
        top_p: params?.topP,
        max_tokens: params?.maxTokens,
        stream: true,
      },
      { signal }
    );

    let fullResponse = '';

    for await (const chunk of stream) {
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (!chunkText) continue;

      fullResponse += chunkText;
      onChunk?.(chunkText);
    }

    return { answer: fullResponse };
  }
}
