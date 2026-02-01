import Phaser from 'phaser';
import type { CreatureInstance } from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';
import { evolveCreature, checkEvolution } from '@/systems/progression/EvolutionSystem';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game.config';

interface EvolutionSceneData {
  creature: CreatureInstance;
  onComplete: (evolved: boolean, newCreature?: CreatureInstance) => void;
}

export class EvolutionScene extends Phaser.Scene {
  private creature!: CreatureInstance;
  private onComplete!: (evolved: boolean, newCreature?: CreatureInstance) => void;
  private newSpeciesId!: number;

  private creatureSprite!: Phaser.GameObjects.Image;
  private messageText!: Phaser.GameObjects.Text;
  private cancelText!: Phaser.GameObjects.Text;

  private isCancelled: boolean = false;
  private evolutionPhase: 'intro' | 'animating' | 'evolving' | 'complete' | 'cancelled' = 'intro';

  private glowGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'EvolutionScene' });
  }

  init(data: EvolutionSceneData): void {
    this.creature = data.creature;
    this.onComplete = data.onComplete;
    this.isCancelled = false;
    this.evolutionPhase = 'intro';

    // Verifier l'evolution
    const newSpeciesId = checkEvolution(this.creature);
    if (!newSpeciesId) {
      // Pas d'evolution possible, quitter
      this.onComplete(false);
      return;
    }
    this.newSpeciesId = newSpeciesId;
  }

  create(): void {
    this.createBackground();
    this.createUI();
    this.createCreatureSprite();
    this.setupInput();
    this.startEvolutionSequence();
  }

  private createBackground(): void {
    // Fond noir avec gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Effet de lumiere
    this.glowGraphics = this.add.graphics();
  }

  private createUI(): void {
    // Boite de message
    const msgBg = this.add.graphics();
    msgBg.fillStyle(0xf8f8f8, 1);
    msgBg.fillRoundedRect(20, GAME_HEIGHT - 100, GAME_WIDTH - 40, 80, 8);
    msgBg.lineStyle(3, 0x333333);
    msgBg.strokeRoundedRect(20, GAME_HEIGHT - 100, GAME_WIDTH - 40, 80, 8);

    this.messageText = this.add.text(40, GAME_HEIGHT - 80, '', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#000000',
      wordWrap: { width: GAME_WIDTH - 80 },
    });

    // Texte d'annulation
    this.cancelText = this.add.text(GAME_WIDTH - 150, 20, 'Appuyer sur B pour annuler', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'italic',
    });
    this.cancelText.setAlpha(0);
  }

  private createCreatureSprite(): void {
    const species = getSpecies(this.creature.speciesId);
    if (!species) return;

    const spriteKey = `creature_${species.spriteKey}`;

    if (this.textures.exists(spriteKey)) {
      this.creatureSprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, spriteKey);
      this.creatureSprite.setScale(2);
    } else {
      // Placeholder si sprite n'existe pas
      const color = this.getTypeColor(species.types[0]);
      this.creatureSprite = this.createPlaceholderSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, color);
    }
  }

  private createPlaceholderSprite(x: number, y: number, color: number): Phaser.GameObjects.Image {
    const key = `evo_placeholder_${color}`;
    if (!this.textures.exists(key)) {
      const graphics = this.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(color, 1);
      graphics.fillRoundedRect(0, 0, 64, 64, 8);
      graphics.lineStyle(3, 0x000000);
      graphics.strokeRoundedRect(0, 0, 64, 64, 8);
      graphics.generateTexture(key, 64, 64);
      graphics.destroy();
    }
    return this.add.image(x, y, key).setScale(2);
  }

  private setupInput(): void {
    // Ecouter la touche B pour annuler
    this.input.keyboard?.on('keydown-B', () => {
      if (this.evolutionPhase === 'animating' && !this.isCancelled) {
        this.cancelEvolution();
      }
    });

    // Ecouter aussi Echap
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.evolutionPhase === 'animating' && !this.isCancelled) {
        this.cancelEvolution();
      }
    });

    // Clic pour passer les messages
    this.input.on('pointerdown', () => {
      if (this.evolutionPhase === 'complete' || this.evolutionPhase === 'cancelled') {
        this.finishScene();
      }
    });
  }

  private startEvolutionSequence(): void {
    const species = getSpecies(this.creature.speciesId);
    const creatureName = this.creature.nickname || species?.name || 'Creature';

    this.messageText.setText(`Quoi ? ${creatureName} evolue !`);

    this.time.delayedCall(2000, () => {
      this.startEvolutionAnimation();
    });
  }

  private startEvolutionAnimation(): void {
    this.evolutionPhase = 'animating';

    // Afficher le texte d'annulation
    this.tweens.add({
      targets: this.cancelText,
      alpha: 1,
      duration: 500,
    });

    this.messageText.setText('');

    // Animation de pulsation et changement de couleur
    let pulseCount = 0;
    const maxPulses = 10;
    const pulseDuration = 600;

    const pulseAnimation = () => {
      if (this.isCancelled) return;

      pulseCount++;

      // Effet de lumiere
      this.updateGlow(pulseCount / maxPulses);

      // Pulsation du sprite
      this.tweens.add({
        targets: this.creatureSprite,
        scaleX: { from: 2, to: 2.3 },
        scaleY: { from: 2, to: 2.3 },
        duration: pulseDuration / 2,
        yoyo: true,
        ease: 'Sine.easeInOut',
      });

      // Changement de teinte
      const tintProgress = pulseCount / maxPulses;
      const color1 = new Phaser.Display.Color(255, 255, 255);
      const color2 = new Phaser.Display.Color(255, 255, 200);
      const tint = Phaser.Display.Color.Interpolate.ColorWithColor(
        color1,
        color2,
        100,
        Math.floor(tintProgress * 100)
      );
      this.creatureSprite.setTint(Phaser.Display.Color.GetColor(tint.r, tint.g, tint.b));

      if (pulseCount < maxPulses && !this.isCancelled) {
        this.time.delayedCall(pulseDuration, pulseAnimation);
      } else if (!this.isCancelled) {
        this.completeEvolution();
      }
    };

    pulseAnimation();

    // Ajouter des particules
    this.addEvolutionParticles();
  }

  private updateGlow(progress: number): void {
    this.glowGraphics.clear();

    const intensity = progress;
    const radius = 80 + progress * 40;

    // Effet de halo
    for (let i = 0; i < 5; i++) {
      const alpha = (0.3 - i * 0.05) * intensity;
      this.glowGraphics.fillStyle(0xffffff, alpha);
      this.glowGraphics.fillCircle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 50,
        radius + i * 20
      );
    }
  }

  private addEvolutionParticles(): void {
    const particleCount = 30;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2 - 50;

    for (let i = 0; i < particleCount; i++) {
      this.time.delayedCall(i * 200, () => {
        if (this.isCancelled) return;

        const angle = Math.random() * Math.PI * 2;
        const startRadius = 100 + Math.random() * 50;
        const endRadius = 20;

        const particle = this.add.graphics();
        particle.fillStyle(0xffffff, 0.8);
        particle.fillCircle(0, 0, 3 + Math.random() * 3);

        particle.x = centerX + Math.cos(angle) * startRadius;
        particle.y = centerY + Math.sin(angle) * startRadius;

        this.tweens.add({
          targets: particle,
          x: centerX + Math.cos(angle) * endRadius,
          y: centerY + Math.sin(angle) * endRadius,
          alpha: 0,
          duration: 1000 + Math.random() * 500,
          onComplete: () => particle.destroy(),
        });
      });
    }
  }

  private cancelEvolution(): void {
    this.isCancelled = true;
    this.evolutionPhase = 'cancelled';

    // Arreter les animations
    this.tweens.killAll();

    // Remettre le sprite normal
    this.creatureSprite.setTint(0xffffff);
    this.creatureSprite.setScale(2);

    // Nettoyer les effets
    this.glowGraphics.clear();
    this.cancelText.setAlpha(0);

    const species = getSpecies(this.creature.speciesId);
    const creatureName = this.creature.nickname || species?.name || 'Creature';

    this.messageText.setText(`Hein ? L'evolution de ${creatureName} a ete annulee !`);

    // Permettre de quitter apres un delai
    this.time.delayedCall(2000, () => {
      this.messageText.setText(
        `${creatureName} n'a pas evolue.\n(Cliquer pour continuer)`
      );
    });
  }

  private completeEvolution(): void {
    this.evolutionPhase = 'evolving';
    this.cancelText.setAlpha(0);

    // Flash blanc
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 1);
    flash.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Changer le sprite
    this.time.delayedCall(250, () => {
      this.changeToEvolvedSprite();
    });

    this.time.delayedCall(500, () => {
      this.showEvolutionComplete();
    });
  }

  private changeToEvolvedSprite(): void {
    const newSpecies = getSpecies(this.newSpeciesId);
    if (!newSpecies) return;

    const newSpriteKey = `creature_${newSpecies.spriteKey}`;

    // Supprimer l'ancien sprite
    this.creatureSprite.destroy();

    // Creer le nouveau sprite
    if (this.textures.exists(newSpriteKey)) {
      this.creatureSprite = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, newSpriteKey);
      this.creatureSprite.setScale(2);
    } else {
      const color = this.getTypeColor(newSpecies.types[0]);
      this.creatureSprite = this.createPlaceholderSprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, color);
    }

    // Animation d'apparition
    this.creatureSprite.setScale(0);
    this.tweens.add({
      targets: this.creatureSprite,
      scaleX: 2,
      scaleY: 2,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  private showEvolutionComplete(): void {
    this.evolutionPhase = 'complete';

    const oldSpecies = getSpecies(this.creature.speciesId);
    const newSpecies = getSpecies(this.newSpeciesId);
    const creatureName = this.creature.nickname || oldSpecies?.name || 'Creature';
    const newName = newSpecies?.name || 'nouvelle forme';

    this.messageText.setText(`Felicitations !\n${creatureName} a evolue en ${newName} !`);

    // Nettoyer les effets
    this.glowGraphics.clear();

    // Permettre de quitter apres un delai
    this.time.delayedCall(2500, () => {
      this.messageText.setText(
        `${creatureName} a evolue en ${newName} !\n(Cliquer pour continuer)`
      );
    });
  }

  private finishScene(): void {
    if (this.isCancelled) {
      this.onComplete(false);
    } else {
      // Effectuer l'evolution
      const evolvedCreature = evolveCreature(this.creature, this.newSpeciesId);
      this.onComplete(true, evolvedCreature);
    }
    this.scene.stop();
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
}
