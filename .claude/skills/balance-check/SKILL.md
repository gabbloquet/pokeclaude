---
name: checking-balance
description: Analyzes game balance for creatures and moves. Use when user asks about balance, stats comparison, or game tuning.
---

# Check Balance

## Files to Read
- `src/data/species.ts` - Creature stats
- `src/data/moves.ts` - Move data

## Metrics

### Creature Stats by Stage
| Stage | Total Stats |
|-------|-------------|
| Base | 280-320 |
| Mid | 380-420 |
| Final | 480-540 |

### Move Power/Accuracy
| Category | Power | Accuracy |
|----------|-------|----------|
| Weak | 40-60 | 100% |
| Medium | 70-90 | 90-95% |
| Strong | 100-120 | 80-85% |

## Output
Generate markdown report:
- Stat comparison table
- Outliers identified
- Recommendations

## Example
Input: "Vérifie l'équilibrage"
Output: Table showing all creatures' total stats with outliers flagged
