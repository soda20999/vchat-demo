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
  ApiResponse,
} from './user';

// Message 相关类型
export type {
  Message,
  MessageStatus,
  MessageProps,
  CreateMessagePayload,
} from './message';

// Conversation 相关类型
export type {
  Conversation,
  ConversationProps,
  ConversationUIState,
  CreateConversationPayload,
  UpdateConversationPayload,
} from './chat';

// Provider 相关类型
export type {
  Provider,
  ProviderProps,
  CreateProviderPayload,
} from './provide';
