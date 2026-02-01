import { describe, it, expect } from 'vitest';
import {
  canUseItemInBattle,
  useHealItem,
  useStatusCureItem,
  useStatBoostItem,
  useItemInBattle,
  getUsableItemsInBattle,
  getStatFromBoostItem,
} from '../systems/battle/ItemSystem';
import { getItem, getItemsByCategory } from '../data/items/items';
import { createWildCreature } from '../utils/creatureUtils';
import { createBattleCreature } from '../utils/battleUtils';
import type { BattleCreature, StatusEffect } from '../types/creature.types';
import type { InventorySlot } from '../types/game.types';

describe('ItemSystem', () => {
  // Helper pour créer une créature de combat
  function createTestBattleCreature(
    speciesId: number = 10,
    level: number = 10,
    hpPercent: number = 1.0,
    status?: StatusEffect
  ): BattleCreature {
    const instance = createWildCreature(speciesId, level);
    const battleCreature = createBattleCreature(instance);

    // Ajuster les HP
    const maxHp = battleCreature.currentHp;
    battleCreature.currentHp = Math.floor(maxHp * hpPercent);

    // Appliquer le status si fourni
    if (status) {
      battleCreature.status = status;
    }

    return battleCreature;
  }

  describe('canUseItemInBattle', () => {
    it('should allow healing item when creature is damaged', () => {
      const creature = createTestBattleCreature(10, 10, 0.5);
      const potion = getItem(10)!; // Potion

      const result = canUseItemInBattle(potion, creature);
      expect(result.canUse).toBe(true);
    });

    it('should not allow healing when creature has full HP', () => {
      const creature = createTestBattleCreature(10, 10, 1.0);
      const potion = getItem(10)!;

      const result = canUseItemInBattle(potion, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('déjà tous ses PV');
    });

    it('should allow status cure when creature has matching status', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'poison');
      const antidote = getItem(23)!; // Antidote

      const result = canUseItemInBattle(antidote, creature);
      expect(result.canUse).toBe(true);
    });

    it('should not allow status cure when creature has no status', () => {
      const creature = createTestBattleCreature(10, 10, 1.0);
      const antidote = getItem(23)!;

      const result = canUseItemInBattle(antidote, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('pas de problème de statut');
    });

    it('should not allow status cure for wrong status type', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'burn');
      const antidote = getItem(23)!; // Soigne poison, pas burn

      const result = canUseItemInBattle(antidote, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('ne soigne pas ce statut');
    });

    it('should always allow stat boost items', () => {
      const creature = createTestBattleCreature(10, 10, 1.0);
      const xAttack = getItem(30)!; // Attaque +

      const result = canUseItemInBattle(xAttack, creature);
      expect(result.canUse).toBe(true);
    });

    it('should not allow capture items in battle', () => {
      const creature = createTestBattleCreature(10, 10);
      const pokeball = getItem(1)!; // Poké Ball

      const result = canUseItemInBattle(pokeball, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('ne peut pas être utilisé ici');
    });

    it('should not allow evolution items in battle', () => {
      const creature = createTestBattleCreature(10, 10);
      const fireStone = getItem(100)!; // Pierre Feu

      const result = canUseItemInBattle(fireStone, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('ne peut pas être utilisé ici');
    });
  });

  describe('useHealItem', () => {
    it('should restore HP correctly', () => {
      const creature = createTestBattleCreature(10, 20, 0.5); // Niveau 20 pour avoir plus de HP
      const initialHp = creature.currentHp;
      const potion = getItem(10)!; // Restaure 20 PV

      const result = useHealItem(potion, creature);

      expect(result.success).toBe(true);
      expect(result.hpRestored).toBeGreaterThan(0);
      expect(result.hpRestored).toBeLessThanOrEqual(20);
      expect(creature.currentHp).toBeGreaterThan(initialHp);
    });

    it('should not overheal beyond max HP', () => {
      // Créer une créature avec pleine vie, puis lui retirer quelques HP
      const creature = createTestBattleCreature(10, 10, 1.0);
      const maxHp = creature.currentHp;
      const missingHp = 5;
      creature.currentHp = maxHp - missingHp;

      const superPotion = getItem(11)!; // Restaure 50 PV

      const result = useHealItem(superPotion, creature);

      expect(result.success).toBe(true);
      expect(result.hpRestored).toBe(missingHp); // Seulement missingHp récupérés
      expect(creature.currentHp).toBe(maxHp);
    });

    it('should fail if creature has full HP', () => {
      const creature = createTestBattleCreature(10, 10, 1.0);
      const potion = getItem(10)!;

      const result = useHealItem(potion, creature);

      expect(result.success).toBe(false);
      expect(result.message).toContain('déjà tous ses PV');
    });

    it('should fail with invalid item', () => {
      const creature = createTestBattleCreature(10, 10, 0.5);
      const invalidItem = { id: 999, name: 'Invalid', description: '', category: 'potion' as const, spriteKey: '' };

      const result = useHealItem(invalidItem, creature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Objet invalide.');
    });
  });

  describe('useStatusCureItem', () => {
    it('should cure poison with antidote', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'poison');
      const antidote = getItem(23)!;

      const result = useStatusCureItem(antidote, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('poison');
      expect(creature.status).toBeUndefined();
    });

    it('should cure badPoison with antidote', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'badPoison');
      const antidote = getItem(23)!;

      const result = useStatusCureItem(antidote, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('badPoison');
      expect(creature.status).toBeUndefined();
    });

    it('should cure burn with Anti-Brûle', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'burn');
      const burnHeal = getItem(20)!;

      const result = useStatusCureItem(burnHeal, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('burn');
    });

    it('should cure paralysis with Anti-Para', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'paralysis');
      const paralyzeHeal = getItem(22)!;

      const result = useStatusCureItem(paralyzeHeal, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('paralysis');
    });

    it('should cure sleep with Réveil', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'sleep');
      const awakening = getItem(24)!;

      const result = useStatusCureItem(awakening, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('sleep');
    });

    it('should cure freeze with Antigel', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'freeze');
      const iceHeal = getItem(21)!;

      const result = useStatusCureItem(iceHeal, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('freeze');
    });

    it('Total Soin should cure any status', () => {
      const statuses: StatusEffect[] = ['burn', 'freeze', 'paralysis', 'poison', 'badPoison', 'sleep'];
      const fullHeal = getItem(25)!;

      for (const status of statuses) {
        const creature = createTestBattleCreature(10, 10, 1.0, status);
        const result = useStatusCureItem(fullHeal, creature);

        expect(result.success).toBe(true);
        expect(result.statusCured).toBe(status);
        expect(creature.status).toBeUndefined();
      }
    });

    it('should fail if creature has no status', () => {
      const creature = createTestBattleCreature(10, 10, 1.0);
      const antidote = getItem(23)!;

      const result = useStatusCureItem(antidote, creature);

      expect(result.success).toBe(false);
      expect(result.message).toContain('pas de problème de statut');
    });

    it('should fail if item does not cure the status', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'burn');
      const antidote = getItem(23)!; // Soigne poison, pas burn

      const result = useStatusCureItem(antidote, creature);

      expect(result.success).toBe(false);
      expect(result.message).toContain('ne soigne pas ce statut');
    });
  });

  describe('useStatBoostItem', () => {
    it('should boost attack stat', () => {
      const creature = createTestBattleCreature(10, 10);
      const xAttack = getItem(30)!;

      const result = useStatBoostItem(xAttack, creature, 'attack');

      expect(result.success).toBe(true);
      expect(result.statBoosted).toBe('attack');
      expect(creature.statModifiers.attack).toBe(1);
    });

    it('should boost defense stat', () => {
      const creature = createTestBattleCreature(10, 10);
      const xDefense = getItem(31)!;

      const result = useStatBoostItem(xDefense, creature, 'defense');

      expect(result.success).toBe(true);
      expect(result.statBoosted).toBe('defense');
      expect(creature.statModifiers.defense).toBe(1);
    });

    it('should boost speed stat', () => {
      const creature = createTestBattleCreature(10, 10);
      const xSpeed = getItem(32)!;

      const result = useStatBoostItem(xSpeed, creature, 'speed');

      expect(result.success).toBe(true);
      expect(result.statBoosted).toBe('speed');
      expect(creature.statModifiers.speed).toBe(1);
    });

    it('should stack boosts up to +6', () => {
      const creature = createTestBattleCreature(10, 10);
      const xAttack = getItem(30)!;

      for (let i = 0; i < 6; i++) {
        const result = useStatBoostItem(xAttack, creature, 'attack');
        expect(result.success).toBe(true);
      }

      expect(creature.statModifiers.attack).toBe(6);
    });

    it('should fail when stat is already at +6', () => {
      const creature = createTestBattleCreature(10, 10);
      creature.statModifiers.attack = 6;
      const xAttack = getItem(30)!;

      const result = useStatBoostItem(xAttack, creature, 'attack');

      expect(result.success).toBe(false);
      expect(result.message).toContain('ne peut plus monter');
    });

    it('should cap at +6 even with multiple boost value', () => {
      const creature = createTestBattleCreature(10, 10);
      creature.statModifiers.attack = 5;
      const xAttack = getItem(30)!;

      // Même avec un boost de +1, ne devrait pas dépasser 6
      const result = useStatBoostItem(xAttack, creature, 'attack');

      expect(result.success).toBe(true);
      expect(creature.statModifiers.attack).toBe(6);
    });
  });

  describe('useItemInBattle', () => {
    it('should use heal item correctly', () => {
      const creature = createTestBattleCreature(10, 20, 0.5); // Niveau 20 pour avoir plus de HP
      const initialHp = creature.currentHp;

      const result = useItemInBattle(10, creature); // Potion

      expect(result.success).toBe(true);
      expect(creature.currentHp).toBeGreaterThan(initialHp);
      expect(creature.currentHp).toBeLessThanOrEqual(initialHp + 20);
    });

    it('should use status cure item correctly', () => {
      const creature = createTestBattleCreature(10, 10, 1.0, 'poison');

      const result = useItemInBattle(23, creature); // Antidote

      expect(result.success).toBe(true);
      expect(creature.status).toBeUndefined();
    });

    it('should use stat boost item correctly', () => {
      const creature = createTestBattleCreature(10, 10);

      const result = useItemInBattle(30, creature, 'attack'); // Attaque +

      expect(result.success).toBe(true);
      expect(creature.statModifiers.attack).toBe(1);
    });

    it('should fail with invalid item ID', () => {
      const creature = createTestBattleCreature(10, 10);

      const result = useItemInBattle(9999, creature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Objet introuvable.');
    });

    it('should fail when item cannot be used', () => {
      const creature = createTestBattleCreature(10, 10, 1.0); // Full HP

      const result = useItemInBattle(10, creature); // Potion

      expect(result.success).toBe(false);
      expect(result.message).toContain('déjà tous ses PV');
    });
  });

  describe('getUsableItemsInBattle', () => {
    it('should return only usable items', () => {
      const inventory: InventorySlot[] = [
        { itemId: 1, quantity: 5 },   // Poké Ball - not usable
        { itemId: 10, quantity: 3 },  // Potion - usable
        { itemId: 23, quantity: 2 },  // Antidote - usable
        { itemId: 30, quantity: 1 },  // Attaque + - usable
        { itemId: 100, quantity: 1 }, // Pierre Feu - not usable
      ];

      const usable = getUsableItemsInBattle(inventory);

      expect(usable).toHaveLength(3);
      expect(usable.find(s => s.itemId === 10)).toBeDefined();
      expect(usable.find(s => s.itemId === 23)).toBeDefined();
      expect(usable.find(s => s.itemId === 30)).toBeDefined();
      expect(usable.find(s => s.itemId === 1)).toBeUndefined();
      expect(usable.find(s => s.itemId === 100)).toBeUndefined();
    });

    it('should exclude items with zero quantity', () => {
      const inventory: InventorySlot[] = [
        { itemId: 10, quantity: 0 },  // Potion with 0 quantity
        { itemId: 11, quantity: 3 },  // Super Potion with quantity
      ];

      const usable = getUsableItemsInBattle(inventory);

      expect(usable).toHaveLength(1);
      expect(usable[0].itemId).toBe(11);
    });

    it('should return empty array for empty inventory', () => {
      const usable = getUsableItemsInBattle([]);
      expect(usable).toHaveLength(0);
    });

    it('should return empty array if no usable items', () => {
      const inventory: InventorySlot[] = [
        { itemId: 1, quantity: 5 },   // Poké Ball
        { itemId: 100, quantity: 1 }, // Pierre Feu
      ];

      const usable = getUsableItemsInBattle(inventory);
      expect(usable).toHaveLength(0);
    });
  });

  describe('getStatFromBoostItem', () => {
    it('should return attack for item 30', () => {
      expect(getStatFromBoostItem(30)).toBe('attack');
    });

    it('should return defense for item 31', () => {
      expect(getStatFromBoostItem(31)).toBe('defense');
    });

    it('should return speed for item 32', () => {
      expect(getStatFromBoostItem(32)).toBe('speed');
    });

    it('should return attack as default for unknown items', () => {
      expect(getStatFromBoostItem(999)).toBe('attack');
    });
  });

  describe('items data integrity', () => {
    it('should have all potions with heal effect', () => {
      const potions = getItemsByCategory('potion');

      for (const potion of potions) {
        expect(potion.effect).toBeDefined();
        expect(potion.effect?.type).toBe('heal');
        expect(potion.effect?.value).toBeGreaterThan(0);
      }
    });

    it('should have all status heals with statusCure effect', () => {
      const statusHeals = getItemsByCategory('statusHeal');

      for (const item of statusHeals) {
        expect(item.effect).toBeDefined();
        expect(item.effect?.type).toBe('statusCure');
        expect(item.effect?.curesStatus).toBeDefined();
        expect(item.effect?.curesStatus?.length).toBeGreaterThan(0);
      }
    });

    it('should have all battle items with statBoost effect', () => {
      const battleItems = getItemsByCategory('battleItem');

      for (const item of battleItems) {
        expect(item.effect).toBeDefined();
        expect(item.effect?.type).toBe('statBoost');
      }
    });

    it('should have all balls with capture effect', () => {
      const balls = getItemsByCategory('ball');

      for (const ball of balls) {
        expect(ball.effect).toBeDefined();
        expect(ball.effect?.type).toBe('capture');
        expect(ball.effect?.captureRate).toBeGreaterThan(0);
      }
    });
  });
});
