import type { CreatureInstance, CreatureSpecies, LearnsetEntry, Move, BaseStats } from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';
import { getMove } from '@/data/moves/moves';
import {
  calculateMaxHp,
  calculateAllStats,
} from '@/utils/creatureUtils';

// Types de courbes d'experience (formules standard Pokemon)
export type GrowthRate = 'fast' | 'mediumFast' | 'mediumSlow' | 'slow';

/**
 * Calcule l'EXP totale necessaire pour atteindre un niveau donne
 * selon la courbe d'experience specifiee.
 *
 * Formules standard Pokemon:
 * - fast: 0.8 * n^3
 * - mediumFast: n^3 (par defaut)
 * - mediumSlow: 1.2 * n^3 - 15 * n^2 + 100 * n - 140
 * - slow: 1.25 * n^3
 */
export function getExpForLevel(level: number, growthRate: GrowthRate = 'mediumFast'): number {
  if (level <= 0) return 0;
  if (level === 1) return 0;

  const n = level;

  switch (growthRate) {
    case 'fast':
      return Math.floor(0.8 * Math.pow(n, 3));
    case 'mediumFast':
      return Math.floor(Math.pow(n, 3));
    case 'mediumSlow':
      return Math.floor(1.2 * Math.pow(n, 3) - 15 * Math.pow(n, 2) + 100 * n - 140);
    case 'slow':
      return Math.floor(1.25 * Math.pow(n, 3));
    default:
      return Math.floor(Math.pow(n, 3));
  }
}

/**
 * Calcule le niveau a partir de l'EXP totale et de la courbe d'experience
 */
export function getLevelFromExp(totalExp: number, growthRate: GrowthRate = 'mediumFast'): number {
  if (totalExp <= 0) return 1;

  // Recherche binaire pour trouver le niveau
  let low = 1;
  let high = 100;

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const expForMid = getExpForLevel(mid, growthRate);

    if (expForMid <= totalExp) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return Math.min(low, 100);
}

/**
 * Resultat d'un level up
 */
export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  statsGained: Partial<BaseStats>;
  newMoves: Move[];
  canEvolve: boolean;
}

/**
 * Resultat de l'ajout d'experience
 */
export interface ExperienceGainResult {
  expGained: number;
  totalExp: number;
  levelUps: LevelUpResult[];
  creature: CreatureInstance;
}

/**
 * Calcule l'EXP gagnee apres un combat
 *
 * Formule: baseExp * enemyLevel / 5 * (isTrainer ? 1.5 : 1) / participantCount
 */
export function calculateExpGain(
  _winnerCreature: CreatureInstance,
  defeatedCreature: CreatureInstance,
  isWildBattle: boolean,
  participantCount: number = 1
): number {
  const defeatedSpecies = getSpecies(defeatedCreature.speciesId);
  if (!defeatedSpecies) return 0;

  const baseExp = defeatedSpecies.baseExp;
  const enemyLevel = defeatedCreature.level;

  // Bonus pour combat dresseur
  const trainerMultiplier = isWildBattle ? 1 : 1.5;

  // Formule de base
  let exp = Math.floor((baseExp * enemyLevel) / 5);

  // Application des multiplicateurs
  exp = Math.floor(exp * trainerMultiplier);

  // Division par nombre de participants
  exp = Math.floor(exp / participantCount);

  // Minimum de 1 EXP
  return Math.max(1, exp);
}

/**
 * Ajoute de l'experience a une creature et gere les level ups
 * Retourne un objet avec les informations de progression
 */
export function addExperience(
  creature: CreatureInstance,
  amount: number,
  growthRate: GrowthRate = 'mediumFast'
): ExperienceGainResult {
  const species = getSpecies(creature.speciesId);
  if (!species) {
    return {
      expGained: 0,
      totalExp: creature.exp,
      levelUps: [],
      creature,
    };
  }

  const previousLevel = creature.level;

  // Ajouter l'experience
  creature.exp += amount;

  // Calculer le nouveau niveau
  let newLevel = getLevelFromExp(creature.exp, growthRate);

  // Cap au niveau 100
  if (newLevel >= 100) {
    newLevel = 100;
    const maxExp = getExpForLevel(100, growthRate);
    if (creature.exp > maxExp) {
      creature.exp = maxExp;
    }
  }

  const levelUps: LevelUpResult[] = [];

  // Traiter chaque level up
  if (newLevel > previousLevel) {
    for (let level = previousLevel + 1; level <= newLevel; level++) {
      creature.level = level;

      // Calculer les stats gagnees
      const statsGained = calculateStatsGained(species, level - 1, level, creature.ivs, creature.evs);

      // Mettre a jour les HP actuels (on gagne la difference de HP max)
      const oldMaxHp = calculateMaxHp(species, level - 1, creature.ivs.hp, creature.evs.hp);
      const newMaxHp = calculateMaxHp(species, level, creature.ivs.hp, creature.evs.hp);
      creature.currentHp = Math.min(creature.currentHp + (newMaxHp - oldMaxHp), newMaxHp);

      // Verifier les nouvelles attaques
      const newMovesEntries = getNewMovesAtLevel(species, level);
      const newMoves: Move[] = [];

      for (const entry of newMovesEntries) {
        const move = getMove(entry.moveId);
        if (move) {
          newMoves.push(move);
        }
      }

      // Verifier si peut evoluer
      const canEvolve = checkCanEvolve(creature);

      levelUps.push({
        previousLevel: level - 1,
        newLevel: level,
        statsGained,
        newMoves,
        canEvolve,
      });
    }
  }

  return {
    expGained: amount,
    totalExp: creature.exp,
    levelUps,
    creature,
  };
}

/**
 * Calcule les stats gagnees lors d'un level up
 */
function calculateStatsGained(
  species: CreatureSpecies,
  oldLevel: number,
  newLevel: number,
  ivs: BaseStats,
  evs: BaseStats
): Partial<BaseStats> {
  const oldStats = calculateAllStats(species, oldLevel, ivs, evs);
  const newStats = calculateAllStats(species, newLevel, ivs, evs);

  return {
    hp: newStats.hp - oldStats.hp,
    attack: newStats.attack - oldStats.attack,
    defense: newStats.defense - oldStats.defense,
    specialAttack: newStats.specialAttack - oldStats.specialAttack,
    specialDefense: newStats.specialDefense - oldStats.specialDefense,
    speed: newStats.speed - oldStats.speed,
  };
}

/**
 * Retourne les nouvelles attaques disponibles a un niveau donne
 */
export function getNewMovesAtLevel(species: CreatureSpecies, level: number): LearnsetEntry[] {
  return species.learnset.filter((entry) => entry.level === level);
}

/**
 * Verifie si une creature peut evoluer
 */
export function checkCanEvolve(creature: CreatureInstance): boolean {
  const species = getSpecies(creature.speciesId);
  if (!species || !species.evolvesTo) return false;
  return creature.level >= species.evolvesTo.level;
}

/**
 * Apprend une attaque a une creature
 * @param slotToReplace - Si la creature a deja 4 attaques, indice du slot a remplacer (0-3)
 * @returns true si l'attaque a ete apprise, false sinon
 */
export function learnMove(
  creature: CreatureInstance,
  moveId: number,
  slotToReplace?: number
): boolean {
  // Verifier si la creature connait deja cette attaque
  if (creature.moves.includes(moveId)) {
    return false;
  }

  // Si la creature a moins de 4 attaques, ajouter directement
  if (creature.moves.length < 4) {
    creature.moves.push(moveId);
    return true;
  }

  // Si un slot de remplacement est specifie, remplacer
  if (slotToReplace !== undefined && slotToReplace >= 0 && slotToReplace < 4) {
    creature.moves[slotToReplace] = moveId;
    return true;
  }

  // Impossible d'apprendre sans remplacer
  return false;
}

/**
 * Calcule l'EXP necessaire pour le prochain niveau
 */
export function getExpToNextLevel(
  creature: CreatureInstance,
  growthRate: GrowthRate = 'mediumFast'
): number {
  if (creature.level >= 100) return 0;

  const nextLevelExp = getExpForLevel(creature.level + 1, growthRate);
  return Math.max(0, nextLevelExp - creature.exp);
}

/**
 * Calcule la progression en pourcentage vers le prochain niveau
 */
export function getExpProgress(
  creature: CreatureInstance,
  growthRate: GrowthRate = 'mediumFast'
): number {
  if (creature.level >= 100) return 100;

  const currentLevelExp = getExpForLevel(creature.level, growthRate);
  const nextLevelExp = getExpForLevel(creature.level + 1, growthRate);
  const expInCurrentLevel = creature.exp - currentLevelExp;
  const expNeededForLevel = nextLevelExp - currentLevelExp;

  if (expNeededForLevel <= 0) return 100;

  return Math.round((expInCurrentLevel / expNeededForLevel) * 100);
}

/**
 * Retourne la courbe d'experience d'une espece
 * (Pour l'instant toutes les creatures utilisent mediumFast)
 */
export function getSpeciesGrowthRate(_speciesId: number): GrowthRate {
  // TODO: Ajouter growthRate dans CreatureSpecies
  return 'mediumFast';
}
