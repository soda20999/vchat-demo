/**
 * 统一导出所有类型定义
 * 使用方式：import { User, Message, Conversation } from '@/type';
 */

// User 相关类型
export type {
  User,
  UserProps,
  RegisterPayload,
  LoginPayload,
  LoginResponse,
  UpdateUserProfilePayload,
  UpdateUserPasswordPayload,
  UserErrorType,
} from './user';

export type {
  ApiErrorEnvelope,
  ApiResponse,
  ApiResponseEnvelope,
  ChatContextOptions,
  ChatPromptSettings,
  SendMessagePayload,
} from './api';
export { sendMessageSchema } from './api';

// Message 相关类型
export type {
  Message,
  MessageDto,
  MessageStatus,
  MessageProps,
  CreateMessagePayload,
} from './message';

// Conversation 相关类型
export type {
  Conversation,
  ConversationDto,
  ConversationProps,
  ConversationUIState,
  CreateConversationPayload,
  UpdateConversationPayload,
} from './chat';

// Provider 相关类型
export type { Provider, ProviderProps, CreateProviderPayload } from './provide';
