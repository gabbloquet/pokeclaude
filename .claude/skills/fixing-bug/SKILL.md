---
name: fixing-bug
description: Fixes ONE bug in the codebase. Use when user reports a bug, error, issue, or unexpected behavior to fix.
---

# Fix Bug

## Process
1. Reproduce/understand the issue
2. Read relevant code
3. Identify root cause
4. Apply minimal fix
5. Verify fix

## Debug Tools
```typescript
// Console logging
console.log('Debug:', variable);

// Phaser debug
this.physics.world.createDebugGraphic();
```

## Common Bug Categories
| Category | Check |
|----------|-------|
| Null/undefined | Add null checks |
| Type errors | Verify types match |
| Event issues | Check listener cleanup |
| Phaser lifecycle | Verify scene order |

## EventBus Cleanup
```typescript
// Always clean up in destroy()
destroy() {
  EventBus.offBattle(EVENT, this.handler, this);
}
```

## Example
Input: "Fix: les dégâts ne s'affichent pas"
Output: Identify missing event emission or UI update, apply fix
