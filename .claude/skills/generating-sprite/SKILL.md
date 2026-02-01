---
name: generating-sprite
description: Generates ONE sprite using the sprite generation script. Use when user asks to generate, create, or update a sprite, icon, or visual asset.
---

# Generate Sprite

## Command
```bash
node scripts/generateSprites.cjs
```

## Output Locations
- Creatures: `public/assets/sprites/creatures/`
- Player: `public/assets/sprites/player/`
- Tiles: `public/assets/sprites/tiles/`
- UI: `public/assets/sprites/ui/`

## Sprite Specs
- Size: 32x32 pixels
- Format: PNG
- Style: Pixel art

## To Add New Creature Sprite
1. Edit `scripts/generateSprites.cjs`
2. Add creature drawing function
3. Run script

## Example
Input: "Génère le sprite de Rocklet"
Output:
1. Add `drawRocklet()` function in script
2. Run `node scripts/generateSprites.cjs`
3. Verify `public/assets/sprites/creatures/rocklet.png`
