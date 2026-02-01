import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { WorldScene } from '@/scenes/WorldScene';
import { BattleScene } from '@/scenes/BattleScene';
import { MoveLearnScene } from '@/scenes/MoveLearnScene';
import { EvolutionScene } from '@/scenes/EvolutionScene';
import { PauseMenuScene } from '@/scenes/PauseMenuScene';
import { IntroScene } from '@/scenes/intro/IntroScene';
import { NameInputScene } from '@/scenes/intro/NameInputScene';
import { HomeScene } from '@/scenes/intro/HomeScene';
import { TownScene } from '@/scenes/intro/TownScene';
import { StarterSelectScene } from '@/scenes/intro/StarterSelectScene';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 32;
export const SCALE_FACTOR = 2;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    PreloadScene,
    IntroScene,
    NameInputScene,
    HomeScene,
    TownScene,
    StarterSelectScene,
    WorldScene,
    BattleScene,
    MoveLearnScene,
    EvolutionScene,
    PauseMenuScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  backgroundColor: '#2d2d2d',
};
