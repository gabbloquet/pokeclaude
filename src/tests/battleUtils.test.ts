import { describe, it, expect } from 'vitest';
import {
  createBattleCreature,
  getModifiedStat,
  calculateDamage,
  checkAccuracy,
  applyStatChange,
} from '../utils/battleUtils';
import { createWildCreature } from '../utils/creatureUtils';
import { getMove } from '../data/moves/moves';

describe('battleUtils', () => {
  describe('createBattleCreature', () => {
    it('should create a battle creature from an instance', () => {
      const instance = createWildCreature(1, 10);
      const battleCreature = createBattleCreature(instance);

      expect(battleCreature.instance).toBe(instance);
      expect(battleCreature.species.id).toBe(1);
      expect(battleCreature.currentHp).toBe(instance.currentHp);
      expect(battleCreature.statModifiers.attack).toBe(0);
      expect(battleCreature.isConfused).toBe(false);
      expect(battleCreature.isFlinched).toBe(false);
      expect(battleCreature.turnsInBattle).toBe(0);
    });
  });

  describe('getModifiedStat', () => {
    it('should return base stat when modifier is 0', () => {
      const instance = createWildCreature(1, 50);
      const battleCreature = createBattleCreature(instance);

      const baseStat = getModifiedStat(battleCreature, 'attack');
      expect(baseStat).toBeGreaterThan(0);
    });

    it('should increase stat with positive modifiers', () => {
      const instance = createWildCreature(1, 50);
      const battleCreature = createBattleCreature(instance);

      const baseStat = getModifiedStat(battleCreature, 'attack');
      battleCreature.statModifiers.attack = 2;
      const boostedStat = getModifiedStat(battleCreature, 'attack');

      expect(boostedStat).toBeGreaterThan(baseStat);
    });

    it('should decrease stat with negative modifiers', () => {
      const instance = createWildCreature(1, 50);
      const battleCreature = createBattleCreature(instance);

      const baseStat = getModifiedStat(battleCreature, 'attack');
      battleCreature.statModifiers.attack = -2;
      const loweredStat = getModifiedStat(battleCreature, 'attack');

      expect(loweredStat).toBeLessThan(baseStat);
    });
  });

  describe('calculateDamage', () => {
    it('should return 0 damage for status moves', () => {
      const attacker = createBattleCreature(createWildCreature(1, 20));
      const defender = createBattleCreature(createWildCreature(4, 20));
      const growl = getMove(2)!; // Growl is a status move

      const result = calculateDamage(attacker, defender, growl);
      expect(result.damage).toBe(0);
      expect(result.effectiveness).toBe(1);
    });

    it('should calculate damage for damaging moves', () => {
      const attacker = createBattleCreature(createWildCreature(1, 20));
      const defender = createBattleCreature(createWildCreature(4, 20));
      const ember = getMove(5)!; // Ember - fire move

      const result = calculateDamage(attacker, defender, ember);
      expect(result.damage).toBeGreaterThan(0);
    });

    it('should apply type effectiveness', () => {
      const fireCreature = createBattleCreature(createWildCreature(1, 30)); // Fire type
      const waterCreature = createBattleCreature(createWildCreature(4, 30)); // Water type
      const grassCreature = createBattleCreature(createWildCreature(7, 30)); // Grass type

      const ember = getMove(5)!; // Fire move

      // Fire vs Water = not very effective
      const vsWater = calculateDamage(fireCreature, waterCreature, ember);
      // Fire vs Grass = super effective
      const vsGrass = calculateDamage(fireCreature, grassCreature, ember);

      expect(vsWater.effectiveness).toBeLessThan(1);
      expect(vsGrass.effectiveness).toBeGreaterThan(1);
    });
  });

  describe('checkAccuracy', () => {
    it('should always hit with 100 accuracy', () => {
      const tackle = getMove(1)!;

      // Run 100 times to verify
      for (let i = 0; i < 100; i++) {
        expect(checkAccuracy(tackle)).toBe(true);
      }
    });

    it('should sometimes miss with lower accuracy', () => {
      const fireBlast = getMove(9)!; // 85 accuracy
      let hits = 0;
      let misses = 0;

      for (let i = 0; i < 1000; i++) {
        if (checkAccuracy(fireBlast)) {
          hits++;
        } else {
          misses++;
        }
      }

      // Should have some misses with 85% accuracy
      expect(misses).toBeGreaterThan(0);
      // Hit rate should be roughly 85%
      expect(hits / 1000).toBeGreaterThan(0.75);
      expect(hits / 1000).toBeLessThan(0.95);
    });
  });

  describe('applyStatChange', () => {
    it('should apply positive stat changes', () => {
      const creature = createBattleCreature(createWildCreature(1, 20));
      const result = applyStatChange(creature, 'attack', 1);

      expect(result.success).toBe(true);
      expect(creature.statModifiers.attack).toBe(1);
    });

    it('should apply negative stat changes', () => {
      const creature = createBattleCreature(createWildCreature(1, 20));
      const result = applyStatChange(creature, 'defense', -1);

      expect(result.success).toBe(true);
      expect(creature.statModifiers.defense).toBe(-1);
    });

    it('should cap stat changes at +6', () => {
      const creature = createBattleCreature(createWildCreature(1, 20));
      creature.statModifiers.attack = 6;

      const result = applyStatChange(creature, 'attack', 1);

      expect(result.success).toBe(false);
      expect(creature.statModifiers.attack).toBe(6);
    });

    it('should cap stat changes at -6', () => {
      const creature = createBattleCreature(createWildCreature(1, 20));
      creature.statModifiers.defense = -6;

      const result = applyStatChange(creature, 'defense', -1);

      expect(result.success).toBe(false);
      expect(creature.statModifiers.defense).toBe(-6);
    });
  });
});
