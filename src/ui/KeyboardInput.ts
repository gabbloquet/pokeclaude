import Phaser from 'phaser';
import { INTRO_COLORS, INTRO_UI, KEYBOARD_CHARS } from '@/config/intro.config';

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
  private keys: Phaser.GameObjects.Container[][] = [];
  private nameDisplay!: Phaser.GameObjects.Text;
  private nameBox!: Phaser.GameObjects.Graphics;
  private cursorX: number = 0;
  private cursorY: number = 0;
  private currentName: string = '';
  private maxLength: number;
  private minLength: number;
  private onConfirm?: (name: string) => void;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private inputCooldown: boolean = false;
  private physicalKeyboardListener?: (event: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene, config: KeyboardInputConfig) {
    this.scene = scene;
    this.maxLength = config.maxLength || 10;
    this.minLength = config.minLength || 1;
    this.onConfirm = config.onConfirm;

    this.container = scene.add.container(config.x, config.y);

    // Créer la zone d'affichage du nom
    this.createNameDisplay();

    // Créer le clavier
    this.createKeyboard();

    // Setup des contrôles
    this.setupControls();

    // Mettre à jour le curseur initial
    this.updateCursor();
  }

  private createNameDisplay(): void {
    const boxWidth = INTRO_UI.keyboard.columns * (INTRO_UI.keyboard.keySize + INTRO_UI.keyboard.keySpacing);

    // Boîte du nom
    this.nameBox = this.scene.add.graphics();
    this.nameBox.fillStyle(0xffffff, 1);
    this.nameBox.fillRoundedRect(0, -80, boxWidth, 50, 8);
    this.nameBox.lineStyle(3, INTRO_COLORS.textBoxBorder);
    this.nameBox.strokeRoundedRect(0, -80, boxWidth, 50, 8);
    this.container.add(this.nameBox);

    // Texte du nom
    this.nameDisplay = this.scene.add.text(boxWidth / 2, -55, '_', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#000000',
    });
    this.nameDisplay.setOrigin(0.5);
    this.container.add(this.nameDisplay);

    // Label
    const label = this.scene.add.text(boxWidth / 2, -100, 'TON NOM', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
    });
    label.setOrigin(0.5);
    this.container.add(label);
  }

  private createKeyboard(): void {
    const { keySize, keySpacing } = INTRO_UI.keyboard;

    KEYBOARD_CHARS.forEach((row, rowIndex) => {
      this.keys[rowIndex] = [];

      row.forEach((char, colIndex) => {
        const x = colIndex * (keySize + keySpacing);
        const y = rowIndex * (keySize + keySpacing);

        const keyContainer = this.scene.add.container(x, y);

        // Fond de la touche
        const bg = this.scene.add.graphics();
        bg.fillStyle(INTRO_COLORS.keyboard.key, 1);
        bg.fillRoundedRect(0, 0, keySize, keySize, 4);
        bg.lineStyle(2, INTRO_COLORS.keyboard.keyBorder);
        bg.strokeRoundedRect(0, 0, keySize, keySize, 4);
        keyContainer.add(bg);

        // Texte de la touche
        let displayChar = char;
        if (char === ' ') displayChar = 'ESP';
        if (char === 'DEL') displayChar = '<-';

        const text = this.scene.add.text(keySize / 2, keySize / 2, displayChar, {
          fontFamily: 'Arial',
          fontSize: char.length > 1 ? '12px' : '18px',
          color: '#000000',
        });
        text.setOrigin(0.5);
        keyContainer.add(text);

        // Stocker les références
        keyContainer.setData('char', char);
        keyContainer.setData('bg', bg);

        this.keys[rowIndex][colIndex] = keyContainer;
        this.container.add(keyContainer);
      });
    });
  }

  private setupControls(): void {
    if (!this.scene.input.keyboard) return;

    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Navigation avec les flèches
    this.cursors.up.on('down', () => this.moveCursor(0, -1));
    this.cursors.down.on('down', () => this.moveCursor(0, 1));
    this.cursors.left.on('down', () => this.moveCursor(-1, 0));
    this.cursors.right.on('down', () => this.moveCursor(1, 0));
    this.enterKey.on('down', () => this.selectKey());
    this.escKey.on('down', () => this.deleteLast());

    // Support clavier physique pour la saisie directe
    this.physicalKeyboardListener = (event: KeyboardEvent) => {
      if (this.inputCooldown) return;

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

    window.addEventListener('keydown', this.physicalKeyboardListener);
  }

  private moveCursor(dx: number, dy: number): void {
    if (this.inputCooldown) return;

    this.inputCooldown = true;
    this.scene.time.delayedCall(100, () => {
      this.inputCooldown = false;
    });

    const newX = this.cursorX + dx;
    const newY = this.cursorY + dy;

    // Gestion des limites
    if (newY >= 0 && newY < KEYBOARD_CHARS.length) {
      this.cursorY = newY;
    }
    if (newX >= 0 && newX < KEYBOARD_CHARS[this.cursorY].length) {
      this.cursorX = newX;
    }

    // Wraparound horizontal
    if (newX < 0) {
      this.cursorX = KEYBOARD_CHARS[this.cursorY].length - 1;
    } else if (newX >= KEYBOARD_CHARS[this.cursorY].length) {
      this.cursorX = 0;
    }

    // Skip les touches doubles (DEL, OK)
    const currentChar = KEYBOARD_CHARS[this.cursorY][this.cursorX];
    if (currentChar === KEYBOARD_CHARS[this.cursorY][this.cursorX - 1] && dx > 0) {
      this.moveCursor(dx, 0);
      return;
    }

    this.updateCursor();
  }

  private updateCursor(): void {
    // Reset toutes les touches
    this.keys.forEach((row) => {
      row.forEach((keyContainer) => {
        const bg = keyContainer.getData('bg') as Phaser.GameObjects.Graphics;
        bg.clear();
        bg.fillStyle(INTRO_COLORS.keyboard.key, 1);
        bg.fillRoundedRect(0, 0, INTRO_UI.keyboard.keySize, INTRO_UI.keyboard.keySize, 4);
        bg.lineStyle(2, INTRO_COLORS.keyboard.keyBorder);
        bg.strokeRoundedRect(0, 0, INTRO_UI.keyboard.keySize, INTRO_UI.keyboard.keySize, 4);
      });
    });

    // Highlight la touche sélectionnée
    const selectedKey = this.keys[this.cursorY][this.cursorX];
    const char = selectedKey.getData('char') as string;
    const bg = selectedKey.getData('bg') as Phaser.GameObjects.Graphics;

    bg.clear();
    bg.fillStyle(INTRO_COLORS.keyboard.keySelected, 1);
    bg.fillRoundedRect(0, 0, INTRO_UI.keyboard.keySize, INTRO_UI.keyboard.keySize, 4);
    bg.lineStyle(3, 0x000000);
    bg.strokeRoundedRect(0, 0, INTRO_UI.keyboard.keySize, INTRO_UI.keyboard.keySize, 4);

    // Highlight aussi la touche jumelle (DEL, OK)
    if (char === 'DEL' || char === 'OK') {
      const neighborX = char === 'DEL' ? this.cursorX + 1 : this.cursorX - 1;
      if (neighborX >= 0 && neighborX < KEYBOARD_CHARS[this.cursorY].length) {
        const neighborKey = this.keys[this.cursorY][neighborX];
        if (neighborKey.getData('char') === char) {
          const neighborBg = neighborKey.getData('bg') as Phaser.GameObjects.Graphics;
          neighborBg.clear();
          neighborBg.fillStyle(INTRO_COLORS.keyboard.keySelected, 1);
          neighborBg.fillRoundedRect(0, 0, INTRO_UI.keyboard.keySize, INTRO_UI.keyboard.keySize, 4);
          neighborBg.lineStyle(3, 0x000000);
          neighborBg.strokeRoundedRect(0, 0, INTRO_UI.keyboard.keySize, INTRO_UI.keyboard.keySize, 4);
        }
      }
    }
  }

  private selectKey(): void {
    const selectedKey = this.keys[this.cursorY][this.cursorX];
    const char = selectedKey.getData('char') as string;

    if (char === 'DEL') {
      this.deleteLast();
    } else if (char === 'OK') {
      this.confirmName();
    } else {
      this.addCharacter(char);
    }
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
    this.nameDisplay.setText(this.currentName + (this.currentName.length < this.maxLength ? '_' : ''));
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
    // Nettoyer les listeners
    if (this.physicalKeyboardListener) {
      window.removeEventListener('keydown', this.physicalKeyboardListener);
    }

    this.cursors.up.removeAllListeners();
    this.cursors.down.removeAllListeners();
    this.cursors.left.removeAllListeners();
    this.cursors.right.removeAllListeners();
    this.enterKey.removeAllListeners();
    this.escKey.removeAllListeners();

    this.container.destroy();
  }
}
