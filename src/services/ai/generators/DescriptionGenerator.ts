/**
 * Générateur de descriptions via IA
 */

import { AIService } from '../AIService';
import { aiDescriptionCache } from '../AICache';
import { ContentValidator } from '../validators/ContentValidator';
import { EventBus, AI_EVENTS } from '@/events';
import { getSpecies } from '@/data/creatures';
import {
  CREATURE_DESCRIPTION_SYSTEM_PROMPT,
  CREATURE_DESCRIPTION_USER_PROMPT,
} from '@/data/prompts/creaturePrompts';
import { getFallbackDescription } from '@/data/fallbacks/descriptions';

export class DescriptionGenerator {
  /**
   * Génère une description pour une créature
   */
  async generateCreatureDescription(speciesId: number): Promise<string> {
    const species = getSpecies(speciesId);

    if (!species) {
      return 'Description non disponible.';
    }

    // Vérifier le cache d'abord
    const cacheKey = `creature-desc:${speciesId}`;
    const cached = aiDescriptionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Si l'IA n'est pas disponible, utiliser le fallback
    if (!AIService.isAvailable()) {
      return getFallbackDescription(speciesId, species.name, species.types);
    }

    EventBus.emitAI(AI_EVENTS.GENERATION_START, {
      type: 'description',
      id: String(speciesId),
    });

    try {
      const isEvolved = !!species.evolvesTo || speciesId > 1;
      const userPrompt = CREATURE_DESCRIPTION_USER_PROMPT(
        species.name,
        species.types,
        isEvolved
      );

      const response = await AIService.ask(
        userPrompt,
        CREATURE_DESCRIPTION_SYSTEM_PROMPT,
        {
          temperature: 0.7,
          maxTokens: 100,
          timeout: 5000,
        }
      );

      // Valider et sanitiser la réponse
      const validation = ContentValidator.validateDescription(response);

      if (!validation.isValid) {
        console.warn('[DescriptionGenerator] Invalid response, using fallback');
        return getFallbackDescription(speciesId, species.name, species.types);
      }

      // Mettre en cache (24h)
      aiDescriptionCache.set(cacheKey, validation.sanitized);

      EventBus.emitAI(AI_EVENTS.GENERATION_COMPLETE, {
        type: 'description',
        result: validation.sanitized,
      });

      return validation.sanitized;
    } catch (error) {
      console.error('[DescriptionGenerator] Error:', error);

      EventBus.emitAI(AI_EVENTS.GENERATION_ERROR, {
        type: 'description',
        error: (error as Error).message,
      });

      return getFallbackDescription(speciesId, species.name, species.types);
    }
  }

  /**
   * Génère une description pour un lieu
   */
  async generateLocationDescription(
    locationName: string,
    locationType: 'town' | 'route' | 'cave' | 'forest' | 'building'
  ): Promise<string> {
    const cacheKey = `location-desc:${locationName}`;
    const cached = aiDescriptionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!AIService.isAvailable()) {
      return this.getLocationFallback(locationName, locationType);
    }

    try {
      const systemPrompt = `Tu décris des lieux dans un jeu Pokémon appelé PokeClaude.
Génère des descriptions courtes (1-2 phrases) et atmosphériques.
En français uniquement.`;

      const userPrompt = `Décris ce lieu: "${locationName}" (type: ${locationType})
Réponds uniquement avec la description.`;

      const response = await AIService.ask(userPrompt, systemPrompt, {
        temperature: 0.8,
        maxTokens: 80,
        timeout: 5000,
      });

      const validation = ContentValidator.validateDescription(response);

      if (validation.isValid) {
        aiDescriptionCache.set(cacheKey, validation.sanitized);
        return validation.sanitized;
      }
    } catch (error) {
      console.error('[DescriptionGenerator] Location error:', error);
    }

    return this.getLocationFallback(locationName, locationType);
  }

  /**
   * Fallback pour les descriptions de lieux
   */
  private getLocationFallback(
    name: string,
    type: 'town' | 'route' | 'cave' | 'forest' | 'building'
  ): string {
    const templates: Record<string, string[]> = {
      town: [
        'Un village paisible où règne une atmosphère chaleureuse.',
        'Une petite ville accueillante avec des habitants sympathiques.',
      ],
      route: [
        'Un chemin bordé de hautes herbes où vivent de nombreuses créatures.',
        'Une route tranquille idéale pour l\'exploration.',
      ],
      cave: [
        'Une grotte sombre et mystérieuse. Qui sait ce qui s\'y cache...',
        'Les échos résonnent dans cette caverne ancienne.',
      ],
      forest: [
        'Une forêt dense où la lumière filtre à travers les feuilles.',
        'Les arbres centenaires abritent de nombreuses créatures.',
      ],
      building: [
        'Un bâtiment important pour les dresseurs de passage.',
        'Un lieu incontournable pour tout aventurier.',
      ],
    };

    const options = templates[type] || templates.town;
    return `${name}: ${options[Math.floor(Math.random() * options.length)]}`;
  }
}

// Instance singleton
export const descriptionGenerator = new DescriptionGenerator();
