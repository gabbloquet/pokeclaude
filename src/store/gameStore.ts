import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreatureInstance } from '@/types/creature.types';
import type { InventorySlot, GridPosition, Direction } from '@/types/game.types';

interface PlayerState {
  name: string;
  position: GridPosition;
  direction: Direction;
}

interface ProgressionState {
  hasCompletedIntro: boolean;
  hasChosenStarter: boolean;
}

interface GameState {
  player: PlayerState;
  team: CreatureInstance[];
  pc: CreatureInstance[];
  inventory: InventorySlot[];
  badges: number[];
  playTime: number;
  money: number;
  progression: ProgressionState;

  // Actions
  setPlayerName: (name: string) => void;
  setPlayerPosition: (position: GridPosition) => void;
  setPlayerDirection: (direction: Direction) => void;
  setProgression: (key: keyof ProgressionState, value: boolean) => void;
  addCreatureToTeam: (creature: CreatureInstance) => void;
  removeCreatureFromTeam: (creatureId: string) => void;
  moveCreatureToPC: (creatureId: string) => void;
  moveCreatureFromPC: (creatureId: string) => void;
  updateCreature: (creatureId: string, updates: Partial<CreatureInstance>) => void;
  addItem: (itemId: number, quantity: number) => void;
  removeItem: (itemId: number, quantity: number) => boolean;
  addBadge: (badgeId: number) => void;
  addMoney: (amount: number) => void;
  removeMoney: (amount: number) => boolean;
  incrementPlayTime: (seconds: number) => void;
  resetGame: () => void;
}

const initialState = {
  player: {
    name: '',
    position: { col: 10, row: 7 },
    direction: 'down' as Direction,
  },
  team: [] as CreatureInstance[],
  pc: [] as CreatureInstance[],
  inventory: [
    { itemId: 1, quantity: 5 },    // Poké Ball
    { itemId: 10, quantity: 3 },   // Potion
  ],
  badges: [] as number[],
  playTime: 0,
  money: 3000,
  progression: {
    hasCompletedIntro: false,
    hasChosenStarter: false,
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setPlayerName: (name) =>
        set((state) => ({
          player: { ...state.player, name },
        })),

      setPlayerPosition: (position) =>
        set((state) => ({
          player: { ...state.player, position },
        })),

      setPlayerDirection: (direction) =>
        set((state) => ({
          player: { ...state.player, direction },
        })),

      setProgression: (key, value) =>
        set((state) => ({
          progression: { ...state.progression, [key]: value },
        })),

  addCreatureToTeam: (creature) =>
    set((state) => {
      if (state.team.length >= 6) {
        // Team full, add to PC
        return { pc: [...state.pc, creature] };
      }
      return { team: [...state.team, creature] };
    }),

  removeCreatureFromTeam: (creatureId) =>
    set((state) => ({
      team: state.team.filter((c) => c.id !== creatureId),
    })),

  moveCreatureToPC: (creatureId) =>
    set((state) => {
      const creature = state.team.find((c) => c.id === creatureId);
      if (!creature || state.team.length <= 1) return state;
      return {
        team: state.team.filter((c) => c.id !== creatureId),
        pc: [...state.pc, creature],
      };
    }),

  moveCreatureFromPC: (creatureId) =>
    set((state) => {
      if (state.team.length >= 6) return state;
      const creature = state.pc.find((c) => c.id === creatureId);
      if (!creature) return state;
      return {
        pc: state.pc.filter((c) => c.id !== creatureId),
        team: [...state.team, creature],
      };
    }),

  updateCreature: (creatureId, updates) =>
    set((state) => ({
      team: state.team.map((c) =>
        c.id === creatureId ? { ...c, ...updates } : c
      ),
      pc: state.pc.map((c) =>
        c.id === creatureId ? { ...c, ...updates } : c
      ),
    })),

  addItem: (itemId, quantity) =>
    set((state) => {
      const existingSlot = state.inventory.find((s) => s.itemId === itemId);
      if (existingSlot) {
        return {
          inventory: state.inventory.map((s) =>
            s.itemId === itemId
              ? { ...s, quantity: s.quantity + quantity }
              : s
          ),
        };
      }
      return {
        inventory: [...state.inventory, { itemId, quantity }],
      };
    }),

  removeItem: (itemId, quantity) => {
    const state = get();
    const slot = state.inventory.find((s) => s.itemId === itemId);
    if (!slot || slot.quantity < quantity) return false;

    set((state) => {
      if (slot.quantity === quantity) {
        return {
          inventory: state.inventory.filter((s) => s.itemId !== itemId),
        };
      }
      return {
        inventory: state.inventory.map((s) =>
          s.itemId === itemId
            ? { ...s, quantity: s.quantity - quantity }
            : s
        ),
      };
    });
    return true;
  },

  addBadge: (badgeId) =>
    set((state) => {
      if (state.badges.includes(badgeId)) return state;
      return { badges: [...state.badges, badgeId] };
    }),

  addMoney: (amount) =>
    set((state) => ({ money: state.money + amount })),

  removeMoney: (amount) => {
    const state = get();
    if (state.money < amount) return false;
    set({ money: state.money - amount });
    return true;
  },

  incrementPlayTime: (seconds) =>
    set((state) => ({ playTime: state.playTime + seconds })),

      resetGame: () => set(initialState),
    }),
    {
      name: 'pokeclaude-save',
      partialize: (state) => ({
        player: state.player,
        team: state.team,
        pc: state.pc,
        inventory: state.inventory,
        badges: state.badges,
        playTime: state.playTime,
        money: state.money,
        progression: state.progression,
      }),
    }
  )
);
