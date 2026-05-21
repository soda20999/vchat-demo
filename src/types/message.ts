/**
 * 消息状态类型
 */
export type MessageStatus = 'loading' | 'streaming' | 'finished' | 'error';

/**
 * 消息类型定义
 */
export interface Message {
  id: number;
  content: string;
  status: MessageStatus;
  conversationId: number;
  type: 'question' | 'answer';
  image?: string; // Base64 数据或本地路径
  createdAt: Date;
}

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
 * 前端显示用的消息类型（向后兼容）
 */
export type MessageProps = Message;
