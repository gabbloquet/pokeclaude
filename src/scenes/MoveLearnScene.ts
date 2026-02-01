import Phaser from 'phaser';
import type { CreatureInstance, Move } from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';
import { getMove } from '@/data/moves/moves';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

interface MoveLearnSceneData {
  creature: CreatureInstance;
  newMove: Move;
  onComplete: (learnedMove: boolean, slotReplaced?: number) => void;
}

export class MoveLearnScene extends Phaser.Scene {
  private creature!: CreatureInstance;
  private newMove!: Move;
  private onComplete!: (learnedMove: boolean, slotReplaced?: number) => void;

  private messageText!: Phaser.GameObjects.Text;
  private moveButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'MoveLearnScene' });
  }

  init(data: MoveLearnSceneData): void {
    this.creature = data.creature;
    this.newMove = data.newMove;
    this.onComplete = data.onComplete;
  }

  create(): void {
    this.createBackground();
    this.createMessageBox();
    this.showInitialQuestion();
  }

  private createBackground(): void {
    // Fond semi-transparent
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createMessageBox(): void {
    // Boite de message en haut
    const msgBg = this.add.graphics();
    msgBg.fillStyle(0xf8f8f8, 1);
    msgBg.fillRoundedRect(20, 20, GAME_WIDTH - 40, 80, 8);
    msgBg.lineStyle(3, 0x333333);
    msgBg.strokeRoundedRect(20, 20, GAME_WIDTH - 40, 80, 8);

    this.messageText = this.add.text(40, 40, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#000000',
      wordWrap: { width: GAME_WIDTH - 80 },
    });
  }

  private showInitialQuestion(): void {
    const species = getSpecies(this.creature.speciesId);
    const creatureName = this.creature.nickname || species?.name || 'Creature';

    this.messageText.setText(
      `${creatureName} veut apprendre ${this.newMove.name}.\nMais ${creatureName} connait deja 4 attaques.`
    );

    this.time.delayedCall(2000, () => {
      this.showLearnChoice();
    });
  }

  private showLearnChoice(): void {
    this.messageText.setText(`Oublier une attaque pour apprendre ${this.newMove.name} ?`);

    // Bouton Oui
    this.createButton(GAME_WIDTH / 2 - 110, 140, 100, 40, 'OUI', () => {
      this.showMoveSelection();
    });

    // Bouton Non
    this.createButton(GAME_WIDTH / 2 + 10, 140, 100, 40, 'NON', () => {
      this.confirmRefuse();
    });
  }

  private showMoveSelection(): void {
    this.messageText.setText(`Quelle attaque doit etre oubliee ?`);

    // Supprimer les boutons precedents
    this.clearButtons();

    // Afficher les 4 attaques actuelles + la nouvelle
    const currentMoves = this.creature.moves.map((id) => getMove(id)).filter((m): m is Move => m !== undefined);

    const buttonWidth = 180;
    const buttonHeight = 60;
    const startY = 140;
    const gap = 10;

    // Attaques actuelles (4)
    currentMoves.forEach((move, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 20 + col * (buttonWidth + gap);
      const y = startY + row * (buttonHeight + gap);

      this.createMoveButton(x, y, buttonWidth, buttonHeight, move, index, false);
    });

    // Nouvelle attaque (en bas)
    this.createMoveButton(
      GAME_WIDTH / 2 - buttonWidth / 2,
      startY + 2 * (buttonHeight + gap) + 20,
      buttonWidth,
      buttonHeight,
      this.newMove,
      -1,
      true
    );

    // Bouton Retour
    this.createButton(
      GAME_WIDTH / 2 - 60,
      startY + 3 * (buttonHeight + gap) + 30,
      120,
      35,
      'ANNULER',
      () => {
        this.confirmRefuse();
      }
    );
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(0, 0, width, height, 6);
    bg.lineStyle(2, 0x333333);
    bg.strokeRoundedRect(0, 0, width, height, 6);
    container.add(bg);

    const label = this.add.text(width / 2, height / 2, text, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#000000',
      fontStyle: 'bold',
    });
    label.setOrigin(0.5);
    container.add(label);

    const hitArea = this.add.rectangle(width / 2, height / 2, width, height);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', onClick);
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xe0e0e0, 1);
      bg.fillRoundedRect(0, 0, width, height, 6);
      bg.lineStyle(2, 0x333333);
      bg.strokeRoundedRect(0, 0, width, height, 6);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xffffff, 1);
      bg.fillRoundedRect(0, 0, width, height, 6);
      bg.lineStyle(2, 0x333333);
      bg.strokeRoundedRect(0, 0, width, height, 6);
    });
    container.add(hitArea);

    this.moveButtons.push(container);
    return container;
  }

  private createMoveButton(
    x: number,
    y: number,
    width: number,
    height: number,
    move: Move,
    slotIndex: number,
    isNewMove: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Couleur selon le type
    const typeColor = this.getTypeColor(move.type);

    const bg = this.add.graphics();
    bg.fillStyle(isNewMove ? 0x90ee90 : typeColor, 1);
    bg.fillRoundedRect(0, 0, width, height, 6);
    bg.lineStyle(2, 0x333333);
    bg.strokeRoundedRect(0, 0, width, height, 6);
    container.add(bg);

    // Nom de l'attaque
    const nameText = this.add.text(10, 8, move.name, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nameText.setShadow(1, 1, '#000000', 1);
    container.add(nameText);

    // Type et puissance
    const infoText = this.add.text(10, 30, `Type: ${this.getTypeName(move.type)} | Puissance: ${move.power || '-'}`, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#ffffff',
    });
    infoText.setShadow(1, 1, '#000000', 1);
    container.add(infoText);

    // Label pour nouvelle attaque
    if (isNewMove) {
      const newLabel = this.add.text(width - 10, 8, 'NOUVEAU', {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#006400',
        fontStyle: 'bold',
      });
      newLabel.setOrigin(1, 0);
      container.add(newLabel);
    }

    const hitArea = this.add.rectangle(width / 2, height / 2, width, height);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      if (isNewMove) {
        // Cliquer sur la nouvelle attaque = ne pas l'apprendre
        this.confirmRefuse();
      } else {
        // Cliquer sur une attaque existante = la remplacer
        this.confirmReplace(slotIndex, move);
      }
    });
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(isNewMove ? 0x70ce70 : this.darkenColor(typeColor), 1);
      bg.fillRoundedRect(0, 0, width, height, 6);
      bg.lineStyle(3, 0xffffff);
      bg.strokeRoundedRect(0, 0, width, height, 6);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(isNewMove ? 0x90ee90 : typeColor, 1);
      bg.fillRoundedRect(0, 0, width, height, 6);
      bg.lineStyle(2, 0x333333);
      bg.strokeRoundedRect(0, 0, width, height, 6);
    });
    container.add(hitArea);

    this.moveButtons.push(container);
    return container;
  }

  private confirmReplace(slotIndex: number, oldMove: Move): void {
    this.clearButtons();

    const species = getSpecies(this.creature.speciesId);
    const creatureName = this.creature.nickname || species?.name || 'Creature';

    this.messageText.setText(
      `1, 2 et... Tada !\n${creatureName} a oublie ${oldMove.name}.\nEt... ${creatureName} a appris ${this.newMove.name} !`
    );

    this.time.delayedCall(2500, () => {
      this.onComplete(true, slotIndex);
      this.scene.stop();
    });
  }

  private confirmRefuse(): void {
    this.clearButtons();

    const species = getSpecies(this.creature.speciesId);
    const creatureName = this.creature.nickname || species?.name || 'Creature';

    this.messageText.setText(`${creatureName} n'a pas appris ${this.newMove.name}.`);

    this.time.delayedCall(1500, () => {
      this.onComplete(false);
      this.scene.stop();
    });
  }

  private clearButtons(): void {
    this.moveButtons.forEach((btn) => btn.destroy());
    this.moveButtons = [];
  }

  private getTypeColor(type: string): number {
    const colors: Record<string, number> = {
      fire: 0xf08030,
      water: 0x6890f0,
      grass: 0x78c850,
      electric: 0xf8d030,
      normal: 0xa8a878,
      ice: 0x98d8d8,
      fighting: 0xc03028,
      poison: 0xa040a0,
      ground: 0xe0c068,
      flying: 0xa890f0,
      psychic: 0xf85888,
      bug: 0xa8b820,
      rock: 0xb8a038,
      ghost: 0x705898,
      dragon: 0x7038f8,
      dark: 0x705848,
      steel: 0xb8b8d0,
      fairy: 0xee99ac,
    };
    return colors[type] || 0xaaaaaa;
  }

  private getTypeName(type: string): string {
    const names: Record<string, string> = {
      fire: 'Feu',
      water: 'Eau',
      grass: 'Plante',
      electric: 'Electrik',
      normal: 'Normal',
      ice: 'Glace',
      fighting: 'Combat',
      poison: 'Poison',
      ground: 'Sol',
      flying: 'Vol',
      psychic: 'Psy',
      bug: 'Insecte',
      rock: 'Roche',
      ghost: 'Spectre',
      dragon: 'Dragon',
      dark: 'Tenebre',
      steel: 'Acier',
      fairy: 'Fee',
    };
    return names[type] || type;
  }

  private darkenColor(color: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) - 30);
    const g = Math.max(0, ((color >> 8) & 0xff) - 30);
    const b = Math.max(0, (color & 0xff) - 30);
    return (r << 16) | (g << 8) | b;
  }
}
