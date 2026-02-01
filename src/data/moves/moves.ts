import type { Move } from '@/types/creature.types';

export const moves: Record<number, Move> = {
  // Normal moves
  1: {
    id: 1,
    name: 'Charge',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 35,
    priority: 0,
  },
  2: {
    id: 2,
    name: 'Grognement',
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 40,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'opponent',
      statChanges: { attack: -1 },
    },
  },
  3: {
    id: 3,
    name: 'Mimi-Queue',
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 30,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'opponent',
      statChanges: { defense: -1 },
    },
  },
  4: {
    id: 4,
    name: 'Vive-Attaque',
    type: 'normal',
    category: 'physical',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 1,
  },

  // Fire moves
  5: {
    id: 5,
    name: 'Flammèche',
    type: 'fire',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 25,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 10, // 10% chance de brûlure
      statusEffect: 'burn',
    },
  },
  6: {
    id: 6,
    name: 'Danse Flamme',
    type: 'fire',
    category: 'special',
    power: 35,
    accuracy: 85,
    pp: 15,
    priority: 0,
  },
  7: {
    id: 7,
    name: 'Roue de Feu',
    type: 'fire',
    category: 'physical',
    power: 60,
    accuracy: 100,
    pp: 25,
    priority: 0,
  },
  8: {
    id: 8,
    name: 'Lance-Flammes',
    type: 'fire',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 10, // 10% chance de brûlure
      statusEffect: 'burn',
    },
  },
  9: {
    id: 9,
    name: 'Déflagration',
    type: 'fire',
    category: 'special',
    power: 110,
    accuracy: 85,
    pp: 5,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 10, // 10% chance de brûlure
      statusEffect: 'burn',
    },
  },

  // Water moves
  10: {
    id: 10,
    name: 'Pistolet à O',
    type: 'water',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 25,
    priority: 0,
  },
  11: {
    id: 11,
    name: 'Écume',
    type: 'water',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 0,
  },
  12: {
    id: 12,
    name: 'Vibraqua',
    type: 'water',
    category: 'special',
    power: 60,
    accuracy: 100,
    pp: 20,
    priority: 0,
  },
  13: {
    id: 13,
    name: 'Surf',
    type: 'water',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    priority: 0,
  },
  14: {
    id: 14,
    name: 'Hydrocanon',
    type: 'water',
    category: 'special',
    power: 110,
    accuracy: 80,
    pp: 5,
    priority: 0,
  },

  // Ice moves
  15: {
    id: 15,
    name: 'Laser Glace',
    type: 'ice',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 10,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 10, // 10% chance de gel
      statusEffect: 'freeze',
    },
  },

  // Grass moves
  16: {
    id: 16,
    name: 'Fouet Lianes',
    type: 'grass',
    category: 'physical',
    power: 45,
    accuracy: 100,
    pp: 25,
    priority: 0,
  },
  17: {
    id: 17,
    name: 'Tranch\'Herbe',
    type: 'grass',
    category: 'physical',
    power: 55,
    accuracy: 95,
    pp: 25,
    priority: 0,
  },
  18: {
    id: 18,
    name: 'Méga-Sangsue',
    type: 'grass',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'drain',
      target: 'self',
      value: 50,
    },
  },
  19: {
    id: 19,
    name: 'Lance-Soleil',
    type: 'grass',
    category: 'special',
    power: 120,
    accuracy: 100,
    pp: 10,
    priority: 0,
  },

  // Flying moves
  20: {
    id: 20,
    name: 'Lame d\'Air',
    type: 'flying',
    category: 'special',
    power: 75,
    accuracy: 95,
    pp: 15,
    priority: 0,
  },

  // Poison moves
  21: {
    id: 21,
    name: 'Poudre Toxik',
    type: 'poison',
    category: 'status',
    power: null,
    accuracy: 75,
    pp: 35,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      statusEffect: 'poison',
    },
  },
  22: {
    id: 22,
    name: 'Bombe Beurk',
    type: 'poison',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 10,
    priority: 0,
  },

  // Electric moves
  23: {
    id: 23,
    name: 'Éclair',
    type: 'electric',
    category: 'special',
    power: 40,
    accuracy: 100,
    pp: 30,
    priority: 0,
  },
  24: {
    id: 24,
    name: 'Cage-Éclair',
    type: 'electric',
    category: 'status',
    power: null,
    accuracy: 90,
    pp: 20,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      statusEffect: 'paralysis',
    },
  },
  25: {
    id: 25,
    name: 'Étincelle',
    type: 'electric',
    category: 'physical',
    power: 65,
    accuracy: 100,
    pp: 20,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 30, // 30% chance de paralysie
      statusEffect: 'paralysis',
    },
  },
  26: {
    id: 26,
    name: 'Tonnerre',
    type: 'electric',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 10, // 10% chance de paralysie
      statusEffect: 'paralysis',
    },
  },
  27: {
    id: 27,
    name: 'Fatal-Foudre',
    type: 'electric',
    category: 'special',
    power: 110,
    accuracy: 70,
    pp: 10,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      value: 30, // 30% chance de paralysie
      statusEffect: 'paralysis',
    },
  },

  // === NOUVELLES ATTAQUES AVEC EFFETS ===

  // Multi-hit
  28: {
    id: 28,
    name: 'Combo-Griffe',
    type: 'normal',
    category: 'physical',
    power: 18,
    accuracy: 80,
    pp: 15,
    priority: 0,
    effect: {
      type: 'multiHit',
      target: 'opponent',
      minHits: 2,
      maxHits: 5,
    },
  },
  29: {
    id: 29,
    name: 'Dard-Nuée',
    type: 'bug',
    category: 'physical',
    power: 25,
    accuracy: 95,
    pp: 20,
    priority: 0,
    effect: {
      type: 'multiHit',
      target: 'opponent',
      minHits: 2,
      maxHits: 5,
    },
  },
  30: {
    id: 30,
    name: 'Double Pied',
    type: 'fighting',
    category: 'physical',
    power: 30,
    accuracy: 100,
    pp: 30,
    priority: 0,
    effect: {
      type: 'multiHit',
      target: 'opponent',
      minHits: 2,
      maxHits: 2, // Toujours 2 coups
    },
  },

  // Recul
  31: {
    id: 31,
    name: 'Double-Tranchant',
    type: 'normal',
    category: 'physical',
    power: 120,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'recoil',
      target: 'self',
      value: 33, // 33% des dégâts infligés en recul
    },
  },
  32: {
    id: 32,
    name: 'Bélier',
    type: 'normal',
    category: 'physical',
    power: 90,
    accuracy: 85,
    pp: 20,
    priority: 0,
    effect: {
      type: 'recoil',
      target: 'self',
      value: 25, // 25% des dégâts infligés en recul
    },
  },
  33: {
    id: 33,
    name: 'Boutefeu',
    type: 'fire',
    category: 'physical',
    power: 120,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'recoil',
      target: 'self',
      value: 33, // 33% des dégâts infligés en recul
    },
  },

  // Attaques à haut taux critique
  34: {
    id: 34,
    name: 'Tranche',
    type: 'normal',
    category: 'physical',
    power: 70,
    accuracy: 100,
    pp: 20,
    priority: 0,
    // Haut taux critique géré dans calculateCriticalRate
  },
  35: {
    id: 35,
    name: 'Pince-Masse',
    type: 'water',
    category: 'physical',
    power: 90,
    accuracy: 90,
    pp: 10,
    priority: 0,
    // Haut taux critique géré dans calculateCriticalRate
  },

  // Drain (absorption)
  36: {
    id: 36,
    name: 'Giga-Sangsue',
    type: 'grass',
    category: 'special',
    power: 75,
    accuracy: 100,
    pp: 10,
    priority: 0,
    effect: {
      type: 'drain',
      target: 'self',
      value: 50, // 50% des dégâts récupérés
    },
  },
  37: {
    id: 37,
    name: 'Vampirisme',
    type: 'bug',
    category: 'physical',
    power: 80,
    accuracy: 100,
    pp: 10,
    priority: 0,
    effect: {
      type: 'drain',
      target: 'self',
      value: 50,
    },
  },
  38: {
    id: 38,
    name: 'Draco-Griffe',
    type: 'dragon',
    category: 'physical',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    // Attaque normale sans effet
  },

  // Soin
  39: {
    id: 39,
    name: 'Repos',
    type: 'psychic',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 10,
    priority: 0,
    effect: {
      type: 'heal',
      target: 'self',
      value: 100, // Soigne 100% des PV max
      statusEffect: 'sleep', // S'endort pendant 2 tours
    },
  },
  40: {
    id: 40,
    name: 'Synthèse',
    type: 'grass',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 5,
    priority: 0,
    effect: {
      type: 'heal',
      target: 'self',
      value: 50, // Soigne 50% des PV max
    },
  },

  // Boost de stats
  41: {
    id: 41,
    name: 'Danse-Lames',
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 20,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'self',
      statChanges: { attack: 2 }, // +2 Attaque
    },
  },
  42: {
    id: 42,
    name: 'Hâte',
    type: 'psychic',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 30,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'self',
      statChanges: { speed: 2 }, // +2 Vitesse
    },
  },
  43: {
    id: 43,
    name: 'Mur de Fer',
    type: 'steel',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'self',
      statChanges: { defense: 2 }, // +2 Défense
    },
  },
  44: {
    id: 44,
    name: 'Croissance',
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 20,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'self',
      statChanges: { attack: 1, specialAttack: 1 }, // +1 Att et Att Spé
    },
  },

  // Debuff de stats
  45: {
    id: 45,
    name: 'Rugissement',
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 40,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'opponent',
      statChanges: { attack: -1, specialAttack: -1 }, // -1 Att et Att Spé
    },
  },
  46: {
    id: 46,
    name: 'Regard Noir',
    type: 'normal',
    category: 'status',
    power: null,
    accuracy: 100,
    pp: 30,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'opponent',
      statChanges: { speed: -2 }, // -2 Vitesse
    },
  },

  // Attaques avec effets secondaires sur les stats
  47: {
    id: 47,
    name: 'Psyko',
    type: 'psychic',
    category: 'special',
    power: 90,
    accuracy: 100,
    pp: 10,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'opponent',
      value: 10, // 10% chance
      statChanges: { specialDefense: -1 },
    },
  },
  48: {
    id: 48,
    name: 'Ball\'Ombre',
    type: 'ghost',
    category: 'special',
    power: 80,
    accuracy: 100,
    pp: 15,
    priority: 0,
    effect: {
      type: 'stat',
      target: 'opponent',
      value: 20, // 20% chance
      statChanges: { specialDefense: -1 },
    },
  },

  // Poison grave
  49: {
    id: 49,
    name: 'Toxik',
    type: 'poison',
    category: 'status',
    power: null,
    accuracy: 90,
    pp: 10,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      statusEffect: 'badPoison',
    },
  },

  // Sommeil
  50: {
    id: 50,
    name: 'Hypnose',
    type: 'psychic',
    category: 'status',
    power: null,
    accuracy: 60,
    pp: 20,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      statusEffect: 'sleep',
    },
  },
  51: {
    id: 51,
    name: 'Poudre Dodo',
    type: 'grass',
    category: 'status',
    power: null,
    accuracy: 75,
    pp: 15,
    priority: 0,
    effect: {
      type: 'status',
      target: 'opponent',
      statusEffect: 'sleep',
    },
  },
};

export function getMove(id: number): Move | undefined {
  return moves[id];
}

export function getAllMoves(): Move[] {
  return Object.values(moves);
}
