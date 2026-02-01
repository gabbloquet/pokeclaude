---
name: creating-pr
description: Creates ONE pull request on GitHub. Use when user asks to create a PR, submit changes, or open a pull request.
---

# Create Pull Request

## Process
1. Check git status and diff
2. Verify branch is pushed
3. Create PR with gh CLI

## Commands
```bash
# Check status
git status
git diff main...HEAD

# Push if needed
git push -u origin branch-name

# Create PR
gh pr create --title "title" --body "body"
```

## PR Format
```markdown
## Summary
- Bullet points of changes

## Test plan
- [ ] How to test

Generated with Claude Code
```

## Title Conventions
- `feat: Add creature capture system`
- `fix: Correct damage calculation`
- `refactor: Simplify EventBus usage`

## Example
Input: "Crée une PR pour les changements"
Output:
```bash
gh pr create --title "feat: add Rocklet creature" --body "## Summary
- Added Rocklet rock-type creature
- Stats: HP 45, ATK 80, DEF 90, SPD 35

## Test plan
- [ ] Verify creature appears in encounters
"
```
