/**
 * Configuration centralisée pour l'UI du jeu
 */

// Constantes définies localement pour éviter les dépendances circulaires
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Couleurs par type de créature
export const TYPE_COLORS: Record<string, number> = {
  fire: 0xf08030,
  water: 0x6890f0,
  grass: 0x78c850,
  electric: 0xf8d030,
  normal: 0xa8a878,
  ice: 0x98d8d8,
  fighting: 0xc03028,
  poison: 0xa040a0,
  ground: 0xe0c068,
  flying: 0xa890f0,
  psychic: 0xf85888,
  bug: 0xa8b820,
  rock: 0xb8a038,
  ghost: 0x705898,
  dragon: 0x7038f8,
  dark: 0x705848,
  steel: 0xb8b8d0,
  fairy: 0xee99ac,
};

// Couleurs de la barre de vie
export const HP_BAR_COLORS = {
  high: 0x00ff00,    // > 50%
  medium: 0xffff00,  // 20-50%
  low: 0xff0000,     // < 20%
};

// Couleurs UI générales
export const UI_COLORS = {
  background: 0xf8f8f8,
  border: 0x333333,
  buttonDefault: 0xffffff,
  buttonHover: 0xe0e0e0,
  textPrimary: '#000000',
  textSecondary: '#666666',
  textMuted: '#999999',
  textDanger: '#ff0000',
  textLight: '#ffffff',
  overlay: 0x000000,
  overlayAlpha: 0.5,
  inputBackground: 0xf0f0f0,
  inputBorder: 0x999999,
  successButton: '#4CAF50',
  neutralButton: '#9e9e9e',
};

// Positions pour l'écran de combat
export const BATTLE_POSITIONS = {
  // Créatures
  playerCreature: {
    x: GAME_WIDTH * 0.25,
    y: GAME_HEIGHT * 0.55,
  },
  enemyCreature: {
    x: GAME_WIDTH * 0.75,
    y: GAME_HEIGHT * 0.25,
  },
  // Info boxes
  playerInfoBox: {
    x: GAME_WIDTH * 0.55,
    y: GAME_HEIGHT * 0.48,
  },
  enemyInfoBox: {
    x: GAME_WIDTH * 0.1,
    y: GAME_HEIGHT * 0.12,
  },
  // Menus
  messageBox: {
    y: GAME_HEIGHT * 0.72,
  },
  actionMenu: {
    x: GAME_WIDTH * 0.55,
    y: GAME_HEIGHT * 0.72,
  },
  moveMenu: {
    x: 10,
    y: GAME_HEIGHT * 0.72,
  },
  ballMenu: {
    x: 10,
    y: GAME_HEIGHT * 0.72,
  },
  // Animation capture
  captureGround: {
    y: GAME_HEIGHT * 0.35,
  },
};

// Dimensions UI
export const UI_DIMENSIONS = {
  infoBox: {
    width: 180,
    heightWithHpText: 60,
    heightWithoutHpText: 50,
    borderRadius: 8,
  },
  messageBox: {
    marginX: 10,
    height: 80,
    borderRadius: 8,
    padding: 20,
  },
  actionButton: {
    width: 95,
    height: 35,
    borderRadius: 6,
    gapX: 10,
    gapY: 5,
  },
  moveButton: {
    height: 35,
    borderRadius: 6,
    gapX: 10,
    gapY: 5,
  },
  hpBar: {
    width: 160,
    height: 10,
    innerWidth: 158,
    innerHeight: 8,
  },
  nicknameDialog: {
    width: 300,
    height: 160,
    borderRadius: 12,
    inputWidth: 240,
    inputHeight: 40,
    maxLength: 12,
  },
};

// Styles de texte
export const TEXT_STYLES = {
  creatureName: {
    fontFamily: 'Arial',
    fontSize: '14px',
    color: '#000000',
    fontStyle: 'bold' as const,
  },
  level: {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#666666',
  },
  hpText: {
    fontFamily: 'Arial',
    fontSize: '11px',
    color: '#333333',
  },
  message: {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#000000',
  },
  buttonLabel: {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#000000',
    fontStyle: 'bold' as const,
  },
  moveLabel: {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#ffffff',
    fontStyle: 'bold' as const,
  },
  backButton: {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#333333',
    fontStyle: 'bold' as const,
  },
  dialogTitle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    color: '#000000',
    fontStyle: 'bold' as const,
  },
  dialogInput: {
    fontFamily: 'Arial',
    fontSize: '16px',
    color: '#333333',
  },
  dialogHint: {
    fontFamily: 'Arial',
    fontSize: '10px',
    color: '#999999',
  },
  dialogButton: {
    fontFamily: 'Arial',
    fontSize: '12px',
    color: '#ffffff',
  },
};

// Timing des animations
export const ANIMATION_TIMINGS = {
  message: 1500,
  ballThrow: 500,
  ballFlash: 200,
  creatureShrink: 300,
  ballBounce: 300,
  ballShake: 150,
  successClick: 200,
  successStar: 500,
  failureOpen: 200,
  failureReappear: 300,
  failureBallFade: 200,
  shakeDelay: 300,
  shakeAngle: 15,
};

// Échelles des sprites
export const SPRITE_SCALES = {
  playerCreature: 1.5,
  enemyCreature: 1.2,
  captureBall: 0.8,
  captureBallThrown: 1,
};

/**
 * Retourne la couleur associée à un type de créature
 */
export function getTypeColor(type: string): number {
  return TYPE_COLORS[type] || 0xaaaaaa;
}

/**
 * Retourne la couleur de la barre de vie selon le pourcentage
 */
export function getHpBarColor(ratio: number): number {
  if (ratio < 0.2) return HP_BAR_COLORS.low;
  if (ratio < 0.5) return HP_BAR_COLORS.medium;
  return HP_BAR_COLORS.high;
}
