import { OpenAICompatibleProvider } from './openai-compatible';

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(apiKey: string = process.env.DEEPSEEK_API_KEY || '') {
    super({
      apiKey,
      baseURL: 'https://api.deepseek.com',
      providerName: 'DeepSeek',
      envKey: 'DEEPSEEK_API_KEY',
      defaultModel: 'deepseek-v4-pro',
      imageFallbackNote:
        '[Note: the user uploaded an image, but the current DeepSeek model does not support image understanding. Please answer based on the text only.]',
    });
  }
}
