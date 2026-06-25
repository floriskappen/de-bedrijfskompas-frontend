export type ByokProviderId = "openrouter";

export type ByokModelCategory = "frontier" | "worker";

export type ByokCostSource = "provider" | "estimated" | "unknown";

export type ByokErrorCode =
  | "missing_config"
  | "invalid_key"
  | "insufficient_credit"
  | "allowance_exceeded"
  | "rate_limited"
  | "network_error"
  | "malformed_response";

export interface ByokModelConfig {
  id: string;
  label: string;
  category: ByokModelCategory;
  inputUsdPerMillionTokens: number | null;
  outputUsdPerMillionTokens: number | null;
}

export interface ByokProviderConfig {
  id: ByokProviderId;
  label: string;
  models: ByokModelConfig[];
}

export interface ByokStoredConfig {
  providerId: ByokProviderId;
  modelByCategory: Partial<Record<ByokModelCategory, string>>;
  saveKey: boolean;
  hasSavedKey: boolean;
  allowanceUsd: number | null;
  usageUsd: number;
  usageCostSource: ByokCostSource;
  confirmedAt: string | null;
}

export interface ByokSetupInput {
  providerId: ByokProviderId;
  modelByCategory: Partial<Record<ByokModelCategory, string>>;
  apiKey: string;
  saveKey: boolean;
  allowanceUsd: number | null;
}

export interface ByokUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  costSource: ByokCostSource;
}

export interface ByokChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ByokRequest {
  purpose: string;
  category: ByokModelCategory;
  messages: ByokChatMessage[];
  responseFormat?: "text" | "json";
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ByokSuccess {
  ok: true;
  content: string;
  usage: ByokUsage;
}

export interface ByokFailure {
  ok: false;
  error: ByokErrorCode;
}

export type ByokResult = ByokSuccess | ByokFailure;

export interface ByokProviderRequest extends ByokRequest {
  apiKey: string;
  modelId: string;
  category: ByokModelCategory;
  providerId: ByokProviderId;
}

export interface ByokProviderAdapter {
  id: ByokProviderId;
  send(request: ByokProviderRequest): Promise<ByokResult>;
}
