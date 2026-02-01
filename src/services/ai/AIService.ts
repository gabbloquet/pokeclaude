/**
 * Service principal pour les appels IA OpenAI
 * Singleton avec retry, rate limiting, timeout et cache
 */

import { aiConfig } from './AIConfig';
import { aiResponseCache } from './AICache';
import type {
  ChatMessage,
  AIOptions,
  AIResponse,
  AIUsage,
  AIServiceError,
  AIErrorCode,
  UsageStats,
} from './types';

const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

class AIServiceClass {
  private usageStats: UsageStats;

  constructor() {
    this.usageStats = this.loadUsageStats();
  }

  /**
   * Envoie une conversation à l'API OpenAI
   */
  async chat(
    messages: ChatMessage[],
    options: AIOptions = {}
  ): Promise<AIResponse> {
    // Vérifier si l'IA est activée
    if (!aiConfig.isEnabled()) {
      throw this.createError('API_KEY_MISSING', 'AI service is not enabled or API key is missing');
    }

    // Vérifier le budget quotidien
    this.checkDailyBudget();

    // Vérifier le cache
    const cacheKey = options.cacheKey;
    if (cacheKey) {
      const cached = aiResponseCache.get(cacheKey);
      if (cached) {
        if (aiConfig.isDebugMode()) {
          console.log('[AIService] Cache hit for:', cacheKey);
        }
        return {
          content: cached,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          fromCache: true,
          model: options.model || aiConfig.getDefaultModel(),
        };
      }
    }

    // Exécuter la requête avec retry
    const response = await this.executeWithRetry(
      () => this.makeRequest(messages, options),
      options.retries ?? DEFAULT_RETRIES
    );

    // Mettre en cache si demandé
    if (cacheKey && response.content) {
      aiResponseCache.set(cacheKey, response.content, options.cacheTTL);
    }

    return response;
  }

  /**
   * Raccourci pour un chat simple avec un seul message
   */
  async ask(
    prompt: string,
    systemPrompt?: string,
    options: AIOptions = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages, options);
    return response.content;
  }

  /**
   * Génère du contenu JSON structuré
   */
  async generateJSON<T>(
    prompt: string,
    systemPrompt: string,
    options: AIOptions = {}
  ): Promise<T> {
    const response = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      { ...options, jsonMode: true }
    );

    try {
      // Extraire le JSON de la réponse (peut être entouré de markdown)
      const jsonMatch = response.content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        response.content.match(/\{[\s\S]*\}/);

      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response.content;
      return JSON.parse(jsonStr) as T;
    } catch {
      throw this.createError('INVALID_RESPONSE', 'Failed to parse JSON response');
    }
  }

  /**
   * Vérifie si le service est disponible
   */
  isAvailable(): boolean {
    return aiConfig.isEnabled() && aiConfig.hasValidApiKey();
  }

  /**
   * Retourne les statistiques d'utilisation
   */
  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }

  /**
   * Réinitialise les statistiques quotidiennes
   */
  resetDailyStats(): void {
    this.usageStats = {
      dailyTokens: 0,
      dailyRequests: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    };
    this.saveUsageStats();
  }

  private async makeRequest(
    messages: ChatMessage[],
    options: AIOptions
  ): Promise<AIResponse> {
    const model = options.model || aiConfig.getDefaultModel();
    const timeout = options.timeout || aiConfig.getTimeout();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.getApiKey()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? DEFAULT_TEMPERATURE,
          max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
          ...(options.jsonMode && { response_format: { type: 'json_object' } }),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw this.handleAPIError(response.status, error);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const usage: AIUsage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      };

      // Mettre à jour les stats
      this.updateUsageStats(usage);

      if (aiConfig.isDebugMode()) {
        console.log('[AIService] Request completed:', {
          model,
          tokens: usage.totalTokens,
          contentLength: content.length,
        });
      }

      return {
        content,
        usage,
        fromCache: false,
        model,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createError('TIMEOUT', `Request timed out after ${timeout}ms`);
      }

      if ((error as AIServiceError).code) {
        throw error;
      }

      throw this.createError('NETWORK_ERROR', (error as Error).message);
    }
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    retries: number
  ): Promise<T> {
    let lastError: AIServiceError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as AIServiceError;

        if (!lastError.retryable || attempt === retries) {
          throw lastError;
        }

        if (aiConfig.isDebugMode()) {
          console.log(`[AIService] Retry ${attempt + 1}/${retries} after error:`, lastError.message);
        }

        // Délai exponentiel entre les tentatives
        await this.delay(RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }

    throw lastError;
  }

  private handleAPIError(status: number, error: Record<string, unknown>): AIServiceError {
    const message = (error.error as Record<string, string>)?.message || 'Unknown API error';

    switch (status) {
      case 401:
        return this.createError('API_KEY_INVALID', message);
      case 429:
        return this.createError('RATE_LIMIT', message, true);
      case 500:
      case 502:
      case 503:
        return this.createError('SERVICE_UNAVAILABLE', message, true);
      default:
        return this.createError('UNKNOWN', message);
    }
  }

  private createError(
    code: AIErrorCode,
    message: string,
    retryable: boolean = false
  ): AIServiceError {
    return { code, message, retryable };
  }

  private checkDailyBudget(): void {
    // Réinitialiser si nouveau jour
    const today = new Date().toISOString().split('T')[0];
    if (this.usageStats.lastResetDate !== today) {
      this.resetDailyStats();
    }

    if (this.usageStats.dailyTokens >= aiConfig.getDailyTokenLimit()) {
      throw this.createError(
        'QUOTA_EXCEEDED',
        `Daily token limit (${aiConfig.getDailyTokenLimit()}) exceeded`
      );
    }
  }

  private updateUsageStats(usage: AIUsage): void {
    this.usageStats.dailyTokens += usage.totalTokens;
    this.usageStats.dailyRequests++;
    this.saveUsageStats();
  }

  private loadUsageStats(): UsageStats {
    try {
      const stored = localStorage.getItem('pokeclaude-ai-usage');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore errors
    }

    return {
      dailyTokens: 0,
      dailyRequests: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    };
  }

  private saveUsageStats(): void {
    try {
      localStorage.setItem('pokeclaude-ai-usage', JSON.stringify(this.usageStats));
    } catch {
      // Ignore errors
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton
export const AIService = new AIServiceClass();

// Exposer globalement pour le debug
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).AIService = AIService;
}
