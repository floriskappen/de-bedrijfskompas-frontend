import type { ByokModelCategory, ByokModelConfig, ByokProviderConfig, ByokProviderId } from "./types";

// Verified against OpenRouter's DeepSeek V4 Flash API quickstart on 2026-06-09.
export const OPENROUTER_DEEPSEEK_V4_FLASH_MODEL_ID = "deepseek/deepseek-v4-flash";

export const OPENROUTER_DEEPSEEK_V4_FLASH_MODEL: ByokModelConfig = {
  id: OPENROUTER_DEEPSEEK_V4_FLASH_MODEL_ID,
  label: "deepseek v4 flash",
  category: "worker",
  inputUsdPerMillionTokens: null,
  outputUsdPerMillionTokens: null,
};

export const BYOK_PROVIDERS: Record<ByokProviderId, ByokProviderConfig> = {
  openrouter: {
    id: "openrouter",
    label: "openrouter",
    models: [OPENROUTER_DEEPSEEK_V4_FLASH_MODEL],
  },
};

export function getByokProvider(providerId: string | null | undefined): ByokProviderConfig {
  return BYOK_PROVIDERS[providerId as ByokProviderId] ?? BYOK_PROVIDERS.openrouter;
}

export function getByokModelsForCategory(
  providerId: ByokProviderId,
  category: ByokModelCategory
): ByokModelConfig[] {
  const provider = getByokProvider(providerId);
  return provider.models.filter((model) => model.category === category);
}

export function getDefaultByokModelForCategory(
  providerId: ByokProviderId,
  category: ByokModelCategory
): ByokModelConfig {
  const models = getByokModelsForCategory(providerId, category);
  return models[0];
}

export function getByokModel(providerId: ByokProviderId, modelId: string | null | undefined): ByokModelConfig {
  const provider = getByokProvider(providerId);
  return provider.models.find((model) => model.id === modelId) ?? provider.models[0];
}
