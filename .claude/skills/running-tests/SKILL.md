---
name: running-tests
description: Runs the test suite using npm test. Use when user asks to run tests, check if tests pass, or validate changes.
---

# Run Tests

## Command
```bash
npm run test
```

## Options
- Single file: `npm run test -- src/__tests__/battle.test.ts`
- Watch mode: `npm run test -- --watch`
- Coverage: `npm run test -- --coverage`

## Output Interpretation
| Symbol | Meaning |
|--------|---------|
| PASS | All tests passed |
| FAIL | At least one test failed |
| SKIP | Test marked as skip |

## On Failure
1. Read the error message
2. Identify failing test
3. Check expected vs received values
4. Fix code or test accordingly

## Example
Input: "Lance les tests"
Output: Run `npm run test` and report results
