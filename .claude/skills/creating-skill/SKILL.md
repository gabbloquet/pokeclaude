---
name: creating-skill
description: Creates ONE atomic skill in .claude/skills/. Use when user asks to add a new skill, slash command, or Claude Code capability.
---

# Create Atomic Skill

## Input
- Action name (what the skill does)
- Trigger context (when to use it)

## Output
- `.claude/skills/<skill-name>/SKILL.md`

## Naming Convention
```
Pattern: verbe-ing + objet
Examples: adding-creature-data, writing-test, fixing-bug
```

**Rules:**
- Lowercase, hyphens only
- Max 64 chars
- No "claude" or "anthropic"
- Gerund form (-ing)

## Template
```markdown
---
name: verbing-object
description: [Verbs] ONE [object]. Use when [precise trigger].
---

# [Action Title]

## Input
[What Claude needs]

## Output
[What Claude produces]

## File(s)
[Exact path(s)]

## Example
Input: "[User request]"
Output: [Concrete result]
```

## Atomicity Rules
| Bon | Mauvais |
|-----|---------|
| 1 action | Workflow multi-étapes |
| < 50 lignes | > 100 lignes |
| 1 fichier cible | Plusieurs systèmes |

## Anti-patterns
```
❌ "Creates creature with stats, sprites, and tests"
✅ "Adds ONE creature to species.ts"

❌ "Helps with testing"
✅ "Writes ONE unit test file"
```

## Example
Input: "Crée une skill pour ajouter des dialogues"
Output:
```markdown
---
name: adding-dialogue-data
description: Adds ONE dialogue to src/data/dialogues.ts. Use when user asks to add NPC dialogue or conversation.
---

# Add Dialogue Data

## Input
- NPC name, dialogue lines, conditions

## Output
- One entry in DIALOGUES object

## File
`src/data/dialogues.ts`

## Example
Input: "Ajoute un dialogue pour le Prof"
Output: Entry with id, speaker, lines array
```
