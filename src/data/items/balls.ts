import type { CreatureSpecies, CreatureType } from '@/types/creature.types';

/**
 * Interface pour les Poké Balls
 */
export interface PokeBall {
  id: number;
  name: string;
  description: string;
  captureRate: number;
  price: number;
  spriteKey: string;
  // Fonction optionnelle pour les balls spéciales avec modificateur dynamique
  captureRateFunc?: (species: CreatureSpecies) => number;
}

/**
 * Collection de toutes les Poké Balls disponibles
 */
export const pokeBalls: Record<number, PokeBall> = {
  1: {
    id: 1,
    name: 'Poké Ball',
    description: 'Une Ball standard pour capturer des créatures sauvages.',
    captureRate: 1.0,
    price: 200,
    spriteKey: 'pokeball',
  },
  2: {
    id: 2,
    name: 'Super Ball',
    description: 'Une Ball avec un meilleur taux de capture que la Poké Ball.',
    captureRate: 1.5,
    price: 600,
    spriteKey: 'superball',
  },
  3: {
    id: 3,
    name: 'Hyper Ball',
    description: 'Une Ball très performante avec un excellent taux de capture.',
    captureRate: 2.0,
    price: 1200,
    spriteKey: 'hyperball',
  },
  4: {
    id: 4,
    name: 'Master Ball',
    description: 'La Ball ultime. Capture à coup sûr n\'importe quelle créature.',
    captureRate: 255,
    price: 0, // Ne peut pas être achetée
    spriteKey: 'masterball',
  },
  5: {
    id: 5,
    name: 'Filet Ball',
    description: 'Particulièrement efficace sur les créatures de type Eau et Insecte.',
    captureRate: 1.0,
    price: 1000,
    spriteKey: 'netball',
    captureRateFunc: (species: CreatureSpecies): number => {
      const waterOrBugTypes: CreatureType[] = ['water', 'bug'];
      const hasMatchingType = species.types.some((type) =>
        waterOrBugTypes.includes(type)
      );
      return hasMatchingType ? 3.5 : 1.0;
    },
  },
  6: {
    id: 6,
    name: 'Sombre Ball',
    description: 'Efficace pour capturer des créatures dans les grottes ou la nuit.',
    captureRate: 1.0,
    price: 1000,
    spriteKey: 'duskball',
    // Le bonus est appliqué via le contexte (grotte/nuit) - ici on met le taux de base
    captureRateFunc: (_species: CreatureSpecies): number => {
      // Note: En pratique, on vérifierait le contexte (heure/lieu)
      // Pour simplifier, on applique toujours le bonus x3
      return 3.0;
    },
  },
  7: {
    id: 7,
    name: 'Rapide Ball',
    description: 'Très efficace si utilisée au premier tour du combat.',
    captureRate: 1.0,
    price: 1000,
    spriteKey: 'quickball',
    // Le bonus est appliqué via le système de combat selon le tour
  },
  8: {
    id: 8,
    name: 'Chrono Ball',
    description: 'Plus le combat dure, plus elle est efficace.',
    captureRate: 1.0,
    price: 1000,
    spriteKey: 'timerball',
    // Le bonus est calculé selon le nombre de tours
  },
  9: {
    id: 9,
    name: 'Luxe Ball',
    description: 'La créature capturée sera plus amicale envers son dresseur.',
    captureRate: 1.0,
    price: 1000,
    spriteKey: 'luxuryball',
  },
  10: {
    id: 10,
    name: 'Bis Ball',
    description: 'Efficace sur les créatures déjà capturées auparavant.',
    captureRate: 1.0,
    price: 1000,
    spriteKey: 'repeatball',
    // Le bonus (x3.5) est appliqué si l'espèce est dans le Pokédex
  },
};

/**
 * Récupère une Poké Ball par son ID
 */
export function getPokeBall(id: number): PokeBall | undefined {
  return pokeBalls[id];
}

/**
 * Récupère toutes les Poké Balls
 */
export function getAllPokeBalls(): PokeBall[] {
  return Object.values(pokeBalls);
}

/**
 * Récupère les Poké Balls achetables (prix > 0)
 */
export function getBuyablePokeBalls(): PokeBall[] {
  return Object.values(pokeBalls).filter((ball) => ball.price > 0);
}

/**
 * Calcule le taux de capture effectif d'une ball pour une espèce donnée
 */
export function getEffectiveCaptureRate(
  ball: PokeBall,
  species: CreatureSpecies
): number {
  // Si la ball a une fonction de calcul personnalisée, l'utiliser
  if (ball.captureRateFunc) {
    return ball.captureRateFunc(species);
  }
  // Sinon, retourner le taux de base
  return ball.captureRate;
}

/**
 * Calcule le taux de capture de la Rapide Ball selon le tour
 */
export function getQuickBallRate(turnNumber: number): number {
  // Tour 1: x5, sinon x1
  return turnNumber === 1 ? 5.0 : 1.0;
}

/**
 * Calcule le taux de capture de la Chrono Ball selon le nombre de tours
 */
export function getTimerBallRate(turnNumber: number): number {
  // Formule: min(4, 1 + (tours * 1229 / 4096))
  // Simplifié: min(4, 1 + tours * 0.3)
  return Math.min(4.0, 1.0 + turnNumber * 0.3);
}

/**
 * Vérifie si une espèce est de type Eau ou Insecte (pour Filet Ball)
 */
export function isWaterOrBugType(species: CreatureSpecies): boolean {
  return species.types.some((type) => type === 'water' || type === 'bug');
}
