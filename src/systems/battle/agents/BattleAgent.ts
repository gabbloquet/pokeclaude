/**
 * Interface de base pour les agents de combat
 * Un agent observe l'état du combat et décide de la meilleure action
 */

import type { BattleCreature, Move } from '@/types/creature.types';

/**
 * État observable d'une créature en combat
 */
export interface BattleCreatureState {
  name: string;
  types: string[];
  level: number;
  currentHp: number;
  maxHp: number;
  hpPercent: number;
  status: string | null;
  statModifiers: Record<string, number>;
  moves: MoveState[];
}

/**
 * État observable d'un move
 */
export interface MoveState {
  id: number;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power: number | null;
  accuracy: number;
  priority: number;
}

/**
 * Observation complète du combat
 */
export interface BattleObservation {
  myCreature: BattleCreatureState;
  enemyCreature: BattleCreatureState;
  turn: number;
  isWildBattle: boolean;
  history: TurnHistory[];
  typeMatchups: TypeMatchup[];
}

/**
 * Historique d'un tour
 */
export interface TurnHistory {
  turn: number;
  myMove: string | null;
  enemyMove: string | null;
  myDamageDealt: number;
  enemyDamageDealt: number;
}

/**
 * Info sur les matchups de types
 */
export interface TypeMatchup {
  moveName: string;
  moveType: string;
  effectiveness: number; // 0, 0.25, 0.5, 1, 2, 4
}

/**
 * Résultat de la décision de l'agent
 */
export interface AgentDecision {
  moveIndex: number;
  reasoning?: string;
  confidence?: number;
}

/**
 * Interface abstraite pour tous les agents de combat
 */
export interface BattleAgent {
  /** Nom de l'agent */
  readonly name: string;

  /** Type d'agent */
  readonly type: 'random' | 'heuristic' | 'llm';

  /**
   * Sélectionne le meilleur move basé sur l'observation
   */
  selectMove(observation: BattleObservation): Promise<AgentDecision>;

  /**
   * Callback appelé à la fin de chaque tour (optionnel, pour apprentissage)
   */
  onTurnEnd?(result: TurnHistory): void;

  /**
   * Réinitialise l'état interne de l'agent (début de combat)
   */
  reset?(): void;
}

/**
 * Crée l'état observable d'une créature
 */
export function createCreatureState(
  creature: BattleCreature,
  availableMoves: Move[]
): BattleCreatureState {
  const maxHp = calculateMaxHp(creature);

  return {
    name: creature.species.name,
    types: creature.species.types,
    level: creature.instance.level,
    currentHp: creature.currentHp,
    maxHp,
    hpPercent: Math.round((creature.currentHp / maxHp) * 100),
    status: creature.status ?? null,
    statModifiers: { ...creature.statModifiers },
    moves: availableMoves.map((move) => ({
      id: move.id,
      name: move.name,
      type: move.type,
      category: move.category,
      power: move.power,
      accuracy: move.accuracy,
      priority: move.priority,
    })),
  };
}

/**
 * Calcule les HP max d'une créature
 */
function calculateMaxHp(creature: BattleCreature): number {
  const baseHp = creature.species.baseStats.hp;
  const level = creature.instance.level;
  const iv = creature.instance.ivs.hp;
  const ev = creature.instance.evs.hp;

  return Math.floor(((2 * baseHp + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
}
