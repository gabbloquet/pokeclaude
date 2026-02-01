import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyStatus,
  cureStatus,
  canActThisTurn,
  applyEndOfTurnStatusDamage,
  initStatusState,
  getStatusState,
  clearStatusState,
  canReceiveStatus,
  getBurnAttackModifier,
  getParalysisSpeedModifier,
} from '../systems/battle/StatusSystem';
import { createBattleCreature } from '../utils/battleUtils';
import { createWildCreature } from '../utils/creatureUtils';
import type { BattleCreature } from '../types/creature.types';

describe('StatusSystem', () => {
  let fireCreature: BattleCreature;
  let waterCreature: BattleCreature;
  let electricCreature: BattleCreature;

  beforeEach(() => {
    // Créer des créatures de test
    // ID 1 = Flamling (Feu), ID 4 = Aqualing (Eau), ID 10 = Sparkit (Électrik)
    fireCreature = createBattleCreature(createWildCreature(1, 20));
    waterCreature = createBattleCreature(createWildCreature(4, 20));
    electricCreature = createBattleCreature(createWildCreature(10, 20));

    // Initialiser les états de statut
    initStatusState(fireCreature.instance.id);
    initStatusState(waterCreature.instance.id);
    initStatusState(electricCreature.instance.id);
  });

  describe('applyStatus', () => {
    it('should apply a status to a creature without status', () => {
      const result = applyStatus(waterCreature, 'burn');

      expect(result.success).toBe(true);
      expect(waterCreature.status).toBe('burn');
      expect(result.message).toContain('brûlé');
    });

    it('should not apply a status to a creature that already has one', () => {
      applyStatus(waterCreature, 'burn');
      const result = applyStatus(waterCreature, 'poison');

      expect(result.success).toBe(false);
      expect(waterCreature.status).toBe('burn');
      expect(result.message).toContain('déjà un statut');
    });

    it('should initialize sleep counter for sleep status', () => {
      const result = applyStatus(waterCreature, 'sleep');

      expect(result.success).toBe(true);
      expect(waterCreature.status).toBe('sleep');

      const state = getStatusState(waterCreature.instance.id);
      expect(state.sleepTurns).toBeGreaterThanOrEqual(1);
      expect(state.sleepTurns).toBeLessThanOrEqual(3);
    });

    it('should initialize badPoison counter', () => {
      const result = applyStatus(waterCreature, 'badPoison');

      expect(result.success).toBe(true);
      expect(waterCreature.status).toBe('badPoison');

      const state = getStatusState(waterCreature.instance.id);
      expect(state.badPoisonCounter).toBe(1);
    });
  });

  describe('cureStatus', () => {
    it('should cure an existing status', () => {
      applyStatus(waterCreature, 'burn');
      const result = cureStatus(waterCreature);

      expect(result.success).toBe(true);
      expect(waterCreature.status).toBeUndefined();
    });

    it('should fail if creature has no status', () => {
      const result = cureStatus(waterCreature);

      expect(result.success).toBe(false);
      expect(result.message).toContain('pas de statut');
    });
  });

  describe('canActThisTurn', () => {
    it('should allow action if no status', () => {
      const result = canActThisTurn(waterCreature);

      expect(result.canAct).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should prevent action when asleep', () => {
      applyStatus(waterCreature, 'sleep');
      // Force le compteur de sommeil à 2 pour garantir qu'il reste endormi
      const state = getStatusState(waterCreature.instance.id);
      state.sleepTurns = 2;

      const result = canActThisTurn(waterCreature);

      expect(result.canAct).toBe(false);
      expect(result.message).toContain('dort');
    });

    it('should wake up when sleep counter reaches 0', () => {
      applyStatus(waterCreature, 'sleep');
      const state = getStatusState(waterCreature.instance.id);
      state.sleepTurns = 1; // Dernier tour de sommeil

      const result = canActThisTurn(waterCreature);

      expect(result.canAct).toBe(true);
      expect(result.message).toContain('réveille');
      expect(waterCreature.status).toBeUndefined();
    });

    it('should prevent action when frozen', () => {
      applyStatus(waterCreature, 'freeze');

      // On teste plusieurs fois car le dégel est aléatoire (20%)
      let frozenCount = 0;
      for (let i = 0; i < 100; i++) {
        // Réinitialiser le statut
        waterCreature.status = 'freeze';
        const result = canActThisTurn(waterCreature);
        if (!result.canAct) frozenCount++;
      }

      // La plupart du temps devrait rester gelé (environ 80%)
      expect(frozenCount).toBeGreaterThan(60);
    });

    it('should sometimes thaw from freeze', () => {
      let thawedCount = 0;
      for (let i = 0; i < 100; i++) {
        waterCreature.status = 'freeze';
        initStatusState(waterCreature.instance.id);
        const result = canActThisTurn(waterCreature);
        if (result.canAct && result.message?.includes('dégèle')) {
          thawedCount++;
        }
      }

      // Devrait dégeler environ 20% du temps
      expect(thawedCount).toBeGreaterThan(5);
      expect(thawedCount).toBeLessThan(40);
    });

    it('should sometimes prevent action with paralysis', () => {
      applyStatus(waterCreature, 'paralysis');

      let paralyzedCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = canActThisTurn(waterCreature);
        if (!result.canAct) paralyzedCount++;
      }

      // Devrait être paralysé environ 25% du temps
      expect(paralyzedCount).toBeGreaterThan(10);
      expect(paralyzedCount).toBeLessThan(45);
    });

    it('should allow action with burn/poison (they just deal damage)', () => {
      applyStatus(waterCreature, 'burn');
      expect(canActThisTurn(waterCreature).canAct).toBe(true);

      cureStatus(waterCreature);
      applyStatus(waterCreature, 'poison');
      expect(canActThisTurn(waterCreature).canAct).toBe(true);
    });
  });

  describe('applyEndOfTurnStatusDamage', () => {
    it('should deal 1/16 max HP for burn', () => {
      const maxHp = waterCreature.currentHp;
      const expectedDamage = Math.max(1, Math.floor(maxHp / 16));

      applyStatus(waterCreature, 'burn');
      const result = applyEndOfTurnStatusDamage(waterCreature);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(expectedDamage);
      expect(waterCreature.currentHp).toBe(maxHp - expectedDamage);
      expect(result!.message).toContain('brûlure');
    });

    it('should deal 1/8 max HP for poison', () => {
      const maxHp = waterCreature.currentHp;
      const expectedDamage = Math.max(1, Math.floor(maxHp / 8));

      applyStatus(waterCreature, 'poison');
      const result = applyEndOfTurnStatusDamage(waterCreature);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(expectedDamage);
      expect(waterCreature.currentHp).toBe(maxHp - expectedDamage);
      expect(result!.message).toContain('poison');
    });

    it('should deal increasing damage for badPoison', () => {
      const maxHp = waterCreature.currentHp;
      applyStatus(waterCreature, 'badPoison');

      // Premier tour : 1/16
      const result1 = applyEndOfTurnStatusDamage(waterCreature);
      const expectedDamage1 = Math.max(1, Math.floor(maxHp / 16));
      expect(result1!.damage).toBe(expectedDamage1);

      // Deuxième tour : 2/16
      const result2 = applyEndOfTurnStatusDamage(waterCreature);
      const expectedDamage2 = Math.max(1, Math.floor((maxHp * 2) / 16));
      expect(result2!.damage).toBe(expectedDamage2);

      // Troisième tour : 3/16
      const result3 = applyEndOfTurnStatusDamage(waterCreature);
      const expectedDamage3 = Math.max(1, Math.floor((maxHp * 3) / 16));
      expect(result3!.damage).toBe(expectedDamage3);
    });

    it('should return null for status that do not deal damage', () => {
      applyStatus(waterCreature, 'paralysis');
      expect(applyEndOfTurnStatusDamage(waterCreature)).toBeNull();

      cureStatus(waterCreature);
      applyStatus(waterCreature, 'sleep');
      expect(applyEndOfTurnStatusDamage(waterCreature)).toBeNull();

      cureStatus(waterCreature);
      applyStatus(waterCreature, 'freeze');
      expect(applyEndOfTurnStatusDamage(waterCreature)).toBeNull();
    });

    it('should return null if no status', () => {
      expect(applyEndOfTurnStatusDamage(waterCreature)).toBeNull();
    });

    it('should not reduce HP below 0', () => {
      applyStatus(waterCreature, 'burn');
      waterCreature.currentHp = 1;

      applyEndOfTurnStatusDamage(waterCreature);

      expect(waterCreature.currentHp).toBe(0);
    });
  });

  describe('canReceiveStatus (type immunities)', () => {
    it('should make Fire types immune to burn', () => {
      expect(canReceiveStatus(fireCreature, 'burn')).toBe(false);
      expect(canReceiveStatus(waterCreature, 'burn')).toBe(true);
    });

    it('should make Electric types immune to paralysis', () => {
      expect(canReceiveStatus(electricCreature, 'paralysis')).toBe(false);
      expect(canReceiveStatus(waterCreature, 'paralysis')).toBe(true);
    });

    it('should allow sleep on any type', () => {
      expect(canReceiveStatus(fireCreature, 'sleep')).toBe(true);
      expect(canReceiveStatus(waterCreature, 'sleep')).toBe(true);
      expect(canReceiveStatus(electricCreature, 'sleep')).toBe(true);
    });
  });

  describe('Status modifiers', () => {
    it('getBurnAttackModifier should return 0.5 when burned', () => {
      expect(getBurnAttackModifier(waterCreature)).toBe(1);

      applyStatus(waterCreature, 'burn');
      expect(getBurnAttackModifier(waterCreature)).toBe(0.5);
    });

    it('getParalysisSpeedModifier should return 0.5 when paralyzed', () => {
      expect(getParalysisSpeedModifier(waterCreature)).toBe(1);

      applyStatus(waterCreature, 'paralysis');
      expect(getParalysisSpeedModifier(waterCreature)).toBe(0.5);
    });
  });

  describe('clearStatusState', () => {
    it('should clean up status state when battle ends', () => {
      applyStatus(waterCreature, 'badPoison');
      const state = getStatusState(waterCreature.instance.id);
      state.badPoisonCounter = 5;

      clearStatusState(waterCreature.instance.id);

      // Après clear, getStatusState retourne un nouvel état initialisé
      const newState = getStatusState(waterCreature.instance.id);
      expect(newState.badPoisonCounter).toBe(0);
    });
  });
});
