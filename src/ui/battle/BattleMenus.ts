import Phaser from 'phaser';
import { getMove } from '@/data/moves/moves';
import { getPokeBall } from '@/data/items/balls';
import { getItem } from '@/data/items/items';
import { getUsableItemsInBattle } from '@/systems/battle/ItemSystem';
import type { InventorySlot } from '@/types/game.types';
import {
  UI_COLORS,
  UI_DIMENSIONS,
  TEXT_STYLES,
  BATTLE_POSITIONS,
  getTypeColor,
} from '@/config/ui.config';
import { GAME_WIDTH } from '@/config/game.config';
import { EventBus, BATTLE_EVENTS } from '@/events';

export interface BattleMenusConfig {
  /** @deprecated Utiliser EventBus à la place */
  onActionSelect?: (actionIndex: number) => void;
  /** @deprecated Utiliser EventBus à la place */
  onMoveSelect?: (moveId: number) => void;
  /** @deprecated Utiliser EventBus à la place */
  onBallSelect?: (ballId: number) => void;
  /** Callback pour utilisation d'objet */
  onItemSelect?: (itemId: number) => void;
  /** @deprecated Utiliser EventBus à la place */
  onBackToActions?: () => void;
  /** Utiliser l'EventBus global au lieu des callbacks */
  useEventBus?: boolean;
}

/**
 * Gestion des menus de combat (actions, attaques, balls)
 * Supporte à la fois les callbacks (legacy) et l'EventBus
 */
export class BattleMenus {
  private scene: Phaser.Scene;
  private config: BattleMenusConfig;
  private useEventBus: boolean;

  private actionMenu: Phaser.GameObjects.Container;
  private moveMenu: Phaser.GameObjects.Container;
  private ballMenu: Phaser.GameObjects.Container;
  private itemMenu: Phaser.GameObjects.Container;
  private bagSubMenu: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: BattleMenusConfig = {}) {
    this.scene = scene;
    this.config = config;
    this.useEventBus = config.useEventBus ?? false;

    this.actionMenu = this.createActionMenu();
    this.moveMenu = scene.add.container(BATTLE_POSITIONS.moveMenu.x, BATTLE_POSITIONS.moveMenu.y);
    this.moveMenu.setVisible(false);
    this.ballMenu = scene.add.container(BATTLE_POSITIONS.ballMenu.x, BATTLE_POSITIONS.ballMenu.y);
    this.ballMenu.setVisible(false);
    this.itemMenu = scene.add.container(BATTLE_POSITIONS.ballMenu.x, BATTLE_POSITIONS.ballMenu.y);
    this.itemMenu.setVisible(false);
    this.bagSubMenu = scene.add.container(BATTLE_POSITIONS.ballMenu.x, BATTLE_POSITIONS.ballMenu.y);
    this.bagSubMenu.setVisible(false);
  }

  private emitAction(actionIndex: number): void {
    if (this.useEventBus) {
      EventBus.emitBattle(BATTLE_EVENTS.ACTION_SELECTED, { actionIndex });
    } else if (this.config.onActionSelect) {
      this.config.onActionSelect(actionIndex);
    }
  }

  private emitMove(moveId: number): void {
    if (this.useEventBus) {
      EventBus.emitBattle(BATTLE_EVENTS.MOVE_SELECTED, { moveId });
    } else if (this.config.onMoveSelect) {
      this.config.onMoveSelect(moveId);
    }
  }

  private emitBall(ballId: number): void {
    if (this.useEventBus) {
      EventBus.emitBattle(BATTLE_EVENTS.BALL_SELECTED, { ballId });
    } else if (this.config.onBallSelect) {
      this.config.onBallSelect(ballId);
    }
  }

  private emitItem(itemId: number): void {
    if (this.useEventBus) {
      EventBus.emitBattle(BATTLE_EVENTS.ITEM_SELECTED, { itemId });
    } else if (this.config.onItemSelect) {
      this.config.onItemSelect(itemId);
    }
  }

  private emitBack(): void {
    if (this.useEventBus) {
      EventBus.emitBattle(BATTLE_EVENTS.MENU_SHOW, { menu: 'action' });
    } else if (this.config.onBackToActions) {
      this.config.onBackToActions();
    }
  }

  private createActionMenu(): Phaser.GameObjects.Container {
    const container = this.scene.add.container(
      BATTLE_POSITIONS.actionMenu.x,
      BATTLE_POSITIONS.actionMenu.y
    );

    const actions = ['ATTAQUE', 'SAC', 'POKEMON', 'FUITE'];
    const { width, height, borderRadius, gapX, gapY } = UI_DIMENSIONS.actionButton;

    actions.forEach((action, i) => {
      const x = (i % 2) * (width + gapX);
      const y = Math.floor(i / 2) * (height + gapY);

      const button = this.scene.add.graphics();
      button.fillStyle(UI_COLORS.buttonDefault, 1);
      button.fillRoundedRect(x, y, width, height, borderRadius);
      button.lineStyle(2, UI_COLORS.border);
      button.strokeRoundedRect(x, y, width, height, borderRadius);
      container.add(button);

      const text = this.scene.add.text(x + width / 2, y + height / 2, action, TEXT_STYLES.buttonLabel);
      text.setOrigin(0.5);
      container.add(text);

      const hitArea = this.scene.add.rectangle(
        x + width / 2,
        y + height / 2,
        width,
        height
      );
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.emitAction(i));
      hitArea.on('pointerover', () => {
        button.clear();
        button.fillStyle(UI_COLORS.buttonHover, 1);
        button.fillRoundedRect(x, y, width, height, borderRadius);
        button.lineStyle(2, UI_COLORS.border);
        button.strokeRoundedRect(x, y, width, height, borderRadius);
      });
      hitArea.on('pointerout', () => {
        button.clear();
        button.fillStyle(UI_COLORS.buttonDefault, 1);
        button.fillRoundedRect(x, y, width, height, borderRadius);
        button.lineStyle(2, UI_COLORS.border);
        button.strokeRoundedRect(x, y, width, height, borderRadius);
      });
      container.add(hitArea);
    });

    container.setVisible(false);
    return container;
  }

  /**
   * Met à jour le menu des attaques selon les moves de la créature
   */
  updateMoveMenu(moves: number[]): void {
    this.moveMenu.removeAll(true);

    const buttonWidth = (GAME_WIDTH - 40) / 2;
    const { height, borderRadius, gapX, gapY } = UI_DIMENSIONS.moveButton;

    moves.forEach((moveId, i) => {
      const move = getMove(moveId);
      if (!move) return;

      const x = (i % 2) * (buttonWidth + gapX);
      const y = Math.floor(i / 2) * (height + gapY);

      const typeColor = getTypeColor(move.type);

      const button = this.scene.add.graphics();
      button.fillStyle(typeColor, 1);
      button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
      button.lineStyle(2, UI_COLORS.border);
      button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
      this.moveMenu.add(button);

      const text = this.scene.add.text(x + 10, y + height / 2, move.name, TEXT_STYLES.moveLabel);
      text.setOrigin(0, 0.5);
      text.setShadow(1, 1, '#000000', 1);
      this.moveMenu.add(text);

      const hitArea = this.scene.add.rectangle(
        x + buttonWidth / 2,
        y + height / 2,
        buttonWidth,
        height
      );
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => this.emitMove(moveId));
      this.moveMenu.add(hitArea);
    });

    // Bouton retour
    this.addBackButton(this.moveMenu);
  }

  /**
   * Met à jour le menu des balls selon l'inventaire
   */
  updateBallMenu(inventory: InventorySlot[]): void {
    this.ballMenu.removeAll(true);

    const buttonWidth = (GAME_WIDTH - 40) / 2;
    const { height, borderRadius, gapX, gapY } = UI_DIMENSIONS.moveButton;

    const availableBalls = inventory
      .filter(slot => {
        const ball = getPokeBall(slot.itemId);
        return ball && slot.quantity > 0;
      })
      .map(slot => ({
        ball: getPokeBall(slot.itemId)!,
        quantity: slot.quantity,
      }));

    if (availableBalls.length === 0) {
      const noBallsText = this.scene.add.text(GAME_WIDTH / 2 - 80, 30, 'Aucune Ball disponible !', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: UI_COLORS.textDanger,
      });
      this.ballMenu.add(noBallsText);
    } else {
      availableBalls.forEach(({ ball, quantity }, i) => {
        const x = (i % 2) * (buttonWidth + gapX);
        const y = Math.floor(i / 2) * (height + gapY);

        const button = this.scene.add.graphics();
        button.fillStyle(UI_COLORS.buttonDefault, 1);
        button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
        button.lineStyle(2, UI_COLORS.border);
        button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
        this.ballMenu.add(button);

        const text = this.scene.add.text(x + 10, y + height / 2, `${ball.name} x${quantity}`, {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: UI_COLORS.textPrimary,
          fontStyle: 'bold',
        });
        text.setOrigin(0, 0.5);
        this.ballMenu.add(text);

        const hitArea = this.scene.add.rectangle(
          x + buttonWidth / 2,
          y + height / 2,
          buttonWidth,
          height
        );
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.emitBall(ball.id));
        hitArea.on('pointerover', () => {
          button.clear();
          button.fillStyle(UI_COLORS.buttonHover, 1);
          button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
          button.lineStyle(2, UI_COLORS.border);
          button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
        });
        hitArea.on('pointerout', () => {
          button.clear();
          button.fillStyle(UI_COLORS.buttonDefault, 1);
          button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
          button.lineStyle(2, UI_COLORS.border);
          button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
        });
        this.ballMenu.add(hitArea);
      });
    }

    // Bouton retour
    this.addBackButton(this.ballMenu);
  }

  /**
   * Met à jour le sous-menu du sac (choix entre Balls et Objets)
   */
  updateBagSubMenu(inventory: InventorySlot[], isWildBattle: boolean): void {
    this.bagSubMenu.removeAll(true);

    const buttonWidth = (GAME_WIDTH - 40) / 2;
    const { height, borderRadius, gapX, gapY } = UI_DIMENSIONS.moveButton;

    const categories = isWildBattle
      ? [
          { label: 'BALLS', action: 'balls' },
          { label: 'OBJETS', action: 'items' },
        ]
      : [{ label: 'OBJETS', action: 'items' }]; // Pas de balls en combat dresseur

    categories.forEach((cat, i) => {
      const x = (i % 2) * (buttonWidth + gapX);
      const y = Math.floor(i / 2) * (height + gapY);

      const button = this.scene.add.graphics();
      button.fillStyle(UI_COLORS.buttonDefault, 1);
      button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
      button.lineStyle(2, UI_COLORS.border);
      button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
      this.bagSubMenu.add(button);

      const text = this.scene.add.text(x + buttonWidth / 2, y + height / 2, cat.label, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: UI_COLORS.textPrimary,
        fontStyle: 'bold',
      });
      text.setOrigin(0.5);
      this.bagSubMenu.add(text);

      const hitArea = this.scene.add.rectangle(
        x + buttonWidth / 2,
        y + height / 2,
        buttonWidth,
        height
      );
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        if (cat.action === 'balls') {
          this.showBallMenu(inventory);
        } else {
          this.showItemMenu(inventory);
        }
      });
      hitArea.on('pointerover', () => {
        button.clear();
        button.fillStyle(UI_COLORS.buttonHover, 1);
        button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
        button.lineStyle(2, UI_COLORS.border);
        button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
      });
      hitArea.on('pointerout', () => {
        button.clear();
        button.fillStyle(UI_COLORS.buttonDefault, 1);
        button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
        button.lineStyle(2, UI_COLORS.border);
        button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
      });
      this.bagSubMenu.add(hitArea);
    });

    this.addBackButton(this.bagSubMenu);
  }

  /**
   * Met à jour le menu des objets utilisables en combat
   */
  updateItemMenu(inventory: InventorySlot[]): void {
    this.itemMenu.removeAll(true);

    const buttonWidth = (GAME_WIDTH - 40) / 2;
    const { height, borderRadius, gapX, gapY } = UI_DIMENSIONS.moveButton;

    const usableItems = getUsableItemsInBattle(inventory);

    if (usableItems.length === 0) {
      const noItemsText = this.scene.add.text(GAME_WIDTH / 2 - 80, 30, 'Aucun objet disponible !', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: UI_COLORS.textDanger,
      });
      this.itemMenu.add(noItemsText);
    } else {
      usableItems.forEach((slot, i) => {
        const item = getItem(slot.itemId);
        if (!item) return;

        const x = (i % 2) * (buttonWidth + gapX);
        const y = Math.floor(i / 2) * (height + gapY);

        // Couleur selon la catégorie
        const categoryColors: Record<string, number> = {
          potion: 0x90ee90,     // Vert clair
          statusHeal: 0xffb6c1, // Rose clair
          battleItem: 0xffd700, // Or
        };
        const bgColor = categoryColors[item.category] || UI_COLORS.buttonDefault;

        const button = this.scene.add.graphics();
        button.fillStyle(bgColor, 1);
        button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
        button.lineStyle(2, UI_COLORS.border);
        button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
        this.itemMenu.add(button);

        const text = this.scene.add.text(x + 10, y + height / 2, `${item.name} x${slot.quantity}`, {
          fontFamily: 'Arial',
          fontSize: '11px',
          color: UI_COLORS.textPrimary,
          fontStyle: 'bold',
        });
        text.setOrigin(0, 0.5);
        this.itemMenu.add(text);

        const hitArea = this.scene.add.rectangle(
          x + buttonWidth / 2,
          y + height / 2,
          buttonWidth,
          height
        );
        hitArea.setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => this.emitItem(item.id));
        hitArea.on('pointerover', () => {
          button.clear();
          button.fillStyle(this.darkenColor(bgColor), 1);
          button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
          button.lineStyle(2, UI_COLORS.border);
          button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
        });
        hitArea.on('pointerout', () => {
          button.clear();
          button.fillStyle(bgColor, 1);
          button.fillRoundedRect(x, y, buttonWidth, height, borderRadius);
          button.lineStyle(2, UI_COLORS.border);
          button.strokeRoundedRect(x, y, buttonWidth, height, borderRadius);
        });
        this.itemMenu.add(hitArea);
      });
    }

    // Bouton retour vers le sous-menu sac
    const backBtn = this.scene.add.text(GAME_WIDTH - 80, 50, 'RETOUR', TEXT_STYLES.backButton);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.emitBack());
    this.itemMenu.add(backBtn);
  }

  private darkenColor(color: number): number {
    const r = Math.max(0, ((color >> 16) & 0xff) - 30);
    const g = Math.max(0, ((color >> 8) & 0xff) - 30);
    const b = Math.max(0, (color & 0xff) - 30);
    return (r << 16) | (g << 8) | b;
  }

  private addBackButton(container: Phaser.GameObjects.Container): void {
    const backBtn = this.scene.add.text(GAME_WIDTH - 80, 50, 'RETOUR', TEXT_STYLES.backButton);
    backBtn.setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.emitBack());
    container.add(backBtn);
  }

  /**
   * Affiche le menu d'actions
   */
  showActionMenu(): void {
    this.actionMenu.setVisible(true);
    this.moveMenu.setVisible(false);
    this.ballMenu.setVisible(false);
  }

  /**
   * Affiche le menu des attaques
   */
  showMoveMenu(moves: number[]): void {
    this.updateMoveMenu(moves);
    this.actionMenu.setVisible(false);
    this.moveMenu.setVisible(true);
    this.ballMenu.setVisible(false);
  }

  /**
   * Affiche le sous-menu du sac
   */
  showBagSubMenu(inventory: InventorySlot[], isWildBattle: boolean): void {
    this.updateBagSubMenu(inventory, isWildBattle);
    this.actionMenu.setVisible(false);
    this.moveMenu.setVisible(false);
    this.ballMenu.setVisible(false);
    this.itemMenu.setVisible(false);
    this.bagSubMenu.setVisible(true);
  }

  /**
   * Affiche le menu des balls
   */
  showBallMenu(inventory: InventorySlot[]): void {
    this.updateBallMenu(inventory);
    this.actionMenu.setVisible(false);
    this.moveMenu.setVisible(false);
    this.bagSubMenu.setVisible(false);
    this.itemMenu.setVisible(false);
    this.ballMenu.setVisible(true);
  }

  /**
   * Affiche le menu des objets
   */
  showItemMenu(inventory: InventorySlot[]): void {
    this.updateItemMenu(inventory);
    this.actionMenu.setVisible(false);
    this.moveMenu.setVisible(false);
    this.ballMenu.setVisible(false);
    this.bagSubMenu.setVisible(false);
    this.itemMenu.setVisible(true);
  }

  /**
   * Cache tous les menus
   */
  hideAll(): void {
    this.actionMenu.setVisible(false);
    this.moveMenu.setVisible(false);
    this.ballMenu.setVisible(false);
    this.itemMenu.setVisible(false);
    this.bagSubMenu.setVisible(false);
  }

  /**
   * Détruit tous les menus
   */
  destroy(): void {
    this.actionMenu.destroy();
    this.moveMenu.destroy();
    this.ballMenu.destroy();
    this.itemMenu.destroy();
    this.bagSubMenu.destroy();
  }
}
