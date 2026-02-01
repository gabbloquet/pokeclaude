# PokeClaude

Jeu Pokémon-like en TypeScript/Phaser 3 avec IA générative (OpenAI).

## Stack

TypeScript 5.x • Phaser 3.80+ • Vite • Vitest • Zustand • OpenAI API

## Commands

```bash
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build
npm run test         # Run tests
npm run test:watch   # Tests en mode watch
npm run preview      # Preview du build
node scripts/generateSprites.cjs  # Générer sprites
```

## Structure

```
src/
├── config/           # Config Phaser, constantes UI
├── data/             # Données statiques (creatures, moves, items)
│   ├── prompts/      # Templates prompts IA
│   └── fallbacks/    # Fallbacks si IA indisponible
├── entities/         # Player
├── events/           # EventBus singleton
├── scenes/           # Scènes Phaser (Boot, Preload, World, Battle)
├── services/ai/      # OpenAI service + generators + validators
├── systems/          # Logique métier (battle, capture, dialogue)
│   └── battle/agents/  # RandomAgent, HeuristicAgent, LLMAgent
├── store/            # Zustand stores
├── types/            # TypeScript interfaces
├── ui/               # Composants UI
└── utils/            # Helpers
```

## Code Style

- **Modules** : ES modules, named exports
- **Naming** : PascalCase (classes/types), camelCase (functions/vars)
- **Files** : Une classe/système par fichier
- **Types** : Interfaces dans `src/types/`, pas de `any`
- **Events** : Toujours cleanup listeners dans `destroy()`

## Architecture

### EventBus (Event-Driven)

```typescript
import { EventBus, BATTLE_EVENTS } from '../events';

// Émettre
EventBus.emitBattle(BATTLE_EVENTS.DAMAGE_DEALT, { target: 'enemy', damage: 25 });

// Écouter
EventBus.onBattle(BATTLE_EVENTS.HP_UPDATE, (payload) => { /* ... */ });

// Cleanup (OBLIGATOIRE dans destroy())
EventBus.offBattle(BATTLE_EVENTS.HP_UPDATE, this.handler, this);
```

### IA Service

```typescript
import { AIService } from '@/services/ai';

if (AIService.isAvailable()) {
  const response = await AIService.chat(messages, { temperature: 0.7 });
}
```

### Battle Agents

```typescript
import { createBattleAgent } from '@/systems/battle/agents';
const agent = createBattleAgent('hard'); // 'easy' | 'normal' | 'hard' | 'expert'
```

## Gotchas

- **EventBus leaks** : Toujours `off()` dans `destroy()` sinon memory leaks
- **Phaser lifecycle** : Assets dans `preload()`, objets dans `create()`
- **IA fallback** : Si `VITE_AI_ENABLED=false`, utilise `HeuristicAgent` + données statiques
- **Sprites 32x32** : Tous les tiles/sprites font 32x32px
- **Encounters** : 15% chance par pas dans tallGrass

## Domain Terms

| Terme | Signification |
|-------|---------------|
| **BST** | Base Stat Total (somme des stats) |
| **STAB** | Same Type Attack Bonus (1.5x) |
| **Type effectiveness** | 0.5x / 1x / 2x selon types |
| **Creature** | Équivalent Pokémon |
| **Move** | Attaque/capacité |
| **EventBus** | Singleton pour communication inter-modules |

## Creatures

| ID | Nom | Type(s) | Évolution |
|----|-----|---------|-----------|
| 1-3 | Flamling → Flamero → Flamaster | Feu (→ Feu/Vol) | Nv.16, 36 |
| 4-6 | Aqualing → Aquaro → Aquaster | Eau | Nv.16, 36 |
| 7-9 | Leafling → Leafero → Leafaster | Plante (→ Plante/Poison) | Nv.16, 32 |
| 10-11 | Sparkit → Sparkolt | Électrik | Nv.26 |

## Balance Guidelines

| Stage | BST attendu |
|-------|-------------|
| Base | 280-320 |
| Mid | 380-420 |
| Final | 480-540 |

## Env Variables

```bash
# .env.local (gitignored)
VITE_OPENAI_API_KEY=sk-...
VITE_AI_ENABLED=true
VITE_AI_MODEL=gpt-4o-mini
```
