/**
 * Quêtes de fallback
 * Utilisées quand l'IA n'est pas disponible
 */

import type { QuestType, QuestDifficulty } from '../prompts/questPrompts';

export interface FallbackQuest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  objective: {
    type: QuestType;
    target: string;
    count?: number;
  };
  reward: {
    money: number;
    items?: { id: number; quantity: number }[];
  };
  dialogue: {
    start: string;
    progress: string;
    complete: string;
  };
}

export const fallbackQuests: FallbackQuest[] = [
  // Quêtes faciles
  {
    id: 'quest_catch_electric',
    title: 'Recherche Électrique',
    description: 'Le Professeur Chen a besoin d\'étudier un Sparkit. Capture-en un pour lui !',
    type: 'capture',
    difficulty: 'easy',
    objective: {
      type: 'capture',
      target: 'Sparkit',
      count: 1,
    },
    reward: {
      money: 500,
      items: [{ id: 1, quantity: 3 }], // 3 Poké Balls
    },
    dialogue: {
      start: 'J\'aurais besoin d\'un Sparkit pour mes recherches. Tu pourrais m\'en capturer un ?',
      progress: 'Tu as trouvé un Sparkit ? Ils vivent dans les zones herbeuses.',
      complete: 'Excellent travail ! Ce Sparkit va beaucoup m\'aider. Voici ta récompense !',
    },
  },
  {
    id: 'quest_battle_5',
    title: 'Entraînement Intensif',
    description: 'Affronte 5 créatures sauvages pour renforcer ton équipe.',
    type: 'battle',
    difficulty: 'easy',
    objective: {
      type: 'battle',
      target: 'créature sauvage',
      count: 5,
    },
    reward: {
      money: 300,
      items: [{ id: 10, quantity: 2 }], // 2 Potions
    },
    dialogue: {
      start: 'La meilleure façon de progresser, c\'est de s\'entraîner ! Affronte quelques créatures sauvages.',
      progress: 'Continue comme ça ! L\'entraînement paie toujours.',
      complete: 'Tu es devenu plus fort ! Prends ces potions, elles te seront utiles.',
    },
  },

  // Quêtes moyennes
  {
    id: 'quest_catch_fire',
    title: 'Flamme Recherchée',
    description: 'Un collectionneur recherche un Flamling. Trouve-en un pour lui.',
    type: 'capture',
    difficulty: 'medium',
    objective: {
      type: 'capture',
      target: 'Flamling',
      count: 1,
    },
    reward: {
      money: 1000,
      items: [{ id: 2, quantity: 3 }], // 3 Super Balls
    },
    dialogue: {
      start: 'Je suis collectionneur et il me manque un Flamling. Tu pourrais m\'aider ?',
      progress: 'Les Flamling sont rares. Cherche bien dans les hautes herbes !',
      complete: 'Magnifique ! Ce Flamling est superbe ! Voici une belle récompense pour toi.',
    },
  },
  {
    id: 'quest_battle_trainer',
    title: 'Défi du Rival',
    description: 'Ton rival te défie ! Remporte 3 combats pour prouver ta valeur.',
    type: 'battle',
    difficulty: 'medium',
    objective: {
      type: 'battle',
      target: 'dresseur',
      count: 3,
    },
    reward: {
      money: 1500,
    },
    dialogue: {
      start: 'Tu penses être fort ? Prouve-le en battant d\'autres dresseurs !',
      progress: 'Pas mal, mais tu peux faire mieux !',
      complete: 'Ok, je l\'admets, tu es doué. Voici ce que je te dois.',
    },
  },

  // Quêtes difficiles
  {
    id: 'quest_catch_3_types',
    title: 'Trio Élémentaire',
    description: 'Capture une créature de chaque type starter : Feu, Eau et Plante.',
    type: 'capture',
    difficulty: 'hard',
    objective: {
      type: 'capture',
      target: 'type starter',
      count: 3,
    },
    reward: {
      money: 3000,
      items: [{ id: 3, quantity: 1 }], // 1 Hyper Ball
    },
    dialogue: {
      start: 'Pour devenir un vrai maître, tu dois comprendre tous les types. Capture un Feu, un Eau et un Plante !',
      progress: 'Il te manque encore des types. Continue tes recherches !',
      complete: 'Impressionnant ! Tu maîtrises maintenant le trio élémentaire. Voici une récompense à la hauteur.',
    },
  },
];

/**
 * Récupère une quête de fallback selon le type et la difficulté
 */
export function getFallbackQuest(
  type?: QuestType,
  difficulty?: QuestDifficulty
): FallbackQuest {
  let candidates = fallbackQuests;

  if (type) {
    candidates = candidates.filter((q) => q.type === type);
  }

  if (difficulty) {
    candidates = candidates.filter((q) => q.difficulty === difficulty);
  }

  // Si aucun match, retourner n'importe quelle quête
  if (candidates.length === 0) {
    candidates = fallbackQuests;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Récupère plusieurs quêtes de fallback
 */
export function getFallbackQuests(count: number = 3): FallbackQuest[] {
  const shuffled = [...fallbackQuests].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
