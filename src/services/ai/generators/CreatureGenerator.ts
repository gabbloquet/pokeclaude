/**
 * Générateur de créatures complètes via IA
 */

import { AIService } from '../AIService';
import { aiResponseCache } from '../AICache';
import { JSONValidator, type JSONSchema } from '../validators/JSONValidator';
import { ContentValidator } from '../validators/ContentValidator';
import { BalancingSystem, type CreatureTier } from './BalancingSystem';
import { EventBus, AI_EVENTS } from '@/events';
import {
  CREATURE_GENERATION_SYSTEM_PROMPT,
  CREATURE_GENERATION_USER_PROMPT,
} from '@/data/prompts/creaturePrompts';
import type { CreatureType, BaseStats, LearnsetEntry } from '@/types/creature.types';

export interface GeneratedCreatureData {
  name: string;
  types: [CreatureType] | [CreatureType, CreatureType];
  description: string;
  baseStats: BaseStats;
  signature?: string;
}

export interface GeneratedCreature {
  id: number;
  name: string;
  types: [CreatureType] | [CreatureType, CreatureType];
  description: string;
  baseStats: BaseStats;
  baseExp: number;
  catchRate: number;
  spriteKey: string;
  learnset: LearnsetEntry[];
  isGenerated: true;
  signature?: string;
}

const VALID_TYPES: CreatureType[] = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const CREATURE_SCHEMA: JSONSchema = {
  type: 'object',
  required: ['name', 'types', 'description', 'baseStats'],
  properties: {
    name: { type: 'string', minLength: 3, maxLength: 20 },
    types: {
      type: 'array',
      items: { type: 'string' },
    },
    description: { type: 'string', maxLength: 200 },
    baseStats: {
      type: 'object',
      required: ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'],
      properties: {
        hp: { type: 'number', minimum: 1, maximum: 255 },
        attack: { type: 'number', minimum: 1, maximum: 255 },
        defense: { type: 'number', minimum: 1, maximum: 255 },
        specialAttack: { type: 'number', minimum: 1, maximum: 255 },
        specialDefense: { type: 'number', minimum: 1, maximum: 255 },
        speed: { type: 'number', minimum: 1, maximum: 255 },
      },
    },
    signature: { type: 'string', maxLength: 100 },
  },
};

// ID de départ pour les créatures générées
let nextGeneratedId = 1000;

export class CreatureGenerator {
  /**
   * Génère une nouvelle créature à partir d'un concept
   */
  async generateCreature(
    concept: string,
    tier: 'base' | 'intermediate' | 'final' = 'base'
  ): Promise<GeneratedCreature | null> {
    const cacheKey = `creature:${concept}:${tier}`;
    const cached = aiResponseCache.get(cacheKey);

    if (cached) {
      const parsed = JSONValidator.parseAndValidate<GeneratedCreatureData>(cached, CREATURE_SCHEMA);
      if (parsed.success && parsed.data) {
        return this.finalizeCreature(parsed.data, tier);
      }
    }

    if (!AIService.isAvailable()) {
      console.warn('[CreatureGenerator] AI not available');
      return null;
    }

    EventBus.emitAI(AI_EVENTS.GENERATION_START, { type: 'creature' });

    try {
      const userPrompt = CREATURE_GENERATION_USER_PROMPT(concept, tier);

      const response = await AIService.chat(
        [
          { role: 'system', content: CREATURE_GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.9,
          maxTokens: 500,
          jsonMode: true,
          timeout: 10000,
        }
      );

      // Valider le JSON
      const validation = JSONValidator.parseAndValidate<GeneratedCreatureData>(
        response.content,
        CREATURE_SCHEMA
      );

      if (!validation.success || !validation.data) {
        console.warn('[CreatureGenerator] Invalid JSON:', validation.errors);
        return null;
      }

      // Mettre en cache (24h)
      aiResponseCache.set(cacheKey, response.content, 24 * 60 * 60 * 1000);

      const creature = this.finalizeCreature(validation.data, tier);

      EventBus.emitAI(AI_EVENTS.GENERATION_COMPLETE, {
        type: 'creature',
        result: creature,
      });

      return creature;
    } catch (error) {
      console.error('[CreatureGenerator] Error:', error);

      EventBus.emitAI(AI_EVENTS.GENERATION_ERROR, {
        type: 'creature',
        error: (error as Error).message,
      });

      return null;
    }
  }

  /**
   * Finalise les données de la créature
   */
  private finalizeCreature(
    data: GeneratedCreatureData,
    tier: 'base' | 'intermediate' | 'final'
  ): GeneratedCreature {
    // Sanitiser le nom
    const nameValidation = ContentValidator.validateName(data.name);
    const name = nameValidation.sanitized || 'Mystecrea';

    // Valider et nettoyer les types
    const types = this.validateTypes(data.types);

    // Sanitiser la description
    const descValidation = ContentValidator.validateDescription(data.description);
    const description = descValidation.sanitized || 'Une créature mystérieuse.';

    // Convertir le tier pour le système d'équilibrage
    const balanceTier: CreatureTier = {
      base: 'starter_base' as CreatureTier,
      intermediate: 'uncommon' as CreatureTier,
      final: 'rare' as CreatureTier,
    }[tier];

    // Équilibrer les stats
    const balanceResult = BalancingSystem.validateStats(data.baseStats, balanceTier);
    const baseStats = balanceResult.isValid
      ? data.baseStats
      : BalancingSystem.adjustStats(data.baseStats, balanceTier);

    // Calculer baseExp et catchRate selon le tier
    const baseExp = this.calculateBaseExp(tier, baseStats);
    const catchRate = this.calculateCatchRate(tier);

    // Générer un learnset de base
    const learnset = this.generateBasicLearnset(types);

    const id = nextGeneratedId++;

    return {
      id,
      name,
      types,
      description,
      baseStats,
      baseExp,
      catchRate,
      spriteKey: `generated_${id}`,
      learnset,
      isGenerated: true,
      signature: data.signature,
    };
  }

  /**
   * Valide et nettoie les types
   */
  private validateTypes(
    types: (string | CreatureType)[]
  ): [CreatureType] | [CreatureType, CreatureType] {
    const validTypes = types
      .map((t) => t.toLowerCase() as CreatureType)
      .filter((t) => VALID_TYPES.includes(t))
      .slice(0, 2);

    if (validTypes.length === 0) {
      return ['normal'];
    }

    if (validTypes.length === 1) {
      return [validTypes[0]];
    }

    return [validTypes[0], validTypes[1]];
  }

  /**
   * Calcule l'EXP de base selon le tier
   */
  private calculateBaseExp(tier: string, stats: BaseStats): number {
    const bst = BalancingSystem.calculateBST(stats);

    const baseMultiplier = {
      base: 0.2,
      intermediate: 0.35,
      final: 0.5,
    }[tier] || 0.2;

    return Math.floor(bst * baseMultiplier);
  }

  /**
   * Calcule le taux de capture selon le tier
   */
  private calculateCatchRate(tier: string): number {
    const rates: Record<string, number> = {
      base: 45,
      intermediate: 45,
      final: 45,
    };

    return rates[tier] || 45;
  }

  /**
   * Génère un learnset basique selon les types
   */
  private generateBasicLearnset(
    types: [CreatureType] | [CreatureType, CreatureType]
  ): LearnsetEntry[] {
    // IDs de moves basiques par type (à adapter selon les moves disponibles)
    const typeToMoves: Partial<Record<CreatureType, number[]>> = {
      normal: [1, 4], // Tackle, Quick Attack
      fire: [5, 7], // Ember, Flame Wheel
      water: [10, 12], // Water Gun, Water Pulse
      grass: [16, 17], // Vine Whip, Razor Leaf
      electric: [23, 25], // Thunder Shock, Spark
    };

    const learnset: LearnsetEntry[] = [
      { level: 1, moveId: 1 }, // Tackle toujours disponible
    ];

    // Ajouter des moves du type principal
    const primaryMoves = typeToMoves[types[0]] || [];
    if (primaryMoves.length > 0) {
      learnset.push({ level: 1, moveId: primaryMoves[0] });
      if (primaryMoves.length > 1) {
        learnset.push({ level: 15, moveId: primaryMoves[1] });
      }
    }

    // Ajouter un move du type secondaire si présent
    if (types.length > 1 && types[1]) {
      const secondaryMoves = typeToMoves[types[1]] || [];
      if (secondaryMoves.length > 0) {
        learnset.push({ level: 20, moveId: secondaryMoves[0] });
      }
    }

    return learnset;
  }

  /**
   * Réinitialise le compteur d'ID (pour les tests)
   */
  resetIdCounter(): void {
    nextGeneratedId = 1000;
  }
}

// Instance singleton
export const creatureGenerator = new CreatureGenerator();
