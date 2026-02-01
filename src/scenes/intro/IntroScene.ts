import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';
import { INTRO_COLORS, INTRO_UI, INTRO_TIMINGS } from '@/config/intro.config';
import { INTRO_DIALOGUES } from '@/data/dialogues/intro';
import { TextBox } from '@/ui/TextBox';

export class IntroScene extends Phaser.Scene {
  private textBox!: TextBox;
  private professor!: Phaser.GameObjects.Sprite;
  private creature!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.Graphics;
  private dialogueIndex: number = 0;
  private dialogues: string[] = INTRO_DIALOGUES.professor.welcome;
  private isWaitingForInput: boolean = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.dialogueIndex = 0;
    this.isWaitingForInput = false;

    // Fond
    this.createBackground();

    // Créer le professeur (invisible au départ)
    this.createProfessor();

    // Créer la créature exemple (invisible au départ)
    this.createCreature();

    // TextBox
    this.textBox = new TextBox(this, {
      x: INTRO_UI.textBox.x,
      y: INTRO_UI.textBox.y,
      width: INTRO_UI.textBox.width,
      height: INTRO_UI.textBox.height,
      fontSize: 18,
    });
    this.textBox.setVisible(false);

    // Contrôles
    if (this.input.keyboard) {
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // Démarrer la séquence
    this.startIntroSequence();
  }

  private createBackground(): void {
    this.background = this.add.graphics();

    // Gradient-like background
    this.background.fillStyle(INTRO_COLORS.background, 1);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ajouter quelques détails
    this.background.fillStyle(INTRO_COLORS.backgroundGradient, 0.5);
    this.background.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);
  }

  private createProfessor(): void {
    // Utiliser le sprite player temporairement pour le professeur
    // (Frame 0 = face vers le bas)
    this.professor = this.add.sprite(
      INTRO_UI.professor.x,
      INTRO_UI.professor.y,
      'player',
      0
    );
    this.professor.setScale(INTRO_UI.professor.scale);
    this.professor.setAlpha(0);
  }

  private createCreature(): void {
    this.creature = this.add.sprite(
      INTRO_UI.creature.x,
      INTRO_UI.creature.y,
      'creature_sparkit'
    );
    this.creature.setScale(INTRO_UI.creature.scale);
    this.creature.setAlpha(0);
  }

  private startIntroSequence(): void {
    // Fade in
    this.cameras.main.fadeIn(INTRO_TIMINGS.fadeIn, 0, 0, 0);

    // Faire apparaître le professeur après le fade
    this.time.delayedCall(INTRO_TIMINGS.fadeIn, () => {
      this.tweens.add({
        targets: this.professor,
        alpha: 1,
        duration: INTRO_TIMINGS.professorAppear,
        onComplete: () => {
          // Afficher la textbox et commencer les dialogues
          this.textBox.setVisible(true);
          this.showNextDialogue();
        },
      });
    });
  }

  private showNextDialogue(): void {
    if (this.dialogueIndex >= this.dialogues.length) {
      this.endIntro();
      return;
    }

    const currentText = this.dialogues[this.dialogueIndex];

    // Faire apparaître la créature quand on parle d'elles
    if (currentText.includes('Créatures') && this.creature.alpha === 0) {
      this.tweens.add({
        targets: this.creature,
        alpha: 1,
        duration: INTRO_TIMINGS.creatureAppear,
      });
    }

    this.textBox.showText(currentText, () => {
      this.isWaitingForInput = true;
    });

    this.dialogueIndex++;
  }

  update(): void {
    if (this.isWaitingForInput) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) ||
          Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.isWaitingForInput = false;

        if (this.textBox.isAnimating()) {
          this.textBox.skipToEnd();
          this.isWaitingForInput = true;
        } else {
          this.showNextDialogue();
        }
      }
    }
  }

  private endIntro(): void {
    // Fade out et transition vers NameInputScene
    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.textBox.destroy();
      this.scene.start('NameInputScene');
    });
  }
}
