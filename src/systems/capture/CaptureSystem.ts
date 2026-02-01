import type { BattleCreature, CreatureInstance, StatusEffect } from '@/types/creature.types';
import { calculateAllStats } from '@/utils/creatureUtils';
import { getSpecies } from '@/data/creatures/species';
import {
  getPokeBall,
  getEffectiveCaptureRate,
  getQuickBallRate,
  getTimerBallRate,
  type PokeBall,
} from '@/data/items/balls';

/**
 * Résultat d'une tentative de capture
 */
export interface CaptureResult {
  success: boolean;
  shakeCount: number; // 0-4, nombre de secousses avant résultat
  isCriticalCapture: boolean;
  message: string;
}

/**
 * Options pour la tentative de capture
 */
export interface CaptureOptions {
  turnNumber?: number; // Pour Rapide Ball et Chrono Ball
  isInCave?: boolean; // Pour Sombre Ball
  isNight?: boolean; // Pour Sombre Ball
  hasBeenCaughtBefore?: boolean; // Pour Bis Ball
}

/**
 * Ancien type de ball pour compatibilité
 * @deprecated Utiliser PokeBall de balls.ts
 */
export interface BallType {
  id: number;
  name: string;
  catchRateModifier: number;
  spriteKey: string;
}

/**
 * Map de compatibilité pour les anciens ballTypes
 * @deprecated Utiliser pokeBalls de balls.ts
 */
export const ballTypes: Record<number, BallType> = {
  1: {
    id: 1,
    name: 'Poké Ball',
    catchRateModifier: 1,
    spriteKey: 'pokeball',
  },
  2: {
    id: 2,
    name: 'Super Ball',
    catchRateModifier: 1.5,
    spriteKey: 'superball',
  },
  3: {
    id: 3,
    name: 'Hyper Ball',
    catchRateModifier: 2,
    spriteKey: 'hyperball',
  },
  4: {
    id: 4,
    name: 'Master Ball',
    catchRateModifier: 255,
    spriteKey: 'masterball',
  },
};

/**
 * Calcule le bonus de status pour la capture
 * - Sleep/Freeze: x2.5
 * - Paralysis/Burn/Poison/BadPoison: x1.5
 * - Aucun status: x1
 */
export function getStatusBonus(status?: StatusEffect): number {
  if (!status) return 1.0;

  switch (status) {
    case 'sleep':
    case 'freeze':
      return 2.5;
    case 'paralysis':
    case 'burn':
    case 'poison':
    case 'badPoison':
      return 1.5;
    default:
      return 1.0;
  }
}

/**
 * Calcule le HP max d'une créature
 */
function getMaxHp(creature: CreatureInstance): number {
  const species = getSpecies(creature.speciesId);
  if (!species) return creature.currentHp;

  const stats = calculateAllStats(
    species,
    creature.level,
    creature.ivs,
    creature.evs
  );
  return stats.hp;
}

/**
 * Calcule le modificateur de la ball selon le contexte
 */
export function getBallModifier(
  ball: PokeBall,
  creature: BattleCreature,
  options: CaptureOptions = {}
): number {
  const { turnNumber = 1, isInCave = false, isNight = false, hasBeenCaughtBefore = false } = options;

  // Master Ball - capture garantie
  if (ball.captureRate >= 255) {
    return 255;
  }

  // Rapide Ball - bonus au premier tour
  if (ball.id === 7) {
    return getQuickBallRate(turnNumber);
  }

  // Chrono Ball - bonus selon le nombre de tours
  if (ball.id === 8) {
    return getTimerBallRate(turnNumber);
  }

  // Sombre Ball - bonus en grotte ou la nuit
  if (ball.id === 6 && (isInCave || isNight)) {
    return 3.0;
  }

  // Bis Ball - bonus si déjà capturé
  if (ball.id === 10 && hasBeenCaughtBefore) {
    return 3.5;
  }

  // Filet Ball et autres balls avec fonction personnalisée
  if (ball.captureRateFunc) {
    return getEffectiveCaptureRate(ball, creature.species);
  }

  return ball.captureRate;
}

/**
 * Calcule le taux de capture 'a' selon la formule Gen 3
 *
 * Formule:
 * a = ((3 * maxHP - 2 * currentHP) * rate * bonusBall * bonusStatus) / (3 * maxHP)
 *
 * @param creature - La créature à capturer
 * @param ball - La ball utilisée
 * @param options - Options de contexte
 * @returns Le taux de capture 'a' (0-255)
 */
export function calculateCaptureRate(
  creature: BattleCreature,
  ball: PokeBall,
  options: CaptureOptions = {}
): number {
  const species = creature.species;
  const maxHp = getMaxHp(creature.instance);
  const currentHp = creature.currentHp;

  // Bonus de status
  const statusBonus = getStatusBonus(creature.status);

  // Modificateur de la ball
  const ballModifier = getBallModifier(ball, creature, options);

  // Formule Gen 3:
  // a = ((3 * HPmax - 2 * HPcurrent) * catchRate * ballRate * statusBonus) / (3 * HPmax)
  const a =
    ((3 * maxHp - 2 * currentHp) *
      species.catchRate *
      ballModifier *
      statusBonus) /
    (3 * maxHp);

  // Le taux est plafonné à 255
  return Math.min(255, Math.max(0, a));
}

/**
 * Calcule le seuil de secousse 'b' selon la formule Gen 3
 *
 * Formule:
 * b = 1048560 / sqrt(sqrt(16711680 / a))
 *
 * @param a - Le taux de capture calculé
 * @returns Le seuil de secousse 'b' (0-65535)
 */
export function calculateShakeThreshold(a: number): number {
  if (a >= 255) {
    return 65535; // Capture garantie
  }

  if (a <= 0) {
    return 0;
  }

  // b = 1048560 / sqrt(sqrt(16711680 / a))
  const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
  return Math.floor(b);
}

/**
 * Effectue un check de secousse
 *
 * @param shakeThreshold - Le seuil b calculé
 * @returns true si la secousse réussit
 */
export function performShakeCheck(shakeThreshold: number): boolean {
  // Génère un nombre aléatoire entre 0 et 65535
  const random = Math.floor(Math.random() * 65536);
  return random < shakeThreshold;
}

/**
 * Vérifie si une capture critique se produit
 * La capture critique n'effectue qu'une seule secousse
 *
 * Formule simplifiée: chance = (catchRate * ballModifier) / 2048
 *
 * @param creature - La créature ciblée
 * @param ball - La ball utilisée
 * @param pokedexCaught - Nombre d'espèces capturées dans le Pokédex
 * @returns true si capture critique
 */
export function checkCriticalCapture(
  creature: BattleCreature,
  ball: PokeBall,
  pokedexCaught: number = 0
): boolean {
  // Multiplicateur basé sur le nombre d'espèces capturées
  let multiplier = 0;
  if (pokedexCaught > 600) multiplier = 2.5;
  else if (pokedexCaught > 450) multiplier = 2.0;
  else if (pokedexCaught > 300) multiplier = 1.5;
  else if (pokedexCaught > 150) multiplier = 1.0;
  else if (pokedexCaught > 30) multiplier = 0.5;

  // Calcul du taux de capture a
  const a = calculateCaptureRate(creature, ball);

  // Chance de capture critique
  const criticalChance = (a * multiplier) / 2048;
  const random = Math.random();

  return random < criticalChance;
}

/**
 * Tente de capturer une créature avec la formule complète Gen 3
 *
 * @param creature - La créature à capturer
 * @param ballId - L'ID de la ball utilisée
 * @param options - Options de contexte (tour, lieu, etc.)
 * @returns Le résultat de la capture
 */
export function attemptCapture(
  creature: BattleCreature,
  ballId: number,
  options: CaptureOptions = {}
): CaptureResult {
  const ball = getPokeBall(ballId);
  if (!ball) {
    return {
      success: false,
      shakeCount: 0,
      isCriticalCapture: false,
      message: 'Ball invalide !',
    };
  }

  // Master Ball - capture garantie
  if (ball.captureRate >= 255) {
    return {
      success: true,
      shakeCount: 4,
      isCriticalCapture: false,
      message: getSuccessMessage(creature.species.name),
    };
  }

  // Calcul du taux de capture 'a'
  const a = calculateCaptureRate(creature, ball, options);

  // Si a >= 255, capture garantie
  if (a >= 255) {
    return {
      success: true,
      shakeCount: 4,
      isCriticalCapture: false,
      message: getSuccessMessage(creature.species.name),
    };
  }

  // Vérification de capture critique
  const isCriticalCapture = checkCriticalCapture(creature, ball);

  if (isCriticalCapture) {
    // Capture critique: un seul check
    const shakeThreshold = calculateShakeThreshold(a);
    const success = performShakeCheck(shakeThreshold);

    return {
      success,
      shakeCount: success ? 1 : 0,
      isCriticalCapture: true,
      message: success
        ? getSuccessMessage(creature.species.name)
        : getFailureMessage(0),
    };
  }

  // Capture normale: 4 checks de secousse
  const shakeThreshold = calculateShakeThreshold(a);
  let shakeCount = 0;

  for (let i = 0; i < 4; i++) {
    if (performShakeCheck(shakeThreshold)) {
      shakeCount++;
    } else {
      break; // La créature s'échappe
    }
  }

  const success = shakeCount === 4;

  return {
    success,
    shakeCount,
    isCriticalCapture: false,
    message: success
      ? getSuccessMessage(creature.species.name)
      : getFailureMessage(shakeCount),
  };
}

/**
 * Fonction de compatibilité avec l'ancienne API
 * @deprecated Utiliser attemptCapture à la place
 */
export function calculateCaptureRateOld(
  creature: BattleCreature,
  ball: BallType
): number {
  const pokeBall = getPokeBall(ball.id);
  if (!pokeBall) return 0;
  return calculateCaptureRate(creature, pokeBall);
}

/**
 * Retourne le message de succès de capture
 */
export function getSuccessMessage(creatureName: string): string {
  return `Félicitations ! ${creatureName} a été capturé !`;
}

/**
 * Retourne le message d'échec selon le nombre de secousses
 */
export function getFailureMessage(shakeCount: number): string {
  switch (shakeCount) {
    case 0:
      return 'Oh non ! La créature s\'est échappée immédiatement !';
    case 1:
      return 'Mince ! C\'était si proche !';
    case 2:
      return 'Aaaah ! Presque capturée !';
    case 3:
      return 'Argh ! Elle s\'est libérée au dernier moment !';
    default:
      return 'La créature s\'est échappée !';
  }
}

/**
 * Alias pour compatibilité
 * @deprecated Utiliser getFailureMessage
 */
export function getShakeMessage(shakeCount: number): string {
  if (shakeCount === 4) {
    return 'Félicitations ! Vous avez capturé la créature !';
  }
  return getFailureMessage(shakeCount);
}

/**
 * Crée une instance de créature capturée
 */
export function createCapturedCreature(
  battleCreature: BattleCreature,
  nickname?: string
): CreatureInstance {
  return {
    ...battleCreature.instance,
    nickname: nickname && nickname.trim() ? nickname.trim() : undefined,
    currentHp: battleCreature.currentHp,
    caughtAt: Date.now(),
  };
}

/**
 * Valide un surnom de créature
 * - Max 12 caractères
 * - Pas de caractères spéciaux interdits
 */
export function validateNickname(nickname: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = nickname.trim();

  if (trimmed.length === 0) {
    return { valid: true }; // Pas de surnom est valide
  }

  if (trimmed.length > 12) {
    return { valid: false, error: 'Le surnom ne peut pas dépasser 12 caractères.' };
  }

  // Vérification des caractères interdits
  const forbiddenPattern = /[<>{}[\]\\|`^~]/;
  if (forbiddenPattern.test(trimmed)) {
    return { valid: false, error: 'Le surnom contient des caractères interdits.' };
  }

  return { valid: true };
}
