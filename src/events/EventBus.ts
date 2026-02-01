import Phaser from 'phaser';
import type { BattleEventPayloads, BattleEventName } from './BattleEvents';
import type { AIEventPayloads, AIEventName } from './AIEvents';

/**
 * EventBus centralisé pour la communication entre modules
 * Utilise le système d'événements de Phaser sous le capot
 */
class EventBusClass extends Phaser.Events.EventEmitter {
  private debugMode: boolean = false;

  constructor() {
    super();
  }

  /**
   * Active/désactive le mode debug (log tous les événements)
   */
  setDebug(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Émet un événement typé
   */
  emitBattle<K extends BattleEventName>(
    event: K,
    payload?: K extends keyof BattleEventPayloads ? BattleEventPayloads[K] : never
  ): boolean {
    if (this.debugMode) {
      console.log(`[EventBus] ${event}`, payload);
    }
    return this.emit(event, payload);
  }

  /**
   * Écoute un événement typé
   */
  onBattle<K extends BattleEventName>(
    event: K,
    callback: (payload: K extends keyof BattleEventPayloads ? BattleEventPayloads[K] : never) => void,
    context?: object
  ): this {
    return this.on(event, callback, context);
  }

  /**
   * Écoute un événement une seule fois
   */
  onceBattle<K extends BattleEventName>(
    event: K,
    callback: (payload: K extends keyof BattleEventPayloads ? BattleEventPayloads[K] : never) => void,
    context?: object
  ): this {
    return this.once(event, callback, context);
  }

  /**
   * Retire un listener
   */
  offBattle<K extends BattleEventName>(
    event: K,
    callback?: (payload: K extends keyof BattleEventPayloads ? BattleEventPayloads[K] : never) => void,
    context?: object
  ): this {
    return this.off(event, callback, context);
  }

  /**
   * Retire tous les listeners d'un événement ou tous les événements
   */
  clearBattle(event?: BattleEventName): this {
    if (event) {
      return this.removeAllListeners(event);
    }
    return this.removeAllListeners();
  }

  // === Méthodes pour les événements IA ===

  /**
   * Émet un événement IA typé
   */
  emitAI<K extends AIEventName>(
    event: K,
    payload?: K extends keyof AIEventPayloads ? AIEventPayloads[K] : never
  ): boolean {
    if (this.debugMode) {
      console.log(`[EventBus] ${event}`, payload);
    }
    return this.emit(event, payload);
  }

  /**
   * Écoute un événement IA typé
   */
  onAI<K extends AIEventName>(
    event: K,
    callback: (payload: K extends keyof AIEventPayloads ? AIEventPayloads[K] : never) => void,
    context?: object
  ): this {
    return this.on(event, callback, context);
  }

  /**
   * Écoute un événement IA une seule fois
   */
  onceAI<K extends AIEventName>(
    event: K,
    callback: (payload: K extends keyof AIEventPayloads ? AIEventPayloads[K] : never) => void,
    context?: object
  ): this {
    return this.once(event, callback, context);
  }

  /**
   * Retire un listener IA
   */
  offAI<K extends AIEventName>(
    event: K,
    callback?: (payload: K extends keyof AIEventPayloads ? AIEventPayloads[K] : never) => void,
    context?: object
  ): this {
    return this.off(event, callback, context);
  }

  /**
   * Retire tous les listeners IA
   */
  clearAI(event?: AIEventName): this {
    if (event) {
      return this.removeAllListeners(event);
    }
    return this.removeAllListeners();
  }
}

// Singleton global
export const EventBus = new EventBusClass();

// Export du type pour les scènes qui veulent leur propre EventEmitter local
export type { EventBusClass };
