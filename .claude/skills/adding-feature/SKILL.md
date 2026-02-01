---
name: adding-feature
description: Adds ONE feature to the codebase. Use when user asks to implement, add, or create a new feature or functionality.
---

# Add Feature

## Process
1. Read existing code in target area
2. Identify integration points
3. Implement minimal code
4. Emit events via EventBus if needed

## Key Directories
| Area | Location |
|------|----------|
| Systems | `src/systems/` |
| Scenes | `src/scenes/` |
| UI | `src/ui/` |
| Data | `src/data/` |

## Conventions
- One system per file
- Use EventBus for cross-module communication
- Follow existing patterns in codebase
- Keep functions small and focused

## EventBus Integration
```typescript
import { EventBus, BATTLE_EVENTS } from '../events';
EventBus.emitBattle(BATTLE_EVENTS.EVENT_NAME, payload);
```

## Example
Input: "Ajoute un système de fuite en combat"
Output: Add flee logic in `BattleSystem.ts` with event emission
