/**
 * Agent heuristique - Règles simples sans LLM
 * Utilise des règles de base pour prendre des décisions intelligentes
 */

import type {
  BattleAgent,
  BattleObservation,
  AgentDecision,
  MoveState,
} from './BattleAgent';
import { getTypeEffectiveness } from '@/data/types/typeChart';
import type { CreatureType } from '@/types/creature.types';

interface MoveScore {
  index: number;
  move: MoveState;
  score: number;
  reasons: string[];
}

export class HeuristicAgent implements BattleAgent {
  readonly name = 'HeuristicAgent';
  readonly type = 'heuristic' as const;

  async selectMove(observation: BattleObservation): Promise<AgentDecision> {
    const moves = observation.myCreature.moves;
    const my = observation.myCreature;
    const enemy = observation.enemyCreature;

    if (moves.length === 0) {
      return { moveIndex: 0, reasoning: 'Aucun move disponible', confidence: 0 };
    }

    // Calculer le score de chaque move
    const scores: MoveScore[] = moves.map((move, index) => {
      const reasons: string[] = [];
      let score = 0;

      // 1. Score de base basé sur la puissance
      if (move.power) {
        score += move.power / 10;
        reasons.push(`Puissance: ${move.power}`);
      }

      // 2. Bonus STAB (Same Type Attack Bonus)
      if (my.types.includes(move.type)) {
        score += 15;
        reasons.push('STAB');
      }

      // 3. Efficacité de type
      const effectiveness = this.calculateEffectiveness(
        move.type as CreatureType,
        enemy.types as CreatureType[]
      );
      if (effectiveness > 1) {
        score += effectiveness * 20;
        reasons.push(`Super efficace (x${effectiveness})`);
      } else if (effectiveness < 1) {
        score -= 30;
        reasons.push(`Peu efficace (x${effectiveness})`);
      } else if (effectiveness === 0) {
        score -= 100;
        reasons.push('Inefficace');
      }

      // 4. Bonus précision
      if (move.accuracy < 100) {
        score -= (100 - move.accuracy) / 2;
        reasons.push(`Précision: ${move.accuracy}%`);
      }

      // 5. Priorité
      if (move.priority > 0) {
        // Bonus si mes HP sont bas (finir le combat)
        if (my.hpPercent < 30) {
          score += move.priority * 15;
          reasons.push(`Priorité +${move.priority} (HP bas)`);
        } else {
          score += move.priority * 5;
        }
      }

      // 6. Situation HP bas - favoriser les attaques rapides
      if (my.hpPercent < 20) {
        // Éviter les moves de statut si HP bas
        if (move.category === 'status') {
          score -= 30;
          reasons.push('Éviter statut (HP critiques)');
        }
        // Favoriser les moves puissants
        if (move.power && move.power >= 80) {
          score += 10;
          reasons.push('Move puissant (finir le combat)');
        }
      }

      // 7. HP ennemi bas - favoriser les finishers
      if (enemy.hpPercent < 25) {
        if (move.power && move.power >= 40) {
          score += 15;
          reasons.push('Ennemi HP bas');
        }
        // Éviter les moves qui augmentent les stats
        if (move.category === 'status') {
          score -= 20;
        }
      }

      // 8. Catégorie vs stats
      if (move.category === 'physical') {
        // Vérifier si notre attaque est bonne
        const atkMod = my.statModifiers.attack || 0;
        score += atkMod * 5;
      } else if (move.category === 'special') {
        const spAtkMod = my.statModifiers.specialAttack || 0;
        score += spAtkMod * 5;
      }

      // 9. Pénaliser la répétition (utiliser l'historique)
      const lastMoves = observation.history.slice(-2);
      const usedRecently = lastMoves.some((h) => h.myMove === move.name);
      if (usedRecently) {
        score -= 10;
        reasons.push('Utilisé récemment');
      }

      return { index, move, score, reasons };
    });

    // Trier par score décroissant
    scores.sort((a, b) => b.score - a.score);

    const best = scores[0];
    const confidence = Math.min(100, Math.max(0, 50 + best.score));

    return {
      moveIndex: best.index,
      reasoning: `${best.move.name}: ${best.reasons.join(', ')}`,
      confidence: Math.round(confidence),
    };
  }

  /**
   * Calcule l'efficacité d'un type contre une combinaison de types
   */
  private calculateEffectiveness(
    attackType: CreatureType,
    defenderTypes: CreatureType[]
  ): number {
    return getTypeEffectiveness(attackType, defenderTypes);
  }

  reset(): void {
    // Pas d'état persistant
  }
}
