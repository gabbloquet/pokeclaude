import Phaser from 'phaser';
import type { CreatureInstance } from '@/types/creature.types';
import type { InventorySlot } from '@/types/game.types';
import { getSpecies } from '@/data/creatures/species';
import { getItem } from '@/data/items/items';
import { calculateMaxHp } from '@/utils/creatureUtils';
import { useGameStore } from '@/store/gameStore';
import {
  useItemOverworld,
  getUsableItemsOverworld,
  canUseItemOverworld,
} from '@/systems/items/OverworldItemSystem';
import { UI_COLORS, TEXT_STYLES, getTypeColor, getHpBarColor } from '@/config/ui.config';

// Constantes locales pour éviter la dépendance circulaire
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

type MenuState = 'main' | 'team' | 'items' | 'item_use' | 'message';

interface PauseMenuSceneData {
  returnScene: string;
}

/**
 * Scene du menu de pause - Permet de gerer l'equipe et les objets
 */
export class PauseMenuScene extends Phaser.Scene {
  private returnScene: string = 'WorldScene';
  private menuState: MenuState = 'main';
  private selectedCreatureIndex: number = 0;
  private selectedItemIndex: number = 0;

  // Containers
  private mainMenuContainer!: Phaser.GameObjects.Container;
  private teamContainer!: Phaser.GameObjects.Container;
  private itemsContainer!: Phaser.GameObjects.Container;
  private messageContainer!: Phaser.GameObjects.Container;

  // Data
  private team: CreatureInstance[] = [];
  private inventory: InventorySlot[] = [];
  private usableItems: InventorySlot[] = [];

  constructor() {
    super({ key: 'PauseMenuScene' });
  }

  init(data: PauseMenuSceneData): void {
    this.returnScene = data?.returnScene || 'WorldScene';
    this.menuState = 'main';
    this.selectedCreatureIndex = 0;
    this.selectedItemIndex = 0;

    // Charger les donnees du store
    const store = useGameStore.getState();
    this.team = store.team;
    this.inventory = store.inventory;
    this.usableItems = getUsableItemsOverworld(this.inventory);
  }

  create(): void {
    // Fond semi-transparent
    const overlay = this.add.graphics();
    overlay.fillStyle(UI_COLORS.overlay, 0.7);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.createMainMenu();
    this.createTeamView();
    this.createItemsView();
    this.createMessageBox();

    this.showMainMenu();
    this.setupInput();
  }

  private setupInput(): void {
    // Touche Escape pour fermer/retour
    this.input.keyboard?.on('keydown-ESC', () => {
      this.handleBack();
    });

    // Touche P pour fermer depuis main
    this.input.keyboard?.on('keydown-P', () => {
      if (this.menuState === 'main') {
        this.closeMenu();
      }
    });
  }

  private handleBack(): void {
    switch (this.menuState) {
      case 'main':
        this.closeMenu();
        break;
      case 'team':
      case 'items':
        this.showMainMenu();
        break;
      case 'item_use':
        this.showTeamView();
        break;
      case 'message':
        this.showMainMenu();
        break;
    }
  }

  private closeMenu(): void {
    this.scene.stop();
    this.scene.resume(this.returnScene);
  }

  // === MAIN MENU ===

  private createMainMenu(): void {
    this.mainMenuContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // Fond du menu
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.background, 1);
    bg.fillRoundedRect(-120, -100, 240, 200, 12);
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(-120, -100, 240, 200, 12);
    this.mainMenuContainer.add(bg);

    // Titre
    const title = this.add.text(0, -75, 'MENU', {
      ...TEXT_STYLES.creatureName,
      fontSize: '18px',
    });
    title.setOrigin(0.5);
    this.mainMenuContainer.add(title);

    // Boutons
    const buttons = [
      { label: 'EQUIPE', action: () => this.showTeamView() },
      { label: 'SAC', action: () => this.showItemsView() },
      { label: 'SAUVEGARDER', action: () => this.handleSave() },
      { label: 'FERMER', action: () => this.closeMenu() },
    ];

    buttons.forEach((btn, i) => {
      const y = -35 + i * 45;
      this.createButton(this.mainMenuContainer, 0, y, 180, 35, btn.label, btn.action);
    });

    this.mainMenuContainer.setVisible(false);
  }

  private showMainMenu(): void {
    this.menuState = 'main';
    this.mainMenuContainer.setVisible(true);
    this.teamContainer.setVisible(false);
    this.itemsContainer.setVisible(false);
    this.messageContainer.setVisible(false);
  }

  // === TEAM VIEW ===

  private createTeamView(): void {
    this.teamContainer = this.add.container(0, 0);
    this.teamContainer.setVisible(false);
  }

  private showTeamView(): void {
    this.menuState = 'team';
    this.mainMenuContainer.setVisible(false);
    this.teamContainer.setVisible(true);
    this.itemsContainer.setVisible(false);
    this.messageContainer.setVisible(false);

    this.refreshTeamView();
  }

  private refreshTeamView(): void {
    this.teamContainer.removeAll(true);

    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.background, 0.95);
    bg.fillRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);
    this.teamContainer.add(bg);

    // Titre
    const title = this.add.text(GAME_WIDTH / 2, 40, 'EQUIPE', {
      ...TEXT_STYLES.creatureName,
      fontSize: '16px',
    });
    title.setOrigin(0.5);
    this.teamContainer.add(title);

    // Afficher chaque creature
    this.team.forEach((creature, i) => {
      this.createCreatureCard(creature, i, 40, 70 + i * 55);
    });

    // Bouton retour
    this.createButton(
      this.teamContainer,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 50,
      100,
      30,
      'RETOUR',
      () => this.showMainMenu()
    );
  }

  private createCreatureCard(
    creature: CreatureInstance,
    index: number,
    x: number,
    y: number
  ): void {
    const species = getSpecies(creature.speciesId);
    if (!species) return;

    const cardWidth = GAME_WIDTH - 80;
    const cardHeight = 50;

    // Fond de la carte
    const cardBg = this.add.graphics();
    const bgColor = index === this.selectedCreatureIndex ? 0xd0d0ff : 0xf0f0f0;
    cardBg.fillStyle(bgColor, 1);
    cardBg.fillRoundedRect(x, y, cardWidth, cardHeight, 8);
    cardBg.lineStyle(2, getTypeColor(species.types[0]));
    cardBg.strokeRoundedRect(x, y, cardWidth, cardHeight, 8);
    this.teamContainer.add(cardBg);

    // Nom et niveau
    const name = creature.nickname || species.name;
    const nameText = this.add.text(x + 10, y + 8, `${name}  Nv.${creature.level}`, {
      ...TEXT_STYLES.creatureName,
      fontSize: '12px',
    });
    this.teamContainer.add(nameText);

    // Barre de vie
    const maxHp = calculateMaxHp(species, creature.level, creature.ivs.hp, creature.evs.hp);
    const hpRatio = creature.currentHp / maxHp;

    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x333333, 1);
    hpBarBg.fillRoundedRect(x + 10, y + 28, 100, 8, 3);
    this.teamContainer.add(hpBarBg);

    const hpBarFill = this.add.graphics();
    hpBarFill.fillStyle(getHpBarColor(hpRatio), 1);
    hpBarFill.fillRoundedRect(x + 11, y + 29, Math.max(0, 98 * hpRatio), 6, 2);
    this.teamContainer.add(hpBarFill);

    // Texte HP
    const hpText = this.add.text(x + 115, y + 26, `${creature.currentHp}/${maxHp}`, {
      ...TEXT_STYLES.hpText,
      fontSize: '10px',
    });
    this.teamContainer.add(hpText);

    // Statut
    if (creature.status) {
      const statusText = this.add.text(x + 170, y + 26, creature.status.toUpperCase(), {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#ff6600',
        fontStyle: 'bold',
      });
      this.teamContainer.add(statusText);
    }

    // Zone cliquable
    const hitArea = this.add.rectangle(
      x + cardWidth / 2,
      y + cardHeight / 2,
      cardWidth,
      cardHeight
    );
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.selectedCreatureIndex = index;
      if (this.menuState === 'item_use') {
        this.useSelectedItem();
      } else {
        this.refreshTeamView();
      }
    });
    this.teamContainer.add(hitArea);
  }

  // === ITEMS VIEW ===

  private createItemsView(): void {
    this.itemsContainer = this.add.container(0, 0);
    this.itemsContainer.setVisible(false);
  }

  private showItemsView(): void {
    this.menuState = 'items';
    this.mainMenuContainer.setVisible(false);
    this.teamContainer.setVisible(false);
    this.itemsContainer.setVisible(true);
    this.messageContainer.setVisible(false);

    // Actualiser les objets utilisables
    this.usableItems = getUsableItemsOverworld(this.inventory);
    this.refreshItemsView();
  }

  private refreshItemsView(): void {
    this.itemsContainer.removeAll(true);

    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.background, 0.95);
    bg.fillRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);
    this.itemsContainer.add(bg);

    // Titre
    const title = this.add.text(GAME_WIDTH / 2, 40, 'OBJETS', {
      ...TEXT_STYLES.creatureName,
      fontSize: '16px',
    });
    title.setOrigin(0.5);
    this.itemsContainer.add(title);

    if (this.usableItems.length === 0) {
      const noItems = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'Aucun objet utilisable', {
        ...TEXT_STYLES.message,
        fontSize: '14px',
        color: UI_COLORS.textSecondary,
      });
      noItems.setOrigin(0.5);
      this.itemsContainer.add(noItems);
    } else {
      // Liste des objets
      this.usableItems.forEach((slot, i) => {
        this.createItemCard(slot, i, 40, 70 + i * 40);
      });
    }

    // Bouton retour
    this.createButton(
      this.itemsContainer,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 50,
      100,
      30,
      'RETOUR',
      () => this.showMainMenu()
    );
  }

  private createItemCard(slot: InventorySlot, index: number, x: number, y: number): void {
    const item = getItem(slot.itemId);
    if (!item) return;

    const cardWidth = GAME_WIDTH - 80;
    const cardHeight = 35;

    // Couleur selon categorie
    const categoryColors: Record<string, number> = {
      potion: 0x90ee90,
      statusHeal: 0xffb6c1,
    };
    const bgColor = categoryColors[item.category] || 0xf0f0f0;

    // Fond
    const cardBg = this.add.graphics();
    cardBg.fillStyle(bgColor, 1);
    cardBg.fillRoundedRect(x, y, cardWidth, cardHeight, 6);
    cardBg.lineStyle(2, UI_COLORS.border);
    cardBg.strokeRoundedRect(x, y, cardWidth, cardHeight, 6);
    this.itemsContainer.add(cardBg);

    // Nom et quantite
    const nameText = this.add.text(x + 10, y + 10, `${item.name} x${slot.quantity}`, {
      ...TEXT_STYLES.buttonLabel,
      fontSize: '11px',
    });
    this.itemsContainer.add(nameText);

    // Description
    const descText = this.add.text(x + cardWidth - 10, y + 10, item.description, {
      fontFamily: 'Arial',
      fontSize: '9px',
      color: UI_COLORS.textSecondary,
    });
    descText.setOrigin(1, 0);
    this.itemsContainer.add(descText);

    // Zone cliquable
    const hitArea = this.add.rectangle(
      x + cardWidth / 2,
      y + cardHeight / 2,
      cardWidth,
      cardHeight
    );
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.selectedItemIndex = index;
      this.showItemUseView();
    });
    this.itemsContainer.add(hitArea);
  }

  // === ITEM USE VIEW ===

  private showItemUseView(): void {
    this.menuState = 'item_use';
    this.mainMenuContainer.setVisible(false);
    this.teamContainer.setVisible(true);
    this.itemsContainer.setVisible(false);

    // Afficher l'equipe avec indication de selection
    this.refreshTeamViewForItemUse();
  }

  private refreshTeamViewForItemUse(): void {
    this.teamContainer.removeAll(true);

    const selectedSlot = this.usableItems[this.selectedItemIndex];
    const item = getItem(selectedSlot?.itemId);

    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.background, 0.95);
    bg.fillRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(20, 20, GAME_WIDTH - 40, GAME_HEIGHT - 40, 12);
    this.teamContainer.add(bg);

    // Titre
    const title = this.add.text(
      GAME_WIDTH / 2,
      40,
      `Utiliser ${item?.name || 'objet'} sur...`,
      {
        ...TEXT_STYLES.creatureName,
        fontSize: '14px',
      }
    );
    title.setOrigin(0.5);
    this.teamContainer.add(title);

    // Afficher chaque creature avec indication de compatibilite
    this.team.forEach((creature, i) => {
      this.createCreatureCardForItemUse(creature, i, item, 40, 70 + i * 55);
    });

    // Bouton retour
    this.createButton(
      this.teamContainer,
      GAME_WIDTH / 2,
      GAME_HEIGHT - 50,
      100,
      30,
      'RETOUR',
      () => this.showItemsView()
    );
  }

  private createCreatureCardForItemUse(
    creature: CreatureInstance,
    index: number,
    item: ReturnType<typeof getItem>,
    x: number,
    y: number
  ): void {
    const species = getSpecies(creature.speciesId);
    if (!species || !item) return;

    const canUse = canUseItemOverworld(item, creature);
    const cardWidth = GAME_WIDTH - 80;
    const cardHeight = 50;

    // Fond de la carte
    const cardBg = this.add.graphics();
    const bgColor = canUse.canUse ? 0xe0ffe0 : 0xffe0e0;
    cardBg.fillStyle(bgColor, 1);
    cardBg.fillRoundedRect(x, y, cardWidth, cardHeight, 8);
    cardBg.lineStyle(2, canUse.canUse ? 0x00aa00 : 0xaa0000);
    cardBg.strokeRoundedRect(x, y, cardWidth, cardHeight, 8);
    this.teamContainer.add(cardBg);

    // Nom et niveau
    const name = creature.nickname || species.name;
    const nameText = this.add.text(x + 10, y + 8, `${name}  Nv.${creature.level}`, {
      ...TEXT_STYLES.creatureName,
      fontSize: '12px',
      color: canUse.canUse ? '#000000' : '#999999',
    });
    this.teamContainer.add(nameText);

    // Barre de vie
    const maxHp = calculateMaxHp(species, creature.level, creature.ivs.hp, creature.evs.hp);
    const hpRatio = creature.currentHp / maxHp;

    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x333333, 1);
    hpBarBg.fillRoundedRect(x + 10, y + 28, 100, 8, 3);
    this.teamContainer.add(hpBarBg);

    const hpBarFill = this.add.graphics();
    hpBarFill.fillStyle(getHpBarColor(hpRatio), 1);
    hpBarFill.fillRoundedRect(x + 11, y + 29, Math.max(0, 98 * hpRatio), 6, 2);
    this.teamContainer.add(hpBarFill);

    // Texte HP
    const hpText = this.add.text(x + 115, y + 26, `${creature.currentHp}/${maxHp}`, {
      ...TEXT_STYLES.hpText,
      fontSize: '10px',
    });
    this.teamContainer.add(hpText);

    // Message si non utilisable
    if (!canUse.canUse && canUse.reason) {
      const reasonText = this.add.text(x + cardWidth - 10, y + 35, canUse.reason, {
        fontFamily: 'Arial',
        fontSize: '9px',
        color: '#aa0000',
      });
      reasonText.setOrigin(1, 0.5);
      this.teamContainer.add(reasonText);
    }

    // Zone cliquable (seulement si utilisable)
    if (canUse.canUse) {
      const hitArea = this.add.rectangle(
        x + cardWidth / 2,
        y + cardHeight / 2,
        cardWidth,
        cardHeight
      );
      hitArea.setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.selectedCreatureIndex = index;
        this.useSelectedItem();
      });
      this.teamContainer.add(hitArea);
    }
  }

  private useSelectedItem(): void {
    const slot = this.usableItems[this.selectedItemIndex];
    if (!slot || slot.quantity <= 0) return;

    const creature = this.team[this.selectedCreatureIndex];
    if (!creature) return;

    const result = useItemOverworld(slot.itemId, creature);

    if (result.success) {
      // Retirer l'objet de l'inventaire
      const store = useGameStore.getState();
      store.removeItem(slot.itemId, 1);

      // Mettre a jour la creature dans le store
      store.updateCreature(creature.id, {
        currentHp: creature.currentHp,
        status: creature.status,
      });

      // Actualiser les donnees locales
      this.inventory = store.inventory;
      this.usableItems = getUsableItemsOverworld(this.inventory);
    }

    // Afficher le message
    this.showMessage(result.message, () => {
      if (result.success) {
        this.showItemsView();
      } else {
        this.showItemUseView();
      }
    });
  }

  // === MESSAGE BOX ===

  private createMessageBox(): void {
    this.messageContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.messageContainer.setVisible(false);
  }

  private showMessage(text: string, onComplete?: () => void): void {
    this.menuState = 'message';
    this.mainMenuContainer.setVisible(false);
    this.teamContainer.setVisible(false);
    this.itemsContainer.setVisible(false);
    this.messageContainer.setVisible(true);

    this.messageContainer.removeAll(true);

    // Fond
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.background, 1);
    bg.fillRoundedRect(-140, -40, 280, 80, 10);
    bg.lineStyle(3, UI_COLORS.border);
    bg.strokeRoundedRect(-140, -40, 280, 80, 10);
    this.messageContainer.add(bg);

    // Texte
    const msgText = this.add.text(0, 0, text, {
      ...TEXT_STYLES.message,
      fontSize: '12px',
      wordWrap: { width: 260 },
      align: 'center',
    });
    msgText.setOrigin(0.5);
    this.messageContainer.add(msgText);

    // Fermer apres un delai
    this.time.delayedCall(1500, () => {
      this.messageContainer.setVisible(false);
      if (onComplete) onComplete();
    });
  }

  // === SAVE ===

  private handleSave(): void {
    // Import dynamique pour eviter les dependances circulaires
    import('@/systems/save/SaveSystem').then(({ saveGame }) => {
      const store = useGameStore.getState();
      saveGame({
        player: store.player,
        team: store.team,
        pc: store.pc,
        inventory: store.inventory,
        badges: store.badges,
        playTime: store.playTime,
        savedAt: Date.now(),
      });
      this.showMessage('Partie sauvegardee !', () => this.showMainMenu());
    });
  }

  // === UTILITIES ===

  private createButton(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    onClick: () => void
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(UI_COLORS.buttonDefault, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    bg.lineStyle(2, UI_COLORS.border);
    bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    container.add(bg);

    const text = this.add.text(x, y, label, {
      ...TEXT_STYLES.buttonLabel,
      fontSize: '11px',
    });
    text.setOrigin(0.5);
    container.add(text);

    const hitArea = this.add.rectangle(x, y, width, height);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', onClick);
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(UI_COLORS.buttonHover, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 6);
      bg.lineStyle(2, UI_COLORS.border);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(UI_COLORS.buttonDefault, 1);
      bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 6);
      bg.lineStyle(2, UI_COLORS.border);
      bg.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 6);
    });
    container.add(hitArea);
  }
}
