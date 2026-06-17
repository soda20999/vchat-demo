import { z } from 'zod';

export interface AIModelParams {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface AIStreamOptions {
  signal?: AbortSignal;
}

export interface AIProvider {
  streamChat(
    userPrompt: string,
    modelName: string,
    schema?: z.ZodType<unknown> | null,
    onChunk?: (text: string) => void,
    imageUrl?: string,
    params?: AIModelParams,
    options?: AIStreamOptions
  ): Promise<{ answer: string }>;
}
