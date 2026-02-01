/**
 * Types pour le service IA
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  /** Modèle OpenAI à utiliser */
  model?: AIModel;
  /** Température (0-2) - Plus élevé = plus créatif */
  temperature?: number;
  /** Nombre maximum de tokens dans la réponse */
  maxTokens?: number;
  /** Clé pour le cache (si fournie, la réponse sera mise en cache) */
  cacheKey?: string;
  /** Durée de vie du cache en ms (défaut: 1h) */
  cacheTTL?: number;
  /** Timeout de la requête en ms */
  timeout?: number;
  /** Nombre de tentatives en cas d'erreur */
  retries?: number;
  /** Forcer une réponse JSON valide */
  jsonMode?: boolean;
}

export type AIModel = 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';

export interface AIResponse {
  content: string;
  usage: AIUsage;
  fromCache: boolean;
  model: string;
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIServiceError {
  code: AIErrorCode;
  message: string;
  retryable: boolean;
  originalError?: Error;
}

export type AIErrorCode =
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'RATE_LIMIT'
  | 'QUOTA_EXCEEDED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE'
  | 'CONTENT_FILTERED'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface AIConfig {
  apiKey: string;
  enabled: boolean;
  defaultModel: AIModel;
  dailyTokenLimit: number;
  requestTimeout: number;
  debug: boolean;
}

export interface UsageStats {
  dailyTokens: number;
  dailyRequests: number;
  lastResetDate: string;
}
