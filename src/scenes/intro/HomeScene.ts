import Phaser from 'phaser';
import { TILE_SIZE } from '@/config/game.config';
import { INTRO_TIMINGS } from '@/config/intro.config';
import { homeMap, HOME_POSITIONS, HOME_TRIGGERS } from '@/data/maps/homeMap';
import { INTRO_DIALOGUES } from '@/data/dialogues/intro';
import { TextBox } from '@/ui/TextBox';
import type { Direction, GridPosition } from '@/types/game.types';

type HomeFloor = 'upstairs' | 'downstairs';

export class HomeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private tilemap!: Phaser.GameObjects.Container;
  private textBox!: TextBox;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;

  private playerGridPos: GridPosition = { col: 4, row: 2 };
  private playerDirection: Direction = 'down';
  private isMoving: boolean = false;
  private moveSpeed: number = 150;
  private currentFloor: HomeFloor = 'upstairs';
  private hasSpokenToMom: boolean = false;
  private isDialogueActive: boolean = false;
  private waitingForDialogueInput: boolean = false;
  private dialogueTexts: string[] = [];
  private dialogueIndex: number = 0;
  private dialogueCallback?: () => void;

  // Mom NPC
  private mom!: Phaser.GameObjects.Sprite;

  constructor() {
    super({ key: 'HomeScene' });
  }

  create(): void {
    // Reset state
    this.isMoving = false;
    this.isDialogueActive = false;
    this.hasSpokenToMom = false;
    this.currentFloor = 'upstairs';
    this.playerGridPos = { ...HOME_POSITIONS.bedroom };

    // Créer la tilemap
    this.createTilemap();

    // Créer la maman (au RDC)
    this.createMom();

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

    // Fade in
    this.cameras.main.fadeIn(INTRO_TIMINGS.fadeIn / 2, 0, 0, 0);

    // Afficher étage initial
    this.updateFloorVisibility();
  }

  private createTilemap(): void {
    this.tilemap = this.add.container(0, 0);

    const tileKeys: Record<number, string> = {
      0: 'grass',
      1: 'wall',
      2: 'path',
      5: 'floor_wood',
      7: 'floor_wood', // Stairs - use wood floor as base
      8: 'path',       // Door
      9: 'wall',       // Furniture
    };

    for (let row = 0; row < homeMap.height; row++) {
      for (let col = 0; col < homeMap.width; col++) {
        const tileIndex = homeMap.tiles[row * homeMap.width + col];
        const tileKey = tileKeys[tileIndex] || 'floor_wood';

        // Vérifier si le tile existe, sinon utiliser path comme fallback
        const finalKey = this.textures.exists(tileKey) ? tileKey : 'path';

        const tile = this.add.image(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + TILE_SIZE / 2,
          finalKey
        );
        this.tilemap.add(tile);

        // Marquer visuellement les escaliers
        if (tileIndex === 7) {
          const stairMarker = this.add.rectangle(
            col * TILE_SIZE + TILE_SIZE / 2,
            row * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE - 8,
            TILE_SIZE - 8,
            0x8b4513,
            0.5
          );
          this.tilemap.add(stairMarker);
        }

        // Marquer visuellement la porte
        if (tileIndex === 8) {
          const doorMarker = this.add.rectangle(
            col * TILE_SIZE + TILE_SIZE / 2,
            row * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4,
            0x654321,
            0.7
          );
          this.tilemap.add(doorMarker);
        }
      }
    }
  }

  private createMom(): void {
    this.mom = this.add.sprite(
      HOME_POSITIONS.mom.col * TILE_SIZE + TILE_SIZE / 2,
      HOME_POSITIONS.mom.row * TILE_SIZE + TILE_SIZE / 2,
      'player',
      0
    );
    this.mom.setTint(0xffaaaa); // Teinte rosée pour différencier
  }

  private createPlayer(): void {
    const x = this.playerGridPos.col * TILE_SIZE + TILE_SIZE / 2;
    const y = this.playerGridPos.row * TILE_SIZE + TILE_SIZE / 2;

    // Ombre
    this.shadow = this.add.ellipse(x, y + 12, 20, 8, 0x000000, 0.3);

    // Joueur
    this.player = this.add.sprite(x, y, 'player', 0);
    this.player.setOrigin(0.5, 0.5);
  }

  private updateFloorVisibility(): void {
    // La visibilité de la maman dépend de l'étage
    this.mom.setVisible(this.currentFloor === 'downstairs');
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
      // Fin du dialogue
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
      // Afficher le texte suivant
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
      // Idle animation
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

    if (this.canMoveTo(newPos)) {
      this.moveToPosition(newPos, direction);
    }
  }

  private canMoveTo(pos: GridPosition): boolean {
    // Limites de l'étage actuel
    const minRow = this.currentFloor === 'upstairs' ? 0 : 5;
    const maxRow = this.currentFloor === 'upstairs' ? 4 : 9;

    if (pos.col < 0 || pos.col >= homeMap.width) return false;
    if (pos.row < minRow || pos.row > maxRow) return false;

    const tileIndex = homeMap.tiles[pos.row * homeMap.width + pos.col];

    // Collision tiles: 1 (wall), 9 (furniture)
    if (tileIndex === 1 || tileIndex === 9) return false;

    // Collision avec maman
    if (this.currentFloor === 'downstairs' &&
        pos.col === HOME_POSITIONS.mom.col &&
        pos.row === HOME_POSITIONS.mom.row) {
      return false;
    }

    return true;
  }

  private moveToPosition(pos: GridPosition, direction: Direction): void {
    this.isMoving = true;
    this.playerGridPos = pos;

    const targetX = pos.col * TILE_SIZE + TILE_SIZE / 2;
    const targetY = pos.row * TILE_SIZE + TILE_SIZE / 2;

    // Animation de marche
    this.player.anims.play(`walk_${direction}`, true);

    // Tween pour le mouvement
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

    // Escalier vers le bas (à l'étage)
    if (this.currentFloor === 'upstairs' &&
        col === HOME_TRIGGERS.stairsUp.col &&
        row === HOME_TRIGGERS.stairsUp.row) {
      this.changeFloor('downstairs');
      return;
    }

    // Escalier vers le haut (au RDC)
    if (this.currentFloor === 'downstairs' &&
        col === HOME_TRIGGERS.stairsDown.col &&
        row === HOME_TRIGGERS.stairsDown.row) {
      this.changeFloor('upstairs');
      return;
    }

    // Porte de sortie
    for (const doorTile of HOME_TRIGGERS.door) {
      if (col === doorTile.col && row === doorTile.row) {
        if (this.hasSpokenToMom) {
          this.exitHome();
        } else {
          this.showDialogue(["Tu devrais d'abord parler à ta mère."], () => {
            // Repousser le joueur
            this.playerGridPos = { col: this.playerGridPos.col, row: this.playerGridPos.row - 1 };
            this.player.setY(this.player.y - TILE_SIZE);
            this.shadow.setY(this.shadow.y - TILE_SIZE);
          });
        }
        return;
      }
    }
  }

  private checkInteraction(): void {
    const { col, row } = this.playerGridPos;

    // Interaction avec maman
    if (this.currentFloor === 'downstairs') {
      const momDist = Math.abs(col - HOME_POSITIONS.mom.col) + Math.abs(row - HOME_POSITIONS.mom.row);
      if (momDist <= 1) {
        this.talkToMom();
        return;
      }
    }

    // Interaction avec PC (à l'étage)
    if (this.currentFloor === 'upstairs') {
      const pcDist = Math.abs(col - HOME_POSITIONS.pc.col) + Math.abs(row - HOME_POSITIONS.pc.row);
      if (pcDist <= 1) {
        this.showDialogue([INTRO_DIALOGUES.pc.noCreatures]);
        return;
      }
    }
  }

  private talkToMom(): void {
    const dialogues = this.hasSpokenToMom
      ? INTRO_DIALOGUES.mom.beforeLeaving
      : INTRO_DIALOGUES.mom.wakeUp;

    this.showDialogue(dialogues, () => {
      this.hasSpokenToMom = true;
    });
  }

  private showDialogue(texts: string[], onComplete?: () => void): void {
    this.isDialogueActive = true;
    this.waitingForDialogueInput = false;
    this.dialogueTexts = texts;
    this.dialogueIndex = 0;
    this.dialogueCallback = onComplete;
    this.textBox.setVisible(true);

    // Afficher le premier texte
    this.textBox.showText(texts[0], () => {
      this.waitingForDialogueInput = true;
    });
  }

  private changeFloor(newFloor: HomeFloor): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.currentFloor = newFloor;

      if (newFloor === 'downstairs') {
        this.playerGridPos = { col: 2, row: 6 }; // Sortie de l'escalier au RDC
      } else {
        this.playerGridPos = { col: 6, row: 2 }; // Sortie de l'escalier à l'étage
      }

      const x = this.playerGridPos.col * TILE_SIZE + TILE_SIZE / 2;
      const y = this.playerGridPos.row * TILE_SIZE + TILE_SIZE / 2;

      this.player.setPosition(x, y);
      this.shadow.setPosition(x, y + 12);

      this.updateFloorVisibility();

      this.cameras.main.fadeIn(200, 0, 0, 0);
    });
  }

  private exitHome(): void {
    this.cameras.main.fadeOut(INTRO_TIMINGS.fadeOut, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.textBox.destroy();
      this.scene.start('TownScene', { fromHome: true });
    });
  }
}
