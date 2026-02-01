---
name: adding-item-data
description: Adds ONE item to the game data. Use when user asks to add a new item, potion, ball, or consumable to the inventory system.
---

# Add Item Data

## Input
- Name, category, effect, price

## Output
- One entry added to items data file

## File
`src/data/items.ts`

## Required Fields
```typescript
{
  id: number,
  name: string,
  category: 'ball' | 'potion' | 'status' | 'battle' | 'key',
  description: string,
  effect: ItemEffect,
  price: number
}
```

## Categories
| Category | Usage |
|----------|-------|
| ball | Capture creatures |
| potion | Restore HP |
| status | Cure status effects |
| battle | Combat items |
| key | Story items |

## Example
Input: "Ajoute Super Potion, heal 50 HP"
Output:
```typescript
{
  id: 3,
  name: 'Super Potion',
  category: 'potion',
  description: 'Restores 50 HP',
  effect: { type: 'heal', value: 50 },
  price: 700
}
```
