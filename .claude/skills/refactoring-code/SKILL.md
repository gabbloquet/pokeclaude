---
name: refactoring-code
description: Refactors ONE component or module. Use when user asks to refactor, clean up, restructure, or improve code organization.
---

# Refactor Code

## Process
1. Read current implementation
2. Identify improvement area
3. Apply changes incrementally
4. Verify behavior unchanged

## Refactoring Types
| Type | Description |
|------|-------------|
| Extract | Move code to separate function/class |
| Rename | Improve naming clarity |
| Simplify | Reduce complexity |
| Reorganize | Better file structure |

## Rules
- Keep same external behavior
- One refactor at a time
- Run tests after each change
- Update imports if files move

## Extract Pattern
```typescript
// Before: inline logic
if (a > b && c < d && e === f) { ... }

// After: extracted function
function shouldProcess(a, b, c, d, e, f): boolean {
  return a > b && c < d && e === f;
}
```

## Example
Input: "Refactorise le calcul de dégâts"
Output: Extract damage calculation to separate function with clear parameters
