/**
 * Cache LRU pour les réponses IA
 * Évite les appels API redondants et réduit les coûts
 */

import type { CacheEntry } from './types';

const DEFAULT_MAX_SIZE = 100;
const DEFAULT_TTL = 60 * 60 * 1000; // 1 heure

export class AICache<T = string> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = DEFAULT_MAX_SIZE, defaultTTL: number = DEFAULT_TTL) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Récupère une valeur du cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Vérifier l'expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // LRU: déplacer en fin de Map (plus récent)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Stocke une valeur dans le cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Si le cache est plein, supprimer l'entrée la plus ancienne
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl ?? this.defaultTTL),
    };

    this.cache.set(key, entry);
  }

  /**
   * Vérifie si une clé existe et n'est pas expirée
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Retourne la taille actuelle du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Retourne les statistiques du cache
   */
  stats(): { size: number; maxSize: number; oldestEntry: number | null } {
    let oldestEntry: number | null = null;

    if (this.cache.size > 0) {
      const firstEntry = this.cache.values().next().value;
      if (firstEntry) {
        oldestEntry = firstEntry.createdAt;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestEntry,
    };
  }

  /**
   * Génère une clé de cache à partir d'un objet
   */
  static generateKey(data: Record<string, unknown>): string {
    return JSON.stringify(data);
  }
}

// Instance singleton pour les réponses IA
export const aiResponseCache = new AICache<string>(100, DEFAULT_TTL);

// Cache plus long pour les descriptions générées
export const aiDescriptionCache = new AICache<string>(200, 24 * 60 * 60 * 1000); // 24h
