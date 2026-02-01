---
name: checking-balance
description: Analyzes game balance for creatures and moves. Use when discussing balance, stats comparison, type effectiveness, or game tuning.
---

# Balance Check

## Quick Analysis

1. Read `src/data/creatures.ts` and `src/data/moves.ts`
2. Calculate stat totals per evolution stage
3. Check type distribution
4. Verify move power/accuracy ratios

## Metrics to Check

### Creatures
| Stage | Expected Total Stats |
|-------|---------------------|
| Base | 280-320 |
| Mid | 380-420 |
| Final | 480-540 |

### Moves
| Category | Power Range | Accuracy |
|----------|-------------|----------|
| Weak | 40-60 | 100% |
| Medium | 70-90 | 90-95% |
| Strong | 100-120 | 80-85% |

## Output Format

Generate markdown report with:
- Stat comparison table
- Outliers identified
- Recommendations