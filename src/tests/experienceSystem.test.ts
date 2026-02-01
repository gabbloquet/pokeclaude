import { describe, it, expect } from 'vitest';
import {
  getExpForLevel,
  getLevelFromExp,
  calculateExpGain,
  addExperience,
  learnMove,
  checkCanEvolve,
  getExpToNextLevel,
  getExpProgress,
} from '../systems/progression/ExperienceSystem';
import {
  checkEvolution,
  evolveCreature,
  getEvolutionChain,
  canSpeciesEvolve,
} from '../systems/progression/EvolutionSystem';
import type { CreatureInstance } from '../types/creature.types';

// Helper pour creer une creature de test
function createTestCreature(
  speciesId: number = 1,
  level: number = 5,
  moves: number[] = [1, 5]
): CreatureInstance {
  return {
    id: 'test-creature-' + Math.random().toString(36).substring(7),
    speciesId,
    level,
    currentHp: 50,
    exp: getExpForLevel(level),
    ivs: {
      hp: 15,
      attack: 15,
      defense: 15,
      specialAttack: 15,
      specialDefense: 15,
      speed: 15,
    },
    evs: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    },
    moves,
    isShiny: false,
    caughtAt: Date.now(),
  };
}

describe('ExperienceSystem', () => {
  describe('getExpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(getExpForLevel(1)).toBe(0);
    });

    it('should return 0 for level 0 or negative', () => {
      expect(getExpForLevel(0)).toBe(0);
      expect(getExpForLevel(-1)).toBe(0);
    });

    it('should calculate mediumFast exp correctly (n^3)', () => {
      expect(getExpForLevel(10, 'mediumFast')).toBe(1000); // 10^3
      expect(getExpForLevel(50, 'mediumFast')).toBe(125000); // 50^3
      expect(getExpForLevel(100, 'mediumFast')).toBe(1000000); // 100^3
    });

    it('should calculate fast exp correctly (0.8 * n^3)', () => {
      expect(getExpForLevel(10, 'fast')).toBe(800); // 0.8 * 1000
      expect(getExpForLevel(100, 'fast')).toBe(800000); // 0.8 * 1000000
    });

    it('should calculate slow exp correctly (1.25 * n^3)', () => {
      expect(getExpForLevel(10, 'slow')).toBe(1250); // 1.25 * 1000
      expect(getExpForLevel(100, 'slow')).toBe(1250000); // 1.25 * 1000000
    });

    it('should calculate mediumSlow exp correctly', () => {
      // 1.2 * n^3 - 15 * n^2 + 100 * n - 140
      // Pour n=10: 1.2*1000 - 15*100 + 100*10 - 140 = 1200 - 1500 + 1000 - 140 = 560
      expect(getExpForLevel(10, 'mediumSlow')).toBe(560);
    });
  });

  describe('getLevelFromExp', () => {
    it('should return level 1 for 0 exp', () => {
      expect(getLevelFromExp(0)).toBe(1);
    });

    it('should be inverse of getExpForLevel for mediumFast', () => {
      for (let level = 1; level <= 100; level++) {
        const exp = getExpForLevel(level, 'mediumFast');
        expect(getLevelFromExp(exp, 'mediumFast')).toBe(level);
      }
    });

    it('should be inverse of getExpForLevel for fast', () => {
      for (let level = 1; level <= 100; level++) {
        const exp = getExpForLevel(level, 'fast');
        expect(getLevelFromExp(exp, 'fast')).toBe(level);
      }
    });

    it('should handle exp between levels correctly', () => {
      // 999 exp should be level 9 (not 10, since 10^3 = 1000)
      expect(getLevelFromExp(999, 'mediumFast')).toBe(9);
      expect(getLevelFromExp(1000, 'mediumFast')).toBe(10);
      expect(getLevelFromExp(1001, 'mediumFast')).toBe(10);
    });

    it('should cap at level 100', () => {
      expect(getLevelFromExp(2000000, 'mediumFast')).toBe(100);
    });
  });

  describe('calculateExpGain', () => {
    it('should return positive exp for defeating a creature', () => {
      const winner = createTestCreature(1, 10);
      const loser = createTestCreature(4, 8);

      const exp = calculateExpGain(winner, loser, true);
      expect(exp).toBeGreaterThan(0);
    });

    it('should give more exp for trainer battles', () => {
      const winner = createTestCreature(1, 10);
      const loser = createTestCreature(4, 8);

      const wildExp = calculateExpGain(winner, loser, true);
      const trainerExp = calculateExpGain(winner, loser, false);

      expect(trainerExp).toBeGreaterThan(wildExp);
    });

    it('should give more exp for higher level enemies', () => {
      const winner = createTestCreature(1, 10);
      const loserLow = createTestCreature(4, 5);
      const loserHigh = createTestCreature(4, 15);

      const expLow = calculateExpGain(winner, loserLow, true);
      const expHigh = calculateExpGain(winner, loserHigh, true);

      expect(expHigh).toBeGreaterThan(expLow);
    });

    it('should return at least 1 exp', () => {
      const winner = createTestCreature(1, 100);
      const loser = createTestCreature(4, 1);

      const exp = calculateExpGain(winner, loser, true);
      expect(exp).toBeGreaterThanOrEqual(1);
    });
  });

  describe('addExperience', () => {
    it('should increase creature exp', () => {
      const creature = createTestCreature(1, 5);
      const initialExp = creature.exp;

      addExperience(creature, 100);

      expect(creature.exp).toBe(initialExp + 100);
    });

    it('should level up creature when enough exp', () => {
      const creature = createTestCreature(1, 5);
      creature.exp = getExpForLevel(5);

      // Donner assez d'exp pour atteindre niveau 6
      const expNeeded = getExpForLevel(6) - creature.exp;
      const result = addExperience(creature, expNeeded + 10);

      expect(creature.level).toBe(6);
      expect(result.levelUps.length).toBe(1);
      expect(result.levelUps[0].newLevel).toBe(6);
    });

    it('should handle multiple level ups', () => {
      const creature = createTestCreature(1, 5);
      creature.exp = getExpForLevel(5);

      // Donner beaucoup d'exp pour plusieurs niveaux
      const expFor10 = getExpForLevel(10);
      const result = addExperience(creature, expFor10);

      expect(creature.level).toBeGreaterThanOrEqual(10);
      expect(result.levelUps.length).toBe(creature.level - 5);
    });

    it('should cap at level 100', () => {
      const creature = createTestCreature(1, 99);
      creature.exp = getExpForLevel(99);

      addExperience(creature, 9999999);

      expect(creature.level).toBe(100);
      expect(creature.exp).toBe(getExpForLevel(100));
    });

    it('should detect new moves at level up', () => {
      // Flamling apprend Growl au niveau 7
      const creature = createTestCreature(1, 6);
      creature.exp = getExpForLevel(6);

      const expNeeded = getExpForLevel(7) - creature.exp;
      const result = addExperience(creature, expNeeded + 10);

      const levelUp7 = result.levelUps.find((l) => l.newLevel === 7);
      expect(levelUp7).toBeDefined();
      expect(levelUp7?.newMoves.length).toBeGreaterThan(0);
      expect(levelUp7?.newMoves[0].id).toBe(2); // Growl
    });

    it('should detect evolution possibility', () => {
      // Flamling evolue au niveau 16
      const creature = createTestCreature(1, 15);
      creature.exp = getExpForLevel(15);

      const expNeeded = getExpForLevel(16) - creature.exp;
      const result = addExperience(creature, expNeeded + 10);

      const levelUp16 = result.levelUps.find((l) => l.newLevel === 16);
      expect(levelUp16).toBeDefined();
      expect(levelUp16?.canEvolve).toBe(true);
    });
  });

  describe('learnMove', () => {
    it('should learn move if less than 4 moves', () => {
      const creature = createTestCreature(1, 10, [1, 5]);

      const result = learnMove(creature, 6);

      expect(result).toBe(true);
      expect(creature.moves).toContain(6);
      expect(creature.moves.length).toBe(3);
    });

    it('should not learn move if already known', () => {
      const creature = createTestCreature(1, 10, [1, 5, 6]);

      const result = learnMove(creature, 5);

      expect(result).toBe(false);
      expect(creature.moves.length).toBe(3);
    });

    it('should not learn move if 4 moves and no slot specified', () => {
      const creature = createTestCreature(1, 10, [1, 5, 6, 7]);

      const result = learnMove(creature, 8);

      expect(result).toBe(false);
      expect(creature.moves).not.toContain(8);
    });

    it('should replace move at specified slot', () => {
      const creature = createTestCreature(1, 10, [1, 5, 6, 7]);

      const result = learnMove(creature, 8, 1);

      expect(result).toBe(true);
      expect(creature.moves[1]).toBe(8);
      expect(creature.moves).not.toContain(5);
    });
  });

  describe('checkCanEvolve', () => {
    it('should return false for creature below evolution level', () => {
      const creature = createTestCreature(1, 10); // Flamling evolue niveau 16

      expect(checkCanEvolve(creature)).toBe(false);
    });

    it('should return true for creature at evolution level', () => {
      const creature = createTestCreature(1, 16);

      expect(checkCanEvolve(creature)).toBe(true);
    });

    it('should return true for creature above evolution level', () => {
      const creature = createTestCreature(1, 20);

      expect(checkCanEvolve(creature)).toBe(true);
    });

    it('should return false for final evolution', () => {
      const creature = createTestCreature(3, 50); // Flamaster, pas d'evolution

      expect(checkCanEvolve(creature)).toBe(false);
    });
  });

  describe('getExpToNextLevel', () => {
    it('should return correct exp to next level', () => {
      const creature = createTestCreature(1, 5);
      creature.exp = getExpForLevel(5);

      const expNeeded = getExpToNextLevel(creature);
      const expectedExp = getExpForLevel(6) - getExpForLevel(5);

      expect(expNeeded).toBe(expectedExp);
    });

    it('should return 0 at level 100', () => {
      const creature = createTestCreature(1, 100);

      expect(getExpToNextLevel(creature)).toBe(0);
    });
  });

  describe('getExpProgress', () => {
    it('should return 0 at start of level', () => {
      const creature = createTestCreature(1, 5);
      creature.exp = getExpForLevel(5);

      expect(getExpProgress(creature)).toBe(0);
    });

    it('should return ~50 at halfway through level', () => {
      const creature = createTestCreature(1, 5);
      const lvl5Exp = getExpForLevel(5);
      const lvl6Exp = getExpForLevel(6);
      creature.exp = lvl5Exp + Math.floor((lvl6Exp - lvl5Exp) / 2);

      const progress = getExpProgress(creature);
      expect(progress).toBeGreaterThanOrEqual(49);
      expect(progress).toBeLessThanOrEqual(51);
    });

    it('should return 100 at level 100', () => {
      const creature = createTestCreature(1, 100);

      expect(getExpProgress(creature)).toBe(100);
    });
  });
});

describe('EvolutionSystem', () => {
  describe('checkEvolution', () => {
    it('should return null if creature cannot evolve yet', () => {
      const creature = createTestCreature(1, 10);

      expect(checkEvolution(creature)).toBeNull();
    });

    it('should return new species ID when ready to evolve', () => {
      const creature = createTestCreature(1, 16);

      expect(checkEvolution(creature)).toBe(2); // Flamero
    });

    it('should return null for final evolution', () => {
      const creature = createTestCreature(3, 50);

      expect(checkEvolution(creature)).toBeNull();
    });
  });

  describe('evolveCreature', () => {
    it('should change species ID', () => {
      const creature = createTestCreature(1, 16);

      const evolved = evolveCreature(creature, 2);

      expect(evolved.speciesId).toBe(2);
    });

    it('should preserve level and exp', () => {
      const creature = createTestCreature(1, 16);
      creature.exp = 5000;

      const evolved = evolveCreature(creature, 2);

      expect(evolved.level).toBe(16);
      expect(evolved.exp).toBe(5000);
    });

    it('should preserve moves', () => {
      const creature = createTestCreature(1, 16, [1, 5, 6, 7]);

      const evolved = evolveCreature(creature, 2);

      expect(evolved.moves).toEqual([1, 5, 6, 7]);
    });

    it('should preserve IVs', () => {
      const creature = createTestCreature(1, 16);

      const evolved = evolveCreature(creature, 2);

      expect(evolved.ivs).toEqual(creature.ivs);
    });

    it('should adjust HP proportionally', () => {
      const creature = createTestCreature(1, 16);
      creature.currentHp = 30; // Partial HP

      const evolved = evolveCreature(creature, 2);

      // HP should be adjusted but not 0
      expect(evolved.currentHp).toBeGreaterThan(0);
    });
  });

  describe('getEvolutionChain', () => {
    it('should return full evolution chain', () => {
      const chain = getEvolutionChain(1);

      expect(chain).toContain(1); // Flamling
      expect(chain).toContain(2); // Flamero
      expect(chain).toContain(3); // Flamaster
    });

    it('should work from middle of chain', () => {
      const chain = getEvolutionChain(2);

      expect(chain).toContain(2); // Flamero
      expect(chain).toContain(3); // Flamaster
    });

    it('should return single element for final evolution', () => {
      const chain = getEvolutionChain(3);

      expect(chain.length).toBe(1);
      expect(chain[0]).toBe(3);
    });
  });

  describe('canSpeciesEvolve', () => {
    it('should return true for species with evolution', () => {
      expect(canSpeciesEvolve(1)).toBe(true); // Flamling
      expect(canSpeciesEvolve(2)).toBe(true); // Flamero
    });

    it('should return false for final evolution', () => {
      expect(canSpeciesEvolve(3)).toBe(false); // Flamaster
      expect(canSpeciesEvolve(6)).toBe(false); // Aquaster
    });
  });
});
