import type { CreatureInstance } from './creature.types';

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  col: number;
  row: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface PlayerState {
  position: GridPosition;
  direction: Direction;
  isMoving: boolean;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  category: 'ball' | 'potion' | 'statusHeal' | 'keyItem' | 'battleItem';
  effect?: ItemEffect;
  spriteKey: string;
}

export interface ItemEffect {
  type: 'heal' | 'capture' | 'statusCure' | 'statBoost' | 'evolution';
  value?: number;
  captureRate?: number;
  curesStatus?: string[];
  evolutionStoneType?: 'fire' | 'water' | 'grass' | 'electric' | 'moon' | 'sun' | 'dawn' | 'dusk' | 'shiny' | 'ice';
}

export interface InventorySlot {
  itemId: number;
  quantity: number;
}

export interface GameSaveData {
  player: {
    name: string;
    position: GridPosition;
    direction: Direction;
  };
  team: CreatureInstance[];
  pc: CreatureInstance[];
  inventory: InventorySlot[];
  badges: number[];
  playTime: number;
  savedAt: number;
}

export interface DialogLine {
  speaker?: string;
  text: string;
  choices?: DialogChoice[];
}

export interface DialogChoice {
  text: string;
  action?: () => void;
  nextDialogId?: string;
}

export interface NPC {
  id: string;
  name: string;
  spriteKey: string;
  position: GridPosition;
  direction: Direction;
  dialogId: string;
  isTrainer?: boolean;
  team?: CreatureInstance[];
}

export interface WildEncounterZone {
  id: string;
  encounterRate: number;
  encounters: WildEncounter[];
}

export interface WildEncounter {
  speciesId: number;
  minLevel: number;
  maxLevel: number;
  rarity: number; // 1-100, higher = more common
}
