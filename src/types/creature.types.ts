export type CreatureType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface CreatureSpecies {
  id: number;
  name: string;
  types: [CreatureType] | [CreatureType, CreatureType];
  baseStats: BaseStats;
  baseExp: number;
  catchRate: number;
  spriteKey: string;
  evolvesTo?: {
    speciesId: number;
    level: number;
  };
  learnset: LearnsetEntry[];
}

export interface LearnsetEntry {
  level: number;
  moveId: number;
}

export interface IVs extends BaseStats {}
export interface EVs extends BaseStats {}

export interface CreatureInstance {
  id: string;
  speciesId: number;
  nickname?: string;
  level: number;
  currentHp: number;
  exp: number;
  ivs: IVs;
  evs: EVs;
  moves: number[]; // Move IDs (max 4)
  isShiny: boolean;
  caughtAt: number; // timestamp
  status?: StatusEffect; // Status persistant hors combat
}

export interface Move {
  id: number;
  name: string;
  type: CreatureType;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number;
  pp: number;
  priority: number;
  effect?: MoveEffect;
}

export interface MoveEffect {
  type: 'status' | 'stat' | 'drain' | 'recoil' | 'heal' | 'multiHit' | 'flinch';
  target: 'self' | 'opponent';
  value?: number;                  // Chance (%), ou valeur spécifique selon le type
  statusEffect?: StatusEffect;
  statChanges?: Partial<Record<keyof BaseStats, number>>;
  minHits?: number;               // Pour multiHit : nombre minimum de coups
  maxHits?: number;               // Pour multiHit : nombre maximum de coups
}

export interface BattleStatModifiers {
  accuracy: number;   // Stages de précision (-6 à +6)
  evasion: number;    // Stages d'esquive (-6 à +6)
}

export type StatusEffect =
  | 'burn'
  | 'freeze'
  | 'paralysis'
  | 'poison'
  | 'badPoison'
  | 'sleep';

export interface BattleCreature {
  instance: CreatureInstance;
  species: CreatureSpecies;
  currentHp: number;
  statModifiers: Record<keyof BaseStats, number>;
  battleStatModifiers: BattleStatModifiers;  // Précision et esquive
  status?: StatusEffect;
  isConfused: boolean;
  isFlinched: boolean;
  turnsInBattle: number;
}
