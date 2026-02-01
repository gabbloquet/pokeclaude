import type { BattleCreature, StatusEffect } from '@/types/creature.types';
import type { Item, InventorySlot } from '@/types/game.types';
import { getItem } from '@/data/items/items';
import { getSpecies } from '@/data/creatures/species';
import { calculateMaxHp } from '@/utils/creatureUtils';

/**
 * Résultat de l'utilisation d'un objet
 */
export interface ItemUseResult {
  success: boolean;
  message: string;
  hpRestored?: number;
  statusCured?: StatusEffect;
  statBoosted?: string;
}

/**
 * Vérifie si un objet peut être utilisé sur une créature en combat
 */
export function canUseItemInBattle(item: Item, creature: BattleCreature): { canUse: boolean; reason?: string } {
  if (!item.effect) {
    return { canUse: false, reason: 'Cet objet n\'a pas d\'effet.' };
  }

  switch (item.effect.type) {
    case 'heal': {
      const maxHp = getCreatureMaxHp(creature);
      if (creature.currentHp >= maxHp) {
        return { canUse: false, reason: `${creature.species.name} a déjà tous ses PV !` };
      }
      return { canUse: true };
    }

    case 'statusCure': {
      if (!creature.status) {
        return { canUse: false, reason: `${creature.species.name} n'a pas de problème de statut !` };
      }
      if (!item.effect.curesStatus?.includes(creature.status)) {
        return { canUse: false, reason: `Cet objet ne soigne pas ce statut.` };
      }
      return { canUse: true };
    }

    case 'statBoost': {
      // Les boosts de stats peuvent toujours être utilisés (jusqu'à +6)
      return { canUse: true };
    }

    case 'capture':
    case 'evolution':
      return { canUse: false, reason: 'Cet objet ne peut pas être utilisé ici.' };

    default:
      return { canUse: false, reason: 'Objet inconnu.' };
  }
}

/**
 * Utilise un objet de soin sur une créature
 */
export function useHealItem(item: Item, creature: BattleCreature): ItemUseResult {
  if (!item.effect || item.effect.type !== 'heal' || item.effect.value === undefined) {
    return { success: false, message: 'Objet invalide.' };
  }

  const maxHp = getCreatureMaxHp(creature);
  const currentHp = creature.currentHp;

  if (currentHp >= maxHp) {
    return { success: false, message: `${creature.species.name} a déjà tous ses PV !` };
  }

  const healValue = item.effect.value;
  const actualHeal = Math.min(healValue, maxHp - currentHp);
  creature.currentHp = Math.min(currentHp + healValue, maxHp);

  return {
    success: true,
    message: `${creature.species.name} récupère ${actualHeal} PV !`,
    hpRestored: actualHeal,
  };
}

/**
 * Utilise un objet de soin de statut sur une créature
 */
export function useStatusCureItem(item: Item, creature: BattleCreature): ItemUseResult {
  if (!item.effect || item.effect.type !== 'statusCure' || !item.effect.curesStatus) {
    return { success: false, message: 'Objet invalide.' };
  }

  if (!creature.status) {
    return { success: false, message: `${creature.species.name} n'a pas de problème de statut !` };
  }

  if (!item.effect.curesStatus.includes(creature.status)) {
    return { success: false, message: `Cet objet ne soigne pas ce statut.` };
  }

  const curedStatus = creature.status;
  creature.status = undefined;

  const statusNames: Record<StatusEffect, string> = {
    burn: 'brûlure',
    freeze: 'gel',
    paralysis: 'paralysie',
    poison: 'empoisonnement',
    badPoison: 'empoisonnement grave',
    sleep: 'sommeil',
  };

  return {
    success: true,
    message: `${creature.species.name} est guéri de sa ${statusNames[curedStatus]} !`,
    statusCured: curedStatus,
  };
}

/**
 * Utilise un objet de boost de stat sur une créature
 */
export function useStatBoostItem(item: Item, creature: BattleCreature, stat: string): ItemUseResult {
  if (!item.effect || item.effect.type !== 'statBoost') {
    return { success: false, message: 'Objet invalide.' };
  }

  const boostValue = item.effect.value ?? 1;
  const statKey = stat as keyof typeof creature.statModifiers;

  if (creature.statModifiers[statKey] === undefined) {
    return { success: false, message: 'Statistique invalide.' };
  }

  const currentMod = creature.statModifiers[statKey];
  if (currentMod >= 6) {
    return { success: false, message: `L'${getStatName(stat)} de ${creature.species.name} ne peut plus monter !` };
  }

  creature.statModifiers[statKey] = Math.min(6, currentMod + boostValue);

  return {
    success: true,
    message: `L'${getStatName(stat)} de ${creature.species.name} augmente !`,
    statBoosted: stat,
  };
}

/**
 * Utilise un objet en combat
 */
export function useItemInBattle(
  itemId: number,
  creature: BattleCreature,
  targetStat?: string
): ItemUseResult {
  const item = getItem(itemId);
  if (!item) {
    return { success: false, message: 'Objet introuvable.' };
  }

  const canUse = canUseItemInBattle(item, creature);
  if (!canUse.canUse) {
    return { success: false, message: canUse.reason || 'Impossible d\'utiliser cet objet.' };
  }

  switch (item.effect?.type) {
    case 'heal':
      return useHealItem(item, creature);
    case 'statusCure':
      return useStatusCureItem(item, creature);
    case 'statBoost':
      return useStatBoostItem(item, creature, targetStat || 'attack');
    default:
      return { success: false, message: 'Cet objet ne peut pas être utilisé en combat.' };
  }
}

/**
 * Filtre les objets utilisables en combat depuis l'inventaire
 */
export function getUsableItemsInBattle(inventory: InventorySlot[]): InventorySlot[] {
  return inventory.filter(slot => {
    const item = getItem(slot.itemId);
    if (!item || slot.quantity <= 0) return false;

    // Seuls les potions, statusHeal et battleItem peuvent être utilisés en combat
    return item.category === 'potion' || item.category === 'statusHeal' || item.category === 'battleItem';
  });
}

/**
 * Retourne le HP max d'une créature
 */
function getCreatureMaxHp(creature: BattleCreature): number {
  const species = getSpecies(creature.instance.speciesId);
  if (!species) return creature.currentHp;

  return calculateMaxHp(
    species,
    creature.instance.level,
    creature.instance.ivs.hp,
    creature.instance.evs.hp
  );
}

/**
 * Retourne le nom français d'une stat
 */
function getStatName(stat: string): string {
  const statNames: Record<string, string> = {
    attack: 'Attaque',
    defense: 'Défense',
    specialAttack: 'Attaque Spéciale',
    specialDefense: 'Défense Spéciale',
    speed: 'Vitesse',
  };
  return statNames[stat] || stat;
}

/**
 * Détermine quelle stat un item de boost affecte (basé sur l'ID)
 */
export function getStatFromBoostItem(itemId: number): string {
  switch (itemId) {
    case 30: return 'attack';
    case 31: return 'defense';
    case 32: return 'speed';
    default: return 'attack';
  }
}
