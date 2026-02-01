import type { BattleCreature, StatusEffect } from '@/types/creature.types';
import { calculateMaxHp } from '@/utils/creatureUtils';

/**
 * StatusSystem - Gestion complète des statuts de combat
 *
 * Statuts disponibles :
 * - burn (brûlure) : -1/16 HP par tour, attaque physique -50%
 * - freeze (gel) : impossible d'agir, 20% chance de dégeler par tour
 * - paralysis (paralysie) : 25% chance de ne pas agir, vitesse -50%
 * - poison : -1/8 HP par tour
 * - badPoison (poison grave) : dégâts augmentent chaque tour (1/16, 2/16, 3/16...)
 * - sleep (sommeil) : impossible d'agir (1-3 tours)
 */

export interface StatusState {
  sleepTurns: number;      // Tours de sommeil restants
  badPoisonCounter: number; // Compteur pour le poison grave (augmente chaque tour)
  frozenTurns: number;      // Tours passés gelé
}

// Store pour les états additionnels des statuts (non stockés dans BattleCreature)
const statusStates = new Map<string, StatusState>();

/**
 * Initialise l'état de statut pour une créature
 */
export function initStatusState(creatureId: string): void {
  statusStates.set(creatureId, {
    sleepTurns: 0,
    badPoisonCounter: 0,
    frozenTurns: 0,
  });
}

/**
 * Récupère l'état de statut d'une créature
 */
export function getStatusState(creatureId: string): StatusState {
  if (!statusStates.has(creatureId)) {
    initStatusState(creatureId);
  }
  return statusStates.get(creatureId)!;
}

/**
 * Réinitialise l'état de statut d'une créature
 */
export function clearStatusState(creatureId: string): void {
  statusStates.delete(creatureId);
}

/**
 * Applique un statut à une créature
 * @returns Message décrivant l'application du statut, ou null si échec
 */
export function applyStatus(
  creature: BattleCreature,
  status: StatusEffect
): { success: boolean; message: string } {
  // Vérifie si la créature a déjà un statut
  if (creature.status) {
    return {
      success: false,
      message: `${creature.species.name} a déjà un statut !`,
    };
  }

  // TODO: Ajouter les immunités de type (ex: Feu immunisé à brûlure, Électrik à paralysie, etc.)
  // Pour l'instant, on applique le statut sans vérification d'immunité

  creature.status = status;
  const state = getStatusState(creature.instance.id);

  // Initialise les états spécifiques selon le statut
  switch (status) {
    case 'sleep':
      // Le sommeil dure entre 1 et 3 tours
      state.sleepTurns = Math.floor(Math.random() * 3) + 1;
      break;
    case 'badPoison':
      state.badPoisonCounter = 1;
      break;
    case 'freeze':
      state.frozenTurns = 0;
      break;
  }

  return {
    success: true,
    message: getStatusInflictedMessage(creature.species.name, status),
  };
}

/**
 * Retire le statut d'une créature
 */
export function cureStatus(creature: BattleCreature): { success: boolean; message: string } {
  if (!creature.status) {
    return {
      success: false,
      message: `${creature.species.name} n'a pas de statut !`,
    };
  }

  const previousStatus = creature.status;
  creature.status = undefined;

  // Réinitialise les états du statut
  const state = getStatusState(creature.instance.id);
  state.sleepTurns = 0;
  state.badPoisonCounter = 0;
  state.frozenTurns = 0;

  return {
    success: true,
    message: getStatusCuredMessage(creature.species.name, previousStatus),
  };
}

/**
 * Vérifie si la créature peut agir ce tour (selon son statut)
 * Appelé en début de tour
 * @returns true si la créature peut agir, false sinon
 */
export function canActThisTurn(creature: BattleCreature): { canAct: boolean; message?: string } {
  if (!creature.status) {
    return { canAct: true };
  }

  const state = getStatusState(creature.instance.id);

  switch (creature.status) {
    case 'sleep':
      // Décrémente le compteur de sommeil
      state.sleepTurns--;
      if (state.sleepTurns <= 0) {
        creature.status = undefined;
        return {
          canAct: true,
          message: `${creature.species.name} se réveille !`,
        };
      }
      return {
        canAct: false,
        message: `${creature.species.name} dort profondément...`,
      };

    case 'freeze':
      state.frozenTurns++;
      // 20% de chance de dégeler chaque tour
      if (Math.random() < 0.20) {
        creature.status = undefined;
        state.frozenTurns = 0;
        return {
          canAct: true,
          message: `${creature.species.name} dégèle !`,
        };
      }
      return {
        canAct: false,
        message: `${creature.species.name} est gelé et ne peut pas bouger !`,
      };

    case 'paralysis':
      // 25% de chance de ne pas pouvoir agir
      if (Math.random() < 0.25) {
        return {
          canAct: false,
          message: `${creature.species.name} est paralysé ! Il ne peut pas attaquer !`,
        };
      }
      return { canAct: true };

    case 'burn':
    case 'poison':
    case 'badPoison':
      // Ces statuts ne bloquent pas l'action
      return { canAct: true };

    default:
      return { canAct: true };
  }
}

/**
 * Applique les dégâts de statut en fin de tour
 * @returns Message décrivant les dégâts, ou null si pas de dégâts
 */
export function applyEndOfTurnStatusDamage(creature: BattleCreature): {
  damage: number;
  message: string;
} | null {
  if (!creature.status) {
    return null;
  }

  const maxHp = calculateMaxHp(
    creature.species,
    creature.instance.level,
    creature.instance.ivs.hp,
    creature.instance.evs.hp
  );

  const state = getStatusState(creature.instance.id);
  let damage = 0;
  let message = '';

  switch (creature.status) {
    case 'burn':
      // -1/16 des PV max par tour
      damage = Math.max(1, Math.floor(maxHp / 16));
      message = `${creature.species.name} souffre de sa brûlure !`;
      break;

    case 'poison':
      // -1/8 des PV max par tour
      damage = Math.max(1, Math.floor(maxHp / 8));
      message = `${creature.species.name} souffre du poison !`;
      break;

    case 'badPoison':
      // Les dégâts augmentent chaque tour : n/16 des PV max
      damage = Math.max(1, Math.floor((maxHp * state.badPoisonCounter) / 16));
      state.badPoisonCounter++;
      message = `${creature.species.name} est gravement empoisonné !`;
      break;

    default:
      return null;
  }

  // Applique les dégâts
  creature.currentHp = Math.max(0, creature.currentHp - damage);

  return { damage, message };
}

/**
 * Retourne le modificateur d'attaque physique dû au statut brûlure
 * @returns 0.5 si brûlé, 1 sinon
 */
export function getBurnAttackModifier(creature: BattleCreature): number {
  if (creature.status === 'burn') {
    return 0.5;
  }
  return 1;
}

/**
 * Retourne le modificateur de vitesse dû au statut paralysie
 * @returns 0.5 si paralysé, 1 sinon
 */
export function getParalysisSpeedModifier(creature: BattleCreature): number {
  if (creature.status === 'paralysis') {
    return 0.5;
  }
  return 1;
}

/**
 * Vérifie si un statut peut être appliqué à une créature selon son type
 * (Immunités de type)
 */
export function canReceiveStatus(
  creature: BattleCreature,
  status: StatusEffect
): boolean {
  const types = creature.species.types;

  switch (status) {
    case 'burn':
      // Les types Feu sont immunisés à la brûlure
      return !types.includes('fire');
    case 'freeze':
      // Les types Glace sont immunisés au gel
      return !types.includes('ice');
    case 'paralysis':
      // Les types Électrik sont immunisés à la paralysie
      return !types.includes('electric');
    case 'poison':
    case 'badPoison':
      // Les types Poison et Acier sont immunisés au poison
      return !types.includes('poison') && !types.includes('steel');
    case 'sleep':
      // Pas d'immunité de type pour le sommeil
      return true;
    default:
      return true;
  }
}

/**
 * Retourne le message d'infliction de statut
 */
function getStatusInflictedMessage(name: string, status: StatusEffect): string {
  const messages: Record<StatusEffect, string> = {
    burn: `${name} est brûlé !`,
    freeze: `${name} est gelé !`,
    paralysis: `${name} est paralysé ! Il aura du mal à attaquer !`,
    poison: `${name} est empoisonné !`,
    badPoison: `${name} est gravement empoisonné !`,
    sleep: `${name} s'endort !`,
  };
  return messages[status];
}

/**
 * Retourne le message de guérison de statut
 */
function getStatusCuredMessage(name: string, status: StatusEffect): string {
  const messages: Record<StatusEffect, string> = {
    burn: `${name} n'est plus brûlé !`,
    freeze: `${name} a dégelé !`,
    paralysis: `${name} n'est plus paralysé !`,
    poison: `${name} n'est plus empoisonné !`,
    badPoison: `${name} n'est plus empoisonné !`,
    sleep: `${name} se réveille !`,
  };
  return messages[status];
}

/**
 * Retourne le texte de statut pour l'affichage UI
 */
export function getStatusDisplayText(status: StatusEffect): string {
  const texts: Record<StatusEffect, string> = {
    burn: 'BRU',
    freeze: 'GEL',
    paralysis: 'PAR',
    poison: 'PSN',
    badPoison: 'PSN',
    sleep: 'SOM',
  };
  return texts[status];
}

/**
 * Retourne la couleur associée au statut pour l'UI
 */
export function getStatusColor(status: StatusEffect): number {
  const colors: Record<StatusEffect, number> = {
    burn: 0xff6600,      // Orange
    freeze: 0x66ccff,    // Bleu clair
    paralysis: 0xffcc00, // Jaune
    poison: 0x9933ff,    // Violet
    badPoison: 0x660099, // Violet foncé
    sleep: 0x999999,     // Gris
  };
  return colors[status];
}
