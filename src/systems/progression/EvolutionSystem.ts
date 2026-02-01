import type { CreatureInstance, CreatureSpecies } from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';
import { calculateMaxHp } from '@/utils/creatureUtils';

/**
 * Types de conditions d'evolution
 */
export type EvolutionConditionType =
  | 'level'      // Evolution par niveau
  | 'stone'      // Evolution par pierre
  | 'trade'      // Evolution par echange
  | 'happiness'  // Evolution par bonheur
  | 'time';      // Evolution selon l'heure (jour/nuit)

/**
 * Condition d'evolution complete
 */
export interface EvolutionCondition {
  type: EvolutionConditionType;
  level?: number;
  itemId?: number;           // ID de la pierre d'evolution
  minHappiness?: number;     // Bonheur minimum (0-255)
  timeOfDay?: 'day' | 'night';
}

/**
 * Resultat de verification d'evolution
 */
export interface EvolutionCheckResult {
  canEvolve: boolean;
  targetSpeciesId: number | null;
  reason?: string;
}

/**
 * Resultat d'evolution
 */
export interface EvolutionResult {
  success: boolean;
  previousSpecies: CreatureSpecies | null;
  newSpecies: CreatureSpecies | null;
  creature: CreatureInstance;
}

/**
 * Verifie si une creature peut evoluer (evolution par niveau)
 * @returns L'ID de l'espece d'evolution ou null
 */
export function checkEvolution(creature: CreatureInstance): number | null {
  const species = getSpecies(creature.speciesId);
  if (!species || !species.evolvesTo) {
    return null;
  }

  if (creature.level >= species.evolvesTo.level) {
    return species.evolvesTo.speciesId;
  }

  return null;
}

/**
 * Verifie les conditions d'evolution detaillees
 */
export function checkEvolutionConditions(
  creature: CreatureInstance,
  condition?: EvolutionCondition,
  context?: { timeOfDay?: 'day' | 'night'; happiness?: number; itemId?: number }
): EvolutionCheckResult {
  const species = getSpecies(creature.speciesId);
  if (!species || !species.evolvesTo) {
    return {
      canEvolve: false,
      targetSpeciesId: null,
      reason: 'Cette creature ne peut pas evoluer.',
    };
  }

  // Si pas de condition specifiee, utiliser l'evolution par niveau standard
  if (!condition) {
    const canEvolve = creature.level >= species.evolvesTo.level;
    return {
      canEvolve,
      targetSpeciesId: canEvolve ? species.evolvesTo.speciesId : null,
      reason: canEvolve ? undefined : `Niveau ${species.evolvesTo.level} requis.`,
    };
  }

  // Verifier selon le type de condition
  switch (condition.type) {
    case 'level':
      if (condition.level && creature.level >= condition.level) {
        return {
          canEvolve: true,
          targetSpeciesId: species.evolvesTo.speciesId,
        };
      }
      return {
        canEvolve: false,
        targetSpeciesId: null,
        reason: `Niveau ${condition.level} requis.`,
      };

    case 'stone':
      if (context?.itemId === condition.itemId) {
        return {
          canEvolve: true,
          targetSpeciesId: species.evolvesTo.speciesId,
        };
      }
      return {
        canEvolve: false,
        targetSpeciesId: null,
        reason: 'Pierre d\'evolution requise.',
      };

    case 'happiness':
      if (context?.happiness !== undefined && condition.minHappiness !== undefined) {
        if (context.happiness >= condition.minHappiness) {
          return {
            canEvolve: true,
            targetSpeciesId: species.evolvesTo.speciesId,
          };
        }
      }
      return {
        canEvolve: false,
        targetSpeciesId: null,
        reason: `Bonheur insuffisant (${condition.minHappiness} requis).`,
      };

    case 'time':
      if (context?.timeOfDay === condition.timeOfDay) {
        // Verifier aussi le niveau si specifie
        if (!condition.level || creature.level >= condition.level) {
          return {
            canEvolve: true,
            targetSpeciesId: species.evolvesTo.speciesId,
          };
        }
      }
      return {
        canEvolve: false,
        targetSpeciesId: null,
        reason: `Evolution disponible uniquement ${condition.timeOfDay === 'day' ? 'le jour' : 'la nuit'}.`,
      };

    case 'trade':
      return {
        canEvolve: false,
        targetSpeciesId: null,
        reason: 'Evolution par echange requise.',
      };

    default:
      return {
        canEvolve: false,
        targetSpeciesId: null,
        reason: 'Conditions d\'evolution non remplies.',
      };
  }
}

/**
 * Fait evoluer une creature vers une nouvelle espece
 * Conserve les stats, moves, etc. et recalcule les HP
 */
export function evolveCreature(
  creature: CreatureInstance,
  newSpeciesId: number
): CreatureInstance {
  const oldSpecies = getSpecies(creature.speciesId);
  const newSpecies = getSpecies(newSpeciesId);

  if (!oldSpecies || !newSpecies) {
    throw new Error('Espece non trouvee');
  }

  // Calculer le ratio de HP pour conserver la proportion
  const oldMaxHp = calculateMaxHp(
    oldSpecies,
    creature.level,
    creature.ivs.hp,
    creature.evs.hp
  );
  const newMaxHp = calculateMaxHp(
    newSpecies,
    creature.level,
    creature.ivs.hp,
    creature.evs.hp
  );

  // Conserver le ratio de HP (ou augmenter si HP max plus eleve)
  const hpRatio = creature.currentHp / oldMaxHp;
  const newCurrentHp = Math.max(1, Math.floor(hpRatio * newMaxHp));

  // Creer la creature evoluee
  const evolvedCreature: CreatureInstance = {
    ...creature,
    speciesId: newSpeciesId,
    currentHp: newCurrentHp,
  };

  return evolvedCreature;
}

/**
 * Tente d'evoluer une creature par niveau
 */
export function tryEvolveByLevel(creature: CreatureInstance): EvolutionResult {
  const newSpeciesId = checkEvolution(creature);

  if (newSpeciesId === null) {
    return {
      success: false,
      previousSpecies: null,
      newSpecies: null,
      creature,
    };
  }

  const previousSpecies = getSpecies(creature.speciesId);
  const evolvedCreature = evolveCreature(creature, newSpeciesId);
  const newSpecies = getSpecies(newSpeciesId);

  return {
    success: true,
    previousSpecies: previousSpecies || null,
    newSpecies: newSpecies || null,
    creature: evolvedCreature,
  };
}

/**
 * Tente d'evoluer une creature avec une pierre d'evolution
 */
export function tryEvolveByStone(
  creature: CreatureInstance,
  _stoneItemId: number
): EvolutionResult {
  const species = getSpecies(creature.speciesId);

  if (!species || !species.evolvesTo) {
    return {
      success: false,
      previousSpecies: null,
      newSpecies: null,
      creature,
    };
  }

  // Pour l'instant, les evolutions par pierre ne sont pas definies dans species
  // On peut etendre le systeme plus tard
  // TODO: Ajouter evolutionConditions dans CreatureSpecies

  return {
    success: false,
    previousSpecies: null,
    newSpecies: null,
    creature,
  };
}

/**
 * Genere les messages d'evolution
 */
export function getEvolutionMessages(
  creature: CreatureInstance,
  previousSpecies: CreatureSpecies,
  newSpecies: CreatureSpecies
): string[] {
  const name = creature.nickname || previousSpecies.name;
  return [
    `Quoi ? ${name} evolue !`,
    `Felicitations !`,
    `${name} a evolue en ${newSpecies.name} !`,
  ];
}

/**
 * Genere le message d'annulation d'evolution
 */
export function getEvolutionCancelMessage(
  creature: CreatureInstance
): string {
  const species = getSpecies(creature.speciesId);
  const name = creature.nickname || species?.name || 'Creature';
  return `Hein ? L'evolution de ${name} a ete annulee !`;
}

/**
 * Obtient l'heure du jour actuelle
 */
export function getCurrentTimeOfDay(): 'day' | 'night' {
  const hour = new Date().getHours();
  // Jour: 6h-18h, Nuit: 18h-6h
  return hour >= 6 && hour < 18 ? 'day' : 'night';
}

/**
 * Verifie la chaine d'evolution complete d'une espece
 */
export function getEvolutionChain(speciesId: number): number[] {
  const chain: number[] = [speciesId];
  let currentId = speciesId;

  // Parcourir vers le haut (formes de base)
  // Pour l'instant, on ne peut pas remonter car les donnees ne le permettent pas

  // Parcourir vers le bas (evolutions)
  while (true) {
    const species = getSpecies(currentId);
    if (!species || !species.evolvesTo) break;

    currentId = species.evolvesTo.speciesId;
    chain.push(currentId);
  }

  return chain;
}

/**
 * Verifie si une espece peut evoluer (a une evolution definie)
 */
export function canSpeciesEvolve(speciesId: number): boolean {
  const species = getSpecies(speciesId);
  return species !== undefined && species.evolvesTo !== undefined;
}

/**
 * Obtient l'espece d'evolution et le niveau requis
 */
export function getEvolutionInfo(
  speciesId: number
): { targetSpeciesId: number; level: number } | null {
  const species = getSpecies(speciesId);
  if (!species || !species.evolvesTo) return null;

  return {
    targetSpeciesId: species.evolvesTo.speciesId,
    level: species.evolvesTo.level,
  };
}
