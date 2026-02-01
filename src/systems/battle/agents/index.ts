/**
 * Exports des agents de combat
 */

export type {
  BattleAgent,
  BattleObservation,
  BattleCreatureState,
  MoveState,
  TurnHistory,
  TypeMatchup,
  AgentDecision,
} from './BattleAgent';
export { createCreatureState } from './BattleAgent';

export { RandomAgent } from './RandomAgent';
export { HeuristicAgent } from './HeuristicAgent';
export { LLMAgent } from './LLMAgent';

export {
  createBattleAgent,
  determineDifficulty,
  getAgentInfo,
  type Difficulty,
} from './AgentFactory';
