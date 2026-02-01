# Architecture PokeClaude

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                         Phaser Game                          │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   Scenes    │   Systems   │     UI      │     Entities      │
│  (lifecycle)│   (logic)   │  (display)  │    (objects)      │
├─────────────┴─────────────┴─────────────┴───────────────────┤
│                        EventBus                              │
├─────────────────────────────────────────────────────────────┤
│                     Zustand Stores                           │
├─────────────────────────────────────────────────────────────┤
│                    Services (AI, Save)                       │
└─────────────────────────────────────────────────────────────┘
```

## Flux de données

```
User Input → Scene → EventBus → System → Store → UI Update
                 ↓
            AI Service (async)
```

## Phaser Lifecycle

```
BootScene → PreloadScene → WorldScene ⇄ BattleScene
    │            │             │            │
  config      assets        explore      combat
```

### Scene Responsibilities

| Scene | Rôle | Fichier |
|-------|------|---------|
| `BootScene` | Config Phaser, init stores | `scenes/BootScene.ts` |
| `PreloadScene` | Charger assets, progress bar | `scenes/PreloadScene.ts` |
| `WorldScene` | Exploration, collisions, encounters | `scenes/WorldScene.ts` |
| `BattleScene` | Combat UI, turn management | `scenes/BattleScene.ts` |

## EventBus Pattern

### Flux typique (combat)

```
┌──────────┐    MOVE_SELECTED    ┌──────────────┐
│  BattleUI │ ──────────────────→ │ BattleSystem │
└──────────┘                      └──────────────┘
                                        │
                                   calcul dégâts
                                        │
                                        ▼
┌──────────┐    HP_UPDATE         ┌──────────────┐
│  InfoBox  │ ←────────────────── │   EventBus   │
└──────────┘                      └──────────────┘
```

### Event Categories

```typescript
// Actions joueur (UI → System)
BATTLE_EVENTS.ACTION_SELECTED
BATTLE_EVENTS.MOVE_SELECTED
BATTLE_EVENTS.BALL_SELECTED
BATTLE_EVENTS.RUN_SELECTED

// Résultats (System → UI)
BATTLE_EVENTS.DAMAGE_DEALT
BATTLE_EVENTS.HP_UPDATE
BATTLE_EVENTS.CREATURE_FAINTED
BATTLE_EVENTS.BATTLE_END

// IA (System → UI)
AI_EVENTS.AGENT_THINKING
AI_EVENTS.DIALOGUE_RESPONSE
```

## Systems Layer

Logique métier découplée des scenes.

| System | Responsabilité |
|--------|----------------|
| `BattleSystem` | Calculs combat, tours, dégâts |
| `CaptureSystem` | Logique capture, taux de succès |
| `DialogueSystem` | Conversations NPC, mémoire |
| `ProgressionSystem` | XP, level up, évolutions |
| `SaveSystem` | Sérialisation, localStorage |

### Pattern System

```typescript
class ExampleSystem {
  private store = useGameStore.getState();

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    EventBus.onBattle(EVENT, this.handler, this);
  }

  destroy() {
    EventBus.offBattle(EVENT, this.handler, this);
  }
}
```

## Stores (Zustand)

```typescript
// Store principal
useGameStore
├── player: PlayerState
├── team: Creature[]
├── inventory: Item[]
├── flags: GameFlags
└── actions: { ... }

// Store contenu généré (IA)
useGeneratedContentStore
├── creatures: GeneratedCreature[]
├── quests: GeneratedQuest[]
└── actions: { ... }
```

## Injection de dépendances

```typescript
// Services injectés via import singleton
import { AIService } from '@/services/ai';
import { EventBus } from '@/events';

// Stores via hooks Zustand
const { player } = useGameStore();
```

## Conventions fichiers

```
src/
├── scenes/           # 1 scene = 1 fichier
│   └── WorldScene.ts
├── systems/          # 1 system = 1 fichier
│   └── BattleSystem.ts
├── ui/               # Composants réutilisables
│   └── battle/
│       ├── InfoBox.ts
│       └── BattleMenu.ts
└── types/            # Interfaces partagées
    └── battle.ts
```
