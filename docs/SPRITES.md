# Sprites - PokeClaude

## Specs

| Asset | Taille | Source |
|-------|--------|--------|
| Tiles | 32×32 | TilesetGrass (16×16 upscaled) |
| Player | 32×32 | Top down character template (64×64 downscaled) |
| Creatures | 64×64 | Retromon Free Pack (56×56 upscaled) |
| Format | PNG (RGBA) | - |
| Style | Pixel art GBC | - |

## Structure assets

```
public/assets/sprites/
├── creatures/                    # Sprites créatures (64×64)
│   ├── flamling.png             # Feu base
│   ├── flamero.png              # Feu mid
│   ├── flamaster.png            # Feu final
│   ├── aqualing.png             # Eau base
│   ├── aquaro.png               # Eau mid
│   ├── aquaster.png             # Eau final
│   ├── leafling.png             # Plante base
│   ├── leafero.png              # Plante mid
│   ├── leafaster.png            # Plante final
│   ├── sparkit.png              # Électrik base
│   ├── sparkolt.png             # Électrik mid
│   ├── Retromon Free Pack/      # Source (ne pas modifier)
│   └── Bonus Pack 2025/         # Source (ne pas modifier)
├── player/
│   ├── player.png               # Spritesheet 128×128 (4×4 grid)
│   └── Top down character.../   # Source (ne pas modifier)
├── tiles/
│   ├── grass.png                # Herbe (32×32)
│   ├── tallGrass.png            # Hautes herbes
│   ├── path.png                 # Chemin
│   ├── water.png                # Eau
│   ├── wall.png                 # Mur/falaise
│   ├── TilesetGrass/            # Source CC-0
│   └── FreeCuteTileset/         # Source (platformer)
└── ui/
    └── pokeball.png
```

## Scripts

### Extraire tiles du tileset

```bash
node scripts/extractTiles.cjs
```

Extrait les tiles de `TilesetGrass/overworld_tileset_grass.png` en 32×32.

### Créer spritesheet joueur

```bash
node scripts/createPlayerSpritesheet.cjs
```

Combine les frames individuels en spritesheet 4×4.

### Setup créatures

```bash
node scripts/setupCreatures.cjs
```

Copie et redimensionne les sprites Retromon → créatures PokeClaude.

### Preview tileset (debug)

```bash
node scripts/previewTileset.cjs
```

Extrait TOUS les tiles numérotés pour identification visuelle.

## Mapping Créatures

| PokeClaude | Source Retromon | Type |
|------------|-----------------|------|
| flamling | Firehound_Front | Feu |
| flamero | Firehound_Front_02 | Feu |
| flamaster | Firefox_Front_02 | Feu/Vol |
| aqualing | Turtle_Front | Eau |
| aquaro | Turtle_Front_02 | Eau |
| aquaster | Fish_Front_02 | Eau |
| leafling | 1_Cactus_Front | Plante |
| leafero | Cactus_Front_02 | Plante |
| leafaster | Eel_Front_02 | Plante/Poison |
| sparkit | Ghost_Front | Électrik |
| sparkolt | Ghost_Front_02 | Électrik |

## Player Spritesheet

### Layout (128×128)

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

Chaque frame: 32×32 pixels
```

### Source

`Top down character template by RgsDev/Character without weapon/idle/`

## Tiles

### Mapping TilesetGrass

| Tile | Row | Col | Description |
|------|-----|-----|-------------|
| grass | 0 | 0 | Herbe simple |
| tallGrass | 5 | 6 | Forêt dense |
| path | 1 | 4 | Chemin sable |
| water | 5 | 1 | Eau profonde |
| wall | 8 | 6 | Falaise |

### Types

| Tile | Walkable | Encounter | Visual |
|------|----------|-----------|--------|
| grass | Yes | No | Herbe verte |
| tallGrass | Yes | Yes | Forêt dense |
| path | Yes | No | Chemin sable |
| water | No | No | Eau bleue |
| wall | No | No | Falaise rocheuse |

## Sources (Licences)

### TilesetGrass (CC-0)
- **Auteur**: Beast Pixels
- **Licence**: CC-0 (Public Domain)
- **URL**: https://beast-pixels.itch.io/overworld-tileset-grass-biome

### Retromon Free Pack
- **Auteur**: Monsteretrope / Willibab
- **Licence**: Free for personal/commercial, credit required
- **URL**: https://monsteretrope.itch.io/free-retro-pixel-monsters-sample-pack-1

### Top down character template
- **Auteur**: RgsDev
- **Licence**: Voir public-license.txt dans le dossier
- **Usage**: Free to use

## Ajouter une nouvelle créature

1. Trouver un sprite dans les packs sources
2. Ajouter le mapping dans `scripts/setupCreatures.cjs`
3. Exécuter `node scripts/setupCreatures.cjs`
4. Ajouter dans `PreloadScene.ts`:
   ```typescript
   this.load.image('creature_newname', '/assets/sprites/creatures/newname.png');
   ```
5. Créer l'entrée dans `src/data/creatures/species.ts`

## Ajouter un nouveau tile

1. Identifier le tile dans `TilesetGrass/overworld_tileset_grass.png`
2. Utiliser `node scripts/previewTileset.cjs` pour trouver row/col
3. Ajouter dans `scripts/extractTiles.cjs`:
   ```javascript
   'newtile': { row: X, col: Y },
   ```
4. Exécuter `node scripts/extractTiles.cjs`
5. Copier vers `tiles/` et charger dans `PreloadScene.ts`

## Tools recommandés

| Outil | Usage | Gratuit |
|-------|-------|---------|
| Aseprite | Pixel art pro | Non (15$) |
| Piskel | Web-based | Oui |
| sharp (npm) | Manipulation images | Oui |

## Vérification

```bash
# Check dimensions
file public/assets/sprites/creatures/*.png
# → PNG image data, 64 x 64

file public/assets/sprites/tiles/*.png
# → PNG image data, 32 x 32

file public/assets/sprites/player/player.png
# → PNG image data, 128 x 128
```
