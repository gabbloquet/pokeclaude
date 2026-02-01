import Phaser from 'phaser';
import {
  UI_COLORS,
  UI_DIMENSIONS,
  TEXT_STYLES,
  getHpBarColor,
} from '@/config/ui.config';

export interface InfoBoxConfig {
  x: number;
  y: number;
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  showHpText?: boolean;
}

/**
 * Composant UI réutilisable pour afficher les infos d'une créature
 * (nom, niveau, barre de vie)
 */
export class InfoBox {
  private container: Phaser.GameObjects.Container;
  private hpBar: Phaser.GameObjects.Graphics;
  private hpText?: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;

  private maxHp: number;
  private showHpText: boolean;

  constructor(scene: Phaser.Scene, config: InfoBoxConfig) {
    this.maxHp = config.maxHp;
    this.showHpText = config.showHpText ?? true;

    this.container = scene.add.container(config.x, config.y);

    const dimensions = UI_DIMENSIONS.infoBox;
    const height = this.showHpText
      ? dimensions.heightWithHpText
      : dimensions.heightWithoutHpText;

    // Fond
    const bg = scene.add.graphics();
    bg.fillStyle(UI_COLORS.background, 1);
    bg.fillRoundedRect(0, 0, dimensions.width, height, dimensions.borderRadius);
    bg.lineStyle(2, UI_COLORS.border);
    bg.strokeRoundedRect(0, 0, dimensions.width, height, dimensions.borderRadius);
    this.container.add(bg);

    // Nom de la créature
    this.nameText = scene.add.text(10, 8, config.name, TEXT_STYLES.creatureName);
    this.container.add(this.nameText);

    // Niveau
    this.levelText = scene.add.text(140, 8, `Nv.${config.level}`, TEXT_STYLES.level);
    this.container.add(this.levelText);

    // Fond de la barre de vie
    const hpBarDimensions = UI_DIMENSIONS.hpBar;
    const hpBarBg = scene.add.graphics();
    hpBarBg.fillStyle(UI_COLORS.border, 1);
    hpBarBg.fillRect(10, 28, hpBarDimensions.width, hpBarDimensions.height);
    this.container.add(hpBarBg);

    // Barre de vie
    this.hpBar = scene.add.graphics();
    this.updateHpBar(config.currentHp);
    this.container.add(this.hpBar);

    // Texte HP (optionnel)
    if (this.showHpText) {
      this.hpText = scene.add.text(
        10,
        42,
        `${config.currentHp}/${config.maxHp}`,
        TEXT_STYLES.hpText
      );
      this.container.add(this.hpText);
    }
  }

  /**
   * Met à jour la barre de vie
   */
  updateHpBar(currentHp: number): void {
    this.hpBar.clear();

    const ratio = currentHp / this.maxHp;
    const hpBarDimensions = UI_DIMENSIONS.hpBar;
    const width = hpBarDimensions.innerWidth * ratio;
    const color = getHpBarColor(ratio);

    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(11, 29, width, hpBarDimensions.innerHeight);
  }

  /**
   * Met à jour le texte HP
   */
  updateHpText(currentHp: number): void {
    if (this.hpText) {
      this.hpText.setText(`${currentHp}/${this.maxHp}`);
    }
  }

  /**
   * Met à jour HP (barre + texte)
   */
  setHp(currentHp: number, maxHp?: number): void {
    if (maxHp !== undefined) {
      this.maxHp = maxHp;
    }
    this.updateHpBar(currentHp);
    this.updateHpText(currentHp);
  }

  /**
   * Met à jour le niveau affiché
   */
  setLevel(level: number): void {
    this.levelText.setText(`Nv.${level}`);
  }

  /**
   * Met à jour le nom affiché
   */
  setName(name: string): void {
    this.nameText.setText(name);
  }

  /**
   * Retourne le container Phaser
   */
  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  /**
   * Retourne la graphics de la barre HP (pour compatibilité)
   */
  getHpBar(): Phaser.GameObjects.Graphics {
    return this.hpBar;
  }

  /**
   * Définit la visibilité
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Détruit le composant
   */
  destroy(): void {
    this.container.destroy();
  }
}
