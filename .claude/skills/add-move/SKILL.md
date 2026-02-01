---
name: adding-move
description: Creates a new attack/move for the battle system. Use when adding new attacks, moves, or abilities to creatures.
---

# Add New Move

## Workflow

```
- [ ] Step 1: Define move data
- [ ] Step 2: Implement effect (if special)
- [ ] Step 3: Assign to creatures
- [ ] Step 4: Test
```

## Step 1: Add in `src/data/moves.ts`

```typescript
{
  id: number,
  name: string,
  type: ElementType,
  category: 'physical' | 'special' | 'status',
  power: number,      // 0 for status moves
  accuracy: number,   // 0-100
  pp: number,
  effect?: MoveEffect
}
```

## Step 2: Special Effects

If move has special effect, update `src/systems/BattleSystem.ts`:
- Add effect logic
- Emit events via EventBus

## Step 3: Assign to Creatures

Update learnsets in `src/data/creatures.ts`:
```typescript
learnset: [
  { level: 1, moveId: NEW_MOVE_ID }
]
```

## Step 4: Test

- Unit test for move data
- Integration test in battle