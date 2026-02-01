import Phaser from 'phaser';
import { useGameStore } from '@/store/gameStore';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingBar();
    this.loadAssets();
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Chargement...', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  private loadAssets(): void {
    // Tiles
    this.load.image('grass', '/assets/sprites/tiles/grass.png');
    this.load.image('tallGrass', '/assets/sprites/tiles/tallGrass.png');
    this.load.image('path', '/assets/sprites/tiles/path.png');
    this.load.image('water', '/assets/sprites/tiles/water.png');
    this.load.image('wall', '/assets/sprites/tiles/wall.png');

    // Intro tiles
    this.load.image('floor_wood', '/assets/sprites/tiles/floor_wood.png');
    this.load.image('floor_tile', '/assets/sprites/tiles/floor_tile.png');
    this.load.image('stairs', '/assets/sprites/tiles/stairs.png');
    this.load.image('door', '/assets/sprites/tiles/door.png');
    this.load.image('sign', '/assets/sprites/tiles/sign.png');

    // Player spritesheet (4 frames x 4 directions)
    this.load.spritesheet('player', '/assets/sprites/player/player.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Creatures - Base forms
    this.load.image('creature_flamling', '/assets/sprites/creatures/flamling.png');
    this.load.image('creature_aqualing', '/assets/sprites/creatures/aqualing.png');
    this.load.image('creature_leafling', '/assets/sprites/creatures/leafling.png');
    this.load.image('creature_sparkit', '/assets/sprites/creatures/sparkit.png');

    // Creatures - Mid evolutions
    this.load.image('creature_flamero', '/assets/sprites/creatures/flamero.png');
    this.load.image('creature_aquaro', '/assets/sprites/creatures/aquaro.png');
    this.load.image('creature_leafero', '/assets/sprites/creatures/leafero.png');
    this.load.image('creature_sparkolt', '/assets/sprites/creatures/sparkolt.png');

    // Creatures - Final evolutions
    this.load.image('creature_flamaster', '/assets/sprites/creatures/flamaster.png');
    this.load.image('creature_aquaster', '/assets/sprites/creatures/aquaster.png');
    this.load.image('creature_leafaster', '/assets/sprites/creatures/leafaster.png');

    // UI
    this.load.image('pokeball', '/assets/sprites/ui/pokeball.png');
  }

  create(): void {
    // Create player animations
    this.createPlayerAnimations();

    // Check if intro has been completed
    const hasCompletedIntro = useGameStore.getState().progression.hasCompletedIntro;

    if (hasCompletedIntro) {
      this.scene.start('WorldScene');
    } else {
      this.scene.start('IntroScene');
    }
  }

  private createPlayerAnimations(): void {
    // Walk down
    this.anims.create({
      key: 'walk_down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    // Walk left
    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    // Walk right
    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });

    // Walk up
    this.anims.create({
      key: 'walk_up',
      frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });

    // Idle animations (single frame)
    this.anims.create({
      key: 'idle_down',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 1,
    });

    this.anims.create({
      key: 'idle_left',
      frames: [{ key: 'player', frame: 4 }],
      frameRate: 1,
    });

    this.anims.create({
      key: 'idle_right',
      frames: [{ key: 'player', frame: 8 }],
      frameRate: 1,
    });

    this.anims.create({
      key: 'idle_up',
      frames: [{ key: 'player', frame: 12 }],
      frameRate: 1,
    });
  }
}
