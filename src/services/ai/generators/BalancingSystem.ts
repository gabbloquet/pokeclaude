/**
 * Système d'équilibrage pour les créatures générées
 */

import type { BaseStats } from '@/types/creature.types';

export type CreatureTier = 'starter_base' | 'common' | 'uncommon' | 'rare' | 'legendary';

export interface BSTRange {
  min: number;
  max: number;
}

export interface BalanceResult {
  isValid: boolean;
  bst: number;
  adjustedStats?: BaseStats;
  warnings: string[];
}

/**
 * Système d'équilibrage des stats de créatures
 */
export class BalancingSystem {
  /**
   * Plages de BST (Base Stat Total) par tier
   */
  static readonly BST_RANGES: Record<CreatureTier, BSTRange> = {
    starter_base: { min: 300, max: 330 },
    common: { min: 250, max: 350 },
    uncommon: { min: 350, max: 450 },
    rare: { min: 450, max: 520 },
    legendary: { min: 570, max: 680 },
  };

  /**
   * Limites des stats individuelles
   */
  static readonly STAT_LIMITS = {
    min: 20,
    max: 130,
    maxForBase: 100, // Pour les formes de base
    maxForFinal: 140, // Pour les formes finales
  };

  /**
   * Calcule le BST (Base Stat Total)
   */
  static calculateBST(stats: BaseStats): number {
    return (
      stats.hp +
      stats.attack +
      stats.defense +
      stats.specialAttack +
      stats.specialDefense +
      stats.speed
    );
  }

  /**
   * Valide les stats d'une créature
   */
  static validateStats(stats: BaseStats, tier: CreatureTier): BalanceResult {
    const warnings: string[] = [];
    const bst = this.calculateBST(stats);
    const range = this.BST_RANGES[tier];

    // Vérifier le BST
    let isValid = bst >= range.min && bst <= range.max;

    if (bst < range.min) {
      warnings.push(`BST trop bas: ${bst} (minimum: ${range.min})`);
    } else if (bst > range.max) {
      warnings.push(`BST trop élevé: ${bst} (maximum: ${range.max})`);
    }

    // Vérifier les stats individuelles
    const statLimit = tier === 'starter_base' || tier === 'common'
      ? this.STAT_LIMITS.maxForBase
      : this.STAT_LIMITS.maxForFinal;

    const statEntries = Object.entries(stats) as [keyof BaseStats, number][];

    for (const [statName, value] of statEntries) {
      if (value < this.STAT_LIMITS.min) {
        warnings.push(`${statName} trop bas: ${value} (minimum: ${this.STAT_LIMITS.min})`);
        isValid = false;
      }
      if (value > statLimit) {
        warnings.push(`${statName} trop élevé: ${value} (maximum: ${statLimit})`);
        isValid = false;
      }
    }

    return { isValid, bst, warnings };
  }

  /**
   * Ajuste les stats pour respecter les contraintes
   */
  static adjustStats(stats: BaseStats, tier: CreatureTier): BaseStats {
    const range = this.BST_RANGES[tier];
    const targetBST = (range.min + range.max) / 2;
    const currentBST = this.calculateBST(stats);

    // Si le BST est dans la plage, juste clamp les stats individuelles
    if (currentBST >= range.min && currentBST <= range.max) {
      return this.clampIndividualStats(stats, tier);
    }

    // Calculer le facteur de scaling
    const scaleFactor = targetBST / currentBST;

    // Appliquer le scaling
    const scaled: BaseStats = {
      hp: Math.round(stats.hp * scaleFactor),
      attack: Math.round(stats.attack * scaleFactor),
      defense: Math.round(stats.defense * scaleFactor),
      specialAttack: Math.round(stats.specialAttack * scaleFactor),
      specialDefense: Math.round(stats.specialDefense * scaleFactor),
      speed: Math.round(stats.speed * scaleFactor),
    };

    // Clamp les stats individuelles
    const clamped = this.clampIndividualStats(scaled, tier);

    // Ajuster le BST final si nécessaire
    return this.adjustBSTToTarget(clamped, targetBST);
  }

  /**
   * Clamp les stats individuelles dans les limites
   */
  private static clampIndividualStats(stats: BaseStats, tier: CreatureTier): BaseStats {
    const statLimit = tier === 'starter_base' || tier === 'common'
      ? this.STAT_LIMITS.maxForBase
      : this.STAT_LIMITS.maxForFinal;

    return {
      hp: Math.max(this.STAT_LIMITS.min, Math.min(statLimit, stats.hp)),
      attack: Math.max(this.STAT_LIMITS.min, Math.min(statLimit, stats.attack)),
      defense: Math.max(this.STAT_LIMITS.min, Math.min(statLimit, stats.defense)),
      specialAttack: Math.max(this.STAT_LIMITS.min, Math.min(statLimit, stats.specialAttack)),
      specialDefense: Math.max(this.STAT_LIMITS.min, Math.min(statLimit, stats.specialDefense)),
      speed: Math.max(this.STAT_LIMITS.min, Math.min(statLimit, stats.speed)),
    };
  }

  /**
   * Ajuste le BST vers une cible
   */
  private static adjustBSTToTarget(stats: BaseStats, targetBST: number): BaseStats {
    const currentBST = this.calculateBST(stats);
    const diff = targetBST - currentBST;

    if (Math.abs(diff) <= 6) {
      return stats;
    }

    // Distribuer la différence sur les stats
    const adjusted = { ...stats };
    const statKeys: (keyof BaseStats)[] = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];

    const perStat = Math.floor(diff / 6);
    let remainder = diff % 6;

    for (const key of statKeys) {
      adjusted[key] += perStat;
      if (remainder > 0) {
        adjusted[key]++;
        remainder--;
      } else if (remainder < 0) {
        adjusted[key]--;
        remainder++;
      }
    }

    return adjusted;
  }

  /**
   * Génère des stats équilibrées à partir d'une distribution de base
   */
  static generateBalancedStats(
    tier: CreatureTier,
    distribution: 'balanced' | 'physical' | 'special' | 'tank' | 'speedy'
  ): BaseStats {
    const range = this.BST_RANGES[tier];
    const targetBST = Math.floor((range.min + range.max) / 2);

    // Distributions de base (somme = 6, sera multipliée)
    const distributions: Record<string, number[]> = {
      balanced: [1, 1, 1, 1, 1, 1],
      physical: [1, 1.4, 0.8, 0.6, 0.8, 1.4],
      special: [1, 0.6, 0.8, 1.4, 0.8, 1.4],
      tank: [1.4, 0.8, 1.2, 0.8, 1.2, 0.6],
      speedy: [0.8, 1, 0.6, 1, 0.6, 2],
    };

    const dist = distributions[distribution] || distributions.balanced;
    const totalDist = dist.reduce((a, b) => a + b, 0);
    const multiplier = targetBST / totalDist;

    const stats: BaseStats = {
      hp: Math.round(dist[0] * multiplier),
      attack: Math.round(dist[1] * multiplier),
      defense: Math.round(dist[2] * multiplier),
      specialAttack: Math.round(dist[3] * multiplier),
      specialDefense: Math.round(dist[4] * multiplier),
      speed: Math.round(dist[5] * multiplier),
    };

    return this.clampIndividualStats(stats, tier);
  }

  /**
   * Détermine le tier approprié pour un niveau d'évolution
   */
  static getTierForEvolutionStage(
    stage: 1 | 2 | 3,
    isStarter: boolean
  ): CreatureTier {
    if (isStarter) {
      switch (stage) {
        case 1: return 'starter_base';
        case 2: return 'uncommon';
        case 3: return 'rare';
      }
    }

    switch (stage) {
      case 1: return 'common';
      case 2: return 'uncommon';
      case 3: return 'rare';
    }
  }
}
