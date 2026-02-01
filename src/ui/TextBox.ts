import Phaser from 'phaser';

export interface TextBoxConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
  fontSize?: number;
  backgroundColor?: number;
  borderColor?: number;
  textColor?: string;
}

export class TextBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private indicator?: Phaser.GameObjects.Text;

  private config: Required<TextBoxConfig>;
  private fullText: string = '';
  private currentIndex: number = 0;
  private isTyping: boolean = false;
  private typeSpeed: number = 30;
  private onComplete?: () => void;

  constructor(scene: Phaser.Scene, config: TextBoxConfig) {
    this.scene = scene;
    this.config = {
      padding: 15,
      fontSize: 16,
      backgroundColor: 0xf8f8f8,
      borderColor: 0x333333,
      textColor: '#000000',
      ...config,
    };

    this.container = scene.add.container(config.x, config.y);

    // Create background
    this.background = scene.add.graphics();
    this.background.fillStyle(this.config.backgroundColor, 1);
    this.background.fillRoundedRect(0, 0, config.width, config.height, 8);
    this.background.lineStyle(3, this.config.borderColor);
    this.background.strokeRoundedRect(0, 0, config.width, config.height, 8);
    this.container.add(this.background);

    // Create text
    this.text = scene.add.text(
      this.config.padding,
      this.config.padding,
      '',
      {
        fontFamily: 'Arial',
        fontSize: `${this.config.fontSize}px`,
        color: this.config.textColor,
        wordWrap: { width: config.width - this.config.padding * 2 },
        lineSpacing: 4,
      }
    );
    this.container.add(this.text);

    // Create continue indicator
    this.indicator = scene.add.text(
      config.width - 20,
      config.height - 20,
      '▼',
      {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#333333',
      }
    );
    this.indicator.setVisible(false);
    this.container.add(this.indicator);

    // Blinking animation for indicator
    scene.tweens.add({
      targets: this.indicator,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  showText(text: string, onComplete?: () => void): void {
    this.fullText = text;
    this.currentIndex = 0;
    this.text.setText('');
    this.isTyping = true;
    this.onComplete = onComplete;
    this.indicator?.setVisible(false);

    this.typeNextCharacter();
  }

  private typeNextCharacter(): void {
    if (!this.isTyping) return;

    if (this.currentIndex < this.fullText.length) {
      this.currentIndex++;
      this.text.setText(this.fullText.substring(0, this.currentIndex));

      this.scene.time.delayedCall(this.typeSpeed, () => {
        this.typeNextCharacter();
      });
    } else {
      this.isTyping = false;
      this.indicator?.setVisible(true);
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  skipToEnd(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.text.setText(this.fullText);
      this.indicator?.setVisible(true);
    }
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }

  isAnimating(): boolean {
    return this.isTyping;
  }

  setTypeSpeed(speed: number): void {
    this.typeSpeed = speed;
  }

  clear(): void {
    this.text.setText('');
    this.fullText = '';
    this.currentIndex = 0;
    this.isTyping = false;
    this.indicator?.setVisible(false);
  }
}
