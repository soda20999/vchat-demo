import { z } from 'zod';

// 模型运行参数，对应各家 OpenAI-compatible API 的常见采样配置。
export interface AIModelParams {
  // 控制回复随机性，值越高越发散。
  temperature?: number;
  // 核采样参数，用于控制候选 token 范围。
  topP?: number;
  // 单次回复最大生成 token 数。
  maxTokens?: number;
}

// 所有模型供应商需要实现的统一聊天接口。
export interface AIProvider {
  // 发起流式对话，并通过 onChunk 持续返回增量文本。
  streamChat(
    // 已组装好的用户 Prompt / 上下文 Prompt。
    userPrompt: string,
    // 实际调用的模型名称，如 deepseek-v4-pro、qwen-plus。
    modelName: string,
    // 预留结构化输出 schema，当前普通聊天可为空。
    schema?: z.ZodType<unknown> | null,
    // 流式响应回调，每次返回一段增量文本。
    onChunk?: (text: string) => void,
    // 可选图片地址或 base64；不支持视觉的模型会降级为文本提示。
    imageUrl?: string,
    // 温度、topP、maxTokens 等模型参数。
    params?: AIModelParams
  ): Promise<{ answer: string }>;
}
