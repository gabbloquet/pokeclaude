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

// Validators
export {
  JSONValidator,
  ContentValidator,
  type JSONSchema,
  type ValidationResult,
  type ContentValidationOptions,
  type ContentValidationResult,
} from './validators';

// Generators
export {
  DescriptionGenerator,
  descriptionGenerator,
  QuestGenerator,
  questGenerator,
  CreatureGenerator,
  creatureGenerator,
  BalancingSystem,
  type GeneratedQuest,
  type GeneratedCreature,
  type GeneratedCreatureData,
  type CreatureTier,
  type BSTRange,
  type BalanceResult,
} from './generators';
