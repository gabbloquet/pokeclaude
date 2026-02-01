import Phaser from 'phaser';
import { TILE_SIZE } from '@/config/game.config';
import type { Direction } from '@/types/game.types';

export class Player {
  public sprite: Phaser.GameObjects.Sprite;
  public shadow: Phaser.GameObjects.Ellipse;
  public gridCol: number;
  public gridRow: number;
  public isMoving: boolean = false;
  private direction: Direction = 'down';
  private scene: Phaser.Scene;
  private moveSpeed: number = 180; // ms per tile (slightly slower for smoother feel)

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gridCol: number,
    gridRow: number
  ) {
    this.scene = scene;
    this.gridCol = gridCol;
    this.gridRow = gridRow;

    // Create player sprite (anchored at bottom center so feet touch ground)
    this.sprite = scene.add.sprite(x, y, 'player');
    this.sprite.setOrigin(0.5, 0.85); // Anchor near the feet
    this.sprite.setDepth(10);
    this.sprite.play('idle_down');

    // Create shadow under player (at feet level)
    this.shadow = scene.add.ellipse(x, y + 2, 14, 5, 0x000000, 0.2);
    this.shadow.setDepth(9);
  }

  moveTo(targetCol: number, targetRow: number, onComplete?: () => void): void {
    if (this.isMoving) return;

    this.isMoving = true;

    // Update direction and play walk animation
    const dx = targetCol - this.gridCol;
    const dy = targetRow - this.gridRow;
    this.updateDirection(dx, dy);
    this.playWalkAnimation();

    const targetX = targetCol * TILE_SIZE + TILE_SIZE / 2;
    const targetY = targetRow * TILE_SIZE + TILE_SIZE / 2;

    // Move player with smooth easing
    this.scene.tweens.add({
      targets: [this.sprite, this.shadow],
      x: targetX,
      duration: this.moveSpeed,
      ease: 'Sine.easeInOut',
    });

    // Move Y separately for sprite (with slight bob) and shadow
    this.scene.tweens.add({
      targets: this.sprite,
      y: targetY,
      duration: this.moveSpeed,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.gridCol = targetCol;
        this.gridRow = targetRow;
        this.isMoving = false;
        this.playIdleAnimation();
        if (onComplete) onComplete();
      },
    });

    // Shadow follows at fixed offset (just below feet)
    this.scene.tweens.add({
      targets: this.shadow,
      y: targetY + 2,
      duration: this.moveSpeed,
      ease: 'Sine.easeInOut',
    });
  }

  faceDirection(dx: number, dy: number): void {
    this.updateDirection(dx, dy);
    this.playIdleAnimation();

    // Small "bump" animation when hitting a wall
    const bumpX = dx * 3;
    const bumpY = dy * 3;

    this.scene.tweens.add({
      targets: [this.sprite, this.shadow],
      x: `+=${bumpX}`,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.scene.tweens.add({
      targets: this.sprite,
      y: `+=${bumpY}`,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    this.scene.tweens.add({
      targets: this.shadow,
      y: `+=${bumpY}`,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private updateDirection(dx: number, dy: number): void {
    if (dx < 0) this.direction = 'left';
    else if (dx > 0) this.direction = 'right';
    else if (dy < 0) this.direction = 'up';
    else if (dy > 0) this.direction = 'down';
  }

  private playWalkAnimation(): void {
    this.sprite.play(`walk_${this.direction}`, true);
  }

  private playIdleAnimation(): void {
    this.sprite.play(`idle_${this.direction}`, true);
  }

  getDirection(): Direction {
    return this.direction;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  getGridPosition(): { col: number; row: number } {
    return { col: this.gridCol, row: this.gridRow };
  }
}
