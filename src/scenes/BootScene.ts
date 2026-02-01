import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Charger les assets minimaux pour l'écran de chargement
    this.load.on('complete', () => {
      this.scene.start('PreloadScene');
    });
  }

  create(): void {
    // Configuration initiale du jeu
    this.scale.refresh();
    this.scene.start('PreloadScene');
  }
}
