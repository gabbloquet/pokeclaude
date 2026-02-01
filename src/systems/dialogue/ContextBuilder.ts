/**
 * Construit le contexte du jeu pour les dialogues IA
 */

import { useGameStore } from '@/store/gameStore';
import { getSpecies } from '@/data/creatures';
import type { GameContext } from '@/data/npcs/personalities';

export class ContextBuilder {
  /**
   * Construit le contexte actuel du jeu pour l'IA
   */
  static buildGameContext(): GameContext {
    const state = useGameStore.getState();

    // Récupérer les noms des créatures de l'équipe
    const teamNames = state.team.map((creature) => {
      const species = getSpecies(creature.speciesId);
      return creature.nickname || species?.name || 'Inconnu';
    });

    return {
      playerName: state.player.name || 'jeune dresseur',
      teamNames,
      teamCount: state.team.length,
      badgeCount: state.badges.length,
      hasChosenStarter: state.progression.hasChosenStarter,
      currentLocation: this.getCurrentLocation(),
      recentEvents: this.getRecentEvents(),
    };
  }

  /**
   * Détermine la localisation actuelle (simplifié)
   */
  private static getCurrentLocation(): string | undefined {
    // Pour l'instant, on utilise une valeur par défaut
    // Sera amélioré quand on aura un système de zones
    return 'Bourg-Palette';
  }

  /**
   * Récupère les événements récents pour le contexte
   */
  private static getRecentEvents(): string[] {
    const state = useGameStore.getState();
    const events: string[] = [];

    if (!state.progression.hasChosenStarter) {
      events.push('Le joueur n\'a pas encore choisi son starter');
    } else if (state.team.length === 1) {
      events.push('Le joueur vient de recevoir son premier compagnon');
    }

    if (state.badges.length > 0) {
      events.push(`Le joueur a obtenu ${state.badges.length} badge(s)`);
    }

    return events;
  }

  /**
   * Formate le contexte en texte pour le prompt
   */
  static formatContextForPrompt(context: GameContext): string {
    const lines: string[] = [];

    lines.push(`Joueur: ${context.playerName}`);

    if (context.teamCount > 0) {
      lines.push(`Équipe: ${context.teamNames.join(', ')}`);
    } else {
      lines.push('Le joueur n\'a pas encore de créature');
    }

    lines.push(`Badges: ${context.badgeCount}/8`);

    if (context.currentLocation) {
      lines.push(`Lieu: ${context.currentLocation}`);
    }

    if (context.recentEvents && context.recentEvents.length > 0) {
      lines.push('');
      lines.push('Événements récents:');
      context.recentEvents.forEach((event) => {
        lines.push(`- ${event}`);
      });
    }

    return lines.join('\n');
  }
}
