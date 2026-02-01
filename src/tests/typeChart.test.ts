import { describe, it, expect } from 'vitest';
import { getTypeEffectiveness, typeChart } from '../data/types/typeChart';

describe('typeChart', () => {
  describe('getTypeEffectiveness', () => {
    it('should return 2 for super effective attacks', () => {
      expect(getTypeEffectiveness('fire', ['grass'])).toBe(2);
      expect(getTypeEffectiveness('water', ['fire'])).toBe(2);
      expect(getTypeEffectiveness('grass', ['water'])).toBe(2);
      expect(getTypeEffectiveness('electric', ['water'])).toBe(2);
    });

    it('should return 0.5 for not very effective attacks', () => {
      expect(getTypeEffectiveness('fire', ['water'])).toBe(0.5);
      expect(getTypeEffectiveness('water', ['grass'])).toBe(0.5);
      expect(getTypeEffectiveness('grass', ['fire'])).toBe(0.5);
    });

    it('should return 0 for immune attacks', () => {
      expect(getTypeEffectiveness('normal', ['ghost'])).toBe(0);
      expect(getTypeEffectiveness('electric', ['ground'])).toBe(0);
      expect(getTypeEffectiveness('ground', ['flying'])).toBe(0);
      expect(getTypeEffectiveness('ghost', ['normal'])).toBe(0);
      expect(getTypeEffectiveness('psychic', ['dark'])).toBe(0);
    });

    it('should return 1 for neutral attacks', () => {
      expect(getTypeEffectiveness('normal', ['normal'])).toBe(1);
      expect(getTypeEffectiveness('fire', ['normal'])).toBe(1);
      expect(getTypeEffectiveness('water', ['normal'])).toBe(1);
    });

    it('should multiply effectiveness for dual types', () => {
      // Fire vs Grass/Bug = 2 * 2 = 4
      expect(getTypeEffectiveness('fire', ['grass', 'bug'])).toBe(4);

      // Water vs Fire/Rock = 2 * 2 = 4
      expect(getTypeEffectiveness('water', ['fire', 'rock'])).toBe(4);

      // Fire vs Water/Rock = 0.5 * 0.5 = 0.25
      expect(getTypeEffectiveness('fire', ['water', 'rock'])).toBe(0.25);

      // Electric vs Water/Flying = 2 * 2 = 4
      expect(getTypeEffectiveness('electric', ['water', 'flying'])).toBe(4);
    });

    it('should handle immune dual types correctly', () => {
      // Ground vs Water/Flying = 2 * 0 = 0
      expect(getTypeEffectiveness('ground', ['water', 'flying'])).toBe(0);
    });
  });

  describe('typeChart completeness', () => {
    const allTypes = [
      'normal', 'fire', 'water', 'grass', 'electric', 'ice',
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];

    it('should have entries for all types', () => {
      for (const type of allTypes) {
        expect(typeChart[type as keyof typeof typeChart]).toBeDefined();
      }
    });
  });
});
