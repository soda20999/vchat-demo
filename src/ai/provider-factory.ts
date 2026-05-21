import { DeepSeekProvider } from './providers/deepseek';
import { QwenProvider } from './providers/qwen';
import { AIProvider } from './interface';

const providerEnvMap: Record<string, string> = {
  deepseek: 'DEEPSEEK_API_KEY',
  qwen: 'QWEN_API_KEY',
};

export function getSupportedProviderNames(): string[] {
  return Object.keys(providerEnvMap);
}

function hasConfiguredApiKey(envKey: string): boolean {
  const value = process.env[envKey]?.trim();
  return Boolean(value && !value.startsWith('replace-with-'));
}

export function getAIProvider(providerType: string): AIProvider {
  const normalizedProvider = providerType.toLowerCase();

  switch (normalizedProvider) {
    case 'deepseek':
      return new DeepSeekProvider(process.env.DEEPSEEK_API_KEY || '');
    case 'qwen':
      return new QwenProvider(process.env.QWEN_API_KEY || '');
    default:
      throw new Error(`Unsupported AI provider: ${providerType}`);
  }
}

export function getAvailableProviders(): string[] {
  return Object.entries(providerEnvMap)
    .filter(([, envKey]) => hasConfiguredApiKey(envKey))
    .map(([providerName]) => providerName);
}
