import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateUserProfileSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  signature: z.string().max(200).optional(),
});

export const updateUserPasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export const createConversationSchema = z.object({
  title: z.string().min(1).max(100),
  selectedModel: z.string().min(1),
  provideId: z.number().int().positive().nullable().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  selectedModel: z.string().optional(),
});

export const createMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z.string().min(1),
  type: z.enum(['question', 'answer']),
  image: z.string().optional(),
  status: z.enum(['loading', 'finished', 'streaming']).default('finished'),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(['loading', 'finished', 'streaming']).optional(),
});

export const sendMessageSchema = z
  .object({
    conversationId: z.number().int().positive().optional(),
    content: z.string().trim().optional().default(''),
    model: z.string().min(1),
    image: z.string().optional(),
  })
  .refine((value) => value.content || value.image, {
    message: 'Message content or image is required',
  });

export const createProviderSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  desc: z.string().optional(),
  avatar: z.string().url().optional(),
  models: z.array(z.string()).min(1),
});

export type RegisterPayload = z.infer<typeof registerSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
export type UpdateUserProfilePayload = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserPasswordPayload = z.infer<typeof updateUserPasswordSchema>;
export type CreateConversationPayload = z.infer<typeof createConversationSchema>;
export type UpdateConversationPayload = z.infer<typeof updateConversationSchema>;
export type CreateMessagePayload = z.infer<typeof createMessageSchema>;
export type UpdateMessagePayload = z.infer<typeof updateMessageSchema>;
export type SendMessagePayload = z.infer<typeof sendMessageSchema>;
export type CreateProviderPayload = z.infer<typeof createProviderSchema>;
