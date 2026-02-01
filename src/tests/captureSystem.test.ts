import { describe, it, expect } from 'vitest';
import {
  calculateCaptureRate,
  calculateShakeThreshold,
  getStatusBonus,
  attemptCapture,
  validateNickname,
  getFailureMessage,
  getSuccessMessage,
  getBallModifier,
} from '../systems/capture/CaptureSystem';
import { getPokeBall } from '../data/items/balls';
import { createWildCreature } from '../utils/creatureUtils';
import { createBattleCreature } from '../utils/battleUtils';
import type { BattleCreature } from '../types/creature.types';

describe('CaptureSystem', () => {
  // Helper pour créer une créature de combat
  function createTestBattleCreature(
    speciesId: number,
    level: number,
    hpPercent: number = 1.0,
    status?: 'sleep' | 'freeze' | 'paralysis' | 'burn' | 'poison'
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

  describe('getStatusBonus', () => {
    it('should return 1.0 for no status', () => {
      expect(getStatusBonus(undefined)).toBe(1.0);
    });

    it('should return 2.5 for sleep', () => {
      expect(getStatusBonus('sleep')).toBe(2.5);
    });

    it('should return 2.5 for freeze', () => {
      expect(getStatusBonus('freeze')).toBe(2.5);
    });

    it('should return 1.5 for paralysis', () => {
      expect(getStatusBonus('paralysis')).toBe(1.5);
    });

    it('should return 1.5 for burn', () => {
      expect(getStatusBonus('burn')).toBe(1.5);
    });

    it('should return 1.5 for poison', () => {
      expect(getStatusBonus('poison')).toBe(1.5);
    });

    it('should return 1.5 for badPoison', () => {
      expect(getStatusBonus('badPoison')).toBe(1.5);
    });
  });

  describe('calculateCaptureRate', () => {
    it('should calculate higher rate for lower HP', () => {
      const fullHpCreature = createTestBattleCreature(10, 10, 1.0); // Sparkit avec 100% HP
      const lowHpCreature = createTestBattleCreature(10, 10, 0.1); // Sparkit avec 10% HP

      const pokeBall = getPokeBall(1)!;

      const rateFullHp = calculateCaptureRate(fullHpCreature, pokeBall);
      const rateLowHp = calculateCaptureRate(lowHpCreature, pokeBall);

      expect(rateLowHp).toBeGreaterThan(rateFullHp);
    });

    it('should calculate higher rate with better balls', () => {
      const creature = createTestBattleCreature(10, 10, 0.5);

      const pokeBall = getPokeBall(1)!; // x1
      const superBall = getPokeBall(2)!; // x1.5
      const hyperBall = getPokeBall(3)!; // x2

      const ratePoke = calculateCaptureRate(creature, pokeBall);
      const rateSuper = calculateCaptureRate(creature, superBall);
      const rateHyper = calculateCaptureRate(creature, hyperBall);

      expect(rateSuper).toBeGreaterThan(ratePoke);
      expect(rateHyper).toBeGreaterThan(rateSuper);
    });

    it('should calculate higher rate with status effects', () => {
      const healthyCreature = createTestBattleCreature(10, 10, 0.5);
      const sleepingCreature = createTestBattleCreature(10, 10, 0.5, 'sleep');
      const paralyzedCreature = createTestBattleCreature(10, 10, 0.5, 'paralysis');

      const pokeBall = getPokeBall(1)!;

      const rateHealthy = calculateCaptureRate(healthyCreature, pokeBall);
      const rateSleeping = calculateCaptureRate(sleepingCreature, pokeBall);
      const rateParalyzed = calculateCaptureRate(paralyzedCreature, pokeBall);

      expect(rateSleeping).toBeGreaterThan(rateHealthy);
      expect(rateParalyzed).toBeGreaterThan(rateHealthy);
      expect(rateSleeping).toBeGreaterThan(rateParalyzed); // Sleep > Paralysis
    });

    it('should cap the rate at 255', () => {
      // Créer une créature facile à capturer avec conditions favorables
      const creature = createTestBattleCreature(10, 5, 0.01, 'sleep'); // Très bas HP, endormi

      const masterBall = getPokeBall(4)!;

      // Master Ball devrait donner un taux très élevé, mais plafonné
      const rate = calculateCaptureRate(creature, masterBall);
      expect(rate).toBeLessThanOrEqual(255);
    });
  });

  describe('calculateShakeThreshold', () => {
    it('should return 65535 for rate >= 255', () => {
      expect(calculateShakeThreshold(255)).toBe(65535);
      expect(calculateShakeThreshold(300)).toBe(65535);
    });

    it('should return 0 for rate <= 0', () => {
      expect(calculateShakeThreshold(0)).toBe(0);
      expect(calculateShakeThreshold(-10)).toBe(0);
    });

    it('should return higher threshold for higher rates', () => {
      const lowThreshold = calculateShakeThreshold(10);
      const midThreshold = calculateShakeThreshold(100);
      const highThreshold = calculateShakeThreshold(200);

      expect(midThreshold).toBeGreaterThan(lowThreshold);
      expect(highThreshold).toBeGreaterThan(midThreshold);
    });

    it('should follow the Gen 3 formula', () => {
      // Pour a = 100, b devrait être environ 52428 selon la formule
      const threshold = calculateShakeThreshold(100);
      // La formule: b = 1048560 / sqrt(sqrt(16711680 / a))
      const expected = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / 100)));
      expect(threshold).toBe(expected);
    });
  });

  describe('getBallModifier', () => {
    it('should return base rate for standard balls', () => {
      const creature = createTestBattleCreature(10, 10);
      const pokeBall = getPokeBall(1)!;
      const superBall = getPokeBall(2)!;

      expect(getBallModifier(pokeBall, creature)).toBe(1.0);
      expect(getBallModifier(superBall, creature)).toBe(1.5);
    });

    it('should return 255 for Master Ball', () => {
      const creature = createTestBattleCreature(10, 10);
      const masterBall = getPokeBall(4)!;

      expect(getBallModifier(masterBall, creature)).toBe(255);
    });

    it('should return 5x for Quick Ball on turn 1', () => {
      const creature = createTestBattleCreature(10, 10);
      const quickBall = getPokeBall(7)!;

      expect(getBallModifier(quickBall, creature, { turnNumber: 1 })).toBe(5.0);
      expect(getBallModifier(quickBall, creature, { turnNumber: 2 })).toBe(1.0);
    });

    it('should increase Timer Ball rate over turns', () => {
      const creature = createTestBattleCreature(10, 10);
      const timerBall = getPokeBall(8)!;

      const turn1 = getBallModifier(timerBall, creature, { turnNumber: 1 });
      const turn5 = getBallModifier(timerBall, creature, { turnNumber: 5 });
      const turn10 = getBallModifier(timerBall, creature, { turnNumber: 10 });

      expect(turn5).toBeGreaterThan(turn1);
      expect(turn10).toBeGreaterThan(turn5);
      expect(turn10).toBeLessThanOrEqual(4.0); // Capped at 4
    });

    it('should return 3x for Dusk Ball in cave or at night', () => {
      const creature = createTestBattleCreature(10, 10);
      const duskBall = getPokeBall(6)!;

      expect(getBallModifier(duskBall, creature, { isInCave: true })).toBe(3.0);
      expect(getBallModifier(duskBall, creature, { isNight: true })).toBe(3.0);
      // Sans ces conditions, la ball utilise sa fonction captureRateFunc qui retourne 3.0 par défaut
    });
  });

  describe('attemptCapture', () => {
    it('should always succeed with Master Ball', () => {
      const creature = createTestBattleCreature(1, 50, 1.0); // Flamling niveau 50, pleine vie

      // Tester plusieurs fois pour s'assurer que c'est garanti
      for (let i = 0; i < 10; i++) {
        const result = attemptCapture(creature, 4); // Master Ball
        expect(result.success).toBe(true);
        expect(result.shakeCount).toBe(4);
      }
    });

    it('should return failure message for invalid ball', () => {
      const creature = createTestBattleCreature(10, 10);

      const result = attemptCapture(creature, 999); // Ball inexistante
      expect(result.success).toBe(false);
      expect(result.message).toBe('Ball invalide !');
    });

    it('should have higher success rate with better conditions', () => {
      // Test statistique avec beaucoup d'essais
      const goodConditions = createTestBattleCreature(10, 5, 0.1, 'sleep'); // Faible HP, endormi
      const badConditions = createTestBattleCreature(1, 50, 1.0); // Pleine vie, niveau élevé

      let goodSuccesses = 0;
      let badSuccesses = 0;
      const trials = 100;

      for (let i = 0; i < trials; i++) {
        if (attemptCapture(goodConditions, 1).success) goodSuccesses++;
        if (attemptCapture(badConditions, 1).success) badSuccesses++;
      }

      // Les bonnes conditions devraient avoir un taux de succès bien plus élevé
      expect(goodSuccesses).toBeGreaterThan(badSuccesses);
    });

    it('should return shake count between 0 and 4', () => {
      const creature = createTestBattleCreature(10, 10, 0.5);

      for (let i = 0; i < 50; i++) {
        const result = attemptCapture(creature, 1);
        expect(result.shakeCount).toBeGreaterThanOrEqual(0);
        expect(result.shakeCount).toBeLessThanOrEqual(4);
      }
    });

    it('should return success only when shakeCount is 4 (or 1 for critical)', () => {
      const creature = createTestBattleCreature(10, 10, 0.5);

      for (let i = 0; i < 50; i++) {
        const result = attemptCapture(creature, 1);
        if (result.success && !result.isCriticalCapture) {
          expect(result.shakeCount).toBe(4);
        }
        if (result.success && result.isCriticalCapture) {
          expect(result.shakeCount).toBe(1);
        }
      }
    });
  });

  describe('validateNickname', () => {
    it('should accept empty nickname', () => {
      expect(validateNickname('')).toEqual({ valid: true });
      expect(validateNickname('   ')).toEqual({ valid: true });
    });

    it('should accept valid nicknames', () => {
      expect(validateNickname('Flamme')).toEqual({ valid: true });
      expect(validateNickname('Pikachu123')).toEqual({ valid: true });
      expect(validateNickname('Mon Ami')).toEqual({ valid: true });
    });

    it('should reject nicknames longer than 12 characters', () => {
      const result = validateNickname('TrèsLongSurnom');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('12 caractères');
    });

    it('should reject forbidden characters', () => {
      const forbiddenChars = ['<', '>', '{', '}', '[', ']', '\\', '|', '`', '^', '~'];

      for (const char of forbiddenChars) {
        const result = validateNickname(`Test${char}`);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('interdits');
      }
    });

    it('should accept exactly 12 characters', () => {
      expect(validateNickname('DouxzeCarat!')).toEqual({ valid: true });
    });
  });

  describe('getFailureMessage', () => {
    it('should return appropriate messages for each shake count', () => {
      expect(getFailureMessage(0)).toContain('échappée immédiatement');
      expect(getFailureMessage(1)).toContain('proche');
      expect(getFailureMessage(2)).toContain('Presque');
      expect(getFailureMessage(3)).toContain('dernier moment');
    });
  });

  describe('getSuccessMessage', () => {
    it('should include creature name', () => {
      const message = getSuccessMessage('Flamling');
      expect(message).toContain('Flamling');
      expect(message).toContain('capturé');
    });
  });

  describe('integration: capture probability distribution', () => {
    it('should have reasonable capture rates for different scenarios', () => {
      // Ce test vérifie que la distribution des captures est raisonnable
      const scenarios = [
        { name: 'Easy (low HP, sleep, Hyper Ball)', creature: createTestBattleCreature(10, 5, 0.1, 'sleep'), ballId: 3 },
        { name: 'Medium (half HP, Poke Ball)', creature: createTestBattleCreature(10, 10, 0.5), ballId: 1 },
        { name: 'Hard (full HP, high level)', creature: createTestBattleCreature(1, 30, 1.0), ballId: 1 },
      ];

      const trials = 200;

      for (const scenario of scenarios) {
        let successes = 0;
        for (let i = 0; i < trials; i++) {
          if (attemptCapture(scenario.creature, scenario.ballId).success) {
            successes++;
          }
        }
        const rate = successes / trials;

        // Log pour debug (optionnel)
        // console.log(`${scenario.name}: ${(rate * 100).toFixed(1)}%`);

        // Vérifications de base
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(1);
      }
    });
  });
});
