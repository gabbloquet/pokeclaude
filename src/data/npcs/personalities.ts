/**
 * Interface et types pour les personnalités des NPCs
 */

export type NPCRole = 'mother' | 'professor' | 'merchant' | 'trainer' | 'nurse' | 'rival' | 'villager';

export type SpeechStyle = 'casual' | 'formal' | 'enthusiastic' | 'mysterious' | 'grumpy' | 'kind';

export interface NPCPersonality {
  /** Identifiant unique du NPC */
  id: string;
  /** Nom affiché */
  name: string;
  /** Rôle dans le jeu */
  role: NPCRole;
  /** Traits de personnalité (utilisés dans le prompt) */
  traits: string[];
  /** Style de parole */
  speechStyle: SpeechStyle;
  /** Ce que le NPC sait (contexte pour l'IA) */
  knowledge: string[];
  /** Prompt système de base pour l'IA */
  systemPrompt: string;
  /** Réponses de fallback si l'IA n'est pas disponible */
  fallbackResponses: string[];
  /** Sujets que le NPC refuse d'aborder */
  forbiddenTopics?: string[];
  /** Température de l'IA pour ce NPC (0-2) */
  temperature?: number;
}

/**
 * Contexte de jeu passé à l'IA pour la génération de dialogue
 */
export interface GameContext {
  playerName: string;
  teamNames: string[];
  teamCount: number;
  badgeCount: number;
  hasChosenStarter: boolean;
  currentLocation?: string;
  recentEvents?: string[];
}

/**
 * Historique de conversation avec un NPC
 */
export interface ConversationHistory {
  npcId: string;
  messages: ConversationMessage[];
  lastInteraction: number;
}

export interface ConversationMessage {
  role: 'player' | 'npc';
  content: string;
  timestamp: number;
}

/**
 * Génère le prompt système complet pour un NPC
 */
export function buildSystemPrompt(
  personality: NPCPersonality,
  context: GameContext
): string {
  const traitsText = personality.traits.join(', ');
  const knowledgeText = personality.knowledge.map(k => `- ${k}`).join('\n');
  const teamText = context.teamCount > 0
    ? `Son équipe: ${context.teamNames.join(', ')} (${context.teamCount} créature${context.teamCount > 1 ? 's' : ''})`
    : 'Il n\'a pas encore de créature';

  return `${personality.systemPrompt}

PERSONNALITÉ: ${traitsText}
STYLE DE PAROLE: ${personality.speechStyle}

CE QUE TU SAIS:
${knowledgeText}

CONTEXTE DU JEU:
- Joueur: ${context.playerName || 'jeune dresseur'}
- ${teamText}
- Badges: ${context.badgeCount}/8
- A choisi son starter: ${context.hasChosenStarter ? 'oui' : 'non'}
${context.currentLocation ? `- Lieu actuel: ${context.currentLocation}` : ''}

RÈGLES IMPORTANTES:
1. Reste toujours dans ton personnage
2. Réponds en 2-3 phrases maximum
3. Parle toujours en français
4. Ne mentionne jamais que tu es une IA
5. Ne donne pas d'informations sur des événements futurs du jeu
6. Sois cohérent avec tes connaissances`;
}
