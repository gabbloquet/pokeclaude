---
name: writing-test
description: Writes ONE unit test file using Vitest. Use when user asks to add tests, test a function, or verify a specific feature.
---

# Write Unit Test

## Input
- Function/module to test
- Expected behaviors

## Output
- One test file in `src/__tests__/`

## Framework
Vitest with `describe`, `it`, `expect`

## File Pattern
`src/__tests__/<module>.test.ts`

## Template
```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../path/to/module';

describe('ModuleName', () => {
  describe('functionToTest', () => {
    it('should [expected behavior]', () => {
      const result = functionToTest(input);
      expect(result).toBe(expected);
    });
  });
});
```

## Conventions
- One `describe` per module/class
- Nested `describe` for each function
- `it` descriptions start with "should"
- Test edge cases: null, empty, boundaries

## Example
Input: "Test calculateDamage avec STAB"
Output: `src/__tests__/battle.test.ts` with STAB test case
