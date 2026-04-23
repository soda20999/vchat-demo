// src/ai/interface.ts
import { z } from "zod";

export interface AIProvider {
  // 统一的流式对话方法
  streamChat(
    userPrompt: string,
    modelName: string,
    schema?: z.ZodType<any> | null,   // ✨ 改为可选：不传就是普通对话，传了就是 JSON 提取
    onChunk?: (text: string) => void, // ✨ 允许不传回调
    imageUrl?: string                 // ✨ 新增图片路径参数
  ): Promise<any>;
}