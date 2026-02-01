import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { TILE_SIZE } from '@/config/game.config';
import { testMap } from '@/data/maps/testMap';
import { createWildCreature } from '@/utils/creatureUtils';
import { useGameStore } from '@/store/gameStore';
import type { CreatureInstance } from '@/types/creature.types';

// Zone de rencontres pour la map de test
const WILD_ENCOUNTERS = [
  { speciesId: 1, minLevel: 3, maxLevel: 6, weight: 30 },  // Flamling
  { speciesId: 4, minLevel: 3, maxLevel: 6, weight: 30 },  // Aqualing
  { speciesId: 7, minLevel: 3, maxLevel: 6, weight: 30 },  // Leafling
  { speciesId: 10, minLevel: 2, maxLevel: 5, weight: 10 }, // Sparkit
];

export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private groundLayer!: Phaser.GameObjects.Group;
  private obstacleLayer!: Phaser.GameObjects.Group;
  private encounterLayer!: Phaser.GameObjects.Group;
  private collisionMap: boolean[][] = [];
  private playerTeam: CreatureInstance[] = [];

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    this.initializePlayerTeam();
    this.createMap();
    this.createPlayer();
    this.setupInput();
    this.setupCamera();
  }

  private initializePlayerTeam(): void {
    const store = useGameStore.getState();

    // Si l'équipe est vide, donner un starter au joueur
    if (store.team.length === 0) {
      const starter = createWildCreature(1, 5); // Flamling niveau 5
      starter.nickname = 'Flamling';
      store.addCreatureToTeam(starter);

      // Donner quelques objets de base
      store.addItem(1, 5);  // 5 Poké Balls
      store.addItem(10, 3); // 3 Potions
    }

    this.playerTeam = store.team;
  }

  private createMap(): void {
    this.groundLayer = this.add.group();
    this.obstacleLayer = this.add.group();
    this.encounterLayer = this.add.group();

    const map = testMap;
    this.collisionMap = [];

    for (let row = 0; row < map.height; row++) {
      this.collisionMap[row] = [];
      for (let col = 0; col < map.width; col++) {
        const tileIndex = row * map.width + col;
        const tileType = map.tiles[tileIndex];
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;

        // Place ground tile
        let groundTexture = 'grass';
        if (tileType === 2) groundTexture = 'path';
        if (tileType === 4) groundTexture = 'water';

        const groundTile = this.add.image(x, y, groundTexture);
        this.groundLayer.add(groundTile);

        // Handle collisions and special tiles
        this.collisionMap[row][col] = false;

        if (tileType === 1) {
          // Wall - collision
          const wall = this.add.image(x, y, 'wall');
          this.obstacleLayer.add(wall);
          this.collisionMap[row][col] = true;
        } else if (tileType === 3) {
          // Tall grass - encounter zone
          const tallGrass = this.add.image(x, y, 'tallGrass');
          this.encounterLayer.add(tallGrass);
        } else if (tileType === 4) {
          // Water - collision
          this.collisionMap[row][col] = true;
        }
      }
    }
  }

  private createPlayer(): void {
    const startX = testMap.playerStart.col * TILE_SIZE + TILE_SIZE / 2;
    const startY = testMap.playerStart.row * TILE_SIZE + TILE_SIZE / 2;

    this.player = new Player(
      this,
      startX,
      startY,
      testMap.playerStart.col,
      testMap.playerStart.row
    );
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };

      // Menu pause avec P ou ESC
      this.input.keyboard.on('keydown-P', this.openPauseMenu, this);
      this.input.keyboard.on('keydown-ESC', this.openPauseMenu, this);
    }
  }

  private openPauseMenu(): void {
    if (this.player.isMoving) return;

    this.scene.pause();
    this.scene.launch('PauseMenuScene', { returnScene: 'WorldScene' });
  }

  private setupCamera(): void {
    // Suivi doux avec lerp (interpolation linéaire)
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(
      0,
      0,
      testMap.width * TILE_SIZE,
      testMap.height * TILE_SIZE
    );
    // Léger deadzone pour éviter les micro-mouvements
    this.cameras.main.setDeadzone(8, 8);
  }

  update(_time: number, _delta: number): void {
    if (this.player.isMoving) return;

    let dx = 0;
    let dy = 0;

    if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
      dx = -1;
    } else if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
      dx = 1;
    } else if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
      dy = -1;
    } else if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
      dy = 1;
    }

    if (dx !== 0 || dy !== 0) {
      const targetCol = this.player.gridCol + dx;
      const targetRow = this.player.gridRow + dy;

      if (this.canMoveTo(targetCol, targetRow)) {
        this.player.moveTo(targetCol, targetRow, () => {
          this.checkForEncounter(targetCol, targetRow);
        });
      } else {
        this.player.faceDirection(dx, dy);
      }
    }
  }

  private canMoveTo(col: number, row: number): boolean {
    if (row < 0 || row >= testMap.height || col < 0 || col >= testMap.width) {
      return false;
    }
    return !this.collisionMap[row][col];
  }

  private checkForEncounter(col: number, row: number): void {
    const tileIndex = row * testMap.width + col;
    const tileType = testMap.tiles[tileIndex];

    if (tileType === 3) {
      // Tall grass
      const encounterChance = 0.15; // 15% chance per step
      if (Math.random() < encounterChance) {
        this.triggerWildEncounter();
      }
    }
  }

  private triggerWildEncounter(): void {
    // Sélectionner une créature sauvage basée sur les poids
    const wildCreature = this.generateWildCreature();

    // Mettre à jour l'équipe dans le store
    const store = useGameStore.getState();
    this.playerTeam = store.team;

    // Vérifier que le joueur a au moins une créature en vie
    const aliveCreature = this.playerTeam.find((c) => c.currentHp > 0);
    if (!aliveCreature) {
      console.log('Toutes vos créatures sont K.O. !');
      return;
    }

    // Transition visuelle
    this.cameras.main.flash(500, 255, 255, 255);

    this.time.delayedCall(500, () => {
      this.scene.start('BattleScene', {
        playerTeam: this.playerTeam,
        enemyCreature: wildCreature,
        isWildBattle: true,
      });
    });
  }

  private generateWildCreature(): CreatureInstance {
    // Calculer le poids total
    const totalWeight = WILD_ENCOUNTERS.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    // Sélectionner l'espèce
    let selectedEncounter = WILD_ENCOUNTERS[0];
    for (const encounter of WILD_ENCOUNTERS) {
      random -= encounter.weight;
      if (random <= 0) {
        selectedEncounter = encounter;
        break;
      }
    }

    // Générer le niveau
    const level =
      selectedEncounter.minLevel +
      Math.floor(
        Math.random() *
          (selectedEncounter.maxLevel - selectedEncounter.minLevel + 1)
      );

    return createWildCreature(selectedEncounter.speciesId, level);
  }
}
