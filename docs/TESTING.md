# Testing - PokeClaude

## Stack

- **Framework** : Vitest
- **Assertions** : Vitest (expect, describe, it)
- **Mocking** : vi.mock, vi.fn, vi.spyOn

## Commands

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test -- --coverage # Coverage report
npm run test -- src/tests/battleUtils.test.ts  # Single file
```

## Structure

```
src/tests/
├── typeChart.test.ts           # Efficacités types
├── battleUtils.test.ts         # Calculs de combat
├── captureSystem.test.ts       # Système capture
├── experienceSystem.test.ts    # XP, level up
├── statusSystem.test.ts        # Status effects
├── itemSystem.test.ts          # Items en combat
├── overworldItemSystem.test.ts # Items overworld
└── creatureUtils.test.ts       # Utilitaires créatures
```

## Patterns

### Test basique

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDamage } from '@/systems/battle/damage';

describe('calculateDamage', () => {
  it('should return positive damage for valid input', () => {
    const damage = calculateDamage({
      level: 50,
      power: 80,
      attack: 100,
      defense: 80
    });

    expect(damage).toBeGreaterThan(0);
  });
});
```

### Test avec setup

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('BattleSystem', () => {
  let system: BattleSystem;
  let mockCreature: Creature;

  beforeEach(() => {
    mockCreature = createMockCreature();
    system = new BattleSystem();
  });

  it('should initialize with turn 1', () => {
    expect(system.turn).toBe(1);
  });
});
```

### Test async

```typescript
import { describe, it, expect } from 'vitest';

describe('AIService', () => {
  it('should return response from API', async () => {
    const response = await AIService.chat([
      { role: 'user', content: 'Hello' }
    ]);

    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
  });
});
```

## Mocking

### Mock module

```typescript
import { vi, describe, it, expect } from 'vitest';

// Mock entire module
vi.mock('@/services/ai', () => ({
  AIService: {
    isAvailable: vi.fn(() => true),
    chat: vi.fn(() => Promise.resolve('Mocked response'))
  }
}));

describe('DialogueSystem', () => {
  it('should use AIService', async () => {
    const dialogue = new DialogueSystem();
    const response = await dialogue.talk('npc', 'Hello');

    expect(AIService.chat).toHaveBeenCalled();
  });
});
```

### Mock function

```typescript
import { vi, describe, it, expect } from 'vitest';

describe('BattleAgent', () => {
  it('should call decision callback', () => {
    const onDecision = vi.fn();
    const agent = new HeuristicAgent({ onDecision });

    agent.selectMove(observation);

    expect(onDecision).toHaveBeenCalledWith(
      expect.objectContaining({ moveIndex: expect.any(Number) })
    );
  });
});
```

### Spy on method

```typescript
import { vi, describe, it, expect } from 'vitest';

describe('EventBus', () => {
  it('should emit events', () => {
    const spy = vi.spyOn(EventBus, 'emitBattle');

    system.dealDamage(50);

    expect(spy).toHaveBeenCalledWith(
      BATTLE_EVENTS.DAMAGE_DEALT,
      expect.objectContaining({ damage: 50 })
    );
  });
});
```

## Mocking Phaser

### Mock Scene

```typescript
const mockScene = {
  add: {
    sprite: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      play: vi.fn().mockReturnThis()
    })),
    text: vi.fn(() => ({
      setOrigin: vi.fn().mockReturnThis()
    }))
  },
  input: {
    keyboard: {
      on: vi.fn()
    }
  },
  events: {
    on: vi.fn(),
    emit: vi.fn()
  }
};
```

### Mock Game Objects

```typescript
function createMockSprite() {
  return {
    x: 0,
    y: 0,
    setPosition: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
    setFrame: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  };
}
```

## Test Data Factories

### Creature factory

```typescript
// src/__tests__/factories/creature.ts
export function createMockCreature(overrides = {}): Creature {
  return {
    id: 1,
    name: 'TestCreature',
    types: ['normal'],
    level: 50,
    currentHp: 100,
    maxHp: 100,
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      speed: 100
    },
    moves: [createMockMove()],
    ...overrides
  };
}
```

### Move factory

```typescript
export function createMockMove(overrides = {}): Move {
  return {
    id: 1,
    name: 'Test Move',
    type: 'normal',
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 10,
    ...overrides
  };
}
```

## Testing Categories

### Unit Tests

```typescript
// Test isolated function
describe('typeEffectiveness', () => {
  it('should return 2 for fire vs grass', () => {
    expect(getTypeEffectiveness('fire', 'grass')).toBe(2);
  });

  it('should return 0.5 for fire vs water', () => {
    expect(getTypeEffectiveness('fire', 'water')).toBe(0.5);
  });
});
```

### Integration Tests

```typescript
// Test system interaction
describe('Battle Flow', () => {
  it('should complete a battle turn', async () => {
    const battle = new BattleSystem();
    battle.start(playerCreature, enemyCreature);

    await battle.executeTurn({
      playerMove: 0,
      enemyMove: 1
    });

    expect(battle.turn).toBe(2);
    expect(battle.isOver).toBe(false);
  });
});
```

### Data Validation Tests

```typescript
// Validate game data
describe('Creatures Data', () => {
  Object.entries(CREATURES).forEach(([id, creature]) => {
    describe(`Creature ${creature.name}`, () => {
      it('should have valid BST for evolution stage', () => {
        const bst = sumStats(creature.baseStats);
        const range = getBSTRange(creature.evolutionStage);

        expect(bst).toBeGreaterThanOrEqual(range.min);
        expect(bst).toBeLessThanOrEqual(range.max);
      });

      it('should have 1-2 types', () => {
        expect(creature.types.length).toBeGreaterThanOrEqual(1);
        expect(creature.types.length).toBeLessThanOrEqual(2);
      });
    });
  });
});
```

## Coverage

### Targets

| Category | Target |
|----------|--------|
| Systems | 80%+ |
| Utils | 90%+ |
| Data validation | 100% |
| UI components | 50%+ |

### Ignore patterns

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        'src/scenes/**',      // Phaser scenes hard to test
        'src/ui/**',          // UI components
        '**/*.d.ts',
        '**/index.ts'
      ]
    }
  }
});
```

## CI Integration

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test -- --coverage --reporter=json

- name: Check coverage
  run: |
    coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$coverage < 70" | bc -l) )); then
      echo "Coverage below 70%"
      exit 1
    fi
```
