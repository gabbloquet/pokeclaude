import Phaser from 'phaser';
import { TILE_SIZE } from '@/config/game.config';
import { INTRO_TIMINGS } from '@/config/intro.config';
import { townMap, TOWN_POSITIONS, TOWN_TRIGGERS, TOWN_BUILDINGS } from '@/data/maps/townMap';
import { INTRO_DIALOGUES } from '@/data/dialogues/intro';
import { TextBox } from '@/ui/TextBox';
import { useGameStore } from '@/store/gameStore';
import type { Direction, GridPosition } from '@/types/game.types';

interface TownSceneData {
  fromHome?: boolean;
  fromLab?: boolean;
}

export class TownScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private tilemap!: Phaser.GameObjects.Container;
  private buildingsLayer!: Phaser.GameObjects.Container;
  private textBox!: TextBox;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;

  private playerGridPos: GridPosition = { col: 10, row: 8 };
  private playerDirection: Direction = 'down';
  private isMoving: boolean = false;
  private moveSpeed: number = 150;
  private isDialogueActive: boolean = false;
  private waitingForDialogueInput: boolean = false;
  private dialogueTexts: string[] = [];
  private dialogueIndex: number = 0;
  private dialogueCallback?: () => void;

  constructor() {
    super({ key: 'TownScene' });
  }

  init(data: TownSceneData): void {
    if (data.fromHome) {
      this.playerGridPos = { col: 10, row: 9 }; // Devant la maison
      this.playerDirection = 'down';
    } else if (data.fromLab) {
      this.playerGridPos = { col: 4, row: 6 }; // Devant le labo
      this.playerDirection = 'down';
    } else {
      this.playerGridPos = { ...TOWN_POSITIONS.playerHome };
      this.playerDirection = 'down';
    }
  }

  create(): void {
    this.isMoving = false;
    this.isDialogueActive = false;

    // Créer la tilemap
    this.createTilemap();

    // Créer les bâtiments
    this.createBuildings();

    // Créer le joueur
    this.createPlayer();

    // TextBox
    this.textBox = new TextBox(this, {
      x: 50,
      y: this.cameras.main.height - 130,
      width: this.cameras.main.width - 100,
      height: 100,
      fontSize: 16,
    });
    this.textBox.setVisible(false);

    // Contrôles
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // Caméra
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, townMap.width * TILE_SIZE, townMap.height * TILE_SIZE);

    // Fade in
    this.cameras.main.fadeIn(INTRO_TIMINGS.fadeIn / 2, 0, 0, 0);
  }

  private createTilemap(): void {
    this.tilemap = this.add.container(0, 0);

    const tileKeys: Record<number, string> = {
      0: 'grass',
      1: 'wall',
      2: 'path',
      3: 'tallGrass',
      4: 'water',
      12: 'path', // door_home
      13: 'path', // door_lab
    };

    for (let row = 0; row < townMap.height; row++) {
      for (let col = 0; col < townMap.width; col++) {
        const tileIndex = townMap.tiles[row * townMap.width + col];
        const tileKey = tileKeys[tileIndex] || 'grass';

        const tile = this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          tileKey
        );
        this.tilemap.add(tile);
      }
    }
  }

  private createBuildings(): void {
    this.buildingsLayer = this.add.container(0, 0);

    // Maison du joueur
    this.createBuilding(
      TOWN_BUILDINGS.playerHome.topLeft,
      TOWN_BUILDINGS.playerHome.width,
      TOWN_BUILDINGS.playerHome.height,
      0x8B4513, // Brun
      'Maison'
    );

    // Laboratoire
    this.createBuilding(
      TOWN_BUILDINGS.laboratory.topLeft,
      TOWN_BUILDINGS.laboratory.width,
      TOWN_BUILDINGS.laboratory.height,
      0xCCCCCC, // Gris
      'Labo'
    );

    // Autre maison
    this.createBuilding(
      TOWN_BUILDINGS.otherHouse.topLeft,
      TOWN_BUILDINGS.otherHouse.width,
      TOWN_BUILDINGS.otherHouse.height,
      0x8B4513,
      ''
    );

    // Panneaux
    this.createSign(TOWN_POSITIONS.signTown.col, TOWN_POSITIONS.signTown.row);
    this.createSign(TOWN_POSITIONS.signLab.col, TOWN_POSITIONS.signLab.row);
  }

  private createBuilding(
    topLeft: GridPosition,
    width: number,
    height: number,
    color: number,
    label: string
  ): void {
    const x = topLeft.col * TILE_SIZE;
    const y = topLeft.row * TILE_SIZE;
    const w = width * TILE_SIZE;
    const h = height * TILE_SIZE;

    // Corps du bâtiment
    const building = this.add.rectangle(
      x + w / 2,
      y + h / 2,
      w - 4,
      h - 4,
      color
    );
    building.setStrokeStyle(2, 0x333333);
    this.buildingsLayer.add(building);

    // Toit
    const roof = this.add.triangle(
      x + w / 2,
      y - 8,
      0, 20,
      w / 2, 0,
      w, 20,
      0x8B0000
    );
    this.buildingsLayer.add(roof);

    // Label
    if (label) {
      const text = this.add.text(x + w / 2, y + h / 2, label, {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#ffffff',
      });
      text.setOrigin(0.5);
      this.buildingsLayer.add(text);
    }
  }

  private createSign(col: number, row: number): void {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;

    const post = this.add.rectangle(x, y + 8, 4, 16, 0x8B4513);
    const board = this.add.rectangle(x, y - 4, 24, 16, 0xDEB887);
    board.setStrokeStyle(1, 0x8B4513);

    this.buildingsLayer.add(post);
    this.buildingsLayer.add(board);
  }

  private createPlayer(): void {
    const x = this.playerGridPos.col * TILE_SIZE + TILE_SIZE / 2;
    const y = this.playerGridPos.row * TILE_SIZE + TILE_SIZE / 2;

    this.shadow = this.add.ellipse(x, y + 12, 20, 8, 0x000000, 0.3);
    this.player = this.add.sprite(x, y, 'player', 0);
    this.player.setOrigin(0.5, 0.5);
  }

  update(): void {
    if (this.isDialogueActive) {
      this.handleDialogueInput();
      return;
    }

    if (!this.isMoving) {
      this.handleMovementInput();
      this.handleInteractionInput();
    }
  }

  private handleDialogueInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space!)) {
      if (this.textBox.isAnimating()) {
        this.textBox.skipToEnd();
      } else if (this.waitingForDialogueInput) {
        this.advanceDialogue();
      }
    }
  }

  private advanceDialogue(): void {
    this.waitingForDialogueInput = false;
    this.dialogueIndex++;

    if (this.dialogueIndex >= this.dialogueTexts.length) {
      this.textBox.setVisible(false);
      this.isDialogueActive = false;
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

  private handleMovementInput(): void {
    let direction: Direction | null = null;

    if (this.cursors.up.isDown) direction = 'up';
    else if (this.cursors.down.isDown) direction = 'down';
    else if (this.cursors.left.isDown) direction = 'left';
    else if (this.cursors.right.isDown) direction = 'right';

    if (direction) {
      this.playerDirection = direction;
      this.tryMove(direction);
    } else {
      this.player.anims.play(`idle_${this.playerDirection}`, true);
    }
  }

  private handleInteractionInput(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.checkInteraction();
    }
  }

  private tryMove(direction: Direction): void {
    const delta = {
      up: { col: 0, row: -1 },
      down: { col: 0, row: 1 },
      left: { col: -1, row: 0 },
      right: { col: 1, row: 0 },
    };

    const newPos = {
      col: this.playerGridPos.col + delta[direction].col,
      row: this.playerGridPos.row + delta[direction].row,
    };

    // Vérifier si c'est une zone bloquée (hautes herbes sans créature)
    if (this.isRouteBlocked(newPos)) {
      this.showRouteBlockedMessage();
      return;
    }

    if (this.canMoveTo(newPos)) {
      this.moveToPosition(newPos, direction);
    }
  }

  private isRouteBlocked(pos: GridPosition): boolean {
    // Vérifier si le joueur a un starter
    const hasStarter = useGameStore.getState().progression.hasChosenStarter;
    if (hasStarter) return false;

    // Vérifier si c'est une case de hautes herbes en haut
    const tileIndex = townMap.tiles[pos.row * townMap.width + pos.col];
    return tileIndex === 3 && pos.row <= 1;
  }

  private showRouteBlockedMessage(): void {
    this.showDialogue(INTRO_DIALOGUES.routeBlocked);
  }

  private canMoveTo(pos: GridPosition): boolean {
    if (pos.col < 0 || pos.col >= townMap.width) return false;
    if (pos.row < 0 || pos.row >= townMap.height) return false;

    const tileIndex = townMap.tiles[pos.row * townMap.width + pos.col];

    // Collisions: 1 (wall/building), 4 (water)
    if (tileIndex === 1 || tileIndex === 4) return false;

    return true;
  }

  private moveToPosition(pos: GridPosition, direction: Direction): void {
    this.isMoving = true;
    this.playerGridPos = pos;

    const targetX = pos.col * TILE_SIZE + TILE_SIZE / 2;
    const targetY = pos.row * TILE_SIZE + TILE_SIZE / 2;

    this.player.anims.play(`walk_${direction}`, true);

    this.tweens.add({
      targets: [this.player, this.shadow],
      x: targetX,
      y: (target: Phaser.GameObjects.GameObject) =>
        target === this.shadow ? targetY + 12 : targetY,
      duration: this.moveSpeed,
      onComplete: () => {
        this.isMoving = false;
        this.checkTriggers();
      },
    });
  }

  private checkTriggers(): void {
    const { col, row } = this.playerGridPos;

    // Porte de la maison
    if (col === TOWN_TRIGGERS.homeDoor.col && row === TOWN_TRIGGERS.homeDoor.row) {
      this.enterHome();
      return;
    }

    // Porte du laboratoire
    if (col === TOWN_TRIGGERS.labDoor.col && row === TOWN_TRIGGERS.labDoor.row) {
      this.enterLab();
      return;
    }

    // Sortie sud (après avoir choisi le starter)
    for (const exit of TOWN_TRIGGERS.southExit) {
      if (col === exit.col && row === exit.row) {
        const hasStarter = useGameStore.getState().progression.hasChosenStarter;
        if (hasStarter) {
          this.exitToWorld();
        }
        return;
      }
    }
  }

  private checkInteraction(): void {
    const { col, row } = this.playerGridPos;

    // Panneau du village
    if (Math.abs(col - TOWN_POSITIONS.signTown.col) <= 1 &&
        Math.abs(row - TOWN_POSITIONS.signTown.row) <= 1) {
      this.showDialogue([INTRO_DIALOGUES.signs.town]);
      return;
    }

    // Panneau du labo
    if (Math.abs(col - TOWN_POSITIONS.signLab.col) <= 1 &&
        Math.abs(row - TOWN_POSITIONS.signLab.row) <= 1) {
      this.showDialogue([INTRO_DIALOGUES.signs.lab]);
      return;
    }
  }

  private showDialogue(texts: string[], onComplete?: () => void): void {
    this.isDialogueActive = true;
    this.waitingForDialogueInput = false;
    this.dialogueTexts = texts;
    this.dialogueIndex = 0;
    this.dialogueCallback = onComplete;
    this.textBox.setVisible(true);

    this.textBox.showText(texts[0], () => {
      this.waitingForDialogueInput = true;
    });
  }

  private enterHome(): void {
    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut / 2, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cleanup();
      this.scene.start('HomeScene');
    });
  }

  private enterLab(): void {
    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut / 2, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cleanup();
      this.scene.start('StarterSelectScene');
    });
  }

  private exitToWorld(): void {
    // Marquer l'intro comme terminée
    useGameStore.getState().setProgression('hasCompletedIntro', true);

    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.cleanup();
      this.scene.start('WorldScene');
    });
  }

  private cleanup(): void {
    this.textBox.destroy();
  }
}
