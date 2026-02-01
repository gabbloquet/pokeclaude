import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';
import { INTRO_COLORS, INTRO_UI, INTRO_TIMINGS } from '@/config/intro.config';
import { INTRO_DIALOGUES } from '@/data/dialogues/intro';
import { TextBox } from '@/ui/TextBox';
import { KeyboardInput } from '@/ui/KeyboardInput';
import { useGameStore } from '@/store/gameStore';

type ConfirmState = 'input' | 'confirming';

export class NameInputScene extends Phaser.Scene {
  private textBox!: TextBox;
  private keyboard!: KeyboardInput;
  private professor!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.Graphics;
  private confirmMenu!: Phaser.GameObjects.Container;
  private confirmOptions!: Phaser.GameObjects.Text[];
  private selectedConfirmIndex: number = 0;
  private state: ConfirmState = 'input';
  private pendingName: string = '';
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private afterDialogues: string[] = [];
  private afterDialogueIndex: number = 0;
  private waitingForDialogueInput: boolean = false;

  constructor() {
    super({ key: 'NameInputScene' });
  }

  create(): void {
    this.state = 'input';
    this.selectedConfirmIndex = 0;

    // Fond
    this.createBackground();

    // Professeur
    this.professor = this.add.sprite(
      GAME_WIDTH / 2,
      120,
      'player',
      0
    );
    this.professor.setScale(2.5);

    // Question du professeur
    this.textBox = new TextBox(this, {
      x: 50,
      y: 180,
      width: GAME_WIDTH - 100,
      height: 60,
      fontSize: 16,
    });
    this.textBox.showText('Quel est ton nom ?');

    // Clavier
    this.keyboard = new KeyboardInput(this, {
      x: INTRO_UI.keyboard.x,
      y: INTRO_UI.keyboard.y + 30,
      maxLength: INTRO_UI.nameInput.maxLength,
      minLength: INTRO_UI.nameInput.minLength,
      onConfirm: (name) => this.showConfirmation(name),
    });

    // Menu de confirmation (caché)
    this.createConfirmMenu();

    // Contrôles pour la confirmation
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // Fade in
    this.cameras.main.fadeIn(INTRO_TIMINGS.fadeIn / 2, 0, 0, 0);
  }

  private createBackground(): void {
    this.background = this.add.graphics();
    this.background.fillStyle(INTRO_COLORS.background, 1);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.background.fillStyle(INTRO_COLORS.backgroundGradient, 0.5);
    this.background.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);
  }

  private createConfirmMenu(): void {
    this.confirmMenu = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    this.confirmMenu.setVisible(false);

    // Fond du menu
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-80, -40, 160, 80, 8);
    bg.lineStyle(3, INTRO_COLORS.textBoxBorder);
    bg.strokeRoundedRect(-80, -40, 160, 80, 8);
    this.confirmMenu.add(bg);

    // Options
    this.confirmOptions = [];

    const yesText = this.add.text(-40, -20, INTRO_DIALOGUES.confirmMenu.yes, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#000000',
    });
    this.confirmOptions.push(yesText);
    this.confirmMenu.add(yesText);

    const noText = this.add.text(-40, 10, INTRO_DIALOGUES.confirmMenu.no, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#000000',
    });
    this.confirmOptions.push(noText);
    this.confirmMenu.add(noText);
  }

  private showConfirmation(name: string): void {
    this.pendingName = name;
    this.state = 'confirming';

    // Cacher le clavier
    this.keyboard.setVisible(false);

    // Afficher le message de confirmation
    this.textBox.showText(`Tu t'appelles ${name} ?`);

    // Afficher le menu de confirmation
    this.confirmMenu.setVisible(true);
    this.selectedConfirmIndex = 0;
    this.updateConfirmCursor();
  }

  private updateConfirmCursor(): void {
    this.confirmOptions.forEach((option, index) => {
      if (index === this.selectedConfirmIndex) {
        option.setText('> ' + (index === 0 ? INTRO_DIALOGUES.confirmMenu.yes : INTRO_DIALOGUES.confirmMenu.no));
        option.setColor('#3498db');
      } else {
        option.setText('  ' + (index === 0 ? INTRO_DIALOGUES.confirmMenu.yes : INTRO_DIALOGUES.confirmMenu.no));
        option.setColor('#000000');
      }
    });
  }

  update(): void {
    if (this.state === 'confirming') {
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
          Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.selectedConfirmIndex = this.selectedConfirmIndex === 0 ? 1 : 0;
        this.updateConfirmCursor();
      }

      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        if (this.selectedConfirmIndex === 0) {
          this.confirmName();
        } else {
          this.cancelConfirmation();
        }
      }
    }

    // Gérer les dialogues après confirmation du nom
    if (this.waitingForDialogueInput) {
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
          Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
        if (this.textBox.isAnimating()) {
          this.textBox.skipToEnd();
        } else {
          this.advanceAfterDialogue();
        }
      }
    }
  }

  private advanceAfterDialogue(): void {
    this.waitingForDialogueInput = false;
    this.afterDialogueIndex++;

    if (this.afterDialogueIndex >= this.afterDialogues.length) {
      this.transitionToHome();
    } else {
      this.textBox.showText(this.afterDialogues[this.afterDialogueIndex], () => {
        this.waitingForDialogueInput = true;
      });
    }
  }

  private confirmName(): void {
    // Sauvegarder le nom
    useGameStore.getState().setPlayerName(this.pendingName);

    // Cacher le menu de confirmation
    this.confirmMenu.setVisible(false);

    // Montrer les dialogues d'après
    const dialogues = INTRO_DIALOGUES.professor.afterName(this.pendingName);
    this.showAfterNameDialogues(dialogues);
  }

  private showAfterNameDialogues(dialogues: string[]): void {
    this.afterDialogues = dialogues;
    this.afterDialogueIndex = 0;
    this.waitingForDialogueInput = false;

    this.textBox.showText(dialogues[0], () => {
      this.waitingForDialogueInput = true;
    });
  }

  private cancelConfirmation(): void {
    this.state = 'input';
    this.confirmMenu.setVisible(false);
    this.keyboard.setVisible(true);
    this.textBox.showText('Quel est ton nom ?');
  }

  private transitionToHome(): void {
    // Fade out et transition
    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cleanup();
      this.scene.start('HomeScene');
    });
  }

  private cleanup(): void {
    this.keyboard.destroy();
    this.textBox.destroy();
  }
}
