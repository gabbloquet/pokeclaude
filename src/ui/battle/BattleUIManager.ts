import Phaser from 'phaser';
import type { CreatureInstance } from '@/types/creature.types';
import type { InventorySlot } from '@/types/game.types';
import { getSpecies } from '@/data/creatures/species';
import { calculateAllStats } from '@/utils/creatureUtils';
import { validateNickname } from '@/systems/capture/CaptureSystem';
import { InfoBox } from './InfoBox';
import { BattleMenus } from './BattleMenus';
import { EventBus, BATTLE_EVENTS } from '@/events';
import {
  UI_COLORS,
  UI_DIMENSIONS,
  TEXT_STYLES,
  BATTLE_POSITIONS,
  ANIMATION_TIMINGS,
  SPRITE_SCALES,
  getTypeColor,
} from '@/config/ui.config';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

export interface BattleCreatureData {
  instance: CreatureInstance;
  species: { name: string; types: string[]; spriteKey: string };
  currentHp: number;
}

export interface BattleUIConfig {
  playerCreature: BattleCreatureData;
  enemyCreature: BattleCreatureData;
  /** Utiliser l'EventBus au lieu des callbacks */
  useEventBus?: boolean;
  /** @deprecated Utiliser EventBus à la place */
  onActionSelect?: (actionIndex: number) => void;
  /** @deprecated Utiliser EventBus à la place */
  onMoveSelect?: (moveId: number) => void;
  /** @deprecated Utiliser EventBus à la place */
  onBallSelect?: (ballId: number) => void;
  /** @deprecated Utiliser EventBus à la place */
  onNicknameConfirm?: (creature: CreatureInstance, nickname: string) => void;
}

/**
 * Gestionnaire principal de l'UI de combat
 * Supporte à la fois les callbacks (legacy) et l'EventBus
 */
export class BattleUIManager {
  private scene: Phaser.Scene;
  private config: BattleUIConfig;
  private useEventBus: boolean;

  // Créatures
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;

  // Info boxes
  private playerInfoBox!: InfoBox;
  private enemyInfoBox!: InfoBox;

  // Messages
  private messageBox!: Phaser.GameObjects.Container;
  private messageText!: Phaser.GameObjects.Text;

  // Menus
  private menus!: BattleMenus;

  // Nickname input
  private nicknameInput!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: BattleUIConfig) {
    this.scene = scene;
    this.config = config;
    this.useEventBus = config.useEventBus ?? false;
  }

  /**
   * Crée tous les éléments UI
   */
  create(): void {
    this.createBackground();
    this.createCreatureSprites();
    this.createInfoBoxes();
    this.createMessageBox();
    this.createMenus();
    this.createNicknameInput();

    // Si EventBus actif, écouter les événements UI
    if (this.useEventBus) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    // Écouter les demandes de changement de menu
    EventBus.onBattle(BATTLE_EVENTS.MENU_SHOW, (payload) => {
      switch (payload.menu) {
        case 'action':
          this.showActionMenu();
          break;
        case 'move':
          this.showMoveMenu();
          break;
        case 'none':
          this.hideMenus();
          break;
      }
    });

    // Écouter les mises à jour HP
    EventBus.onBattle(BATTLE_EVENTS.HP_UPDATE, (payload) => {
      if (payload.target === 'player') {
        this.playerInfoBox.setHp(payload.currentHp, payload.maxHp);
      } else {
        this.enemyInfoBox.setHp(payload.currentHp, payload.maxHp);
      }
    });

    // Écouter les demandes d'affichage de message
    EventBus.onBattle(BATTLE_EVENTS.MESSAGE_SHOW, (payload) => {
      this.showMessage(payload.text, () => {
        EventBus.emitBattle(BATTLE_EVENTS.MESSAGE_COMPLETE, undefined);
      });
    });
  }

  private createBackground(): void {
    const bg = this.scene.add.graphics();
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x90ee90, 0x90ee90, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Sol
    bg.fillStyle(0x90ee90, 1);
    bg.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
  }

  private createCreatureSprites(): void {
    const { playerCreature, enemyCreature } = this.config;

    // Sprite joueur
    const playerSpriteKey = `creature_${playerCreature.species.spriteKey}`;
    if (this.scene.textures.exists(playerSpriteKey)) {
      this.playerSprite = this.scene.add.image(
        BATTLE_POSITIONS.playerCreature.x,
        BATTLE_POSITIONS.playerCreature.y,
        playerSpriteKey
      );
      this.playerSprite.setScale(SPRITE_SCALES.playerCreature);
    } else {
      this.playerSprite = this.createPlaceholderSprite(
        BATTLE_POSITIONS.playerCreature.x,
        BATTLE_POSITIONS.playerCreature.y,
        getTypeColor(playerCreature.species.types[0])
      );
    }

    // Sprite ennemi
    const enemySpriteKey = `creature_${enemyCreature.species.spriteKey}`;
    if (this.scene.textures.exists(enemySpriteKey)) {
      this.enemySprite = this.scene.add.image(
        BATTLE_POSITIONS.enemyCreature.x,
        BATTLE_POSITIONS.enemyCreature.y,
        enemySpriteKey
      );
      this.enemySprite.setScale(SPRITE_SCALES.enemyCreature);
    } else {
      this.enemySprite = this.createPlaceholderSprite(
        BATTLE_POSITIONS.enemyCreature.x,
        BATTLE_POSITIONS.enemyCreature.y,
        getTypeColor(enemyCreature.species.types[0])
      );
    }
  }

  private createPlaceholderSprite(x: number, y: number, color: number): Phaser.GameObjects.Image {
    const key = `placeholder_${color}`;
    if (!this.scene.textures.exists(key)) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, 64, 64, 8);
      graphics.lineStyle(3, 0x000000);
      graphics.strokeRoundedRect(0, 0, 64, 64, 8);
      graphics.generateTexture(key, 64, 64);
      graphics.destroy();
    }
    return this.scene.add.image(x, y, key);
  }

  private createInfoBoxes(): void {
    const { playerCreature, enemyCreature } = this.config;

    const playerMaxHp = this.getMaxHp(playerCreature.instance);
    const enemyMaxHp = this.getMaxHp(enemyCreature.instance);

    this.playerInfoBox = new InfoBox(this.scene, {
      x: BATTLE_POSITIONS.playerInfoBox.x,
      y: BATTLE_POSITIONS.playerInfoBox.y,
      name: playerCreature.species.name,
      level: playerCreature.instance.level,
      currentHp: playerCreature.currentHp,
      maxHp: playerMaxHp,
      showHpText: true,
    });

    this.enemyInfoBox = new InfoBox(this.scene, {
      x: BATTLE_POSITIONS.enemyInfoBox.x,
      y: BATTLE_POSITIONS.enemyInfoBox.y,
      name: enemyCreature.species.name,
      level: enemyCreature.instance.level,
      currentHp: enemyCreature.currentHp,
      maxHp: enemyMaxHp,
      showHpText: false,
    });
  }

  private createMessageBox(): void {
    this.messageBox = this.scene.add.container(0, BATTLE_POSITIONS.messageBox.y);

    const { marginX, height, borderRadius, padding } = UI_DIMENSIONS.messageBox;

    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.background, 1);
    bg.fillRoundedRect(marginX, 0, GAME_WIDTH - marginX * 2, height, borderRadius);
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(marginX, 0, GAME_WIDTH - marginX * 2, height, borderRadius);
    this.messageBox.add(bg);

    this.messageText = this.scene.add.text(marginX + padding, padding, '', {
      ...TEXT_STYLES.message,
      wordWrap: { width: GAME_WIDTH - marginX * 2 - padding * 2 },
    });
    this.messageBox.add(this.messageText);
  }

  private createMenus(): void {
    if (this.useEventBus) {
      // Mode EventBus : pas de callbacks
      this.menus = new BattleMenus(this.scene, {
        useEventBus: true,
      });
    } else {
      // Mode legacy : callbacks
      this.menus = new BattleMenus(this.scene, {
        onActionSelect: this.config.onActionSelect,
        onMoveSelect: this.config.onMoveSelect,
        onBallSelect: this.config.onBallSelect,
        onBackToActions: () => this.showActionMenu(),
      });
    }
  }

  private createNicknameInput(): void {
    this.nicknameInput = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.nicknameInput.setVisible(false);
  }

  private getMaxHp(creature: CreatureInstance): number {
    const species = getSpecies(creature.speciesId);
    if (!species) return creature.currentHp;

    const stats = calculateAllStats(
      species,
      creature.level,
      creature.ivs,
      creature.evs
    );
    return stats.hp;
  }

  // --- Public API ---

  /**
   * Affiche un message dans la boîte de texte
   */
  showMessage(text: string, onComplete?: () => void): void {
    this.messageText.setText(text);
    this.menus.hideAll();

    if (onComplete) {
      this.scene.time.delayedCall(ANIMATION_TIMINGS.message, onComplete);
    }
  }

  /**
   * Affiche le menu d'actions
   */
  showActionMenu(): void {
    this.messageText.setText(`Que doit faire ${this.config.playerCreature.species.name} ?`);
    this.menus.showActionMenu();
  }

  /**
   * Affiche le menu des attaques
   */
  showMoveMenu(): void {
    this.menus.showMoveMenu(this.config.playerCreature.instance.moves);
  }

  /**
   * Affiche le menu des balls
   */
  showBallMenu(inventory: InventorySlot[]): void {
    this.menus.showBallMenu(inventory);
  }

  /**
   * Affiche le sous-menu du sac (choix entre Balls et Objets)
   */
  showBagSubMenu(inventory: InventorySlot[], isWildBattle: boolean): void {
    this.menus.showBagSubMenu(inventory, isWildBattle);
  }

  /**
   * Affiche le menu des objets
   */
  showItemMenu(inventory: InventorySlot[]): void {
    this.menus.showItemMenu(inventory);
  }

  /**
   * Cache tous les menus
   */
  hideMenus(): void {
    this.menus.hideAll();
  }

  /**
   * Met à jour l'affichage des créatures (HP)
   */
  updateCreatureDisplays(
    playerCurrentHp: number,
    playerMaxHp: number,
    enemyCurrentHp: number,
    enemyMaxHp: number
  ): void {
    this.playerInfoBox.setHp(playerCurrentHp, playerMaxHp);
    this.enemyInfoBox.setHp(enemyCurrentHp, enemyMaxHp);
  }

  /**
   * Met à jour le niveau du joueur
   */
  updatePlayerLevel(level: number): void {
    this.playerInfoBox.setLevel(level);
  }

  /**
   * Retourne le sprite ennemi (pour les animations)
   */
  getEnemySprite(): Phaser.GameObjects.Image {
    return this.enemySprite;
  }

  /**
   * Retourne le sprite joueur
   */
  getPlayerSprite(): Phaser.GameObjects.Image {
    return this.playerSprite;
  }

  /**
   * Affiche le dialogue de surnom
   */
  showNicknameInput(creature: CreatureInstance): void {
    this.nicknameInput.removeAll(true);

    const dimensions = UI_DIMENSIONS.nicknameDialog;

    // Fond semi-transparent
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(UI_COLORS.overlay, UI_COLORS.overlayAlpha);
    overlay.fillRect(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    this.nicknameInput.add(overlay);

    // Boîte de dialogue
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.buttonDefault, 1);
    bg.fillRoundedRect(
      -dimensions.width / 2,
      -dimensions.height / 2,
      dimensions.width,
      dimensions.height,
      dimensions.borderRadius
    );
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(
      -dimensions.width / 2,
      -dimensions.height / 2,
      dimensions.width,
      dimensions.height,
      dimensions.borderRadius
    );
    this.nicknameInput.add(bg);

    const species = getSpecies(creature.speciesId);
    const creatureName = species?.name || 'Créature';

    // Titre
    const title = this.scene.add.text(0, -60, `Donner un surnom à ${creatureName} ?`, TEXT_STYLES.dialogTitle);
    title.setOrigin(0.5);
    this.nicknameInput.add(title);

    // Zone de texte
    const inputBg = this.scene.add.graphics();
    inputBg.fillStyle(UI_COLORS.inputBackground, 1);
    inputBg.fillRoundedRect(
      -dimensions.inputWidth / 2,
      -dimensions.inputHeight / 2,
      dimensions.inputWidth,
      dimensions.inputHeight,
      6
    );
    inputBg.lineStyle(2, UI_COLORS.inputBorder);
    inputBg.strokeRoundedRect(
      -dimensions.inputWidth / 2,
      -dimensions.inputHeight / 2,
      dimensions.inputWidth,
      dimensions.inputHeight,
      6
    );
    this.nicknameInput.add(inputBg);

    let nickname = '';
    const inputText = this.scene.add.text(0, 0, creatureName, TEXT_STYLES.dialogInput);
    inputText.setOrigin(0.5);
    this.nicknameInput.add(inputText);

    // Indication
    const hint = this.scene.add.text(0, 30, `(Max ${dimensions.maxLength} caractères)`, TEXT_STYLES.dialogHint);
    hint.setOrigin(0.5);
    this.nicknameInput.add(hint);

    // Gestion du clavier
    const keyboardHandler = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        nickname = nickname.slice(0, -1);
        inputText.setText(nickname || creatureName);
      } else if (event.key === 'Enter') {
        this.scene.input.keyboard?.off('keydown', keyboardHandler);
        this.confirmNickname(creature, nickname);
      } else if (event.key.length === 1 && nickname.length < dimensions.maxLength) {
        const validation = validateNickname(nickname + event.key);
        if (validation.valid) {
          nickname += event.key;
          inputText.setText(nickname);
        }
      }
    };
    this.scene.input.keyboard?.on('keydown', keyboardHandler);

    // Bouton Confirmer
    const confirmBtn = this.scene.add.text(-60, 60, 'CONFIRMER', {
      ...TEXT_STYLES.dialogButton,
      backgroundColor: UI_COLORS.successButton,
      padding: { x: 10, y: 5 },
    });
    confirmBtn.setOrigin(0.5);
    confirmBtn.setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => {
      this.scene.input.keyboard?.off('keydown', keyboardHandler);
      this.confirmNickname(creature, nickname);
    });
    this.nicknameInput.add(confirmBtn);

    // Bouton Pas de surnom
    const skipBtn = this.scene.add.text(60, 60, 'PAS DE SURNOM', {
      ...TEXT_STYLES.dialogButton,
      backgroundColor: UI_COLORS.neutralButton,
      padding: { x: 10, y: 5 },
    });
    skipBtn.setOrigin(0.5);
    skipBtn.setInteractive({ useHandCursor: true });
    skipBtn.on('pointerdown', () => {
      this.scene.input.keyboard?.off('keydown', keyboardHandler);
      this.confirmNickname(creature, '');
    });
    this.nicknameInput.add(skipBtn);

    this.nicknameInput.setVisible(true);
  }

  private confirmNickname(creature: CreatureInstance, nickname: string): void {
    this.nicknameInput.setVisible(false);

    if (nickname.trim()) {
      creature.nickname = nickname.trim();
    }

    if (this.useEventBus) {
      EventBus.emitBattle(BATTLE_EVENTS.CAPTURE_SUCCESS, { creatureId: creature.id });
    } else if (this.config.onNicknameConfirm) {
      this.config.onNicknameConfirm(creature, nickname);
    }
  }

  /**
   * Nettoie les ressources et les listeners
   */
  destroy(): void {
    if (this.useEventBus) {
      EventBus.offBattle(BATTLE_EVENTS.MENU_SHOW);
      EventBus.offBattle(BATTLE_EVENTS.HP_UPDATE);
      EventBus.offBattle(BATTLE_EVENTS.MESSAGE_SHOW);
    }

    this.playerInfoBox.destroy();
    this.enemyInfoBox.destroy();
    this.menus.destroy();
    this.messageBox.destroy();
    this.nicknameInput.destroy();
  }
}
