# Formation Claude Code - Fonctionnalités Avancées

Ce document liste les fonctionnalités avancées de Claude Code à explorer en utilisant le projet PokeClaude comme terrain d'apprentissage.

## Niveau 1 - Fondamentaux

### CLAUDE.md
- [ ] Améliorer le fichier CLAUDE.md avec des conventions de nommage strictes
- [ ] Ajouter des règles de style de code spécifiques au projet
- [ ] Documenter les patterns architecturaux à respecter

### MCP Servers
- [ ] Utiliser **exa** pour rechercher de la documentation Phaser/game dev
- [ ] Utiliser **context7** pour accéder aux docs à jour (Zustand, Vite, Vitest)
- [ ] Utiliser **GitHub MCP** pour automatiser la gestion des issues/PRs

---

## Niveau 2 - Skills Atomiques (Best Practices)

> **Note**: Depuis la version 2.1.3, les slash commands ont été fusionnés avec les Skills.
> Tout va maintenant dans `.claude/skills/`

### Principe Single-Responsibility

**1 Skill = 1 Action**

Les skills doivent être atomiques : une seule responsabilité, une seule action.

| Avant (Multi-étapes) | Problème |
|---------------------|----------|
| `/new-creature` (5 étapes) | Mélange données + sprite + tests + docs |
| `/add-move` (4 étapes) | Mélange données + effet + assignation + test |

| Après (Atomique) | Avantage |
|-----------------|----------|
| `/adding-creature-data` | Une créature dans species.ts |
| `/adding-move-data` | Une attaque dans moves.ts |
| `/generating-sprite` | Un sprite via script |
| `/writing-test` | Un fichier de test |

### Pattern "verbe-ing + objet"

```
✅ Bon                     ❌ Éviter
adding-creature-data       new-creature
writing-test               test-creator
fixing-bug                 bug-fixer
committing-changes         commit
```

### Skills PokeClaude (restructurées)

#### Catégorie : Données (`data/`)
- [x] `/adding-creature-data` - Ajouter UNE créature
- [x] `/adding-move-data` - Ajouter UNE attaque
- [x] `/adding-item-data` - Ajouter UN item

#### Catégorie : Tests (`tests/`)
- [x] `/writing-test` - Écrire UN test unitaire
- [x] `/running-tests` - Lancer les tests

#### Catégorie : Assets (`assets/`)
- [x] `/generating-sprite` - Générer UN sprite

#### Catégorie : Documentation (`docs/`)
- [x] `/updating-docs` - Mettre à jour CLAUDE.md/README

#### Catégorie : Code (`code/`)
- [x] `/adding-feature` - Ajouter UNE feature
- [x] `/fixing-bug` - Corriger UN bug
- [x] `/refactoring-code` - Refactorer UN composant

#### Catégorie : Git (`git/`)
- [x] `/committing-changes` - Créer un commit
- [x] `/creating-pr` - Créer une PR

#### Catégorie : Analyse (`analysis/`)
- [x] `/checking-balance` - Analyser l'équilibrage
- [x] `/analyzing-creatures` - Analyser les matchups

#### Catégorie : Debug (`debug/`)
- [x] `/debugging-phaser` - Debug Phaser 3

### Structure d'une Skill Atomique

```
.claude/skills/
├── adding-creature-data/
│   └── SKILL.md
├── adding-move-data/
│   └── SKILL.md
├── writing-test/
│   └── SKILL.md
└── ...
```

### Format SKILL.md (Atomique)

```yaml
---
name: verbe-ing-objet
description: [Verbe] [UN/UNE] [objet]. Use when [trigger précis].
---

# [Action]

## Input
[Ce dont Claude a besoin]

## Output
[Ce que Claude doit produire]

## Fichier(s)
[Chemin exact]

## Exemple
[Input → Output concret]
```

### Exemple Concret

```markdown
---
name: adding-creature-data
description: Adds ONE creature to src/data/species.ts. Use when user asks to add a new creature.
---

# Add Creature Data

## Input
- Name, types, base stats, optional evolution

## Output
- One entry in CREATURES object

## File
`src/data/species.ts`

## Example
Input: "Ajoute Rocklet, type Roche"
Output: Entry with id, name, types, baseStats
```

### Règles importantes
- **name**: lowercase, hyphens, max 64 chars, pas de "claude" ou "anthropic"
- **description**: 3ème personne, inclure QUOI + QUAND utiliser
- **Corps**: < 50 lignes pour skills atomiques (< 500 pour skills complexes)
- **Atomicité**: 1 skill = 1 action, pas de workflows multi-étapes

---

## Niveau 3 - Hooks basiques

Créer des hooks dans `.claude/hooks/` :

### Hooks à implémenter
- [ ] **PostToolUse** - Auto-format avec Prettier après éditions de fichiers
- [ ] **PostToolUse** - Lancer `npm run test` automatiquement après modifications
- [ ] **UserPromptSubmit** - Logger toutes les demandes dans un fichier d'audit
- [ ] **Notification** - Notification sonore quand Claude attend une réponse

### Structure des hooks
```
.claude/
├── hooks/
│   ├── post_tool_use.py
│   ├── user_prompt_submit.py
│   └── notification.py
└── settings.json
```

---

## Niveau 4 - Sub-agents spécialisés

Créer des agents dans `.claude/agents/` :

### Agents à implémenter
- [ ] **battle-system-expert.md** - Expert du système de combat tour par tour
- [ ] **pixel-art-reviewer.md** - Vérifie la cohérence des sprites générés
- [ ] **phaser-debugger.md** - Spécialiste debugging Phaser 3
- [ ] **test-writer.md** - Génère des tests Vitest automatiquement
- [ ] **eventbus-auditor.md** - Audit les listeners de l'EventBus

### Exemple de structure agent
```markdown
---
name: battle-system-expert
description: Expert du système de combat. Utiliser pour implémenter ou debugger la logique de combat.
tools: Read, Grep, Glob, Edit
model: sonnet
---

# Battle System Expert

Tu es un expert du système de combat tour par tour de PokeClaude.

## Connaissances
- Architecture dans src/systems/BattleSystem.ts
- Calculs de dégâts avec STAB et efficacités de types
- EventBus pour la communication UI/logique

## Instructions
1. Toujours lire les fichiers existants avant de proposer des modifications
2. Respecter l'architecture Event-Driven
3. Écrire des tests pour toute nouvelle fonctionnalité
```

---

## Niveau 5 - Hooks avancés

### Hooks de contrôle
- [ ] **PreToolUse** - Bloquer les modifications sur `src/data/creatures.ts` sans confirmation
- [ ] **PreToolUse** - Empêcher la suppression de fichiers critiques
- [ ] **Stop** - Vérifier que les tests passent avant de terminer une tâche
- [ ] **Stop** - Générer un résumé des changements effectués

### Hook de validation pre-commit
```python
# .claude/hooks/pre_tool_use.py
# Bloquer les commits si les tests échouent
```

---

## Niveau 6 - Tasks (Nouveau!)

Les Tasks remplacent les Todos et permettent la coordination multi-sessions.

### Fonctionnalités Tasks
- [ ] Créer une Task List pour un projet complexe
- [ ] Définir des dépendances entre tasks
- [ ] Lancer plusieurs sessions sur la même Task List
- [ ] Utiliser Tasks avec des sous-agents

### Exercice pratique : Système de capture

```bash
# Lancer Claude avec une Task List dédiée
CLAUDE_CODE_TASK_LIST_ID=pokeclaude-capture claude
```

#### Tasks à créer
```
Task 1: Créer CaptureSystem dans src/systems/
Task 2: Ajouter animations de capture (bloqué par Task 1)
Task 3: Intégrer dans BattleScene (bloqué par Task 1)
Task 4: UI de sélection des balls (bloqué par Task 1)
Task 5: Tests unitaires (bloqué par Tasks 2, 3, 4)
```

#### Multi-agents en parallèle
```bash
# Terminal 1 - Agent système
CLAUDE_CODE_TASK_LIST_ID=pokeclaude-capture claude

# Terminal 2 - Agent UI
CLAUDE_CODE_TASK_LIST_ID=pokeclaude-capture claude
```

Les agents sont notifiés en temps réel quand une task est complétée.

### Stockage
- Tasks stockées dans `~/.claude/tasks`
- Possibilité de construire des utilitaires par-dessus

---

## Niveau 7 - Output Styles

Créer des styles de sortie dans `.claude/output-styles/` :

### Styles à tester
- [ ] `/output-style ultra-concise` - Prototypage rapide
- [ ] `/output-style table-based` - Comparaison de créatures
- [ ] Créer un style personnalisé pour les rapports de balance

---

## Niveau 8 - Meta-agent

### Agent qui génère d'autres agents
- [ ] Créer un meta-agent capable de générer des agents spécialisés
- [ ] L'utiliser pour créer rapidement de nouveaux experts pour PokeClaude

---

## Niveau 9 - Status Lines personnalisées

### Status lines à implémenter
- [ ] Afficher la branche git et le nombre de tests
- [ ] Afficher le nombre de créatures dans le jeu
- [ ] Indicateur visuel du type de tâche en cours

---

## Niveau 10 - Projet intégré

### Challenge final
Implémenter une fonctionnalité complète en utilisant :
1. **Task List partagée** entre sessions
2. **Sous-agents spécialisés** (backend + UI)
3. **Hooks** pour notifications et validations
4. **Commands** pour les actions répétitives
5. **Output style** adapté au workflow

### Fonctionnalité suggérée
Implémenter le **système d'évolution des créatures** avec :
- Détection du niveau requis
- Animation d'évolution
- Mise à jour des stats
- Apprentissage de nouvelles attaques
- Tests complets

---

## Niveau 11 - Skills Authoring (Best Practices)

Les Skills sont des extensions qui ajoutent des capacités spécialisées à Claude. Cette section couvre les best practices officielles d'Anthropic.

### Principes fondamentaux

#### 1. La concision est clé
Le context window est une ressource partagée. Chaque token compte.

**Question à se poser pour chaque information :**
- "Claude a-t-il vraiment besoin de cette explication ?"
- "Puis-je supposer que Claude sait déjà ça ?"

```markdown
# ❌ Mauvais (150 tokens)
PDF (Portable Document Format) files are a common file format that contains
text, images, and other content. To extract text from a PDF, you'll need to
use a library. There are many libraries available...

# ✅ Bon (50 tokens)
Use pdfplumber for text extraction:
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    text = pdf.pages[0].extract_text()
```

#### 2. Degrés de liberté appropriés

| Liberté | Quand l'utiliser | Exemple |
|---------|------------------|---------|
| **Haute** | Plusieurs approches valides | Code review, analyse |
| **Moyenne** | Pattern préféré avec variations | Templates avec paramètres |
| **Basse** | Opérations fragiles/critiques | Migrations DB, scripts exacts |

**Analogie** : Claude comme un robot sur un chemin
- **Pont étroit avec falaises** → Instructions exactes (liberté basse)
- **Champ ouvert sans danger** → Direction générale (liberté haute)

### Structure d'une Skill

#### YAML Frontmatter obligatoire

```yaml
---
name: processing-pdfs          # max 64 chars, lowercase, hyphens
description: Extracts text and tables from PDF files. Use when working with PDF files or when the user mentions PDFs.
---
```

**Règles pour `name` :**
- Max 64 caractères
- Uniquement minuscules, chiffres, hyphens
- Pas de tags XML
- Pas de mots réservés : "anthropic", "claude"

**Règles pour `description` :**
- Non vide, max 1024 caractères
- **Toujours à la 3ème personne** (pas "I can help" ni "You can use")
- Inclure QUOI fait la skill ET QUAND l'utiliser

#### Conventions de nommage (forme gérondif recommandée)

```
✅ Bon                    ❌ Éviter
processing-pdfs          helper
analyzing-spreadsheets   utils
managing-databases       tools
testing-code             documents
```

### Progressive Disclosure Pattern

SKILL.md sert de table des matières. Claude charge les fichiers supplémentaires uniquement quand nécessaire.

```
skill/
├── SKILL.md              # Instructions principales (<500 lignes)
├── FORMS.md              # Guide formulaires (chargé si besoin)
├── reference.md          # Référence API (chargé si besoin)
└── scripts/
    ├── analyze.py        # Exécuté, pas chargé en contexte
    └── validate.py
```

**Règle importante** : Garder les références à **un seul niveau de profondeur**.

```markdown
# ❌ Trop profond
SKILL.md → advanced.md → details.md → actual_info.md

# ✅ Un niveau
SKILL.md → advanced.md
SKILL.md → reference.md
SKILL.md → examples.md
```

### Patterns utiles

#### Pattern Template

```markdown
## Report structure

ALWAYS use this exact template:

# [Analysis Title]

## Executive summary
[One-paragraph overview]

## Key findings
- Finding 1
- Finding 2
```

#### Pattern Examples (input/output)

```markdown
## Commit message format

**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

#### Pattern Workflow avec checklist

```markdown
## Form filling workflow

Copy this checklist:
- [ ] Step 1: Analyze the form
- [ ] Step 2: Create field mapping
- [ ] Step 3: Validate mapping
- [ ] Step 4: Fill the form
- [ ] Step 5: Verify output
```

#### Pattern Feedback Loop

```markdown
## Process
1. Make edits
2. **Validate**: python scripts/validate.py
3. If fails → fix → validate again
4. **Only proceed when validation passes**
```

### Exercices Skills pour PokeClaude

#### Skill 1 : `analyzing-creatures`

```yaml
---
name: analyzing-creatures
description: Analyzes creature stats, type matchups, and balance. Use when discussing creature balance, stats comparison, or type effectiveness.
---
```

Contenu à inclure :
- [ ] Quick reference des formules de dégâts
- [ ] Table des efficacités de types
- [ ] Scripts d'analyse de balance

#### Skill 2 : `creating-game-content`

```yaml
---
name: creating-game-content
description: Creates new game content (creatures, moves, items). Use when adding new creatures, attacks, or items to the game.
---
```

Structure :
```
creating-game-content/
├── SKILL.md
├── CREATURES.md      # Guide création créatures
├── MOVES.md          # Guide création attaques
├── ITEMS.md          # Guide création items
└── scripts/
    ├── validate_creature.py
    └── generate_sprite.py
```

#### Skill 3 : `debugging-phaser`

```yaml
---
name: debugging-phaser
description: Debugs Phaser 3 game issues. Use when encountering rendering problems, scene lifecycle issues, or input handling bugs.
---
```

### Développement itératif avec Claude

**Workflow recommandé :**

1. **Compléter une tâche SANS skill** avec Claude A
2. **Identifier le pattern réutilisable** (contexte fourni répétitivement)
3. **Demander à Claude A de créer la Skill**
4. **Reviewer pour la concision** - supprimer les explications inutiles
5. **Tester avec Claude B** (instance fraîche avec la Skill)
6. **Itérer** selon les observations

### Checklist Skill

Avant de partager une Skill :

**Qualité core**
- [ ] Description spécifique avec mots-clés
- [ ] SKILL.md < 500 lignes
- [ ] Références à un niveau de profondeur
- [ ] Pas d'info time-sensitive
- [ ] Terminologie consistante
- [ ] Exemples concrets

**Code et scripts**
- [ ] Scripts gèrent les erreurs (pas de "punt to Claude")
- [ ] Pas de "magic numbers" non justifiés
- [ ] Packages requis listés
- [ ] Paths en forward slash uniquement

**Tests**
- [ ] Testé avec Haiku, Sonnet, Opus
- [ ] Au moins 3 scénarios d'évaluation
- [ ] Usage réel testé

### Ressources Skills
- [Skills Overview](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
- [Skills Quickstart](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/quickstart)
- [Skills in Claude Code](https://code.claude.com/docs/en/skills)
- [Skills Marketplace](https://skillsmp.com/categories) (60,000+ skills)

---

## Nouveautés Claude Code 2.1.x (Janvier 2026)

> **1,096 commits** dans la version 2.1.0 - La plus grosse mise à jour depuis le lancement.

### Fonctionnalités essentielles pour Dev/CTO

#### 1. `/teleport` - Session vers le web
Téléporter une session terminal vers claude.ai/code pour :
- [ ] Partager une session avec un collègue
- [ ] Continuer sur mobile/web
- [ ] Débugger visuellement

```bash
/teleport
# Génère un lien claude.ai/code/session-xxx
```

#### 2. `Shift+Enter` - Nouvelles lignes
Écrire des prompts multi-lignes sans configuration. Fini le copier-coller depuis un éditeur.

#### 3. Skills Hot Reload
Les skills se rechargent automatiquement quand modifiées. Plus besoin de relancer Claude.

```bash
# Modifier .claude/skills/my-skill/SKILL.md
# → Changements appliqués instantanément
```

#### 4. Forked Context (Contexte isolé)
Les skills s'exécutent dans un contexte séparé. Évite la pollution du contexte principal.

#### 5. Hooks dans le Frontmatter
Ajouter des hooks directement dans les agents et skills :

```yaml
---
name: my-skill
description: ...
hooks:
  PostToolUse:
    - command: "npm run lint"
      matcher: "Edit|Write"
---
```

#### 6. Wildcard Permissions
Autoriser des patterns de commandes :

```bash
# Autoriser tous les flags --help
Bash(*--help*)

# Autoriser npm avec n'importe quel argument
Bash(npm *)
```

#### 7. Langue de réponse configurable
Claude répond dans la langue configurée (settings ou CLAUDE.md).

```json
// .claude/settings.json
{
  "language": "fr"
}
```

#### 8. Agents persistants
Les agents ne s'arrêtent plus quand on refuse un tool use. Ils proposent une alternative.

### Exercices 2.1.x pour PokeClaude

- [ ] Tester `/teleport` et partager une session de debug
- [ ] Configurer le hot reload sur une skill existante
- [ ] Ajouter un hook PostToolUse pour linter après édition
- [ ] Configurer les wildcard permissions pour npm et node

### Versions importantes

| Version | Date | Changement clé |
|---------|------|----------------|
| 2.1.0 | 7 jan 2026 | Hot reload, /teleport, Shift+Enter |
| 2.1.3 | 24 jan 2026 | Fusion commands → skills |
| 2.1.22 | jan 2026 | 109 raffinements CLI |
| 2.1.25 | 30 jan 2026 | Fix Bedrock/Vertex |

### Ressources 2.1.x
- [Changelog officiel](https://code.claude.com/docs/en/changelog)
- [Thread Boris Cherny (créateur)](https://threads.com/@boris_cherny)
- [ClaudeLog - Release Notes](https://claudelog.com/faqs/claude-code-release-notes/)

---

## Tips Claude Code (Quick Wins)

### Commandes essentielles
- [ ] **Plan Mode** (`Shift + Tab`) - Mode planification pour structurer les projets
- [ ] **`/doctor`** - Diagnostiquer les problèmes d'environnement, dépendances manquantes
- [ ] **`/compact`** - Compacter le contexte manuellement quand il devient trop long
- [ ] **`/teleport`** - Téléporter la session vers claude.ai/code (v2.1+)
- [ ] **`Shift+Enter`** - Nouvelles lignes dans les prompts (v2.1+)

### Skills (remplace les Slash Commands depuis v2.1.3)
- [ ] Explorer le marketplace avec 60,000+ Skills : https://skillsmp.com/categories
- [ ] Créer des Skills personnalisées pour PokeClaude
- [ ] Profiter du hot reload pour itérer rapidement

### Bonnes pratiques
- [ ] **Step by step** - Toujours procéder étape par étape pour les builds complexes
- [ ] **Clear context** - Si Claude échoue 3+ fois, effacer le contexte et ré-expliquer
- [ ] **Session logs** - Créer un "Claude Journal" pour reviewer les sessions passées

### Outils complémentaires
- [ ] **Ralph Plugin** - Exécuter Claude en boucle autonome
- [ ] **Claude Chrome Extension** - Claude dans la sidebar du navigateur
- [ ] **Claude Desktop App** - Accès rapide via la barre de menu

---

## Tips Prompting

### Format optimal
```
[Role] + [Task] + [Context] + [Constraints] + [Question]
```

### Techniques efficaces
- [ ] **"Think First" Pattern** - Ajouter "Think deeply about all requests..." dans les instructions
- [ ] **Role Assignment** - "You are a [insert role]."
- [ ] **Extended Thinking** - Activer pour les workflows avancés
- [ ] **Hard Stop** - "Hard stop when _." pour gérer les limites de tokens
- [ ] **JSON/XML/Markdown** - Formats idéaux pour le prompting structuré

### Ressources prompting
- [Anthropic Prompt Library](https://platform.claude.com/docs/en/resources/prompt-library/library)
- [Claude 4 Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Interactive Prompt Maker](https://claude.ai/public/artifacts/3796db7e-4ef1-4cab-b70c-d045778f23ec)

---

## Tips Optimisation Tokens

### Model Stacking
- [ ] Utiliser **Grok** pour scraper, puis importer dans Claude
- [ ] Utiliser **ChatGPT voice** pour prompter, exporter le transcript vers Claude
- [ ] Utiliser **Google AI Studio** pour le prototypage, puis Claude pour la finalisation

### Choix du modèle
| Modèle | Usage |
|--------|-------|
| **Haiku 4.5** | Tâches quotidiennes rapides, Chrome extension |
| **Sonnet 4.5** | Planification, coding standard |
| **Opus 4.5** | Tâches complexes, PDF, long contexte |

---

## Claude Cowork (Desktop)

### Exercices avec PokeClaude
- [ ] Organiser les assets dans `public/assets/` avec patterns de nommage
- [ ] Batch rename des sprites avec format `YYYY-MM-DD`
- [ ] Analyser la structure du projet en parallèle

### Sécurité Cowork
- [ ] Créer un dossier "Cowork" dédié avec accès isolé
- [ ] Toujours terminer par "Confirm with me before deleting..."
- [ ] Backup avant actions destructives
- [Guide sécurité Cowork](https://support.claude.com/en/articles/13364135-using-cowork-safely)

---

## Ressources

### Documentation officielle
- [Documentation Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### Guides communautaires
- [Repo claude-code-hooks-mastery](https://github.com/disler/claude-code-hooks-mastery)
- [Blog - How I Use Every Claude Code Feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)
- [Guide CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Claude Code for Everyone (cours)](https://ccforeveryone.com/)

### Communautés
- r/Claude
- r/ClaudeCode
- r/Anthropic

### Setup de référence
- [Setup de Boris (créateur de Claude Code)](https://twitter.com/anthropaboris)

---

## Notes

- Les Tasks sont stockées dans `~/.claude/tasks`
- Les hooks utilisent des scripts Python avec UV pour l'isolation des dépendances
- Toujours nettoyer les listeners dans `destroy()` pour les composants utilisant l'EventBus
- **Haiku 4.5** est le modèle le plus rapide pour les tâches quotidiennes
- Exporter les données Claude via Settings → Privacy → Export Data
