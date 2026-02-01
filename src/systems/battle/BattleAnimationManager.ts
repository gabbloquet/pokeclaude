import Phaser from 'phaser';
import {
  BATTLE_POSITIONS,
  ANIMATION_TIMINGS,
  SPRITE_SCALES,
} from '@/config/ui.config';
import { GAME_HEIGHT } from '@/config/game.config';

/**
 * Gestionnaire des animations de combat (principalement capture)
 */
export class BattleAnimationManager {
  private scene: Phaser.Scene;
  private ballSprite: Phaser.GameObjects.Image | null = null;
  private captureStars: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createTextures();
  }

  /**
   * Crée les textures nécessaires pour les animations
   */
  private createTextures(): void {
    this.createBallTexture();
    this.createStarTexture();
  }

  private createBallTexture(): void {
    if (this.scene.textures.exists('capture_ball')) return;

    const graphics = this.scene.make.graphics({ x: 0, y: 0 });
    // Partie haute (rouge)
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(16, 16, 14);
    // Partie basse (blanche)
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(2, 16, 28, 14);
    graphics.fillCircle(16, 16, 14);
    graphics.fillStyle(0xff0000, 1);
    graphics.beginPath();
    graphics.arc(16, 16, 14, Math.PI, 0, false);
    graphics.fill();
    // Ligne centrale
    graphics.fillStyle(0x333333, 1);
    graphics.fillRect(2, 14, 28, 4);
    // Bouton central
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(16, 16, 5);
    graphics.lineStyle(2, 0x333333);
    graphics.strokeCircle(16, 16, 5);
    // Contour
    graphics.lineStyle(2, 0x333333);
    graphics.strokeCircle(16, 16, 14);
    graphics.generateTexture('capture_ball', 32, 32);
    graphics.destroy();
  }

  private createStarTexture(): void {
    if (this.scene.textures.exists('capture_star')) return;

    const starGraphics = this.scene.make.graphics({ x: 0, y: 0 });
    starGraphics.fillStyle(0xffff00, 1);

    const cx = 8, cy = 8, spikes = 5, outerRadius = 8, innerRadius = 4;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;

    starGraphics.beginPath();
    starGraphics.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      const x1 = cx + Math.cos(rot) * outerRadius;
      const y1 = cy + Math.sin(rot) * outerRadius;
      starGraphics.lineTo(x1, y1);
      rot += step;
      const x2 = cx + Math.cos(rot) * innerRadius;
      const y2 = cy + Math.sin(rot) * innerRadius;
      starGraphics.lineTo(x2, y2);
      rot += step;
    }
    starGraphics.lineTo(cx, cy - outerRadius);
    starGraphics.closePath();
    starGraphics.fillPath();
    starGraphics.generateTexture('capture_star', 16, 16);
    starGraphics.destroy();
  }

  /**
   * Joue l'animation complète de capture
   */
  async playCaptureAnimation(
    enemySprite: Phaser.GameObjects.Image,
    shakeCount: number,
    success: boolean
  ): Promise<void> {
    const enemyX = enemySprite.x;
    const enemyY = enemySprite.y;

    // Phase 1: Lancer la ball vers l'ennemi
    this.ballSprite = this.scene.add.image(
      BATTLE_POSITIONS.playerCreature.x,
      GAME_HEIGHT * 0.6,
      'capture_ball'
    );
    this.ballSprite.setScale(SPRITE_SCALES.captureBall);

    await this.animateBallThrow(enemyX, enemyY);

    // Phase 2: Flash et disparition de la créature
    await this.animateCreatureCapture(enemySprite, enemyX, enemyY);

    // Phase 3: La ball tombe au sol
    await this.animateBallDrop();

    // Phase 4: Secousses
    for (let i = 0; i < shakeCount && i < 3; i++) {
      await this.playBallShake();
      await this.delay(ANIMATION_TIMINGS.shakeDelay);
    }

    // Phase 5: Résultat
    if (success) {
      await this.playSuccessAnimation();
    } else {
      await this.playFailureAnimation(enemySprite);
    }
  }

  private async animateBallThrow(targetX: number, targetY: number): Promise<void> {
    if (!this.ballSprite) return;

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this.ballSprite,
        x: targetX,
        y: targetY - 30,
        scale: SPRITE_SCALES.captureBallThrown,
        duration: ANIMATION_TIMINGS.ballThrow,
        ease: 'Quad.easeOut',
        onComplete: () => resolve(),
      });
    });
  }

  private async animateCreatureCapture(
    enemySprite: Phaser.GameObjects.Image,
    x: number,
    y: number
  ): Promise<void> {
    // Flash blanc
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillCircle(x, y, 50);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: ANIMATION_TIMINGS.ballFlash,
      onComplete: () => flash.destroy(),
    });

    // Réduction et disparition de la créature
    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: enemySprite,
        scale: 0,
        alpha: 0,
        duration: ANIMATION_TIMINGS.creatureShrink,
        ease: 'Quad.easeIn',
        onComplete: () => resolve(),
      });
    });
  }

  private async animateBallDrop(): Promise<void> {
    if (!this.ballSprite) return;

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this.ballSprite,
        y: BATTLE_POSITIONS.captureGround.y,
        duration: ANIMATION_TIMINGS.ballBounce,
        ease: 'Bounce.easeOut',
        onComplete: () => resolve(),
      });
    });
  }

  private async playBallShake(): Promise<void> {
    if (!this.ballSprite) return;

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this.ballSprite,
        angle: -ANIMATION_TIMINGS.shakeAngle,
        duration: ANIMATION_TIMINGS.ballShake,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 1,
        onComplete: () => resolve(),
      });
    });
  }

  private async playSuccessAnimation(): Promise<void> {
    if (!this.ballSprite) return;

    // Effet de "clic"
    const clickEffect = this.scene.add.graphics();
    clickEffect.fillStyle(0xffff00, 0.8);
    clickEffect.fillCircle(this.ballSprite.x, this.ballSprite.y, 5);

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: clickEffect,
        scale: 2,
        alpha: 0,
        duration: ANIMATION_TIMINGS.successClick,
        onComplete: () => {
          clickEffect.destroy();
          resolve();
        },
      });
    });

    // Étoiles
    const starPositions = [
      { x: -30, y: -20 },
      { x: 30, y: -20 },
      { x: -20, y: -40 },
      { x: 20, y: -40 },
      { x: 0, y: -50 },
    ];

    for (const pos of starPositions) {
      const star = this.scene.add.image(
        this.ballSprite.x + pos.x,
        this.ballSprite.y + pos.y,
        'capture_star'
      );
      star.setScale(0);
      this.captureStars.push(star);

      this.scene.tweens.add({
        targets: star,
        scale: 1,
        y: star.y - 20,
        alpha: { from: 1, to: 0 },
        duration: ANIMATION_TIMINGS.successStar,
        delay: Math.random() * 200,
        onComplete: () => star.destroy(),
      });
    }

    await this.delay(600);

    // Nettoyage
    this.cleanup();
  }

  private async playFailureAnimation(enemySprite: Phaser.GameObjects.Image): Promise<void> {
    if (!this.ballSprite) return;

    // La ball s'ouvre
    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: this.ballSprite,
        scale: 1.5,
        duration: ANIMATION_TIMINGS.failureOpen,
        ease: 'Quad.easeOut',
        onComplete: () => resolve(),
      });
    });

    // Flash
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillCircle(this.ballSprite!.x, this.ballSprite!.y, 30);

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: ANIMATION_TIMINGS.ballFlash,
        onComplete: () => {
          flash.destroy();
          resolve();
        },
      });
    });

    // Réapparition de la créature
    enemySprite.setScale(0);
    enemySprite.setAlpha(1);

    await new Promise<void>(resolve => {
      this.scene.tweens.add({
        targets: enemySprite,
        scale: SPRITE_SCALES.enemyCreature,
        duration: ANIMATION_TIMINGS.failureReappear,
        ease: 'Back.easeOut',
        onComplete: () => resolve(),
      });
    });

    // La ball disparaît
    if (this.ballSprite) {
      this.scene.tweens.add({
        targets: this.ballSprite,
        alpha: 0,
        scale: 0,
        duration: ANIMATION_TIMINGS.failureBallFade,
        onComplete: () => {
          this.ballSprite?.destroy();
          this.ballSprite = null;
        },
      });
    }

    await this.delay(ANIMATION_TIMINGS.failureReappear);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
  }

  private cleanup(): void {
    if (this.ballSprite) {
      this.ballSprite.destroy();
      this.ballSprite = null;
    }
    this.captureStars = [];
  }

  /**
   * Nettoie toutes les ressources
   */
  destroy(): void {
    this.cleanup();
  }
}
