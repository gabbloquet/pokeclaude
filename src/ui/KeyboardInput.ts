import Phaser from 'phaser';
import { INTRO_COLORS } from '@/config/intro.config';

export interface KeyboardInputConfig {
  x: number;
  y: number;
  maxLength?: number;
  minLength?: number;
  onConfirm?: (name: string) => void;
  onCancel?: () => void;
}

export class KeyboardInput {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private nameDisplay!: Phaser.GameObjects.Text;
  private nameBox!: Phaser.GameObjects.Graphics;
  private hintText!: Phaser.GameObjects.Text;
  private currentName: string = '';
  private maxLength: number;
  private minLength: number;
  private onConfirm?: (name: string) => void;
  private keyboardListener?: (event: KeyboardEvent) => void;
  private cursorBlink?: Phaser.Time.TimerEvent;
  private showCursor: boolean = true;

  constructor(scene: Phaser.Scene, config: KeyboardInputConfig) {
    this.scene = scene;
    this.maxLength = config.maxLength || 10;
    this.minLength = config.minLength || 1;
    this.onConfirm = config.onConfirm;

    this.container = scene.add.container(config.x, config.y);

    // Créer la zone d'affichage du nom
    this.createNameDisplay();

    // Setup du listener clavier
    this.setupKeyboardListener();

    // Clignotement du curseur
    this.cursorBlink = scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.showCursor = !this.showCursor;
        this.updateNameDisplay();
      },
      loop: true,
    });
  }

  private createNameDisplay(): void {
    const boxWidth = 280;

    // Boîte du nom
    this.nameBox = this.scene.add.graphics();
    this.nameBox.fillStyle(0xffffff, 1);
    this.nameBox.fillRoundedRect(0, 0, boxWidth, 50, 8);
    this.nameBox.lineStyle(3, INTRO_COLORS.textBoxBorder);
    this.nameBox.strokeRoundedRect(0, 0, boxWidth, 50, 8);
    this.container.add(this.nameBox);

    // Texte du nom
    this.nameDisplay = this.scene.add.text(boxWidth / 2, 25, '_', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#000000',
    });
    this.nameDisplay.setOrigin(0.5);
    this.container.add(this.nameDisplay);

    // Label
    const label = this.scene.add.text(boxWidth / 2, -20, 'TON NOM', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    this.container.add(label);

    // Indication
    this.hintText = this.scene.add.text(boxWidth / 2, 70, 'Tape ton nom puis appuie sur Entrée', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#aaaaaa',
    });
    this.hintText.setOrigin(0.5);
    this.container.add(this.hintText);
  }

  private setupKeyboardListener(): void {
    this.keyboardListener = (event: KeyboardEvent) => {
      const key = event.key;

      if (key === 'Backspace') {
        this.deleteLast();
        event.preventDefault();
      } else if (key === 'Enter') {
        this.confirmName();
        event.preventDefault();
      } else if (key.length === 1 && /[a-zA-Z0-9 \-\.']/.test(key)) {
        this.addCharacter(key);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', this.keyboardListener);
  }

  private addCharacter(char: string): void {
    if (this.currentName.length < this.maxLength) {
      this.currentName += char;
      this.updateNameDisplay();
    }
  }

  private deleteLast(): void {
    if (this.currentName.length > 0) {
      this.currentName = this.currentName.slice(0, -1);
      this.updateNameDisplay();
    }
  }

  private updateNameDisplay(): void {
    const cursor = this.showCursor && this.currentName.length < this.maxLength ? '_' : '';
    this.nameDisplay.setText(this.currentName + cursor);

    // Mettre à jour l'indication
    if (this.currentName.length < this.minLength) {
      this.hintText.setText(`Minimum ${this.minLength} caractère${this.minLength > 1 ? 's' : ''}`);
      this.hintText.setColor('#ff6666');
    } else {
      this.hintText.setText('Appuie sur Entrée pour confirmer');
      this.hintText.setColor('#66ff66');
    }
  }

  private confirmName(): void {
    if (this.currentName.length >= this.minLength) {
      if (this.onConfirm) {
        this.onConfirm(this.currentName);
      }
    }
  }

  public getName(): string {
    return this.currentName;
  }

  public setName(name: string): void {
    this.currentName = name.slice(0, this.maxLength);
    this.updateNameDisplay();
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  public destroy(): void {
    if (this.keyboardListener) {
      window.removeEventListener('keydown', this.keyboardListener);
    }

    if (this.cursorBlink) {
      this.cursorBlink.destroy();
    }

    this.container.destroy();
  }
}
