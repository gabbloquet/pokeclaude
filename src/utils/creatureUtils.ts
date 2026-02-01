import type {
  CreatureInstance,
  CreatureSpecies,
  BaseStats,
  IVs,
  EVs,
} from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';

export function generateRandomIVs(): IVs {
  return {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    specialAttack: Math.floor(Math.random() * 32),
    specialDefense: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  };
}

export function createEmptyEVs(): EVs {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
  };
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function calculateStat(
  baseStat: number,
  iv: number,
  ev: number,
  level: number,
  isHp: boolean
): number {
  const base = Math.floor(((2 * baseStat + iv + Math.floor(ev / 4)) * level) / 100);
  return isHp ? base + level + 10 : base + 5;
}

export function calculateAllStats(
  species: CreatureSpecies,
  level: number,
  ivs: IVs,
  evs: EVs
): BaseStats {
  return {
    hp: calculateStat(species.baseStats.hp, ivs.hp, evs.hp, level, true),
    attack: calculateStat(species.baseStats.attack, ivs.attack, evs.attack, level, false),
    defense: calculateStat(species.baseStats.defense, ivs.defense, evs.defense, level, false),
    specialAttack: calculateStat(
      species.baseStats.specialAttack,
      ivs.specialAttack,
      evs.specialAttack,
      level,
      false
    ),
    specialDefense: calculateStat(
      species.baseStats.specialDefense,
      ivs.specialDefense,
      evs.specialDefense,
      level,
      false
    ),
    speed: calculateStat(species.baseStats.speed, ivs.speed, evs.speed, level, false),
  };
}

export function calculateMaxHp(
  species: CreatureSpecies,
  level: number,
  iv: number,
  ev: number
): number {
  return calculateStat(species.baseStats.hp, iv, ev, level, true);
}

export function getStarterMoves(species: CreatureSpecies, level: number): number[] {
  const availableMoves = species.learnset
    .filter((entry) => entry.level <= level)
    .sort((a, b) => b.level - a.level)
    .slice(0, 4)
    .map((entry) => entry.moveId);
  return availableMoves;
}

export function createWildCreature(speciesId: number, level: number): CreatureInstance {
  const species = getSpecies(speciesId);
  if (!species) {
    throw new Error(`Species with ID ${speciesId} not found`);
  }

  const ivs = generateRandomIVs();
  const evs = createEmptyEVs();
  const maxHp = calculateMaxHp(species, level, ivs.hp, evs.hp);
  const moves = getStarterMoves(species, level);

  return {
    id: generateUUID(),
    speciesId,
    level,
    currentHp: maxHp,
    exp: getExpForLevel(level),
    ivs,
    evs,
    moves,
    isShiny: Math.random() < 1 / 4096,
    caughtAt: Date.now(),
  };
}

export function getExpForLevel(level: number): number {
  // Medium-fast experience group formula
  return Math.floor(Math.pow(level, 3));
}

export function getLevelFromExp(exp: number): number {
  return Math.floor(Math.cbrt(exp));
}

export function getExpToNextLevel(currentLevel: number, currentExp: number): number {
  const nextLevelExp = getExpForLevel(currentLevel + 1);
  return nextLevelExp - currentExp;
}

export function canEvolve(creature: CreatureInstance): boolean {
  const species = getSpecies(creature.speciesId);
  if (!species || !species.evolvesTo) return false;
  return creature.level >= species.evolvesTo.level;
}

export function evolve(creature: CreatureInstance): CreatureInstance | null {
  const species = getSpecies(creature.speciesId);
  if (!species || !species.evolvesTo) return null;
  if (creature.level < species.evolvesTo.level) return null;

  return {
    ...creature,
    speciesId: species.evolvesTo.speciesId,
  };
}
