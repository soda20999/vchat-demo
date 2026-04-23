import { GeminiProvider } from './providers/gemini';
import { DeepSeekProvider } from './providers/deepseek';
import { AIProvider } from './interface';

const providerEnvMap: Record<string, string> = {
  gemini: 'GEMINI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
};

export function getAIProvider(providerType: string): AIProvider {
  const normalizedProvider = providerType.toLowerCase();

  switch (normalizedProvider) {
    case 'gemini':
      return new GeminiProvider(process.env.GEMINI_API_KEY || '');
    case 'deepseek':
      return new DeepSeekProvider(process.env.DEEPSEEK_API_KEY || '');
    default:
      throw new Error(`Unsupported AI provider: ${providerType}`);
  }
}

export function getAvailableProviders(): string[] {
  return Object.entries(providerEnvMap)
    .filter(([, envKey]) => Boolean(process.env[envKey]))
    .map(([providerName]) => providerName);
}
