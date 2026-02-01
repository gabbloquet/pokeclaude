import type { CreatureInstance, Move, BaseStats } from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';
import { getMove } from '@/data/moves/moves';
import {
  addExperience,
  getNewMovesAtLevel,
  learnMove,
  checkCanEvolve,
  type GrowthRate,
  type LevelUpResult,
  type ExperienceGainResult,
} from './ExperienceSystem';

/**
 * Resultat complet d'un level up avec gestion des attaques
 */
export interface CompleteLevelUpResult {
  levelUpResult: LevelUpResult;
  movesToLearn: Move[];
  requiresMoveChoice: boolean;
  currentMoves: Move[];
}

/**
 * Contexte de choix d'attaque quand la creature a deja 4 attaques
 */
export interface MoveLearnContext {
  creature: CreatureInstance;
  newMove: Move;
  currentMoves: Move[];
  onLearnMove: (slotToReplace: number | null) => void; // null = ne pas apprendre
}

/**
 * Gere le processus complet de level up
 */
export class LevelUpSystem {
  private pendingMoveContexts: MoveLearnContext[] = [];

  constructor(_onMoveChoiceRequired?: (context: MoveLearnContext) => void) {
    // Callback optionnel pour gerer les choix d'attaques
  }

  /**
   * Traite le gain d'experience et retourne les resultats complets
   */
  processExperienceGain(
    creature: CreatureInstance,
    expAmount: number,
    growthRate: GrowthRate = 'mediumFast'
  ): {
    expResult: ExperienceGainResult;
    completeLevelUps: CompleteLevelUpResult[];
    pendingMoveChoices: MoveLearnContext[];
  } {
    // Ajouter l'experience
    const expResult = addExperience(creature, expAmount, growthRate);

    const completeLevelUps: CompleteLevelUpResult[] = [];
    const pendingMoveChoices: MoveLearnContext[] = [];

    // Traiter chaque level up
    for (const levelUp of expResult.levelUps) {
      const movesToLearn: Move[] = [...levelUp.newMoves];
      const currentMoves = this.getCurrentMoves(creature);
      const requiresMoveChoice = creature.moves.length >= 4 && movesToLearn.length > 0;

      completeLevelUps.push({
        levelUpResult: levelUp,
        movesToLearn,
        requiresMoveChoice,
        currentMoves,
      });

      // Traiter chaque nouvelle attaque
      for (const newMove of movesToLearn) {
        if (creature.moves.length < 4) {
          // Apprendre automatiquement si place disponible
          learnMove(creature, newMove.id);
        } else {
          // Creer un contexte de choix
          const context: MoveLearnContext = {
            creature,
            newMove,
            currentMoves: this.getCurrentMoves(creature),
            onLearnMove: (slotToReplace) => {
              if (slotToReplace !== null) {
                learnMove(creature, newMove.id, slotToReplace);
              }
            },
          };
          pendingMoveChoices.push(context);
          this.pendingMoveContexts.push(context);
        }
      }
    }

    return {
      expResult,
      completeLevelUps,
      pendingMoveChoices,
    };
  }

  /**
   * Retourne les attaques actuelles de la creature sous forme d'objets Move
   */
  getCurrentMoves(creature: CreatureInstance): Move[] {
    return creature.moves
      .map((moveId) => getMove(moveId))
      .filter((move): move is Move => move !== undefined);
  }

  /**
   * Verifie les nouvelles attaques disponibles pour un niveau donne
   */
  checkNewMoves(creature: CreatureInstance, level: number): Move[] {
    const species = getSpecies(creature.speciesId);
    if (!species) return [];

    const newMoveEntries = getNewMovesAtLevel(species, level);
    const newMoves: Move[] = [];

    for (const entry of newMoveEntries) {
      const move = getMove(entry.moveId);
      if (move && !creature.moves.includes(move.id)) {
        newMoves.push(move);
      }
    }

    return newMoves;
  }

  /**
   * Tente d'apprendre une nouvelle attaque
   * Retourne true si apprise, false si choix necessaire ou deja connue
   */
  tryLearnMove(creature: CreatureInstance, moveId: number): boolean {
    return learnMove(creature, moveId);
  }

  /**
   * Remplace une attaque existante par une nouvelle
   */
  replaceMove(creature: CreatureInstance, newMoveId: number, slotIndex: number): boolean {
    return learnMove(creature, newMoveId, slotIndex);
  }

  /**
   * Refuse d'apprendre une attaque (ne fait rien, juste pour la semantique)
   */
  refuseMove(_creature: CreatureInstance, _moveId: number): void {
    // Ne rien faire - la creature n'apprend pas l'attaque
  }

  /**
   * Verifie si la creature peut evoluer apres un level up
   */
  checkEvolutionReady(creature: CreatureInstance): boolean {
    return checkCanEvolve(creature);
  }

  /**
   * Retourne les choix d'attaques en attente
   */
  getPendingMoveChoices(): MoveLearnContext[] {
    return [...this.pendingMoveContexts];
  }

  /**
   * Efface les choix d'attaques en attente
   */
  clearPendingMoveChoices(): void {
    this.pendingMoveContexts = [];
  }

  /**
   * Traite un choix d'attaque en attente
   */
  resolveMoveChoice(context: MoveLearnContext, slotToReplace: number | null): void {
    context.onLearnMove(slotToReplace);
    this.pendingMoveContexts = this.pendingMoveContexts.filter((c) => c !== context);
  }

  /**
   * Genere un message de level up
   */
  getLevelUpMessage(creature: CreatureInstance, levelUp: LevelUpResult): string {
    const species = getSpecies(creature.speciesId);
    const name = creature.nickname || species?.name || 'Creature';
    return `${name} monte au niveau ${levelUp.newLevel} !`;
  }

  /**
   * Genere un message de stats gagnees
   */
  getStatsGainedMessage(statsGained: Partial<BaseStats>): string[] {
    const messages: string[] = [];

    if (statsGained.hp && statsGained.hp > 0) {
      messages.push(`PV +${statsGained.hp}`);
    }
    if (statsGained.attack && statsGained.attack > 0) {
      messages.push(`Attaque +${statsGained.attack}`);
    }
    if (statsGained.defense && statsGained.defense > 0) {
      messages.push(`Defense +${statsGained.defense}`);
    }
    if (statsGained.specialAttack && statsGained.specialAttack > 0) {
      messages.push(`Atq. Spe. +${statsGained.specialAttack}`);
    }
    if (statsGained.specialDefense && statsGained.specialDefense > 0) {
      messages.push(`Def. Spe. +${statsGained.specialDefense}`);
    }
    if (statsGained.speed && statsGained.speed > 0) {
      messages.push(`Vitesse +${statsGained.speed}`);
    }

    return messages;
  }

  /**
   * Genere un message pour une nouvelle attaque
   */
  getNewMoveMessage(creature: CreatureInstance, move: Move): string {
    const species = getSpecies(creature.speciesId);
    const name = creature.nickname || species?.name || 'Creature';
    return `${name} veut apprendre ${move.name} !`;
  }

  /**
   * Genere un message quand la creature a deja 4 attaques
   */
  getMoveFullMessage(creature: CreatureInstance): string {
    const species = getSpecies(creature.speciesId);
    const name = creature.nickname || species?.name || 'Creature';
    return `Mais ${name} connait deja 4 attaques...`;
  }

  /**
   * Genere un message quand on refuse d'apprendre une attaque
   */
  getMoveRefusedMessage(creature: CreatureInstance, move: Move): string {
    const species = getSpecies(creature.speciesId);
    const name = creature.nickname || species?.name || 'Creature';
    return `${name} n'a pas appris ${move.name}.`;
  }

  /**
   * Genere un message quand on apprend une attaque
   */
  getMoveLearnedMessage(creature: CreatureInstance, move: Move): string {
    const species = getSpecies(creature.speciesId);
    const name = creature.nickname || species?.name || 'Creature';
    return `${name} a appris ${move.name} !`;
  }

  /**
   * Genere un message quand on oublie une attaque
   */
  getMoveForgottenMessage(creature: CreatureInstance, oldMove: Move, newMove: Move): string {
    const species = getSpecies(creature.speciesId);
    const name = creature.nickname || species?.name || 'Creature';
    return `${name} oublie ${oldMove.name} et apprend ${newMove.name} !`;
  }
}

/**
 * Instance singleton du systeme de level up
 */
export const levelUpSystem = new LevelUpSystem();
