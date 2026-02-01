/**
 * Store pour le contenu généré par l'IA
 * Séparé du store principal pour éviter les conflits
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeneratedCreature } from '@/services/ai/generators/CreatureGenerator';
import type { GeneratedQuest } from '@/services/ai/generators/QuestGenerator';

interface GeneratedContent {
  creatures: GeneratedCreature[];
  quests: GeneratedQuest[];
  descriptions: Record<string, string>; // speciesId -> description
}

interface GeneratedContentState extends GeneratedContent {
  // Creatures
  addCreature: (creature: GeneratedCreature) => void;
  getCreature: (id: number) => GeneratedCreature | undefined;
  removeCreature: (id: number) => void;

  // Quests
  addQuest: (quest: GeneratedQuest) => void;
  getActiveQuests: () => GeneratedQuest[];
  completeQuest: (title: string) => void;

  // Descriptions
  setDescription: (speciesId: number, description: string) => void;
  getDescription: (speciesId: number) => string | undefined;

  // Utils
  clearAll: () => void;
  getStats: () => { creatures: number; quests: number; descriptions: number };
}

const initialState: GeneratedContent = {
  creatures: [],
  quests: [],
  descriptions: {},
};

export const useGeneratedContentStore = create<GeneratedContentState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === Creatures ===
      addCreature: (creature) =>
        set((state) => {
          // Éviter les doublons
          if (state.creatures.some((c) => c.id === creature.id)) {
            return state;
          }
          return { creatures: [...state.creatures, creature] };
        }),

      getCreature: (id) => get().creatures.find((c) => c.id === id),

      removeCreature: (id) =>
        set((state) => ({
          creatures: state.creatures.filter((c) => c.id !== id),
        })),

      // === Quests ===
      addQuest: (quest) =>
        set((state) => {
          // Éviter les doublons par titre
          if (state.quests.some((q) => q.title === quest.title)) {
            return state;
          }
          return { quests: [...state.quests, quest] };
        }),

      getActiveQuests: () => get().quests,

      completeQuest: (title) =>
        set((state) => ({
          quests: state.quests.filter((q) => q.title !== title),
        })),

      // === Descriptions ===
      setDescription: (speciesId, description) =>
        set((state) => ({
          descriptions: {
            ...state.descriptions,
            [speciesId]: description,
          },
        })),

      getDescription: (speciesId) => get().descriptions[speciesId],

      // === Utils ===
      clearAll: () => set(initialState),

      getStats: () => {
        const state = get();
        return {
          creatures: state.creatures.length,
          quests: state.quests.length,
          descriptions: Object.keys(state.descriptions).length,
        };
      },
    }),
    {
      name: 'pokeclaude-generated-content',
    }
  )
);

/**
 * Helper pour obtenir toutes les créatures (base + générées)
 */
export function getAllCreaturesWithGenerated(
  baseSpecies: Record<number, unknown>
): Map<number, unknown> {
  const all = new Map<number, unknown>();

  // Ajouter les espèces de base
  for (const [id, species] of Object.entries(baseSpecies)) {
    all.set(Number(id), species);
  }

  // Ajouter les créatures générées
  const generated = useGeneratedContentStore.getState().creatures;
  for (const creature of generated) {
    all.set(creature.id, creature);
  }

  return all;
}
