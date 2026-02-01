---
name: adding-creature-data
description: Adds ONE creature to src/data/species.ts. Use when user asks to add a new creature, monster, or pokemon-like entity to the game data.
---

# Add Creature Data

## Input
- Name, types, base stats, optional evolution

## Output
- One entry added to `CREATURES` object in `src/data/species.ts`

## File
`src/data/species.ts`

## Required Fields
```typescript
{
  id: number,           // Next sequential ID
  name: string,         // Capitalized name
  types: ElementType[], // 1-2 types
  baseStats: {
    hp: number,
    attack: number,
    defense: number,
    speed: number
  },
  evolution?: {
    toId: number,
    level: number
  }
}
```

## Stat Ranges by Stage
| Stage | Total Stats |
|-------|-------------|
| Base | 280-320 |
| Mid | 380-420 |
| Final | 480-540 |

## Example
Input: "Ajoute Rocklet, type Roche, stats base"
Output:
```typescript
12: {
  id: 12,
  name: 'Rocklet',
  types: ['rock'],
  baseStats: { hp: 45, attack: 80, defense: 90, speed: 35 }
}
```
