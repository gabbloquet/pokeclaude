import Phaser from 'phaser';

export interface MenuItem {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface MenuConfig {
  x: number;
  y: number;
  width?: number;
  items: MenuItem[];
  columns?: number;
  padding?: number;
  fontSize?: number;
  backgroundColor?: number;
  borderColor?: number;
  selectedColor?: number;
  textColor?: string;
  selectedTextColor?: string;
  disabledTextColor?: string;
}

export class Menu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Graphics;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private itemBackgrounds: Phaser.GameObjects.Graphics[] = [];

  private config: Required<MenuConfig>;
  private selectedIndex: number = 0;
  private onSelect?: (item: MenuItem) => void;

  constructor(scene: Phaser.Scene, config: MenuConfig) {
    this.scene = scene;
    this.config = {
      width: 150,
      columns: 1,
      padding: 10,
      fontSize: 14,
      backgroundColor: 0xf8f8f8,
      borderColor: 0x333333,
      selectedColor: 0x4a90d9,
      textColor: '#000000',
      selectedTextColor: '#ffffff',
      disabledTextColor: '#999999',
      ...config,
    };

    this.container = scene.add.container(config.x, config.y);
    this.createMenu();
  }

  private createMenu(): void {
    const { items, columns, padding, fontSize, width } = this.config;

    const itemHeight = fontSize + padding * 1.5;
    const rows = Math.ceil(items.length / columns);
    const columnWidth = width / columns;
    const menuHeight = rows * itemHeight + padding * 2;

    // Background
    this.background = this.scene.add.graphics();
    this.background.fillStyle(this.config.backgroundColor, 1);
    this.background.fillRoundedRect(0, 0, width, menuHeight, 8);
    this.background.lineStyle(2, this.config.borderColor);
    this.background.strokeRoundedRect(0, 0, width, menuHeight, 8);
    this.container.add(this.background);

    // Items
    items.forEach((item, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = col * columnWidth + padding;
      const y = row * itemHeight + padding;

      // Item background for selection highlight
      const itemBg = this.scene.add.graphics();
      itemBg.fillStyle(this.config.selectedColor, 1);
      itemBg.fillRoundedRect(x - 4, y - 2, columnWidth - padding, itemHeight - 4, 4);
      itemBg.setVisible(index === this.selectedIndex);
      this.container.add(itemBg);
      this.itemBackgrounds.push(itemBg);

      // Item text
      const textColor = item.disabled
        ? this.config.disabledTextColor
        : index === this.selectedIndex
          ? this.config.selectedTextColor
          : this.config.textColor;

      const text = this.scene.add.text(x, y, item.label, {
        fontFamily: 'Arial',
        fontSize: `${fontSize}px`,
        color: textColor,
        fontStyle: 'bold',
      });
      this.container.add(text);
      this.itemTexts.push(text);

      // Interactive area
      const hitArea = this.scene.add.rectangle(
        x + (columnWidth - padding) / 2,
        y + (itemHeight - 4) / 2,
        columnWidth - padding,
        itemHeight - 4
      );
      hitArea.setInteractive({ useHandCursor: !item.disabled });

      if (!item.disabled) {
        hitArea.on('pointerover', () => this.setSelectedIndex(index));
        hitArea.on('pointerdown', () => this.selectItem(index));
      }

      this.container.add(hitArea);
    });

    // Keyboard navigation
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-UP', () => this.navigate(-columns));
      this.scene.input.keyboard.on('keydown-DOWN', () => this.navigate(columns));
      this.scene.input.keyboard.on('keydown-LEFT', () => this.navigate(-1));
      this.scene.input.keyboard.on('keydown-RIGHT', () => this.navigate(1));
      this.scene.input.keyboard.on('keydown-ENTER', () => this.selectCurrent());
      this.scene.input.keyboard.on('keydown-SPACE', () => this.selectCurrent());
    }
  }

  private navigate(direction: number): void {
    let newIndex = this.selectedIndex + direction;
    const items = this.config.items;

    // Wrap around
    if (newIndex < 0) newIndex = items.length - 1;
    if (newIndex >= items.length) newIndex = 0;

    // Skip disabled items
    let attempts = 0;
    while (items[newIndex]?.disabled && attempts < items.length) {
      newIndex += direction > 0 ? 1 : -1;
      if (newIndex < 0) newIndex = items.length - 1;
      if (newIndex >= items.length) newIndex = 0;
      attempts++;
    }

    this.setSelectedIndex(newIndex);
  }

  private setSelectedIndex(index: number): void {
    if (index === this.selectedIndex) return;
    if (this.config.items[index]?.disabled) return;

    // Update previous selection
    this.itemBackgrounds[this.selectedIndex].setVisible(false);
    this.itemTexts[this.selectedIndex].setColor(this.config.textColor);

    // Update new selection
    this.selectedIndex = index;
    this.itemBackgrounds[this.selectedIndex].setVisible(true);
    this.itemTexts[this.selectedIndex].setColor(this.config.selectedTextColor);
  }

  private selectItem(index: number): void {
    if (this.config.items[index]?.disabled) return;
    this.setSelectedIndex(index);
    this.selectCurrent();
  }

  private selectCurrent(): void {
    const item = this.config.items[this.selectedIndex];
    if (item && !item.disabled && this.onSelect) {
      this.onSelect(item);
    }
  }

  setOnSelect(callback: (item: MenuItem) => void): void {
    this.onSelect = callback;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  getSelectedItem(): MenuItem {
    return this.config.items[this.selectedIndex];
  }
}
