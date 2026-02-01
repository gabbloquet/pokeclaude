---
name: committing-changes
description: Creates git commits following Conventional Commits specification. Use when the user wants to commit, asks for a commit message, or mentions /commit.
---

# Conventional Commit

## Workflow

```
- [ ] Run git status
- [ ] Run git diff (staged + unstaged)
- [ ] Analyze changes
- [ ] Generate commit message
- [ ] Stage files
- [ ] Commit
```

## Commit Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation uniquement |
| `style` | Formatage (pas de changement de code) |
| `refactor` | Refactoring (ni feat ni fix) |
| `perf` | Amélioration de performance |
| `test` | Ajout ou correction de tests |
| `chore` | Maintenance, dépendances, config |
| `ci` | CI/CD configuration |

## Scopes pour PokeClaude

| Scope | Fichiers concernés |
|-------|-------------------|
| `battle` | src/systems/Battle*, src/scenes/BattleScene |
| `creatures` | src/data/creatures.ts, sprites/creatures |
| `moves` | src/data/moves.ts |
| `ui` | src/ui/*, src/config/ui* |
| `world` | src/scenes/WorldScene, src/data/maps |
| `player` | src/entities/Player* |
| `events` | src/events/* |
| `store` | src/store/* |
| `config` | src/config/*, vite.config, tsconfig |
| `tests` | src/__tests__/*, vitest.config |
| `assets` | public/assets/*, scripts/generate* |

## Exemples

```bash
# Nouvelle créature
feat(creatures): add Sparkit electric-type creature

# Fix de combat
fix(battle): correct damage calculation with STAB modifier

# Refactoring
refactor(events): simplify EventBus listener cleanup

# Tests
test(battle): add unit tests for type effectiveness

# Chore
chore(deps): update phaser to 3.80.1
```

## Règles

1. **Description en minuscules**, pas de point final
2. **Scope optionnel** mais recommandé
3. **Body** pour expliquer le "pourquoi" si nécessaire
4. **Breaking changes** : ajouter `!` après le type/scope
   ```
   feat(api)!: change creature stats structure
   ```

## Commandes Git

```bash
# Voir les changements
git status
git diff
git diff --staged

# Commit
git add <files>
git commit -m "type(scope): description"
```

## Co-Author

Toujours terminer par :
```
Co-Authored-By: Claude <noreply@anthropic.com>
```
