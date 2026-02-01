import { describe, it, expect } from 'vitest';
import {
  generateRandomIVs,
  createEmptyEVs,
  calculateStat,
  getExpForLevel,
  getLevelFromExp,
  createWildCreature,
} from '../utils/creatureUtils';

describe('creatureUtils', () => {
  describe('generateRandomIVs', () => {
    it('should generate IVs between 0 and 31', () => {
      for (let i = 0; i < 100; i++) {
        const ivs = generateRandomIVs();
        expect(ivs.hp).toBeGreaterThanOrEqual(0);
        expect(ivs.hp).toBeLessThanOrEqual(31);
        expect(ivs.attack).toBeGreaterThanOrEqual(0);
        expect(ivs.attack).toBeLessThanOrEqual(31);
        expect(ivs.defense).toBeGreaterThanOrEqual(0);
        expect(ivs.defense).toBeLessThanOrEqual(31);
        expect(ivs.specialAttack).toBeGreaterThanOrEqual(0);
        expect(ivs.specialAttack).toBeLessThanOrEqual(31);
        expect(ivs.specialDefense).toBeGreaterThanOrEqual(0);
        expect(ivs.specialDefense).toBeLessThanOrEqual(31);
        expect(ivs.speed).toBeGreaterThanOrEqual(0);
        expect(ivs.speed).toBeLessThanOrEqual(31);
      }
    });
  });

  describe('createEmptyEVs', () => {
    it('should create EVs with all zeros', () => {
      const evs = createEmptyEVs();
      expect(evs.hp).toBe(0);
      expect(evs.attack).toBe(0);
      expect(evs.defense).toBe(0);
      expect(evs.specialAttack).toBe(0);
      expect(evs.specialDefense).toBe(0);
      expect(evs.speed).toBe(0);
    });
  });

  describe('calculateStat', () => {
    it('should calculate HP stat correctly', () => {
      // Base 45, IV 15, EV 0, Level 5
      // Formula: floor(((2*45 + 15) * 5 / 100)) + 5 + 10 = floor(5.25) + 15 = 5 + 15 = 20
      const hp = calculateStat(45, 15, 0, 5, true);
      expect(hp).toBe(20);
    });

    it('should calculate non-HP stat correctly', () => {
      // Base 49, IV 15, EV 0, Level 5
      const attack = calculateStat(49, 15, 0, 5, false);
      expect(attack).toBe(10); // floor(((2*49 + 15) * 5 / 100) + 5) = 10
    });

    it('should account for EVs', () => {
      const withoutEV = calculateStat(50, 15, 0, 50, false);
      const withEV = calculateStat(50, 15, 252, 50, false);
      expect(withEV).toBeGreaterThan(withoutEV);
    });
  });

  describe('getExpForLevel / getLevelFromExp', () => {
    it('should be inverse functions', () => {
      for (let level = 1; level <= 100; level++) {
        const exp = getExpForLevel(level);
        const calculatedLevel = getLevelFromExp(exp);
        expect(calculatedLevel).toBe(level);
      }
    });

    it('should return 0 exp for level 0', () => {
      expect(getExpForLevel(0)).toBe(0);
    });

    it('should return correct exp for level 100', () => {
      expect(getExpForLevel(100)).toBe(1000000);
    });
  });

  describe('createWildCreature', () => {
    it('should create a valid wild creature', () => {
      const creature = createWildCreature(1, 10);

      expect(creature.speciesId).toBe(1);
      expect(creature.level).toBe(10);
      expect(creature.currentHp).toBeGreaterThan(0);
      expect(creature.moves.length).toBeGreaterThan(0);
      expect(creature.moves.length).toBeLessThanOrEqual(4);
      expect(creature.id).toBeDefined();
      expect(creature.ivs).toBeDefined();
      expect(creature.evs).toBeDefined();
    });

    it('should throw error for invalid species', () => {
      expect(() => createWildCreature(9999, 10)).toThrow();
    });
  });
});
