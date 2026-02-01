---
name: updating-docs
description: Updates CLAUDE.md or README.md documentation. Use when user asks to update docs, add documentation, or sync docs with code changes.
---

# Update Documentation

## Files
- `CLAUDE.md` - Claude Code instructions
- `README.md` - Project documentation

## CLAUDE.md Sections
| Section | Content |
|---------|---------|
| Creatures | Table with ID, Name, Types, Evolution |
| Moves | Attack reference |
| Architecture | File structure |
| Commands | npm scripts |

## When to Update
- New creature added → Update creatures table
- New feature → Update architecture section
- New command → Update commands section

## Creatures Table Format
```markdown
| ID | Nom | Type(s) | Evolution |
|----|-----|---------|-----------|
| 12 | Rocklet | Roche | → Bouldera (Nv.18) |
```

## Example
Input: "Mets à jour CLAUDE.md avec Rocklet"
Output: Add Rocklet row to creatures table in CLAUDE.md
