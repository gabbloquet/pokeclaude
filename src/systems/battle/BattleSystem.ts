import type {
  BattleCreature,
  CreatureInstance,
  Move,
} from '@/types/creature.types';
import { getMove } from '@/data/moves/moves';
import {
  createBattleCreature,
  calculateDamage,
  checkAccuracy,
  determineFirstAttacker,
  getEffectivenessMessage,
} from '@/utils/battleUtils';
import {
  attemptCapture as attemptCaptureSystem,
  createCapturedCreature,
  type CaptureResult,
  type CaptureOptions,
} from '@/systems/capture/CaptureSystem';
import {
  initStatusState,
  canActThisTurn,
  applyEndOfTurnStatusDamage,
  clearStatusState,
} from './StatusSystem';
import { applyMoveEffects } from './MoveEffects';
import { useItemInBattle, getStatFromBoostItem } from './ItemSystem';

export type BattleAction =
  | { type: 'fight'; moveId: number }
  | { type: 'item'; itemId: number }
  | { type: 'switch'; creatureIndex: number }
  | { type: 'run' }
  | { type: 'capture'; ballId: number };

export interface BattleResult {
  type: 'victory' | 'defeat' | 'capture' | 'escape' | 'ongoing';
  expGained?: number;
  capturedCreature?: CreatureInstance;
  captureResult?: CaptureResult;
  itemUsed?: boolean;
}

export interface BattleMessage {
  text: string;
  delay?: number;
}

export type BattleEventHandler = (messages: BattleMessage[]) => Promise<void>;

export class BattleSystem {
  private playerCreature: BattleCreature;
  private enemyCreature: BattleCreature;
  private isWildBattle: boolean;
  private onBattleEvent: BattleEventHandler;
  private escapeAttempts: number = 0;
  private turnNumber: number = 1;
  private isInCave: boolean = false;
  private isNight: boolean = false;

  constructor(
    playerCreatureInstance: CreatureInstance,
    enemyCreatureInstance: CreatureInstance,
    isWildBattle: boolean,
    onBattleEvent: BattleEventHandler,
    options?: { isInCave?: boolean; isNight?: boolean }
  ) {
    this.playerCreature = createBattleCreature(playerCreatureInstance);
    this.enemyCreature = createBattleCreature(enemyCreatureInstance);
    this.isWildBattle = isWildBattle;
    this.onBattleEvent = onBattleEvent;
    this.isInCave = options?.isInCave ?? false;
    this.isNight = options?.isNight ?? false;

    // Initialise les états de statut pour les deux créatures
    initStatusState(this.playerCreature.instance.id);
    initStatusState(this.enemyCreature.instance.id);
  }

  getTurnNumber(): number {
    return this.turnNumber;
  }

  getPlayerCreature(): BattleCreature {
    return this.playerCreature;
  }

  getEnemyCreature(): BattleCreature {
    return this.enemyCreature;
  }

  async executeAction(playerAction: BattleAction): Promise<BattleResult> {
    const messages: BattleMessage[] = [];

    // Handle non-fight actions first
    if (playerAction.type === 'run') {
      return this.handleEscape(messages);
    }

    if (playerAction.type === 'capture') {
      return this.handleCapture(playerAction.ballId, messages);
    }

    if (playerAction.type === 'item') {
      return this.handleItem(playerAction.itemId, messages);
    }

    if (playerAction.type === 'switch') {
      // TODO: Implement switching
      return { type: 'ongoing' };
    }

    // Fight action
    if (playerAction.type !== 'fight') {
      return { type: 'ongoing' };
    }

    const playerMove = getMove(playerAction.moveId);
    if (!playerMove) {
      return { type: 'ongoing' };
    }

    // Enemy selects a move (simple AI: random move)
    const enemyMoveId = this.selectEnemyMove();
    const enemyMove = getMove(enemyMoveId);
    if (!enemyMove) {
      return { type: 'ongoing' };
    }

    // Determine order
    const firstAttacker = determineFirstAttacker(
      this.playerCreature,
      playerMove,
      this.enemyCreature,
      enemyMove
    );

    if (firstAttacker === 'creature1') {
      // Player attacks first
      const result = await this.executeMove(
        this.playerCreature,
        this.enemyCreature,
        playerMove,
        messages,
        true
      );
      if (result.type !== 'ongoing') return result;

      // Enemy attacks if still alive
      if (this.enemyCreature.currentHp > 0) {
        const result2 = await this.executeMove(
          this.enemyCreature,
          this.playerCreature,
          enemyMove,
          messages,
          false
        );
        if (result2.type !== 'ongoing') return result2;
      }
    } else {
      // Enemy attacks first
      const result = await this.executeMove(
        this.enemyCreature,
        this.playerCreature,
        enemyMove,
        messages,
        false
      );
      if (result.type !== 'ongoing') return result;

      // Player attacks if still alive
      if (this.playerCreature.currentHp > 0) {
        const result2 = await this.executeMove(
          this.playerCreature,
          this.enemyCreature,
          playerMove,
          messages,
          true
        );
        if (result2.type !== 'ongoing') return result2;
      }
    }

    // Applique les dégâts de statut en fin de tour
    const endOfTurnResult = await this.applyEndOfTurnEffects(messages);
    if (endOfTurnResult.type !== 'ongoing') {
      return endOfTurnResult;
    }

    // Update turn counters
    this.playerCreature.turnsInBattle++;
    this.enemyCreature.turnsInBattle++;
    this.turnNumber++;

    return { type: 'ongoing' };
  }

  /**
   * Applique les effets de fin de tour (dégâts de statut, etc.)
   */
  private async applyEndOfTurnEffects(
    messages: BattleMessage[]
  ): Promise<BattleResult> {
    // Dégâts de statut pour le joueur
    if (this.playerCreature.currentHp > 0) {
      const playerStatusDamage = applyEndOfTurnStatusDamage(this.playerCreature);
      if (playerStatusDamage) {
        messages.push({ text: playerStatusDamage.message });

        if (this.playerCreature.currentHp <= 0) {
          messages.push({ text: `${this.playerCreature.species.name} est K.O. !` });
          clearStatusState(this.playerCreature.instance.id);
          await this.onBattleEvent(messages);
          return { type: 'defeat' };
        }
      }
    }

    // Dégâts de statut pour l'ennemi
    if (this.enemyCreature.currentHp > 0) {
      const enemyStatusDamage = applyEndOfTurnStatusDamage(this.enemyCreature);
      if (enemyStatusDamage) {
        messages.push({ text: enemyStatusDamage.message });

        if (this.enemyCreature.currentHp <= 0) {
          messages.push({ text: `${this.enemyCreature.species.name} est K.O. !` });
          clearStatusState(this.enemyCreature.instance.id);
          await this.onBattleEvent(messages);
          const expGained = this.calculateExpGain();
          return { type: 'victory', expGained };
        }
      }
    }

    if (messages.length > 0) {
      await this.onBattleEvent(messages);
    }

    return { type: 'ongoing' };
  }

  private async handleCapture(
    ballId: number,
    messages: BattleMessage[]
  ): Promise<BattleResult> {
    // On ne peut capturer que dans un combat sauvage
    if (!this.isWildBattle) {
      messages.push({ text: 'Impossible de capturer la créature d\'un dresseur !' });
      await this.onBattleEvent(messages);
      return { type: 'ongoing' };
    }

    // Options de capture basées sur le contexte du combat
    const captureOptions: CaptureOptions = {
      turnNumber: this.turnNumber,
      isInCave: this.isInCave,
      isNight: this.isNight,
      hasBeenCaughtBefore: false, // TODO: Vérifier dans le Pokédex
    };

    // Tentative de capture
    const result = attemptCaptureSystem(this.enemyCreature, ballId, captureOptions);

    // Si capture réussie
    if (result.success) {
      const capturedCreature = createCapturedCreature(this.enemyCreature);
      messages.push({ text: result.message });
      await this.onBattleEvent(messages);

      return {
        type: 'capture',
        capturedCreature,
        captureResult: result,
      };
    }

    // Capture échouée - l'ennemi attaque
    messages.push({ text: result.message });

    // L'ennemi contre-attaque
    const enemyMoveId = this.selectEnemyMove();
    const enemyMove = getMove(enemyMoveId);
    if (enemyMove) {
      const attackResult = await this.executeMove(
        this.enemyCreature,
        this.playerCreature,
        enemyMove,
        messages,
        false
      );
      if (attackResult.type !== 'ongoing') {
        return attackResult;
      }
    }

    // Incrémenter le compteur de tours
    this.turnNumber++;

    return { type: 'ongoing', captureResult: result };
  }

  /**
   * Gère l'utilisation d'un objet en combat
   */
  private async handleItem(
    itemId: number,
    messages: BattleMessage[]
  ): Promise<BattleResult> {
    // Détermine la stat pour les objets de boost
    const targetStat = getStatFromBoostItem(itemId);

    // Utilise l'objet sur la créature du joueur
    const result = useItemInBattle(itemId, this.playerCreature, targetStat);

    messages.push({ text: result.message });

    if (!result.success) {
      await this.onBattleEvent(messages);
      return { type: 'ongoing', itemUsed: false };
    }

    // L'ennemi contre-attaque après l'utilisation d'un objet
    const enemyMoveId = this.selectEnemyMove();
    const enemyMove = getMove(enemyMoveId);
    if (enemyMove) {
      const attackResult = await this.executeMove(
        this.enemyCreature,
        this.playerCreature,
        enemyMove,
        messages,
        false
      );
      if (attackResult.type !== 'ongoing') {
        return attackResult;
      }
    }

    // Applique les effets de fin de tour
    const endOfTurnResult = await this.applyEndOfTurnEffects(messages);
    if (endOfTurnResult.type !== 'ongoing') {
      return endOfTurnResult;
    }

    // Incrémenter le compteur de tours
    this.turnNumber++;

    return { type: 'ongoing', itemUsed: true };
  }

  private async executeMove(
    attacker: BattleCreature,
    defender: BattleCreature,
    move: Move,
    messages: BattleMessage[],
    isPlayer: boolean
  ): Promise<BattleResult> {
    const attackerName = attacker.species.name;

    // Vérifie si le statut empêche d'agir
    const canAct = canActThisTurn(attacker);
    if (canAct.message) {
      messages.push({ text: canAct.message });
    }
    if (!canAct.canAct) {
      await this.onBattleEvent(messages);
      return { type: 'ongoing' };
    }

    messages.push({ text: `${attackerName} utilise ${move.name} !` });

    // Check accuracy avec les modificateurs de précision/esquive
    if (!checkAccuracy(move, attacker, defender)) {
      messages.push({ text: `${attackerName} rate son attaque !` });
      await this.onBattleEvent(messages);
      return { type: 'ongoing' };
    }

    // Gère les attaques multi-hit
    const isMultiHit = move.effect?.type === 'multiHit';
    const hitCount = isMultiHit
      ? this.calculateHitCount(move.effect?.minHits ?? 2, move.effect?.maxHits ?? 5)
      : 1;

    let totalDamage = 0;

    // Calculate and apply damage (une ou plusieurs fois pour multi-hit)
    if (move.power !== null) {
      for (let hit = 0; hit < hitCount; hit++) {
        const { damage, isCritical, effectiveness } = calculateDamage(
          attacker,
          defender,
          move
        );

        totalDamage += damage;
        defender.currentHp = Math.max(0, defender.currentHp - damage);

        if (hit === 0) {
          // Affiche les messages de critique et efficacité seulement au premier coup
          if (isCritical) {
            messages.push({ text: 'Coup critique !' });
          }

          const effectivenessMsg = getEffectivenessMessage(effectiveness);
          if (effectivenessMsg) {
            messages.push({ text: effectivenessMsg });
          }
        }

        // Check for KO pendant le multi-hit
        if (defender.currentHp <= 0) {
          break;
        }
      }

      // Affiche le nombre de coups pour multi-hit
      if (isMultiHit && hitCount > 1) {
        messages.push({ text: `Touché ${hitCount} fois !` });
      }

      // Check for KO
      if (defender.currentHp <= 0) {
        messages.push({ text: `${defender.species.name} est K.O. !` });
        // Nettoie l'état de statut
        clearStatusState(defender.instance.id);
        await this.onBattleEvent(messages);

        if (isPlayer) {
          const expGained = this.calculateExpGain();
          return { type: 'victory', expGained };
        } else {
          return { type: 'defeat' };
        }
      }
    }

    // Handle move effects avec le nouveau système
    if (move.effect) {
      const effectResult = applyMoveEffects(move, attacker, defender, totalDamage);
      for (const msg of effectResult.messages) {
        messages.push({ text: msg });
      }

      // Vérifie si l'attaquant est KO par le recul
      if (effectResult.additionalDamage && attacker.currentHp <= 0) {
        messages.push({ text: `${attackerName} est K.O. !` });
        clearStatusState(attacker.instance.id);
        await this.onBattleEvent(messages);

        if (isPlayer) {
          return { type: 'defeat' };
        } else {
          const expGained = this.calculateExpGain();
          return { type: 'victory', expGained };
        }
      }
    }

    await this.onBattleEvent(messages);
    return { type: 'ongoing' };
  }

  /**
   * Calcule le nombre de coups pour une attaque multi-hit
   * Distribution : 35% pour min, 35% pour min+1, 15% pour max-1, 15% pour max
   */
  private calculateHitCount(minHits: number, maxHits: number): number {
    if (minHits === maxHits) return minHits;

    const range = maxHits - minHits;
    if (range === 1) {
      // 50/50 pour 2 valeurs possibles
      return Math.random() < 0.5 ? minHits : maxHits;
    }

    // Distribution standard 2-5 : 35%, 35%, 15%, 15%
    const roll = Math.random() * 100;
    if (roll < 35) return minHits;
    if (roll < 70) return minHits + 1;
    if (roll < 85) return maxHits - 1;
    return maxHits;
  }

  private selectEnemyMove(): number {
    const moves = this.enemyCreature.instance.moves;
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  private async handleEscape(messages: BattleMessage[]): Promise<BattleResult> {
    if (!this.isWildBattle) {
      messages.push({ text: 'Impossible de fuir un combat de dresseur !' });
      await this.onBattleEvent(messages);
      return { type: 'ongoing' };
    }

    this.escapeAttempts++;

    // Escape formula
    const playerSpeed = this.playerCreature.instance.level * 2; // Simplified
    const enemySpeed = this.enemyCreature.instance.level * 2;
    const escapeOdds = Math.floor(
      ((playerSpeed * 128) / enemySpeed + 30 * this.escapeAttempts) % 256
    );

    if (Math.random() * 256 < escapeOdds) {
      messages.push({ text: 'Vous avez réussi à fuir !' });
      await this.onBattleEvent(messages);
      return { type: 'escape' };
    } else {
      messages.push({ text: 'Impossible de fuir !' });
      await this.onBattleEvent(messages);
      return { type: 'ongoing' };
    }
  }

  private calculateExpGain(): number {
    const enemyLevel = this.enemyCreature.instance.level;
    const baseExp = this.enemyCreature.species.baseExp;
    const isWild = this.isWildBattle ? 1 : 1.5;

    return Math.floor((baseExp * enemyLevel * isWild) / 7);
  }

  /**
   * Tente une capture avec le nouveau système
   * @deprecated Utiliser executeAction avec type 'capture'
   */
  attemptCapture(catchRateModifier: number): {
    success: boolean;
    shakeCount: number;
  } {
    // Trouver l'ID de ball correspondant au modificateur
    let ballId = 1; // Poké Ball par défaut
    if (catchRateModifier >= 255) ballId = 4; // Master Ball
    else if (catchRateModifier >= 2) ballId = 3; // Hyper Ball
    else if (catchRateModifier >= 1.5) ballId = 2; // Super Ball

    const result = attemptCaptureSystem(this.enemyCreature, ballId, {
      turnNumber: this.turnNumber,
      isInCave: this.isInCave,
      isNight: this.isNight,
    });

    return {
      success: result.success,
      shakeCount: result.shakeCount,
    };
  }

  /**
   * Exécute une tentative de capture et retourne le résultat complet
   */
  async executeCaptureAction(ballId: number): Promise<BattleResult> {
    const messages: BattleMessage[] = [];
    return this.handleCapture(ballId, messages);
  }
}
