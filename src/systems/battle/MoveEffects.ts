import type {
  BattleCreature,
  Move,
  MoveEffect,
  BaseStats,
} from '@/types/creature.types';
import { applyStatChange } from '@/utils/battleUtils';
import { applyStatus, canReceiveStatus } from './StatusSystem';
import { calculateMaxHp } from '@/utils/creatureUtils';

/**
 * MoveEffects - Gestion des effets secondaires des attaques
 *
 * Types d'effets supportés :
 * - status : infliger un statut (avec chance)
 * - stat : modifier les stats
 * - drain : absorber une partie des dégâts infligés
 * - recoil : subir un recul basé sur les dégâts infligés
 * - heal : soigner des PV
 * - multiHit : attaquer plusieurs fois
 * - highCrit : taux critique augmenté
 */

export interface MoveEffectResult {
  messages: string[];
  additionalDamage?: number; // Pour le recul
  healAmount?: number;        // Pour le drain/heal
}

/**
 * Applique tous les effets d'une attaque après le calcul des dégâts
 */
export function applyMoveEffects(
  move: Move,
  attacker: BattleCreature,
  defender: BattleCreature,
  damageDealt: number
): MoveEffectResult {
  const result: MoveEffectResult = { messages: [] };

  if (!move.effect) {
    return result;
  }

  const effect = move.effect;
  const target = effect.target === 'self' ? attacker : defender;

  switch (effect.type) {
    case 'status':
      applyStatusEffect(effect, target, result);
      break;

    case 'stat':
      applyStatEffect(effect, target, result);
      break;

    case 'drain':
      applyDrainEffect(effect, attacker, damageDealt, result);
      break;

    case 'recoil':
      applyRecoilEffect(effect, attacker, damageDealt, result);
      break;

    case 'heal':
      applyHealEffect(effect, attacker, result);
      break;
  }

  return result;
}

/**
 * Applique un effet de statut (avec chance si définie)
 */
function applyStatusEffect(
  effect: MoveEffect,
  target: BattleCreature,
  result: MoveEffectResult
): void {
  if (!effect.statusEffect) return;

  // Vérifie la chance d'infliger le statut (100% si non définie)
  const chance = effect.value ?? 100;
  if (Math.random() * 100 >= chance) {
    return; // L'effet n'a pas été déclenché
  }

  // Vérifie l'immunité de type
  if (!canReceiveStatus(target, effect.statusEffect)) {
    result.messages.push(`${target.species.name} est immunisé !`);
    return;
  }

  // Applique le statut
  const statusResult = applyStatus(target, effect.statusEffect);
  if (statusResult.success) {
    result.messages.push(statusResult.message);
  }
}

/**
 * Applique un effet de modification de stats
 */
function applyStatEffect(
  effect: MoveEffect,
  target: BattleCreature,
  result: MoveEffectResult
): void {
  if (!effect.statChanges) return;

  // Vérifie la chance d'appliquer l'effet (100% si non définie)
  const chance = effect.value ?? 100;
  if (Math.random() * 100 >= chance) {
    return;
  }

  for (const [stat, change] of Object.entries(effect.statChanges)) {
    if (change !== undefined) {
      const statResult = applyStatChange(
        target,
        stat as keyof BaseStats,
        change as number
      );
      result.messages.push(statResult.message);
    }
  }
}

/**
 * Applique un effet de drain (récupération de PV basée sur les dégâts)
 */
function applyDrainEffect(
  effect: MoveEffect,
  attacker: BattleCreature,
  damageDealt: number,
  result: MoveEffectResult
): void {
  const drainPercent = effect.value ?? 50;
  const healAmount = Math.max(1, Math.floor(damageDealt * (drainPercent / 100)));

  const maxHp = calculateMaxHp(
    attacker.species,
    attacker.instance.level,
    attacker.instance.ivs.hp,
    attacker.instance.evs.hp
  );

  const actualHeal = Math.min(healAmount, maxHp - attacker.currentHp);
  attacker.currentHp = Math.min(maxHp, attacker.currentHp + healAmount);

  result.healAmount = actualHeal;
  result.messages.push(`${attacker.species.name} absorbe l'énergie !`);
}

/**
 * Applique un effet de recul (dégâts auto-infligés)
 */
function applyRecoilEffect(
  effect: MoveEffect,
  attacker: BattleCreature,
  damageDealt: number,
  result: MoveEffectResult
): void {
  const recoilPercent = effect.value ?? 25;
  const recoilDamage = Math.max(1, Math.floor(damageDealt * (recoilPercent / 100)));

  attacker.currentHp = Math.max(0, attacker.currentHp - recoilDamage);

  result.additionalDamage = recoilDamage;
  result.messages.push(`${attacker.species.name} est blessé par le recul !`);
}

/**
 * Applique un effet de soin (pourcentage des PV max)
 */
function applyHealEffect(
  effect: MoveEffect,
  attacker: BattleCreature,
  result: MoveEffectResult
): void {
  const healPercent = effect.value ?? 50;

  const maxHp = calculateMaxHp(
    attacker.species,
    attacker.instance.level,
    attacker.instance.ivs.hp,
    attacker.instance.evs.hp
  );

  const healAmount = Math.max(1, Math.floor(maxHp * (healPercent / 100)));
  const actualHeal = Math.min(healAmount, maxHp - attacker.currentHp);
  attacker.currentHp = Math.min(maxHp, attacker.currentHp + healAmount);

  result.healAmount = actualHeal;

  if (actualHeal > 0) {
    result.messages.push(`${attacker.species.name} récupère des PV !`);
  } else {
    result.messages.push(`Les PV de ${attacker.species.name} sont déjà au maximum !`);
  }
}

/**
 * Calcule le nombre de coups pour une attaque multi-hit
 * @returns Nombre de coups (entre 2 et 5, avec distribution pondérée)
 */
export function calculateMultiHitCount(): number {
  // Distribution : 35% pour 2 coups, 35% pour 3 coups, 15% pour 4 coups, 15% pour 5 coups
  const roll = Math.random() * 100;
  if (roll < 35) return 2;
  if (roll < 70) return 3;
  if (roll < 85) return 4;
  return 5;
}

/**
 * Vérifie si une attaque a un taux critique élevé
 */
export function isHighCritMove(move: Move): boolean {
  // Liste des attaques à haut taux critique
  const highCritMoves = [
    'Tranche',
    'Pince-Masse',
    'Tranch\'Herbe',
    'Coupe Psycho',
    'Coup d\'Boule',
    'Aéropique',
    'Coup Bas',
    'Tranche Nuit',
    'Lame de Roc',
    'Cross Poison',
  ];
  return highCritMoves.includes(move.name);
}

/**
 * Vérifie si une attaque est multi-hit
 */
export function isMultiHitMove(move: Move): boolean {
  const multiHitMoves = [
    'Combo-Griffe',
    'Double Pied',
    'Dard-Nuée',
    'Picanon',
    'Queue de Fer',
    'Fouet Lianes',
    'Balayette',
  ];
  return multiHitMoves.includes(move.name);
}

/**
 * Vérifie si une attaque a un effet de recul
 */
export function isRecoilMove(move: Move): boolean {
  return move.effect?.type === 'recoil';
}

/**
 * Vérifie si une attaque a un effet de drain
 */
export function isDrainMove(move: Move): boolean {
  return move.effect?.type === 'drain';
}
