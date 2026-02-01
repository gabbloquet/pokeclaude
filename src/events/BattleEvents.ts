/**
 * Définition des événements de combat
 * Architecture Event-Driven pour découpler les modules
 */

// Types d'événements
export const BATTLE_EVENTS = {
  // === Actions du joueur ===
  ACTION_SELECTED: 'battle:action:selected',
  MOVE_SELECTED: 'battle:move:selected',
  BALL_SELECTED: 'battle:ball:selected',
  ITEM_SELECTED: 'battle:item:selected',
  RUN_SELECTED: 'battle:run:selected',

  // === Résultats de combat ===
  TURN_START: 'battle:turn:start',
  TURN_END: 'battle:turn:end',
  DAMAGE_DEALT: 'battle:damage:dealt',
  CREATURE_FAINTED: 'battle:creature:fainted',
  BATTLE_END: 'battle:end',

  // === Capture ===
  CAPTURE_START: 'battle:capture:start',
  CAPTURE_SHAKE: 'battle:capture:shake',
  CAPTURE_SUCCESS: 'battle:capture:success',
  CAPTURE_FAIL: 'battle:capture:fail',

  // === Progression ===
  EXP_GAINED: 'battle:exp:gained',
  LEVEL_UP: 'battle:levelup',
  MOVE_LEARNED: 'battle:move:learned',
  EVOLUTION_START: 'battle:evolution:start',

  // === UI ===
  MESSAGE_SHOW: 'ui:message:show',
  MESSAGE_COMPLETE: 'ui:message:complete',
  MENU_SHOW: 'ui:menu:show',
  HP_UPDATE: 'ui:hp:update',

  // === Audio (préparation future) ===
  SFX_PLAY: 'audio:sfx:play',
  MUSIC_PLAY: 'audio:music:play',
  MUSIC_STOP: 'audio:music:stop',
} as const;

// Types pour le typage fort des payloads
export interface BattleEventPayloads {
  [BATTLE_EVENTS.ACTION_SELECTED]: { actionIndex: number };
  [BATTLE_EVENTS.MOVE_SELECTED]: { moveId: number };
  [BATTLE_EVENTS.BALL_SELECTED]: { ballId: number };
  [BATTLE_EVENTS.ITEM_SELECTED]: { itemId: number };
  [BATTLE_EVENTS.RUN_SELECTED]: undefined;

  [BATTLE_EVENTS.DAMAGE_DEALT]: {
    target: 'player' | 'enemy';
    damage: number;
    isCritical: boolean;
    effectiveness: number;
  };
  [BATTLE_EVENTS.CREATURE_FAINTED]: { target: 'player' | 'enemy' };
  [BATTLE_EVENTS.BATTLE_END]: { result: 'victory' | 'defeat' | 'escape' | 'capture' };

  [BATTLE_EVENTS.CAPTURE_START]: { ballId: number };
  [BATTLE_EVENTS.CAPTURE_SHAKE]: { shakeNumber: number };
  [BATTLE_EVENTS.CAPTURE_SUCCESS]: { creatureId: string };
  [BATTLE_EVENTS.CAPTURE_FAIL]: undefined;

  [BATTLE_EVENTS.EXP_GAINED]: { creatureId: string; amount: number };
  [BATTLE_EVENTS.LEVEL_UP]: { creatureId: string; newLevel: number };
  [BATTLE_EVENTS.MOVE_LEARNED]: { creatureId: string; moveId: number };

  [BATTLE_EVENTS.MESSAGE_SHOW]: { text: string; duration?: number };
  [BATTLE_EVENTS.MESSAGE_COMPLETE]: undefined;
  [BATTLE_EVENTS.MENU_SHOW]: { menu: 'action' | 'move' | 'ball' | 'item' | 'bag' | 'none' };
  [BATTLE_EVENTS.HP_UPDATE]: {
    target: 'player' | 'enemy';
    currentHp: number;
    maxHp: number;
  };

  [BATTLE_EVENTS.SFX_PLAY]: { sfx: string };
  [BATTLE_EVENTS.MUSIC_PLAY]: { track: string; loop?: boolean };
  [BATTLE_EVENTS.MUSIC_STOP]: undefined;
}

// Type helper pour les événements
export type BattleEventType = keyof typeof BATTLE_EVENTS;
export type BattleEventName = (typeof BATTLE_EVENTS)[BattleEventType];
