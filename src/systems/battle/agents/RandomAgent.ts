/**
 * Agent aléatoire - Baseline
 * Choisit un move au hasard parmi les moves disponibles
 */

import type {
  BattleAgent,
  BattleObservation,
  AgentDecision,
} from './BattleAgent';

export class RandomAgent implements BattleAgent {
  readonly name = 'RandomAgent';
  readonly type = 'random' as const;

  async selectMove(observation: BattleObservation): Promise<AgentDecision> {
    const moves = observation.myCreature.moves;

    if (moves.length === 0) {
      return { moveIndex: 0, reasoning: 'Aucun move disponible', confidence: 0 };
    }

    const randomIndex = Math.floor(Math.random() * moves.length);

    return {
      moveIndex: randomIndex,
      reasoning: `Move aléatoire: ${moves[randomIndex].name}`,
      confidence: Math.round(100 / moves.length),
    };
  }

  reset(): void {
    // Pas d'état à réinitialiser
  }
}
