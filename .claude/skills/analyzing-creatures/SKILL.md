---
name: analyzing-creatures
description: Analyzes creature matchups and type effectiveness. Use when user asks about type advantages, creature comparison, or team composition.
---

# Analyze Creatures

## Type Effectiveness
| Attack → | Fire | Water | Grass | Electric |
|----------|------|-------|-------|----------|
| Fire | 0.5x | 0.5x | 2x | 1x |
| Water | 2x | 0.5x | 0.5x | 1x |
| Grass | 0.5x | 2x | 0.5x | 1x |
| Electric | 1x | 2x | 0.5x | 0.5x |

## Damage Formula
```
damage = ((2*level/5+2) * power * atk/def / 50 + 2) * modifiers
```

## Modifiers
- **STAB**: 1.5x if move type = creature type
- **Type**: 0.5x, 1x, or 2x
- **Random**: 0.85-1.0

## Analysis Tasks
1. Compare two creatures → Read stats, calculate matchups
2. Team analysis → Check type coverage
3. Counter suggestions → Find effective types

## Example
Input: "Compare Flamling vs Aqualing"
Output: Stats comparison + type matchup analysis (Water beats Fire)
