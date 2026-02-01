/**
 * Système de fallback pour les dialogues quand l'IA n'est pas disponible
 */

import { getPersonality, type NPCPersonality, type GameContext } from '@/data/npcs';

export class DialogueFallbacks {
  private usedResponses: Map<string, Set<number>> = new Map();

  /**
   * Récupère une réponse de fallback pour un NPC
   * Essaie de varier les réponses et de les contextualiser
   */
  getResponse(npcId: string, context?: GameContext): string {
    const personality = getPersonality(npcId);

    if (!personality) {
      return this.getGenericResponse();
    }

    // Essayer une réponse contextuelle d'abord
    const contextualResponse = this.getContextualResponse(personality, context);
    if (contextualResponse) {
      return contextualResponse;
    }

    // Sinon, utiliser les fallbacks prédéfinis
    return this.getNextFallback(npcId, personality);
  }

  /**
   * Génère une réponse basée sur le contexte
   */
  private getContextualResponse(
    personality: NPCPersonality,
    context?: GameContext
  ): string | null {
    if (!context) return null;

    // Réponses contextuelles pour la mère
    if (personality.role === 'mother') {
      if (!context.hasChosenStarter) {
        return 'Tu devrais aller voir le Professeur Chen ! Il a quelque chose d\'important pour toi.';
      }
      if (context.teamCount === 1 && context.teamNames[0]) {
        return `${context.teamNames[0]} a l'air en pleine forme ! Prends bien soin de lui.`;
      }
      if (context.badgeCount > 0) {
        return `${context.badgeCount} badge${context.badgeCount > 1 ? 's' : ''} ! Je suis si fière de toi, mon chéri !`;
      }
    }

    // Réponses contextuelles pour le professeur
    if (personality.role === 'professor') {
      if (!context.hasChosenStarter) {
        return 'Ah, te voilà ! J\'ai trois créatures qui attendent un dresseur. Viens choisir ton partenaire !';
      }
      if (context.teamCount > 3) {
        return `Impressionnant ! Tu as déjà ${context.teamCount} créatures. Continue à remplir le Pokédex !`;
      }
    }

    return null;
  }

  /**
   * Récupère le prochain fallback non utilisé pour un NPC
   */
  private getNextFallback(npcId: string, personality: NPCPersonality): string {
    const fallbacks = personality.fallbackResponses;

    if (!fallbacks || fallbacks.length === 0) {
      return this.getGenericResponse();
    }

    // Initialiser le set des réponses utilisées
    if (!this.usedResponses.has(npcId)) {
      this.usedResponses.set(npcId, new Set());
    }

    const used = this.usedResponses.get(npcId)!;

    // Si toutes les réponses ont été utilisées, réinitialiser
    if (used.size >= fallbacks.length) {
      used.clear();
    }

    // Trouver une réponse non utilisée
    for (let i = 0; i < fallbacks.length; i++) {
      if (!used.has(i)) {
        used.add(i);
        return fallbacks[i];
      }
    }

    // Fallback ultime
    return fallbacks[0];
  }

  /**
   * Réponse générique si aucun NPC n'est trouvé
   */
  private getGenericResponse(): string {
    const responses = [
      '...',
      'Hmm ?',
      'Bonjour !',
      'Belle journée, n\'est-ce pas ?',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Réinitialise l'historique des réponses utilisées pour un NPC
   */
  resetHistory(npcId?: string): void {
    if (npcId) {
      this.usedResponses.delete(npcId);
    } else {
      this.usedResponses.clear();
    }
  }
}

// Instance singleton
export const dialogueFallbacks = new DialogueFallbacks();
