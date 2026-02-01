import Phaser from 'phaser';

export interface HealthBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  maxValue: number;
  currentValue: number;
  showText?: boolean;
}

export class HealthBar {
  private scene: Phaser.Scene;
  private background: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private text?: Phaser.GameObjects.Text;

  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private maxValue: number;
  private currentValue: number;

  constructor(scene: Phaser.Scene, config: HealthBarConfig) {
    this.scene = scene;
    this.x = config.x;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.maxValue = config.maxValue;
    this.currentValue = config.currentValue;

    // Create background
    this.background = scene.add.graphics();
    this.background.fillStyle(0x333333, 1);
    this.background.fillRect(this.x, this.y, this.width, this.height);

    // Create bar
    this.bar = scene.add.graphics();
    this.draw();

    // Create text if enabled
    if (config.showText) {
      this.text = scene.add.text(
        this.x + this.width + 5,
        this.y + this.height / 2,
        `${this.currentValue}/${this.maxValue}`,
        {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#ffffff',
        }
      );
      this.text.setOrigin(0, 0.5);
    }
  }

  setValue(value: number): void {
    this.currentValue = Math.max(0, Math.min(this.maxValue, value));
    this.draw();
    this.updateText();
  }

  setMaxValue(value: number): void {
    this.maxValue = value;
    this.draw();
    this.updateText();
  }

  animateToValue(value: number, duration: number = 500): void {
    const targetValue = Math.max(0, Math.min(this.maxValue, value));
    const startValue = this.currentValue;

    this.scene.tweens.addCounter({
      from: startValue,
      to: targetValue,
      duration,
      onUpdate: (tween) => {
        const value = tween.getValue();
        if (value !== null) {
          this.currentValue = Math.round(value);
          this.draw();
          this.updateText();
        }
      },
    });
  }

  private draw(): void {
    this.bar.clear();

    const ratio = this.currentValue / this.maxValue;
    const barWidth = (this.width - 2) * ratio;

    // Determine color based on health percentage
    let color = 0x00ff00; // Green
    if (ratio < 0.5) color = 0xffff00; // Yellow
    if (ratio < 0.2) color = 0xff0000; // Red

    this.bar.fillStyle(color, 1);
    this.bar.fillRect(this.x + 1, this.y + 1, barWidth, this.height - 2);
  }

  private updateText(): void {
    if (this.text) {
      this.text.setText(`${this.currentValue}/${this.maxValue}`);
    }
  }

  destroy(): void {
    this.background.destroy();
    this.bar.destroy();
    if (this.text) {
      this.text.destroy();
    }
  }

  setPosition(x: number, y: number): void {
    const dx = x - this.x;
    const dy = y - this.y;

    this.x = x;
    this.y = y;

    this.background.clear();
    this.background.fillStyle(0x333333, 1);
    this.background.fillRect(this.x, this.y, this.width, this.height);

    this.draw();

    if (this.text) {
      this.text.setPosition(this.text.x + dx, this.text.y + dy);
    }
  }

  setVisible(visible: boolean): void {
    this.background.setVisible(visible);
    this.bar.setVisible(visible);
    if (this.text) {
      this.text.setVisible(visible);
    }
  }

  getPercentage(): number {
    return (this.currentValue / this.maxValue) * 100;
  }
}
