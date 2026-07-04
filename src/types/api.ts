import { z } from 'zod';

export interface ApiResponseEnvelope<T = unknown> {
  code?: number;
  message?: string;
  data?: T;
  timestamp?: number;
}

export interface ApiErrorEnvelope {
  code?: number;
  message: string;
  timestamp?: number;
}

export type ApiResponse<T = unknown> = ApiResponseEnvelope<T>;

export const chatContextOptionsSchema = z.object({
  memoryEnabled: z.boolean().optional(),
  summaryEnabled: z.boolean().optional(),
  relevantHistoryEnabled: z.boolean().optional(),
  recentTurns: z.number().int().positive().optional(),
});

export const chatPromptSettingsSchema = z.object({
  templateId: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
});

export const sendMessageSchema = z
  .object({
    conversationId: z.number().int().positive().nullable().optional(),
    content: z.string().trim().optional().default(''),
    model: z.string().trim().min(1, 'Model is required'),
    image: z.string().optional(),
    providerName: z.string().trim().optional(),
    contextOptions: chatContextOptionsSchema.optional(),
    promptSettings: chatPromptSettingsSchema.optional(),
  })
  .refine((value) => value.content || value.image, {
    message: 'Message content or image is required',
  });

export type ChatContextOptions = z.infer<typeof chatContextOptionsSchema>;
export type ChatPromptSettings = z.infer<typeof chatPromptSettingsSchema>;
export type SendMessagePayload = z.infer<typeof sendMessageSchema>;
