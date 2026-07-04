/**
 * 消息状态类型
 */
export type MessageStatus = 'loading' | 'streaming' | 'finished' | 'error';

/**
 * 前端 UI 层使用的消息类型，时间字段已 hydration 为 Date。
 */
export interface Message {
  id: number;
  content: string;
  status: MessageStatus;
  conversationId: number;
  type: 'question' | 'answer';
  image?: string;
  createdAt: Date;
}

/**
 * API JSON 返回的消息 DTO，时间字段保持序列化后的字符串。
 */
export type MessageDto = Omit<Message, 'createdAt'> & {
  createdAt: string;
};

/**
 * 前端创建消息时的请求数据
 */
export interface CreateMessagePayload {
  conversationId: number;
  content: string;
  type: 'question' | 'answer';
  image?: string;
}

/**
 * 前端显示用的消息类型
 */
export type MessageProps = Message;
