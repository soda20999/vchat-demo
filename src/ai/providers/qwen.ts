import { OpenAICompatibleProvider } from './openai-compatible';

export class QwenProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string = process.env.QWEN_API_KEY || '') {
    super({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      providerName: 'Qwen',
      envKey: 'QWEN_API_KEY',
      defaultModel: 'qwen-plus',
      imageFallbackNote:
        '[Note: the user uploaded an image, but the current Qwen text model does not process images yet. Please answer based on the text only.]',
    });
  }
}
