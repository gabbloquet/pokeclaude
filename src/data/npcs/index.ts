/**
 * Exports des personnalités NPC
 */

export * from './personalities';
export { momPersonality } from './mom';
export { professorPersonality } from './professor';

import { momPersonality } from './mom';
import { professorPersonality } from './professor';
import type { NPCPersonality } from './personalities';

/**
 * Registry de toutes les personnalités disponibles
 */
export const npcPersonalities: Record<string, NPCPersonality> = {
  mom: momPersonality,
  professor: professorPersonality,
};

/**
 * Récupère une personnalité par son ID
 */
export function getPersonality(npcId: string): NPCPersonality | undefined {
  return npcPersonalities[npcId];
}
