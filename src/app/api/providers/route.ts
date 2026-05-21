import { getSupportedProviderNames } from '@/ai/provider-factory';
import { LOCAL_PROVIDERS } from '@/config/providers';
import * as providerService from '@/db/service/provide';
import {
  jsonExceptionResponse,
  jsonSuccessResponse,
} from '@/lib/api-error';

export async function GET() {
  try {
    const supportedProviders = new Set(getSupportedProviderNames());
    const dbProviderMap = new Map(
      (await providerService.getAllProviders()).map((provider) => [
        provider.name,
        provider,
      ])
    );
    const localProviderMap = new Map(
      LOCAL_PROVIDERS.map((provider) => [provider.name, provider])
    );
    const providers = LOCAL_PROVIDERS
      .filter((provider) => supportedProviders.has(provider.name))
      .map((provider) => {
        const dbProvider = dbProviderMap.get(provider.name);
        return {
          ...provider,
          id: dbProvider?.id ?? provider.id,
          createdAt: dbProvider?.createdAt ?? provider.createdAt,
          updatedAt: dbProvider?.updatedAt ?? provider.updatedAt,
          models: localProviderMap.get(provider.name)?.models || provider.models,
        };
      });

    return jsonSuccessResponse(providers, 'Providers fetched');
  } catch (error) {
    return jsonExceptionResponse(error, 'GET /api/providers error');
  }
}
