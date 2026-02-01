import type { CreatureInstance, StatusEffect } from '@/types/creature.types';
import type { Item } from '@/types/game.types';
import { getItem } from '@/data/items/items';
import { getSpecies } from '@/data/creatures/species';
import { calculateMaxHp } from '@/utils/creatureUtils';

/**
 * Resultat de l'utilisation d'un objet hors combat
 */
export interface OverworldItemResult {
  success: boolean;
  message: string;
  hpRestored?: number;
  statusCured?: StatusEffect;
}

/**
 * Verifie si un objet peut etre utilise hors combat sur une creature
 */
export function canUseItemOverworld(
  item: Item,
  creature: CreatureInstance
): { canUse: boolean; reason?: string } {
  if (!item.effect) {
    return { canUse: false, reason: "Cet objet n'a pas d'effet." };
  }

  // Creature KO ?
  if (creature.currentHp <= 0) {
    // Seuls les rappels pourraient fonctionner (TODO: ajouter les rappels)
    return { canUse: false, reason: `${getCreatureName(creature)} est K.O. !` };
  }

  switch (item.effect.type) {
    case 'heal': {
      const maxHp = getCreatureMaxHp(creature);
      if (creature.currentHp >= maxHp) {
        return {
          canUse: false,
          reason: `${getCreatureName(creature)} a deja tous ses PV !`,
        };
      }
      return { canUse: true };
    }

    case 'statusCure': {
      if (!creature.status) {
        return {
          canUse: false,
          reason: `${getCreatureName(creature)} n'a pas de probleme de statut !`,
        };
      }
      if (!item.effect.curesStatus?.includes(creature.status)) {
        return { canUse: false, reason: 'Cet objet ne soigne pas ce statut.' };
      }
      return { canUse: true };
    }

    case 'capture':
    case 'statBoost':
    case 'evolution':
      return { canUse: false, reason: 'Cet objet ne peut pas etre utilise ici.' };

    default:
      return { canUse: false, reason: 'Objet inconnu.' };
  }
}

/**
 * Utilise un objet de soin sur une creature
 */
export function useHealItemOverworld(
  item: Item,
  creature: CreatureInstance
): OverworldItemResult {
  if (!item.effect || item.effect.type !== 'heal' || item.effect.value === undefined) {
    return { success: false, message: 'Objet invalide.' };
  }

  const maxHp = getCreatureMaxHp(creature);
  const currentHp = creature.currentHp;

  if (currentHp >= maxHp) {
    return {
      success: false,
      message: `${getCreatureName(creature)} a deja tous ses PV !`,
    };
  }

  const healValue = item.effect.value;
  const actualHeal = Math.min(healValue, maxHp - currentHp);
  creature.currentHp = Math.min(currentHp + healValue, maxHp);

  return {
    success: true,
    message: `${getCreatureName(creature)} recupere ${actualHeal} PV !`,
    hpRestored: actualHeal,
  };
}

/**
 * Utilise un objet de soin de statut sur une creature
 */
export function useStatusCureItemOverworld(
  item: Item,
  creature: CreatureInstance
): OverworldItemResult {
  if (!item.effect || item.effect.type !== 'statusCure' || !item.effect.curesStatus) {
    return { success: false, message: 'Objet invalide.' };
  }

  if (!creature.status) {
    return {
      success: false,
      message: `${getCreatureName(creature)} n'a pas de probleme de statut !`,
    };
  }

  if (!item.effect.curesStatus.includes(creature.status)) {
    return { success: false, message: 'Cet objet ne soigne pas ce statut.' };
  }

  const curedStatus = creature.status!; // On a deja verifie que status existe
  creature.status = undefined;

  const statusNames: Record<StatusEffect, string> = {
    burn: 'brulure',
    freeze: 'gel',
    paralysis: 'paralysie',
    poison: 'empoisonnement',
    badPoison: 'empoisonnement grave',
    sleep: 'sommeil',
  };

  return {
    success: true,
    message: `${getCreatureName(creature)} est gueri de sa ${statusNames[curedStatus]} !`,
    statusCured: curedStatus,
  };
}

/**
 * Utilise un objet hors combat
 */
export function useItemOverworld(
  itemId: number,
  creature: CreatureInstance
): OverworldItemResult {
  const item = getItem(itemId);
  if (!item) {
    return { success: false, message: 'Objet introuvable.' };
  }

  const canUse = canUseItemOverworld(item, creature);
  if (!canUse.canUse) {
    return { success: false, message: canUse.reason || "Impossible d'utiliser cet objet." };
  }

  switch (item.effect?.type) {
    case 'heal':
      return useHealItemOverworld(item, creature);
    case 'statusCure':
      return useStatusCureItemOverworld(item, creature);
    default:
      return { success: false, message: 'Cet objet ne peut pas etre utilise ici.' };
  }
}

/**
 * Retourne les objets utilisables hors combat
 */
export function getUsableItemsOverworld(inventory: { itemId: number; quantity: number }[]): {
  itemId: number;
  quantity: number;
}[] {
  return inventory.filter((slot) => {
    const item = getItem(slot.itemId);
    if (!item || slot.quantity <= 0) return false;

    // Seuls les potions et statusHeal peuvent etre utilises hors combat
    return item.category === 'potion' || item.category === 'statusHeal';
  });
}

/**
 * Retourne le nom d'une creature
 */
function getCreatureName(creature: CreatureInstance): string {
  if (creature.nickname) return creature.nickname;
  const species = getSpecies(creature.speciesId);
  return species?.name || 'Creature';
}

/**
 * Retourne le HP max d'une creature
 */
function getCreatureMaxHp(creature: CreatureInstance): number {
  const species = getSpecies(creature.speciesId);
  if (!species) return creature.currentHp;

  return calculateMaxHp(species, creature.level, creature.ivs.hp, creature.evs.hp);
}
