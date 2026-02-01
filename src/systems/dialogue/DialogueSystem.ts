/**
 * Système de dialogue IA pour les NPCs
 * Gère les conversations avec contexte et fallback
 */

import { AIService, type ChatMessage } from '@/services/ai';
import { EventBus, AI_EVENTS } from '@/events';
import {
  getPersonality,
  buildSystemPrompt,
  type NPCPersonality,
  type GameContext,
  type ConversationHistory,
} from '@/data/npcs';
import { ContextBuilder } from './ContextBuilder';
import { dialogueFallbacks } from './DialogueFallbacks';

const MAX_CONVERSATION_MESSAGES = 10;
const CONVERSATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export class DialogueSystem {
  private conversations: Map<string, ConversationHistory> = new Map();
  private isLoading: boolean = false;

  /**
   * Démarre ou continue une conversation avec un NPC
   */
  async talk(
    npcId: string,
    playerMessage?: string
  ): Promise<string> {
    const personality = getPersonality(npcId);

    if (!personality) {
      console.warn(`[DialogueSystem] Unknown NPC: ${npcId}`);
      return dialogueFallbacks.getResponse(npcId);
    }

    // Si l'IA n'est pas disponible, utiliser les fallbacks
    if (!AIService.isAvailable()) {
      EventBus.emitAI(AI_EVENTS.DIALOGUE_FALLBACK, {
        npcId,
        fallbackResponse: dialogueFallbacks.getResponse(npcId),
      });
      return this.useFallback(npcId, personality);
    }

    // Construire le contexte du jeu
    const gameContext = ContextBuilder.buildGameContext();

    // Récupérer ou créer l'historique de conversation
    const history = this.getOrCreateHistory(npcId);

    // Ajouter le message du joueur si fourni
    if (playerMessage) {
      this.addMessage(history, 'player', playerMessage);
    }

    // Émettre l'événement de chargement
    this.isLoading = true;
    EventBus.emitAI(AI_EVENTS.DIALOGUE_LOADING, { npcId });

    try {
      // Construire les messages pour l'API
      const messages = this.buildAPIMessages(personality, gameContext, history);

      // Générer la clé de cache
      const cacheKey = this.generateCacheKey(npcId, playerMessage, gameContext);

      // Appeler l'IA
      const response = await AIService.chat(messages, {
        temperature: personality.temperature ?? 0.7,
        maxTokens: 150,
        cacheKey,
        cacheTTL: 60 * 60 * 1000, // 1 heure
        timeout: 8000,
      });

      const npcResponse = response.content.trim();

      // Ajouter la réponse à l'historique
      this.addMessage(history, 'npc', npcResponse);

      // Émettre l'événement de succès
      EventBus.emitAI(AI_EVENTS.DIALOGUE_RESPONSE, { npcId, response: npcResponse });

      this.isLoading = false;
      return npcResponse;
    } catch (error) {
      console.error('[DialogueSystem] AI error:', error);

      // Émettre l'événement d'erreur
      EventBus.emitAI(AI_EVENTS.DIALOGUE_ERROR, {
        npcId,
        error: (error as Error).message,
      });

      this.isLoading = false;
      return this.useFallback(npcId, personality, gameContext);
    }
  }

  /**
   * Obtient une réponse rapide sans historique (pour les interactions simples)
   */
  async quickTalk(npcId: string): Promise<string> {
    return this.talk(npcId);
  }

  /**
   * Réinitialise la conversation avec un NPC
   */
  resetConversation(npcId: string): void {
    this.conversations.delete(npcId);
    dialogueFallbacks.resetHistory(npcId);
  }

  /**
   * Vérifie si une conversation est en cours de chargement
   */
  isDialogueLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Récupère ou crée l'historique de conversation
   */
  private getOrCreateHistory(npcId: string): ConversationHistory {
    let history = this.conversations.get(npcId);

    // Vérifier si la conversation a expiré
    if (history && Date.now() - history.lastInteraction > CONVERSATION_TIMEOUT_MS) {
      this.resetConversation(npcId);
      history = undefined;
    }

    if (!history) {
      history = {
        npcId,
        messages: [],
        lastInteraction: Date.now(),
      };
      this.conversations.set(npcId, history);
    }

    history.lastInteraction = Date.now();
    return history;
  }

  /**
   * Ajoute un message à l'historique
   */
  private addMessage(
    history: ConversationHistory,
    role: 'player' | 'npc',
    content: string
  ): void {
    history.messages.push({
      role,
      content,
      timestamp: Date.now(),
    });

    // Limiter la taille de l'historique
    if (history.messages.length > MAX_CONVERSATION_MESSAGES) {
      history.messages = history.messages.slice(-MAX_CONVERSATION_MESSAGES);
    }
  }

  /**
   * Construit les messages pour l'API OpenAI
   */
  private buildAPIMessages(
    personality: NPCPersonality,
    context: GameContext,
    history: ConversationHistory
  ): ChatMessage[] {
    const messages: ChatMessage[] = [];

    // Prompt système
    messages.push({
      role: 'system',
      content: buildSystemPrompt(personality, context),
    });

    // Historique de conversation
    for (const msg of history.messages) {
      messages.push({
        role: msg.role === 'player' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Si pas de message du joueur, ajouter une salutation implicite
    if (history.messages.length === 0) {
      messages.push({
        role: 'user',
        content: '(Le joueur s\'approche et te regarde)',
      });
    }

    return messages;
  }

  /**
   * Génère une clé de cache unique pour la conversation
   */
  private generateCacheKey(
    npcId: string,
    playerMessage: string | undefined,
    context: GameContext
  ): string {
    const contextHash = `${context.teamCount}-${context.badgeCount}-${context.hasChosenStarter}`;
    return `dialogue:${npcId}:${contextHash}:${playerMessage || 'greeting'}`;
  }

  /**
   * Utilise le système de fallback
   */
  private useFallback(
    npcId: string,
    _personality: NPCPersonality,
    context?: GameContext
  ): string {
    const response = dialogueFallbacks.getResponse(npcId, context);

    EventBus.emitAI(AI_EVENTS.DIALOGUE_FALLBACK, {
      npcId,
      fallbackResponse: response,
    });

    return response;
  }
}

// Instance singleton
export const dialogueSystem = new DialogueSystem();
