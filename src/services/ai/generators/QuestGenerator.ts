/**
 * Générateur de quêtes via IA
 */

import { AIService } from '../AIService';
import { aiResponseCache } from '../AICache';
import { JSONValidator, type JSONSchema } from '../validators/JSONValidator';
import { ContentValidator } from '../validators/ContentValidator';
import { EventBus, AI_EVENTS } from '@/events';
import {
  QUEST_GENERATION_SYSTEM_PROMPT,
  QUEST_GENERATION_USER_PROMPT,
  type QuestType,
  type QuestDifficulty,
} from '@/data/prompts/questPrompts';
import { getFallbackQuest, type FallbackQuest } from '@/data/fallbacks/quests';

export interface GeneratedQuest {
  title: string;
  description: string;
  objective: {
    type: QuestType;
    target: string;
    count?: number;
  };
  reward: {
    money: number;
    items?: { id: number; quantity: number }[];
  };
  dialogue: {
    start: string;
    progress: string;
    complete: string;
  };
}

const QUEST_SCHEMA: JSONSchema = {
  type: 'object',
  required: ['title', 'description', 'objective', 'reward', 'dialogue'],
  properties: {
    title: { type: 'string', maxLength: 50 },
    description: { type: 'string', maxLength: 200 },
    objective: {
      type: 'object',
      required: ['type', 'target'],
      properties: {
        type: { type: 'string' },
        target: { type: 'string' },
        count: { type: 'number', minimum: 1, maximum: 10 },
      },
    },
    reward: {
      type: 'object',
      required: ['money'],
      properties: {
        money: { type: 'number', minimum: 0, maximum: 10000 },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              quantity: { type: 'number' },
            },
          },
        },
      },
    },
    dialogue: {
      type: 'object',
      required: ['start', 'progress', 'complete'],
      properties: {
        start: { type: 'string', maxLength: 150 },
        progress: { type: 'string', maxLength: 150 },
        complete: { type: 'string', maxLength: 150 },
      },
    },
  },
};

export class QuestGenerator {
  /**
   * Génère une quête
   */
  async generateQuest(
    type: QuestType,
    difficulty: QuestDifficulty,
    context: {
      playerLevel: number;
      availableLocations: string[];
      availableCreatures: string[];
    }
  ): Promise<GeneratedQuest | FallbackQuest> {
    // Générer une clé de cache basée sur les paramètres
    const cacheKey = `quest:${type}:${difficulty}:${context.playerLevel}`;
    const cached = aiResponseCache.get(cacheKey);

    if (cached) {
      const parsed = JSONValidator.parseAndValidate<GeneratedQuest>(cached, QUEST_SCHEMA);
      if (parsed.success && parsed.data) {
        return parsed.data;
      }
    }

    if (!AIService.isAvailable()) {
      return getFallbackQuest(type, difficulty);
    }

    EventBus.emitAI(AI_EVENTS.GENERATION_START, { type: 'quest' });

    try {
      const userPrompt = QUEST_GENERATION_USER_PROMPT(
        type,
        difficulty,
        context.playerLevel,
        context.availableLocations,
        context.availableCreatures
      );

      const response = await AIService.chat(
        [
          { role: 'system', content: QUEST_GENERATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.8,
          maxTokens: 400,
          jsonMode: true,
          timeout: 8000,
        }
      );

      // Valider le JSON
      const validation = JSONValidator.parseAndValidate<GeneratedQuest>(
        response.content,
        QUEST_SCHEMA
      );

      if (!validation.success || !validation.data) {
        console.warn('[QuestGenerator] Invalid JSON:', validation.errors);
        return getFallbackQuest(type, difficulty);
      }

      const quest = validation.data;

      // Sanitiser les textes
      quest.title = ContentValidator.validateName(quest.title).sanitized;
      quest.description = ContentValidator.validateDescription(quest.description).sanitized;
      quest.dialogue.start = ContentValidator.validateDialogue(quest.dialogue.start).sanitized;
      quest.dialogue.progress = ContentValidator.validateDialogue(quest.dialogue.progress).sanitized;
      quest.dialogue.complete = ContentValidator.validateDialogue(quest.dialogue.complete).sanitized;

      // Mettre en cache (1h)
      aiResponseCache.set(cacheKey, JSON.stringify(quest), 60 * 60 * 1000);

      EventBus.emitAI(AI_EVENTS.GENERATION_COMPLETE, {
        type: 'quest',
        result: quest,
      });

      return quest;
    } catch (error) {
      console.error('[QuestGenerator] Error:', error);

      EventBus.emitAI(AI_EVENTS.GENERATION_ERROR, {
        type: 'quest',
        error: (error as Error).message,
      });

      return getFallbackQuest(type, difficulty);
    }
  }

  /**
   * Génère plusieurs quêtes
   */
  async generateQuests(
    count: number,
    context: {
      playerLevel: number;
      availableLocations: string[];
      availableCreatures: string[];
    }
  ): Promise<(GeneratedQuest | FallbackQuest)[]> {
    const types: QuestType[] = ['capture', 'battle', 'exploration', 'collection'];
    const difficulties: QuestDifficulty[] = ['easy', 'medium', 'hard'];

    const quests: (GeneratedQuest | FallbackQuest)[] = [];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const difficulty = difficulties[Math.min(i, difficulties.length - 1)];

      const quest = await this.generateQuest(type, difficulty, context);
      quests.push(quest);
    }

    return quests;
  }
}

// Instance singleton
export const questGenerator = new QuestGenerator();
