import { describe, it, expect } from 'vitest';
import {
  canUseItemOverworld,
  useHealItemOverworld,
  useStatusCureItemOverworld,
  useItemOverworld,
  getUsableItemsOverworld,
} from '../systems/items/OverworldItemSystem';
import { getItem } from '../data/items/items';
import { createWildCreature } from '../utils/creatureUtils';
import type { CreatureInstance, StatusEffect } from '../types/creature.types';

describe('OverworldItemSystem', () => {
  // Helper pour creer une creature de test
  function createTestCreature(
    speciesId: number = 10,
    level: number = 10,
    hpPercent: number = 1.0,
    status?: StatusEffect
  ): CreatureInstance {
    const creature = createWildCreature(speciesId, level);
    const maxHp = creature.currentHp;
    creature.currentHp = Math.floor(maxHp * hpPercent);
    if (status) {
      creature.status = status;
    }
    return creature;
  }

  describe('canUseItemOverworld', () => {
    it('should allow healing when creature is damaged', () => {
      const creature = createTestCreature(10, 10, 0.5);
      const potion = getItem(10)!;

      const result = canUseItemOverworld(potion, creature);
      expect(result.canUse).toBe(true);
    });

    it('should not allow healing when creature has full HP', () => {
      const creature = createTestCreature(10, 10, 1.0);
      const potion = getItem(10)!;

      const result = canUseItemOverworld(potion, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('deja tous ses PV');
    });

    it('should not allow items on KO creatures', () => {
      const creature = createTestCreature(10, 10, 0.0);
      creature.currentHp = 0;
      const potion = getItem(10)!;

      const result = canUseItemOverworld(potion, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('K.O.');
    });

    it('should allow status cure when creature has matching status', () => {
      const creature = createTestCreature(10, 10, 1.0, 'poison');
      const antidote = getItem(23)!;

      const result = canUseItemOverworld(antidote, creature);
      expect(result.canUse).toBe(true);
    });

    it('should not allow status cure when creature has no status', () => {
      const creature = createTestCreature(10, 10, 1.0);
      const antidote = getItem(23)!;

      const result = canUseItemOverworld(antidote, creature);
      expect(result.canUse).toBe(false);
      expect(result.reason).toContain('pas de probleme de statut');
    });

    it('should not allow capture items overworld', () => {
      const creature = createTestCreature(10, 10);
      const pokeball = getItem(1)!;

      const result = canUseItemOverworld(pokeball, creature);
      expect(result.canUse).toBe(false);
    });

    it('should not allow stat boost items overworld', () => {
      const creature = createTestCreature(10, 10);
      const xAttack = getItem(30)!;

      const result = canUseItemOverworld(xAttack, creature);
      expect(result.canUse).toBe(false);
    });
  });

  describe('useHealItemOverworld', () => {
    it('should restore HP correctly', () => {
      const creature = createTestCreature(10, 20, 0.5);
      const initialHp = creature.currentHp;
      const potion = getItem(10)!;

      const result = useHealItemOverworld(potion, creature);

      expect(result.success).toBe(true);
      expect(result.hpRestored).toBeGreaterThan(0);
      expect(creature.currentHp).toBeGreaterThan(initialHp);
    });

    it('should not overheal', () => {
      const creature = createTestCreature(10, 10, 1.0);
      const maxHp = creature.currentHp;
      creature.currentHp = maxHp - 5;

      const superPotion = getItem(11)!; // 50 HP

      const result = useHealItemOverworld(superPotion, creature);

      expect(result.success).toBe(true);
      expect(result.hpRestored).toBe(5);
      expect(creature.currentHp).toBe(maxHp);
    });

    it('should fail if creature has full HP', () => {
      const creature = createTestCreature(10, 10, 1.0);
      const potion = getItem(10)!;

      const result = useHealItemOverworld(potion, creature);

      expect(result.success).toBe(false);
    });
  });

  describe('useStatusCureItemOverworld', () => {
    it('should cure poison with antidote', () => {
      const creature = createTestCreature(10, 10, 1.0, 'poison');
      const antidote = getItem(23)!;

      const result = useStatusCureItemOverworld(antidote, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('poison');
      expect(creature.status).toBeUndefined();
    });

    it('should cure burn with Anti-Brule', () => {
      const creature = createTestCreature(10, 10, 1.0, 'burn');
      const burnHeal = getItem(20)!;

      const result = useStatusCureItemOverworld(burnHeal, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('burn');
    });

    it('should cure paralysis with Anti-Para', () => {
      const creature = createTestCreature(10, 10, 1.0, 'paralysis');
      const paralyzeHeal = getItem(22)!;

      const result = useStatusCureItemOverworld(paralyzeHeal, creature);

      expect(result.success).toBe(true);
      expect(result.statusCured).toBe('paralysis');
    });

    it('Total Soin should cure any status', () => {
      const statuses: StatusEffect[] = ['burn', 'freeze', 'paralysis', 'poison', 'badPoison', 'sleep'];
      const fullHeal = getItem(25)!;

      for (const status of statuses) {
        const creature = createTestCreature(10, 10, 1.0, status);
        const result = useStatusCureItemOverworld(fullHeal, creature);

        expect(result.success).toBe(true);
        expect(result.statusCured).toBe(status);
      }
    });

    it('should fail if creature has no status', () => {
      const creature = createTestCreature(10, 10, 1.0);
      const antidote = getItem(23)!;

      const result = useStatusCureItemOverworld(antidote, creature);

      expect(result.success).toBe(false);
    });

    it('should fail if item does not cure the status', () => {
      const creature = createTestCreature(10, 10, 1.0, 'burn');
      const antidote = getItem(23)!; // Soigne poison, pas burn

      const result = useStatusCureItemOverworld(antidote, creature);

      expect(result.success).toBe(false);
    });
  });

  describe('useItemOverworld', () => {
    it('should use heal item correctly', () => {
      const creature = createTestCreature(10, 20, 0.5);
      const initialHp = creature.currentHp;

      const result = useItemOverworld(10, creature); // Potion

      expect(result.success).toBe(true);
      expect(creature.currentHp).toBeGreaterThan(initialHp);
    });

    it('should use status cure item correctly', () => {
      const creature = createTestCreature(10, 10, 1.0, 'poison');

      const result = useItemOverworld(23, creature); // Antidote

      expect(result.success).toBe(true);
      expect(creature.status).toBeUndefined();
    });

    it('should fail with invalid item ID', () => {
      const creature = createTestCreature(10, 10);

      const result = useItemOverworld(9999, creature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Objet introuvable.');
    });

    it('should fail when item cannot be used', () => {
      const creature = createTestCreature(10, 10, 1.0);

      const result = useItemOverworld(10, creature); // Potion sur creature full HP

      expect(result.success).toBe(false);
    });
  });

  describe('getUsableItemsOverworld', () => {
    it('should return only usable items', () => {
      const inventory = [
        { itemId: 1, quantity: 5 },   // Poke Ball - not usable
        { itemId: 10, quantity: 3 },  // Potion - usable
        { itemId: 23, quantity: 2 },  // Antidote - usable
        { itemId: 30, quantity: 1 },  // Attaque + - not usable
        { itemId: 100, quantity: 1 }, // Pierre Feu - not usable
      ];

      const usable = getUsableItemsOverworld(inventory);

      expect(usable).toHaveLength(2);
      expect(usable.find(s => s.itemId === 10)).toBeDefined();
      expect(usable.find(s => s.itemId === 23)).toBeDefined();
    });

    it('should exclude items with zero quantity', () => {
      const inventory = [
        { itemId: 10, quantity: 0 },
        { itemId: 11, quantity: 3 },
      ];

      const usable = getUsableItemsOverworld(inventory);

      expect(usable).toHaveLength(1);
      expect(usable[0].itemId).toBe(11);
    });

    it('should return empty array for empty inventory', () => {
      const usable = getUsableItemsOverworld([]);
      expect(usable).toHaveLength(0);
    });

    it('should return empty array if no usable items', () => {
      const inventory = [
        { itemId: 1, quantity: 5 },   // Poke Ball
        { itemId: 30, quantity: 1 },  // Attaque +
      ];

      const usable = getUsableItemsOverworld(inventory);
      expect(usable).toHaveLength(0);
    });
  });
});
