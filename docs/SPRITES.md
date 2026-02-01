# Sprites - PokeClaude

## Specs

| Propriété | Valeur |
|-----------|--------|
| Taille | 32x32 pixels |
| Format | PNG (RGBA) |
| Style | Pixel art |
| Palette | 16 couleurs max par sprite |

## Structure assets

```
public/assets/sprites/
├── creatures/       # Sprites créatures (front + back)
│   ├── flamling.png
│   └── flamling-back.png
├── player/          # Spritesheet joueur
│   └── player.png   # 4 directions × 4 frames
├── tiles/           # Tiles de map
│   ├── grass.png
│   ├── water.png
│   ├── path.png
│   ├── wall.png
│   └── tallGrass.png
└── ui/              # Éléments interface
    ├── button.png
    └── healthbar.png
```

## Génération automatique

### Script

```bash
node scripts/generateSprites.cjs
```

### Ajouter une créature

```javascript
// scripts/generateSprites.cjs

function drawNewCreature(ctx) {
  // Base shape
  ctx.fillStyle = '#FF6B6B';
  ctx.fillRect(8, 8, 16, 16);

  // Eyes
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(12, 12, 3, 3);
  ctx.fillRect(17, 12, 3, 3);

  // Pupils
  ctx.fillStyle = '#000000';
  ctx.fillRect(13, 13, 1, 1);
  ctx.fillRect(18, 13, 1, 1);
}

// Register in CREATURES array
const CREATURES = [
  { name: 'flamling', draw: drawFlamling },
  { name: 'newcreature', draw: drawNewCreature },  // Add here
];
```

## Palette de couleurs

### Types

| Type | Primaire | Secondaire | Accent |
|------|----------|------------|--------|
| Feu | `#FF6B35` | `#F7C331` | `#FFFFFF` |
| Eau | `#4EA8DE` | `#5390D9` | `#FFFFFF` |
| Plante | `#52B788` | `#95D5B2` | `#2D6A4F` |
| Électrik | `#FFD60A` | `#FFC300` | `#000000` |
| Normal | `#A8A878` | `#D8D8C0` | `#705848` |
| Vol | `#A890F0` | `#C8C0F8` | `#705898` |
| Poison | `#A040A0` | `#D080D0` | `#483850` |
| Roche | `#B8A038` | `#D8C870` | `#786830` |

### UI

| Élément | Couleur |
|---------|---------|
| Background | `#1A1A2E` |
| Panel | `#16213E` |
| Text | `#FFFFFF` |
| Accent | `#E94560` |
| HP Bar (full) | `#52B788` |
| HP Bar (mid) | `#F7C331` |
| HP Bar (low) | `#E63946` |

## Player Spritesheet

### Layout

```
┌────┬────┬────┬────┐
│ D0 │ D1 │ D2 │ D3 │  ← Down (frames 0-3)
├────┼────┼────┼────┤
│ L0 │ L1 │ L2 │ L3 │  ← Left (frames 4-7)
├────┼────┼────┼────┤
│ R0 │ R1 │ R2 │ R3 │  ← Right (frames 8-11)
├────┼────┼────┼────┤
│ U0 │ U1 │ U2 │ U3 │  ← Up (frames 12-15)
└────┴────┴────┴────┘

Total: 128×128 pixels (4×4 grid of 32×32)
```

### Animation frames

| Frame | Usage |
|-------|-------|
| 0 | Idle (stand) |
| 1 | Walk step left |
| 2 | Idle (stand) |
| 3 | Walk step right |

### Phaser config

```typescript
this.load.spritesheet('player', 'assets/sprites/player/player.png', {
  frameWidth: 32,
  frameHeight: 32
});

// Animation
this.anims.create({
  key: 'walk-down',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 8,
  repeat: -1
});
```

## Creatures Design

### Proportions

```
┌────────────────────────────────┐
│         (4px margin)           │
│   ┌────────────────────────┐   │
│   │                        │   │
│   │       CREATURE         │   │
│   │        24×24           │   │
│   │      main area         │   │
│   │                        │   │
│   └────────────────────────┘   │
│         (4px margin)           │
└────────────────────────────────┘
```

### Guidelines

- **Silhouette** : Reconnaissable même en miniature
- **Yeux** : Toujours visibles, 2-3px
- **Couleur dominante** : Reflète le type principal
- **Pose** : Front view pour combat, légèrement dynamique

### Évolutions

| Stage | Taille | Complexité |
|-------|--------|------------|
| Base | 16-20px | Simple, mignon |
| Mid | 20-24px | Plus détaillé |
| Final | 24-28px | Complexe, imposant |

## Tiles

### Types

| Tile | Walkable | Encounter | Visual |
|------|----------|-----------|--------|
| grass | Yes | No | Vert uni |
| tallGrass | Yes | Yes | Vert + texture |
| path | Yes | No | Beige/marron |
| water | No | No | Bleu animé |
| wall | No | No | Gris/pierre |

### Tile variations

```javascript
// Pour éviter la répétition visuelle
const GRASS_VARIANTS = [
  drawGrass1,  // Plain
  drawGrass2,  // With small flower
  drawGrass3,  // With rock
];
```

## UI Elements

### Health Bar

```
┌──────────────────────────────┐
│ ██████████████░░░░░░░░░░░░░░ │  ← 30×6 pixels
└──────────────────────────────┘
  Green      │    Empty
  (current)  │    (damage)
```

### Menu Button

```
┌────────────────────────────────┐
│  ┌──────────────────────────┐  │  ← 64×24 pixels
│  │        ATTACK            │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
   Border    │    Text area
   (2px)     │    (centered)
```

## Export

### Depuis éditeur externe

1. **Aseprite** : File → Export → PNG, Scale 1x
2. **Piskel** : Download → PNG
3. **Photoshop** : Export → Quick Export as PNG

### Vérification

```bash
# Check dimensions
file public/assets/sprites/creatures/*.png

# Should output: PNG image data, 32 x 32, 8-bit/color RGBA
```

## Tools recommandés

| Outil | Usage | Gratuit |
|-------|-------|---------|
| Aseprite | Pixel art pro | Non (15$) |
| Piskel | Web-based | Oui |
| Pixilart | Web-based | Oui |
| GIMP | Édition générale | Oui |

## Checklist nouveau sprite

- [ ] Dimensions 32×32
- [ ] Format PNG avec transparence
- [ ] Palette cohérente avec le type
- [ ] Silhouette lisible
- [ ] Nommage lowercase (ex: `flamling.png`)
- [ ] Ajouté dans `generateSprites.cjs`
- [ ] Testé in-game
