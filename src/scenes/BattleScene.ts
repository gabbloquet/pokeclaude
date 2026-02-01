import Phaser from 'phaser';
import type { CreatureInstance, Move } from '@/types/creature.types';
import type { InventorySlot } from '@/types/game.types';
import { BattleSystem, BattleMessage, BattleResult } from '@/systems/battle/BattleSystem';
import { BattleAnimationManager } from '@/systems/battle/BattleAnimationManager';
import { BattleUIManager } from '@/ui/battle/BattleUIManager';
import { EventBus, BATTLE_EVENTS } from '@/events';
import { getSpecies } from '@/data/creatures/species';
import { getPokeBall } from '@/data/items/balls';
import { getItem } from '@/data/items/items';
import { calculateAllStats } from '@/utils/creatureUtils';
import {
  addExperience,
  calculateExpGain,
  learnMove,
  checkCanEvolve,
  type LevelUpResult,
} from '@/systems/progression/ExperienceSystem';
import { useGameStore } from '@/store/gameStore';

interface BattleSceneData {
  playerTeam: CreatureInstance[];
  enemyCreature: CreatureInstance;
  isWildBattle: boolean;
  inventory?: InventorySlot[];
}

/**
 * Scène de combat - Orchestrateur principal
 * Utilise une architecture Event-Driven pour la communication entre modules
 */
export class BattleScene extends Phaser.Scene {
  private battleSystem!: BattleSystem;
  private uiManager!: BattleUIManager;
  private animationManager!: BattleAnimationManager;

  private playerTeam: CreatureInstance[] = [];
  private currentCreatureIndex: number = 0;
  private isWildBattle: boolean = true;
  private inventory: InventorySlot[] = [];
  private isProcessing: boolean = false;

  // Référence pour la capture en cours
  private pendingCapturedCreature: CreatureInstance | null = null;

  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data: BattleSceneData): void {
    this.playerTeam = data.playerTeam;
    this.isWildBattle = data.isWildBattle;
    this.currentCreatureIndex = 0;
    this.inventory = data.inventory || this.getDefaultInventory();
    this.isProcessing = false;
    this.pendingCapturedCreature = null;

    this.battleSystem = new BattleSystem(
      this.playerTeam[0],
      data.enemyCreature,
      data.isWildBattle,
      this.handleBattleMessages.bind(this)
    );
  }

  private getDefaultInventory(): InventorySlot[] {
    return [
      // Balls
      { itemId: 1, quantity: 10 },  // Poké Ball
      { itemId: 2, quantity: 5 },   // Super Ball
      { itemId: 3, quantity: 2 },   // Hyper Ball
      // Potions
      { itemId: 10, quantity: 5 },  // Potion
      { itemId: 11, quantity: 3 },  // Super Potion
      // Soins de statut
      { itemId: 23, quantity: 2 },  // Antidote
      { itemId: 25, quantity: 1 },  // Total Soin
    ];
  }

  create(): void {
    const playerCreature = this.battleSystem.getPlayerCreature();
    const enemyCreature = this.battleSystem.getEnemyCreature();

    // Créer les managers
    this.animationManager = new BattleAnimationManager(this);

    this.uiManager = new BattleUIManager(this, {
      playerCreature: {
        instance: playerCreature.instance,
        species: playerCreature.species,
        currentHp: playerCreature.currentHp,
      },
      enemyCreature: {
        instance: enemyCreature.instance,
        species: enemyCreature.species,
        currentHp: enemyCreature.currentHp,
      },
      useEventBus: true, // Activer le mode Event-Driven
    });

    this.uiManager.create();

    // S'abonner aux événements
    this.setupEventListeners();

    // Démarrer le combat
    this.showBattleIntro();
  }

  // === Event Listeners ===

  private setupEventListeners(): void {
    // Actions du joueur
    EventBus.onBattle(BATTLE_EVENTS.ACTION_SELECTED, this.onActionSelected.bind(this));
    EventBus.onBattle(BATTLE_EVENTS.MOVE_SELECTED, this.onMoveSelected.bind(this));
    EventBus.onBattle(BATTLE_EVENTS.BALL_SELECTED, this.onBallSelected.bind(this));
    EventBus.onBattle(BATTLE_EVENTS.ITEM_SELECTED, this.onItemSelected.bind(this));

    // Capture réussie (après surnom)
    EventBus.onBattle(BATTLE_EVENTS.CAPTURE_SUCCESS, this.onCaptureConfirmed.bind(this));

    // Debug mode (désactiver en prod)
    // EventBus.setDebug(true);
  }

  private cleanupEventListeners(): void {
    EventBus.offBattle(BATTLE_EVENTS.ACTION_SELECTED);
    EventBus.offBattle(BATTLE_EVENTS.MOVE_SELECTED);
    EventBus.offBattle(BATTLE_EVENTS.BALL_SELECTED);
    EventBus.offBattle(BATTLE_EVENTS.ITEM_SELECTED);
    EventBus.offBattle(BATTLE_EVENTS.CAPTURE_SUCCESS);
  }

  // === Event Handlers ===

  private onActionSelected(payload: { actionIndex: number }): void {
    if (this.isProcessing) return;

    switch (payload.actionIndex) {
      case 0: // Attaque
        this.uiManager.showMoveMenu();
        break;
      case 1: // Sac
        this.handleBagAction();
        break;
      case 2: // Pokémon
        this.uiManager.showMessage('Pas d\'autres creatures disponibles...', () => {
          this.uiManager.showActionMenu();
        });
        break;
      case 3: // Fuite
        this.handleRun();
        break;
    }
  }

  private async onMoveSelected(payload: { moveId: number }): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.uiManager.hideMenus();

    // Émettre l'événement de début de tour
    EventBus.emitBattle(BATTLE_EVENTS.TURN_START, undefined);

    const result = await this.battleSystem.executeAction({
      type: 'fight',
      moveId: payload.moveId,
    });

    this.emitHpUpdates();
    this.handleBattleResult(result);
  }

  private async onBallSelected(payload: { ballId: number }): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.uiManager.hideMenus();

    // Émettre l'événement de capture
    EventBus.emitBattle(BATTLE_EVENTS.CAPTURE_START, { ballId: payload.ballId });

    // Retirer la ball de l'inventaire
    const ballSlot = this.inventory.find(slot => slot.itemId === payload.ballId);
    if (ballSlot) {
      ballSlot.quantity--;
      if (ballSlot.quantity <= 0) {
        this.inventory = this.inventory.filter(slot => slot.itemId !== payload.ballId);
      }
    }

    const ball = getPokeBall(payload.ballId);
    this.uiManager.showMessage(`Vous lancez une ${ball?.name || 'Ball'} !`);

    const result = await this.battleSystem.executeAction({
      type: 'capture',
      ballId: payload.ballId,
    });

    // Jouer l'animation de capture
    if (result.captureResult) {
      // Émettre les événements de secousse
      for (let i = 0; i < result.captureResult.shakeCount; i++) {
        EventBus.emitBattle(BATTLE_EVENTS.CAPTURE_SHAKE, { shakeNumber: i + 1 });
      }

      await this.animationManager.playCaptureAnimation(
        this.uiManager.getEnemySprite(),
        result.captureResult.shakeCount,
        result.captureResult.success
      );
    }

    this.emitHpUpdates();
    this.handleBattleResult(result);
  }

  private onCaptureConfirmed(payload: { creatureId: string }): void {
    if (this.pendingCapturedCreature && this.pendingCapturedCreature.id === payload.creatureId) {
      this.endBattleWithCapture(this.pendingCapturedCreature);
      this.pendingCapturedCreature = null;
    }
  }

  // === Logique de combat ===

  private handleBagAction(): void {
    // Afficher le sous-menu du sac (Balls ou Objets)
    this.uiManager.showBagSubMenu(this.inventory, this.isWildBattle);
  }

  private async onItemSelected(payload: { itemId: number }): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.uiManager.hideMenus();

    // Retirer l'objet de l'inventaire
    const itemSlot = this.inventory.find(slot => slot.itemId === payload.itemId);
    if (itemSlot) {
      itemSlot.quantity--;
      if (itemSlot.quantity <= 0) {
        this.inventory = this.inventory.filter(slot => slot.itemId !== payload.itemId);
      }
    }

    const item = getItem(payload.itemId);
    this.uiManager.showMessage(`Vous utilisez ${item?.name || 'un objet'} !`);

    const result = await this.battleSystem.executeAction({
      type: 'item',
      itemId: payload.itemId,
    });

    // Si l'objet n'a pas pu être utilisé, le remettre dans l'inventaire
    if (!result.itemUsed) {
      if (itemSlot) {
        itemSlot.quantity++;
      } else {
        this.inventory.push({ itemId: payload.itemId, quantity: 1 });
      }
    }

    this.emitHpUpdates();
    this.handleBattleResult(result);
  }

  private async handleRun(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const result = await this.battleSystem.executeAction({ type: 'run' });
    this.handleBattleResult(result);
  }

  private showBattleIntro(): void {
    const enemyCreature = this.battleSystem.getEnemyCreature();
    const introText = this.isWildBattle
      ? `Un ${enemyCreature.species.name} sauvage apparait !`
      : `Le dresseur envoie ${enemyCreature.species.name} !`;

    this.uiManager.showMessage(introText, () => {
      this.uiManager.showActionMenu();
    });
  }

  private async handleBattleMessages(messages: BattleMessage[]): Promise<void> {
    for (const message of messages) {
      await new Promise<void>((resolve) => {
        this.uiManager.showMessage(message.text, resolve);
      });
    }
  }

  private handleBattleResult(result: BattleResult): void {
    this.isProcessing = false;

    // Émettre l'événement de fin de tour
    EventBus.emitBattle(BATTLE_EVENTS.TURN_END, undefined);

    switch (result.type) {
      case 'victory':
        EventBus.emitBattle(BATTLE_EVENTS.CREATURE_FAINTED, { target: 'enemy' });
        this.handleVictory();
        break;
      case 'defeat':
        EventBus.emitBattle(BATTLE_EVENTS.CREATURE_FAINTED, { target: 'player' });
        this.uiManager.showMessage('Vous avez perdu...', () => {
          this.endBattle(false);
        });
        break;
      case 'capture':
        if (result.capturedCreature) {
          this.pendingCapturedCreature = result.capturedCreature;
          this.uiManager.showMessage(result.captureResult?.message || 'Capture reussie !', () => {
            this.uiManager.showNicknameInput(result.capturedCreature!);
          });
        }
        break;
      case 'escape':
        EventBus.emitBattle(BATTLE_EVENTS.BATTLE_END, { result: 'escape' });
        this.endBattle(true);
        break;
      case 'ongoing':
        this.uiManager.showActionMenu();
        break;
    }
  }

  private async handleVictory(): Promise<void> {
    const playerCreature = this.playerTeam[this.currentCreatureIndex];
    const enemyCreature = this.battleSystem.getEnemyCreature();

    const expGained = calculateExpGain(
      playerCreature,
      enemyCreature.instance,
      this.isWildBattle
    );

    // Émettre l'événement d'XP
    EventBus.emitBattle(BATTLE_EVENTS.EXP_GAINED, {
      creatureId: playerCreature.id,
      amount: expGained,
    });

    const species = getSpecies(playerCreature.speciesId);
    const creatureName = playerCreature.nickname || species?.name || 'Creature';

    await new Promise<void>((resolve) => {
      this.uiManager.showMessage(`${creatureName} gagne ${expGained} points d'EXP !`, resolve);
    });

    const expResult = addExperience(playerCreature, expGained);

    for (const levelUp of expResult.levelUps) {
      await this.processLevelUp(playerCreature, levelUp);
    }

    // Mettre à jour le store
    const gameStore = useGameStore.getState();
    gameStore.updateCreature(playerCreature.id, {
      exp: playerCreature.exp,
      level: playerCreature.level,
      currentHp: playerCreature.currentHp,
      moves: playerCreature.moves,
    });

    if (checkCanEvolve(playerCreature)) {
      EventBus.emitBattle(BATTLE_EVENTS.EVOLUTION_START, undefined);
      await this.triggerEvolution(playerCreature);
    } else {
      EventBus.emitBattle(BATTLE_EVENTS.BATTLE_END, { result: 'victory' });
      this.endBattle(true);
    }
  }

  private async processLevelUp(creature: CreatureInstance, levelUp: LevelUpResult): Promise<void> {
    const species = getSpecies(creature.speciesId);
    const creatureName = creature.nickname || species?.name || 'Creature';

    // Émettre l'événement de level up
    EventBus.emitBattle(BATTLE_EVENTS.LEVEL_UP, {
      creatureId: creature.id,
      newLevel: levelUp.newLevel,
    });

    await new Promise<void>((resolve) => {
      this.uiManager.showMessage(`${creatureName} monte au niveau ${levelUp.newLevel} !`, resolve);
    });

    this.uiManager.updatePlayerLevel(creature.level);
    this.emitHpUpdates();

    for (const newMove of levelUp.newMoves) {
      await this.processNewMove(creature, newMove);
    }
  }

  private async processNewMove(creature: CreatureInstance, newMove: Move): Promise<void> {
    const species = getSpecies(creature.speciesId);
    const creatureName = creature.nickname || species?.name || 'Creature';

    if (creature.moves.length < 4) {
      learnMove(creature, newMove.id);

      // Émettre l'événement d'apprentissage
      EventBus.emitBattle(BATTLE_EVENTS.MOVE_LEARNED, {
        creatureId: creature.id,
        moveId: newMove.id,
      });

      await new Promise<void>((resolve) => {
        this.uiManager.showMessage(`${creatureName} apprend ${newMove.name} !`, resolve);
      });
    } else {
      await this.showMoveLearnChoice(creature, newMove);
    }
  }

  private showMoveLearnChoice(creature: CreatureInstance, newMove: Move): Promise<void> {
    return new Promise((resolve) => {
      this.scene.launch('MoveLearnScene', {
        creature,
        newMove,
        onComplete: (learned: boolean, slotReplaced?: number) => {
          if (learned && slotReplaced !== undefined) {
            learnMove(creature, newMove.id, slotReplaced);
            EventBus.emitBattle(BATTLE_EVENTS.MOVE_LEARNED, {
              creatureId: creature.id,
              moveId: newMove.id,
            });
          }
          this.scene.stop('MoveLearnScene');
          resolve();
        },
      });
    });
  }

  private async triggerEvolution(creature: CreatureInstance): Promise<void> {
    return new Promise((resolve) => {
      this.scene.launch('EvolutionScene', {
        creature,
        onComplete: (evolved: boolean, newCreature?: CreatureInstance) => {
          if (evolved && newCreature) {
            this.playerTeam[this.currentCreatureIndex] = newCreature;

            const gameStore = useGameStore.getState();
            gameStore.updateCreature(creature.id, {
              speciesId: newCreature.speciesId,
              currentHp: newCreature.currentHp,
            });
          }
          this.scene.stop('EvolutionScene');
          EventBus.emitBattle(BATTLE_EVENTS.BATTLE_END, { result: 'victory' });
          this.endBattle(true);
          resolve();
        },
      });
    });
  }

  // === Utilitaires ===

  private emitHpUpdates(): void {
    const playerCreature = this.battleSystem.getPlayerCreature();
    const enemyCreature = this.battleSystem.getEnemyCreature();

    const playerMaxHp = this.getMaxHp(playerCreature.instance);
    const enemyMaxHp = this.getMaxHp(enemyCreature.instance);

    EventBus.emitBattle(BATTLE_EVENTS.HP_UPDATE, {
      target: 'player',
      currentHp: playerCreature.currentHp,
      maxHp: playerMaxHp,
    });

    EventBus.emitBattle(BATTLE_EVENTS.HP_UPDATE, {
      target: 'enemy',
      currentHp: enemyCreature.currentHp,
      maxHp: enemyMaxHp,
    });
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

  // === Fin de combat ===

  private endBattle(victory: boolean): void {
    this.cleanupEventListeners();
    this.uiManager.destroy();

    const playerCreature = this.battleSystem.getPlayerCreature();
    this.playerTeam[this.currentCreatureIndex].currentHp = playerCreature.currentHp;

    this.scene.start('WorldScene', {
      victory,
      inventory: this.inventory,
    });
  }

  private endBattleWithCapture(capturedCreature: CreatureInstance): void {
    this.cleanupEventListeners();
    this.uiManager.destroy();

    EventBus.emitBattle(BATTLE_EVENTS.BATTLE_END, { result: 'capture' });

    const playerCreature = this.battleSystem.getPlayerCreature();
    this.playerTeam[this.currentCreatureIndex].currentHp = playerCreature.currentHp;

    this.scene.start('WorldScene', {
      victory: true,
      capturedCreature,
      inventory: this.inventory,
    });
  }
}
