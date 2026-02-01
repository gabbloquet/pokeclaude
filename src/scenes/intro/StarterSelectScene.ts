import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';
import { INTRO_COLORS, INTRO_UI, INTRO_TIMINGS, STARTER_OPTIONS } from '@/config/intro.config';
import { INTRO_DIALOGUES } from '@/data/dialogues/intro';
import { TextBox } from '@/ui/TextBox';
import { useGameStore } from '@/store/gameStore';
import { creatureSpecies } from '@/data/creatures/species';
import type { CreatureInstance } from '@/types/creature.types';

type SceneState = 'intro' | 'selecting' | 'preview' | 'confirming' | 'outro';

export class StarterSelectScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Graphics;
  private professor!: Phaser.GameObjects.Sprite;
  private textBox!: TextBox;
  private pokeballs!: Phaser.GameObjects.Container[];
  private creaturePreview!: Phaser.GameObjects.Sprite;
  private previewContainer!: Phaser.GameObjects.Container;
  private confirmMenu!: Phaser.GameObjects.Container;
  private confirmOptions!: Phaser.GameObjects.Text[];

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  private state: SceneState = 'intro';
  private selectedIndex: number = 1; // Centre par défaut
  private selectedConfirmIndex: number = 0;
  private dialogueTexts: string[] = [];
  private dialogueIndex: number = 0;
  private dialogueCallback?: () => void;
  private waitingForDialogueInput: boolean = false;

  constructor() {
    super({ key: 'StarterSelectScene' });
  }

  create(): void {
    this.state = 'intro';
    this.selectedIndex = 1;

    // Fond (laboratoire simplifié)
    this.createBackground();

    // Professeur
    this.professor = this.add.sprite(GAME_WIDTH / 2, 120, 'player', 0);
    this.professor.setScale(2.5);

    // Pokéballs
    this.createPokeballs();

    // Preview de la créature (caché)
    this.createPreviewContainer();

    // Menu de confirmation (caché)
    this.createConfirmMenu();

    // TextBox
    this.textBox = new TextBox(this, {
      x: 50,
      y: GAME_HEIGHT - 140,
      width: GAME_WIDTH - 100,
      height: 110,
      fontSize: 16,
    });

    // Contrôles
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // Fade in
    this.cameras.main.fadeIn(INTRO_TIMINGS.fadeIn / 2, 0, 0, 0);

    // Démarrer l'intro
    this.startIntroDialogue();
  }

  private createBackground(): void {
    this.background = this.add.graphics();

    // Fond du labo (gris clair)
    this.background.fillStyle(0xdedede, 1);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sol carrelé
    this.background.fillStyle(0xcccccc, 1);
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      for (let y = GAME_HEIGHT / 2; y < GAME_HEIGHT; y += 40) {
        if ((x + y) % 80 === 0) {
          this.background.fillRect(x, y, 40, 40);
        }
      }
    }

    // Table avec les Pokéballs
    this.background.fillStyle(0x8B4513, 1);
    this.background.fillRect(GAME_WIDTH / 2 - 200, INTRO_UI.starterSelect.ballY - 30, 400, 60);
    this.background.fillStyle(0x654321, 1);
    this.background.fillRect(GAME_WIDTH / 2 - 200, INTRO_UI.starterSelect.ballY + 20, 400, 10);
  }

  private createPokeballs(): void {
    this.pokeballs = [];

    STARTER_OPTIONS.forEach((starter, index) => {
      const x = GAME_WIDTH / 2 + (index - 1) * INTRO_UI.starterSelect.ballSpacing;
      const y = INTRO_UI.starterSelect.ballY;

      const container = this.add.container(x, y);

      // Pokéball
      const ball = this.add.sprite(0, 0, 'pokeball');
      ball.setScale(1.5);
      container.add(ball);

      // Label du type
      const label = this.add.text(0, 35, starter.name, {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#333333',
      });
      label.setOrigin(0.5);
      container.add(label);

      container.setData('index', index);
      container.setData('ball', ball);

      this.pokeballs.push(container);
    });
  }

  private createPreviewContainer(): void {
    this.previewContainer = this.add.container(GAME_WIDTH / 2, INTRO_UI.starterSelect.previewY);
    this.previewContainer.setVisible(false);

    // Fond de la preview
    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.9);
    bg.fillRoundedRect(-120, -60, 240, 120, 10);
    bg.lineStyle(2, 0x333333);
    bg.strokeRoundedRect(-120, -60, 240, 120, 10);
    this.previewContainer.add(bg);

    // Sprite de la créature
    this.creaturePreview = this.add.sprite(-60, 0, 'creature_flamling');
    this.creaturePreview.setScale(1);
    this.previewContainer.add(this.creaturePreview);

    // Les infos seront ajoutées dynamiquement
  }

  private createConfirmMenu(): void {
    this.confirmMenu = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.confirmMenu.setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-80, -40, 160, 80, 8);
    bg.lineStyle(3, INTRO_COLORS.textBoxBorder);
    bg.strokeRoundedRect(-80, -40, 160, 80, 8);
    this.confirmMenu.add(bg);

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

  private startIntroDialogue(): void {
    this.showDialogues(INTRO_DIALOGUES.starterChoice.intro, () => {
      this.state = 'selecting';
      this.textBox.showText(INTRO_DIALOGUES.starterChoice.selectPrompt);
      this.updateSelection();
    });
  }

  private showDialogues(texts: string[], onComplete: () => void): void {
    this.dialogueTexts = texts;
    this.dialogueIndex = 0;
    this.dialogueCallback = onComplete;
    this.waitingForDialogueInput = false;

    this.textBox.showText(texts[0], () => {
      this.waitingForDialogueInput = true;
    });
  }

  private advanceDialogue(): void {
    this.waitingForDialogueInput = false;
    this.dialogueIndex++;

    if (this.dialogueIndex >= this.dialogueTexts.length) {
      this.dialogueTexts = [];
      this.dialogueIndex = 0;
      if (this.dialogueCallback) {
        const callback = this.dialogueCallback;
        this.dialogueCallback = undefined;
        callback();
      }
    } else {
      this.textBox.showText(this.dialogueTexts[this.dialogueIndex], () => {
        this.waitingForDialogueInput = true;
      });
    }
  }

  update(): void {
    switch (this.state) {
      case 'intro':
      case 'outro':
        this.handleIntroInput();
        break;
      case 'selecting':
        this.handleSelectionInput();
        break;
      case 'preview':
        this.handlePreviewInput();
        break;
      case 'confirming':
        this.handleConfirmInput();
        break;
    }
  }

  private handleIntroInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      if (this.textBox.isAnimating()) {
        this.textBox.skipToEnd();
      } else if (this.waitingForDialogueInput) {
        this.advanceDialogue();
      }
    }
  }

  private handleSelectionInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectedIndex = Math.min(2, this.selectedIndex + 1);
      this.updateSelection();
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.showPreview();
    }
  }

  private handlePreviewInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      if (this.textBox.isAnimating()) {
        this.textBox.skipToEnd();
      } else if (this.waitingForDialogueInput) {
        this.advanceDialogue();
      } else {
        this.showConfirmation();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.hidePreview();
    }
  }

  private handleConfirmInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectedConfirmIndex = this.selectedConfirmIndex === 0 ? 1 : 0;
      this.updateConfirmCursor();
    } else if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (this.selectedConfirmIndex === 0) {
        this.confirmSelection();
      } else {
        this.cancelConfirmation();
      }
    }
  }

  private updateSelection(): void {
    this.pokeballs.forEach((container, index) => {
      const ball = container.getData('ball') as Phaser.GameObjects.Sprite;

      if (index === this.selectedIndex) {
        ball.setScale(2);
        this.tweens.add({
          targets: container,
          y: INTRO_UI.starterSelect.ballY - 10,
          duration: 100,
        });
      } else {
        ball.setScale(1.5);
        this.tweens.add({
          targets: container,
          y: INTRO_UI.starterSelect.ballY,
          duration: 100,
        });
      }
    });
  }

  private showPreview(): void {
    this.state = 'preview';
    const starter = STARTER_OPTIONS[this.selectedIndex];
    const speciesKey = starter.name.toLowerCase() as 'flamling' | 'aqualing' | 'leafling';

    // Mettre à jour le sprite
    this.creaturePreview.setTexture(`creature_${speciesKey}`);

    // Afficher la preview
    this.previewContainer.setVisible(true);

    // Afficher la description
    const descriptions = INTRO_DIALOGUES.starterChoice.descriptions[speciesKey];
    this.showDialogues(descriptions, () => {
      // Reste en mode preview, attend input
    });
  }

  private hidePreview(): void {
    this.state = 'selecting';
    this.previewContainer.setVisible(false);
    this.textBox.showText(INTRO_DIALOGUES.starterChoice.selectPrompt);
  }

  private showConfirmation(): void {
    this.state = 'confirming';
    const starter = STARTER_OPTIONS[this.selectedIndex];

    this.textBox.showText(INTRO_DIALOGUES.starterChoice.confirm(starter.name));
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

  private cancelConfirmation(): void {
    this.state = 'preview';
    this.confirmMenu.setVisible(false);

    const starter = STARTER_OPTIONS[this.selectedIndex];
    const speciesKey = starter.name.toLowerCase() as 'flamling' | 'aqualing' | 'leafling';
    const descriptions = INTRO_DIALOGUES.starterChoice.descriptions[speciesKey];
    this.textBox.showText(descriptions[descriptions.length - 1]);
  }

  private confirmSelection(): void {
    this.state = 'outro';
    this.confirmMenu.setVisible(false);
    this.previewContainer.setVisible(false);

    const starter = STARTER_OPTIONS[this.selectedIndex];

    // Créer l'instance de la créature
    const species = creatureSpecies[starter.speciesId];
    const creatureInstance: CreatureInstance = {
      id: this.generateUUID(),
      speciesId: starter.speciesId,
      level: 5,
      currentHp: this.calculateHP(species.baseStats.hp, 5),
      exp: 0,
      ivs: this.generateIVs(),
      evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      moves: this.getStarterMoves(species.learnset),
      isShiny: Math.random() < 1 / 4096,
      caughtAt: Date.now(),
    };

    // Ajouter au store
    useGameStore.getState().addCreatureToTeam(creatureInstance);
    useGameStore.getState().setProgression('hasChosenStarter', true);

    // Dialogues de fin
    const afterDialogues = INTRO_DIALOGUES.starterChoice.afterChoice(starter.name);
    this.showDialogues(afterDialogues, () => {
      this.exitToTown();
    });
  }

  private generateUUID(): string {
    // Simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateIVs() {
    return {
      hp: Math.floor(Math.random() * 32),
      attack: Math.floor(Math.random() * 32),
      defense: Math.floor(Math.random() * 32),
      specialAttack: Math.floor(Math.random() * 32),
      specialDefense: Math.floor(Math.random() * 32),
      speed: Math.floor(Math.random() * 32),
    };
  }

  private calculateHP(baseHP: number, level: number): number {
    // Formule simplifiée
    return Math.floor(((2 * baseHP) * level) / 100) + level + 10;
  }

  private getStarterMoves(learnset: Array<{ level: number; moveId: number }>): number[] {
    // Récupérer les moves appris au niveau 5 ou moins
    return learnset
      .filter(entry => entry.level <= 5)
      .slice(0, 4)
      .map(entry => entry.moveId);
  }

  private exitToTown(): void {
    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.textBox.destroy();
      this.scene.start('TownScene', { fromLab: true });
    });
  }
}
