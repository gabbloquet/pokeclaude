/**
 * Factory pour créer les agents de combat selon la difficulté
 */

import type { BattleAgent } from './BattleAgent';
import { RandomAgent } from './RandomAgent';
import { HeuristicAgent } from './HeuristicAgent';
import { LLMAgent } from './LLMAgent';
import { AIService } from '@/services/ai';

export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';

/**
 * Crée un agent de combat selon la difficulté
 */
export function createBattleAgent(difficulty: Difficulty): BattleAgent {
  switch (difficulty) {
    case 'easy':
      // Agent aléatoire pour les débutants
      return new RandomAgent();

    case 'normal':
      // Agent heuristique pour un défi équilibré
      return new HeuristicAgent();

    case 'hard':
      // Agent heuristique amélioré (même classe, mais pourrait être une sous-classe)
      return new HeuristicAgent();

    case 'expert':
      // Agent LLM si disponible, sinon heuristique
      if (AIService.isAvailable()) {
        return new LLMAgent();
      }
      console.log('[AgentFactory] AI not available, falling back to HeuristicAgent');
      return new HeuristicAgent();

    default:
      return new RandomAgent();
  }
}

/**
 * Détermine la difficulté selon le contexte du combat
 */
export function determineDifficulty(
  isWildBattle: boolean,
  playerBadgeCount: number,
  isTrainerBattle: boolean = false,
  isGymLeader: boolean = false
): Difficulty {
  // Combats sauvages: toujours easy ou normal
  if (isWildBattle) {
    return playerBadgeCount >= 4 ? 'normal' : 'easy';
  }

  // Gym Leaders: hard ou expert
  if (isGymLeader) {
    return playerBadgeCount >= 6 ? 'expert' : 'hard';
  }

  // Dresseurs normaux: normal ou hard selon la progression
  if (isTrainerBattle) {
    if (playerBadgeCount >= 6) return 'hard';
    if (playerBadgeCount >= 3) return 'normal';
    return 'easy';
  }

  return 'easy';
}

/**
 * Retourne les informations sur un agent
 */
export function getAgentInfo(agent: BattleAgent): {
  name: string;
  description: string;
  usesAI: boolean;
} {
  switch (agent.type) {
    case 'random':
      return {
        name: 'Agent Aléatoire',
        description: 'Choisit ses attaques au hasard',
        usesAI: false,
      };
    case 'heuristic':
      return {
        name: 'Agent Tactique',
        description: 'Utilise des règles de combat intelligentes',
        usesAI: false,
      };
    case 'llm':
      return {
        name: 'Agent IA Expert',
        description: 'Raisonne comme un stratège professionnel',
        usesAI: true,
      };
    default:
      return {
        name: 'Agent Inconnu',
        description: 'Type d\'agent non reconnu',
        usesAI: false,
      };
  }
}
