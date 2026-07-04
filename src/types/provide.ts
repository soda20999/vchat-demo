/**
 * AI 服务商类型定义
 */
export interface Provider {
  id: number;
  name: string;
  title?: string;
  desc?: string;
  avatar?: string;
  models: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建服务商时的请求数据
 */
export interface CreateProviderPayload {
  name: string;
  title?: string;
  desc?: string;
  avatar?: string;
  models: string[];
}

/**
 * 前端显示用的提供商类型（向后兼容）
 */
export type ProviderProps = Provider;
