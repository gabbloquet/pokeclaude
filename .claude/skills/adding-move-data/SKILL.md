---
name: adding-move-data
description: Adds ONE move/attack to src/data/moves.ts. Use when user asks to add a new attack, move, ability, or technique to the battle system.
---

# Add Move Data

## Input
- Name, type, category, power, accuracy, PP

## Output
- One entry added to `MOVES` object in `src/data/moves.ts`

## File
`src/data/moves.ts`

## Required Fields
```typescript
{
  id: number,
  name: string,
  type: ElementType,
  category: 'physical' | 'special' | 'status',
  power: number,      // 0 for status
  accuracy: number,   // 0-100
  pp: number,
  effect?: MoveEffect
}
```

## Balance Guidelines
| Category | Power | Accuracy |
|----------|-------|----------|
| Weak | 40-60 | 100% |
| Medium | 70-90 | 90-95% |
| Strong | 100-120 | 80-85% |

## Example
Input: "Ajoute Rock Throw, Roche, physique, 50 power"
Output:
```typescript
15: {
  id: 15,
  name: 'Rock Throw',
  type: 'rock',
  category: 'physical',
  power: 50,
  accuracy: 90,
  pp: 15
}
```
