import type { CreatureSpecies } from '@/types/creature.types';

export const creatureSpecies: Record<number, CreatureSpecies> = {
  1: {
    id: 1,
    name: 'Flamling',
    types: ['fire'],
    baseStats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    },
    baseExp: 64,
    catchRate: 45,
    spriteKey: 'flamling',
    evolvesTo: { speciesId: 2, level: 16 },
    learnset: [
      { level: 1, moveId: 1 }, // Tackle
      { level: 1, moveId: 5 }, // Ember
      { level: 7, moveId: 2 }, // Growl
      { level: 13, moveId: 6 }, // Fire Spin
      { level: 20, moveId: 7 }, // Flame Wheel
    ],
  },
  2: {
    id: 2,
    name: 'Flamero',
    types: ['fire'],
    baseStats: {
      hp: 58,
      attack: 64,
      defense: 58,
      specialAttack: 80,
      specialDefense: 65,
      speed: 80,
    },
    baseExp: 142,
    catchRate: 45,
    spriteKey: 'flamero',
    evolvesTo: { speciesId: 3, level: 36 },
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 5 },
      { level: 7, moveId: 2 },
      { level: 13, moveId: 6 },
      { level: 20, moveId: 7 },
      { level: 28, moveId: 8 }, // Flamethrower
    ],
  },
  3: {
    id: 3,
    name: 'Flamaster',
    types: ['fire', 'flying'],
    baseStats: {
      hp: 78,
      attack: 84,
      defense: 78,
      specialAttack: 109,
      specialDefense: 85,
      speed: 100,
    },
    baseExp: 267,
    catchRate: 45,
    spriteKey: 'flamaster',
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 5 },
      { level: 1, moveId: 7 },
      { level: 36, moveId: 9 }, // Fire Blast
      { level: 44, moveId: 20 }, // Air Slash
    ],
  },
  4: {
    id: 4,
    name: 'Aqualing',
    types: ['water'],
    baseStats: {
      hp: 44,
      attack: 48,
      defense: 65,
      specialAttack: 50,
      specialDefense: 64,
      speed: 43,
    },
    baseExp: 63,
    catchRate: 45,
    spriteKey: 'aqualing',
    evolvesTo: { speciesId: 5, level: 16 },
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 10 }, // Water Gun
      { level: 7, moveId: 3 }, // Tail Whip
      { level: 13, moveId: 11 }, // Bubble
      { level: 20, moveId: 12 }, // Water Pulse
    ],
  },
  5: {
    id: 5,
    name: 'Aquaro',
    types: ['water'],
    baseStats: {
      hp: 59,
      attack: 63,
      defense: 80,
      specialAttack: 65,
      specialDefense: 80,
      speed: 58,
    },
    baseExp: 142,
    catchRate: 45,
    spriteKey: 'aquaro',
    evolvesTo: { speciesId: 6, level: 36 },
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 10 },
      { level: 7, moveId: 3 },
      { level: 13, moveId: 11 },
      { level: 20, moveId: 12 },
      { level: 28, moveId: 13 }, // Surf
    ],
  },
  6: {
    id: 6,
    name: 'Aquaster',
    types: ['water'],
    baseStats: {
      hp: 79,
      attack: 83,
      defense: 100,
      specialAttack: 85,
      specialDefense: 105,
      speed: 78,
    },
    baseExp: 265,
    catchRate: 45,
    spriteKey: 'aquaster',
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 10 },
      { level: 1, moveId: 12 },
      { level: 36, moveId: 14 }, // Hydro Pump
      { level: 44, moveId: 15 }, // Ice Beam
    ],
  },
  7: {
    id: 7,
    name: 'Leafling',
    types: ['grass'],
    baseStats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45,
    },
    baseExp: 64,
    catchRate: 45,
    spriteKey: 'leafling',
    evolvesTo: { speciesId: 8, level: 16 },
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 16 }, // Vine Whip
      { level: 7, moveId: 2 },
      { level: 13, moveId: 17 }, // Razor Leaf
      { level: 20, moveId: 18 }, // Mega Drain
    ],
  },
  8: {
    id: 8,
    name: 'Leafero',
    types: ['grass', 'poison'],
    baseStats: {
      hp: 60,
      attack: 62,
      defense: 63,
      specialAttack: 80,
      specialDefense: 80,
      speed: 60,
    },
    baseExp: 142,
    catchRate: 45,
    spriteKey: 'leafero',
    evolvesTo: { speciesId: 9, level: 32 },
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 16 },
      { level: 7, moveId: 2 },
      { level: 13, moveId: 17 },
      { level: 20, moveId: 18 },
      { level: 28, moveId: 21 }, // Poison Powder
    ],
  },
  9: {
    id: 9,
    name: 'Leafaster',
    types: ['grass', 'poison'],
    baseStats: {
      hp: 80,
      attack: 82,
      defense: 83,
      specialAttack: 100,
      specialDefense: 100,
      speed: 80,
    },
    baseExp: 263,
    catchRate: 45,
    spriteKey: 'leafaster',
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 16 },
      { level: 1, moveId: 17 },
      { level: 32, moveId: 19 }, // Solar Beam
      { level: 40, moveId: 22 }, // Sludge Bomb
    ],
  },
  10: {
    id: 10,
    name: 'Sparkit',
    types: ['electric'],
    baseStats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90,
    },
    baseExp: 112,
    catchRate: 190,
    spriteKey: 'sparkit',
    evolvesTo: { speciesId: 11, level: 26 },
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 23 }, // Thunder Shock
      { level: 8, moveId: 24 }, // Thunder Wave
      { level: 15, moveId: 4 }, // Quick Attack
      { level: 22, moveId: 25 }, // Spark
    ],
  },
  11: {
    id: 11,
    name: 'Sparkolt',
    types: ['electric'],
    baseStats: {
      hp: 60,
      attack: 90,
      defense: 55,
      specialAttack: 90,
      specialDefense: 80,
      speed: 110,
    },
    baseExp: 218,
    catchRate: 75,
    spriteKey: 'sparkolt',
    learnset: [
      { level: 1, moveId: 1 },
      { level: 1, moveId: 23 },
      { level: 1, moveId: 4 },
      { level: 26, moveId: 26 }, // Thunderbolt
      { level: 34, moveId: 27 }, // Thunder
    ],
  },
};

export function getSpecies(id: number): CreatureSpecies | undefined {
  return creatureSpecies[id];
}

export function getAllSpecies(): CreatureSpecies[] {
  return Object.values(creatureSpecies);
}
