---
name: creating-new-creature
description: Creates a new creature with stats, sprites, moves, and tests. Use when the user wants to add a new creature to the game or mentions creating/adding creatures.
---

# Create New Creature

## Workflow

Copy this checklist:
```
- [ ] Step 1: Add creature data
- [ ] Step 2: Add moves
- [ ] Step 3: Generate sprite
- [ ] Step 4: Create tests
- [ ] Step 5: Update documentation
```

## Step 1: Add creature in `src/data/creatures.ts`

Required fields:
- `id`: Unique number (follow sequence)
- `name`: Creature name
- `types`: Array of types (max 2)
- `baseStats`: { hp, attack, defense, speed }
- `evolution`: Optional evolution data

## Step 2: Add moves in `src/data/moves.ts`

- Starting moves (level 1)
- Learned moves by level

## Step 3: Generate sprite

```bash
node scripts/generateSprites.cjs
```

## Step 4: Create tests

Add tests in `src/__tests__/`:
- Stats validation
- Move learning verification

## Step 5: Update CLAUDE.md

Add creature to the creatures table.
