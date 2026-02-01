import type { Item } from '@/types/game.types';

export const items: Record<number, Item> = {
  // Pierres d'evolution
  100: {
    id: 100,
    name: 'Pierre Feu',
    description: 'Une pierre permettant a certaines creatures d\'evoluer. Rouge comme les flammes.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'fire',
    },
    spriteKey: 'firestone',
  },
  101: {
    id: 101,
    name: 'Pierre Eau',
    description: 'Une pierre permettant a certaines creatures d\'evoluer. Bleue comme l\'ocean.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'water',
    },
    spriteKey: 'waterstone',
  },
  102: {
    id: 102,
    name: 'Pierre Plante',
    description: 'Une pierre permettant a certaines creatures d\'evoluer. Verte comme les forets.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'grass',
    },
    spriteKey: 'leafstone',
  },
  103: {
    id: 103,
    name: 'Pierre Foudre',
    description: 'Une pierre permettant a certaines creatures d\'evoluer. Jaune comme l\'eclair.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'electric',
    },
    spriteKey: 'thunderstone',
  },
  104: {
    id: 104,
    name: 'Pierre Lune',
    description: 'Une pierre noire permettant a certaines creatures d\'evoluer.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'moon',
    },
    spriteKey: 'moonstone',
  },
  105: {
    id: 105,
    name: 'Pierre Soleil',
    description: 'Une pierre rouge-orangee permettant a certaines creatures d\'evoluer.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'sun',
    },
    spriteKey: 'sunstone',
  },
  106: {
    id: 106,
    name: 'Pierre Aube',
    description: 'Une pierre scintillante permettant a certaines creatures d\'evoluer.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'dawn',
    },
    spriteKey: 'dawnstone',
  },
  107: {
    id: 107,
    name: 'Pierre Nuit',
    description: 'Une pierre sombre permettant a certaines creatures d\'evoluer.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'dusk',
    },
    spriteKey: 'duskstone',
  },
  108: {
    id: 108,
    name: 'Pierre Eclat',
    description: 'Une pierre brillante permettant a certaines creatures d\'evoluer.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'shiny',
    },
    spriteKey: 'shinystone',
  },
  109: {
    id: 109,
    name: 'Pierre Glace',
    description: 'Une pierre glacee permettant a certaines creatures d\'evoluer.',
    category: 'keyItem',
    effect: {
      type: 'evolution',
      evolutionStoneType: 'ice',
    },
    spriteKey: 'icestone',
  },

  // Poke Balls
  1: {
    id: 1,
    name: 'Poké Ball',
    description: 'Une Ball standard pour capturer des créatures.',
    category: 'ball',
    effect: {
      type: 'capture',
      captureRate: 1,
    },
    spriteKey: 'pokeball',
  },
  2: {
    id: 2,
    name: 'Super Ball',
    description: 'Une Ball avec un meilleur taux de capture.',
    category: 'ball',
    effect: {
      type: 'capture',
      captureRate: 1.5,
    },
    spriteKey: 'superball',
  },
  3: {
    id: 3,
    name: 'Hyper Ball',
    description: 'Une Ball très performante.',
    category: 'ball',
    effect: {
      type: 'capture',
      captureRate: 2,
    },
    spriteKey: 'hyperball',
  },
  4: {
    id: 4,
    name: 'Master Ball',
    description: 'Capture à coup sûr n\'importe quelle créature.',
    category: 'ball',
    effect: {
      type: 'capture',
      captureRate: 255,
    },
    spriteKey: 'masterball',
  },

  // Potions
  10: {
    id: 10,
    name: 'Potion',
    description: 'Restaure 20 PV.',
    category: 'potion',
    effect: {
      type: 'heal',
      value: 20,
    },
    spriteKey: 'potion',
  },
  11: {
    id: 11,
    name: 'Super Potion',
    description: 'Restaure 50 PV.',
    category: 'potion',
    effect: {
      type: 'heal',
      value: 50,
    },
    spriteKey: 'superpotion',
  },
  12: {
    id: 12,
    name: 'Hyper Potion',
    description: 'Restaure 200 PV.',
    category: 'potion',
    effect: {
      type: 'heal',
      value: 200,
    },
    spriteKey: 'hyperpotion',
  },
  13: {
    id: 13,
    name: 'Potion Max',
    description: 'Restaure tous les PV.',
    category: 'potion',
    effect: {
      type: 'heal',
      value: 9999,
    },
    spriteKey: 'maxpotion',
  },

  // Status heals
  20: {
    id: 20,
    name: 'Anti-Brûle',
    description: 'Soigne les brûlures.',
    category: 'statusHeal',
    effect: {
      type: 'statusCure',
      curesStatus: ['burn'],
    },
    spriteKey: 'burnheal',
  },
  21: {
    id: 21,
    name: 'Antigel',
    description: 'Dégèle une créature gelée.',
    category: 'statusHeal',
    effect: {
      type: 'statusCure',
      curesStatus: ['freeze'],
    },
    spriteKey: 'iceheal',
  },
  22: {
    id: 22,
    name: 'Anti-Para',
    description: 'Soigne la paralysie.',
    category: 'statusHeal',
    effect: {
      type: 'statusCure',
      curesStatus: ['paralysis'],
    },
    spriteKey: 'paralyzeheal',
  },
  23: {
    id: 23,
    name: 'Antidote',
    description: 'Soigne l\'empoisonnement.',
    category: 'statusHeal',
    effect: {
      type: 'statusCure',
      curesStatus: ['poison', 'badPoison'],
    },
    spriteKey: 'antidote',
  },
  24: {
    id: 24,
    name: 'Réveil',
    description: 'Réveille une créature endormie.',
    category: 'statusHeal',
    effect: {
      type: 'statusCure',
      curesStatus: ['sleep'],
    },
    spriteKey: 'awakening',
  },
  25: {
    id: 25,
    name: 'Total Soin',
    description: 'Soigne tous les problèmes de statut.',
    category: 'statusHeal',
    effect: {
      type: 'statusCure',
      curesStatus: ['burn', 'freeze', 'paralysis', 'poison', 'badPoison', 'sleep'],
    },
    spriteKey: 'fullheal',
  },

  // Battle items
  30: {
    id: 30,
    name: 'Attaque +',
    description: 'Augmente l\'Attaque en combat.',
    category: 'battleItem',
    effect: {
      type: 'statBoost',
      value: 1,
    },
    spriteKey: 'xattack',
  },
  31: {
    id: 31,
    name: 'Défense +',
    description: 'Augmente la Défense en combat.',
    category: 'battleItem',
    effect: {
      type: 'statBoost',
      value: 1,
    },
    spriteKey: 'xdefense',
  },
  32: {
    id: 32,
    name: 'Vitesse +',
    description: 'Augmente la Vitesse en combat.',
    category: 'battleItem',
    effect: {
      type: 'statBoost',
      value: 1,
    },
    spriteKey: 'xspeed',
  },
};

export function getItem(id: number): Item | undefined {
  return items[id];
}

export function getAllItems(): Item[] {
  return Object.values(items);
}

export function getItemsByCategory(category: Item['category']): Item[] {
  return Object.values(items).filter((item) => item.category === category);
}
