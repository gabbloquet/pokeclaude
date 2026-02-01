/**
 * Configuration du service IA
 * Lit les variables d'environnement Vite
 */

import type { AIConfig, AIModel } from './types';

class AIConfigManager {
  private config: AIConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): AIConfig {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    const enabled = import.meta.env.VITE_AI_ENABLED !== 'false';
    const model = (import.meta.env.VITE_AI_MODEL || 'gpt-4o-mini') as AIModel;
    const dailyLimit = parseInt(import.meta.env.VITE_AI_DAILY_TOKEN_LIMIT || '100000', 10);
    const timeout = parseInt(import.meta.env.VITE_AI_REQUEST_TIMEOUT_MS || '10000', 10);
    const debug = import.meta.env.VITE_AI_DEBUG === 'true';

    return {
      apiKey,
      enabled: enabled && !!apiKey,
      defaultModel: model,
      dailyTokenLimit: dailyLimit,
      requestTimeout: timeout,
      debug,
    };
  }

  get(): AIConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  hasValidApiKey(): boolean {
    return !!this.config.apiKey && this.config.apiKey.startsWith('sk-');
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  getDefaultModel(): AIModel {
    return this.config.defaultModel;
  }

  getTimeout(): number {
    return this.config.requestTimeout;
  }

  getDailyTokenLimit(): number {
    return this.config.dailyTokenLimit;
  }

  isDebugMode(): boolean {
    return this.config.debug;
  }

  /**
   * Met à jour la configuration à runtime (utile pour les tests)
   */
  update(partial: Partial<AIConfig>): void {
    this.config = { ...this.config, ...partial };
  }
}

export const aiConfig = new AIConfigManager();
