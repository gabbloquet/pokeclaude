/**
 * Exports publics du service IA
 */

export { AIService } from './AIService';
export { aiConfig } from './AIConfig';
export { AICache, aiResponseCache, aiDescriptionCache } from './AICache';
export type {
  ChatMessage,
  AIOptions,
  AIResponse,
  AIUsage,
  AIServiceError,
  AIErrorCode,
  AIModel,
  AIConfig,
  UsageStats,
  CacheEntry,
} from './types';
