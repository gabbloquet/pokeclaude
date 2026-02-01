# Intégration IA - PokeClaude

## Configuration

```bash
# .env.local
VITE_OPENAI_API_KEY=sk-...
VITE_AI_ENABLED=true
VITE_AI_MODEL=gpt-5-mini
```

## AIService

### Usage basique

```typescript
import { AIService } from '@/services/ai';

// Vérifier disponibilité
if (!AIService.isAvailable()) {
  // Fallback automatique
  return;
}

// Chat simple
const response = await AIService.chat([
  { role: 'system', content: 'Tu es un PNJ.' },
  { role: 'user', content: 'Bonjour !' }
]);

// Avec options
const response = await AIService.chat(messages, {
  temperature: 0.7,      // 0-1, créativité
  maxTokens: 150,        // limite réponse
  cacheKey: 'npc-mom',   // clé cache
  cacheTTL: 60000        // TTL cache (ms)
});
```

### Paramètres température

| Cas d'usage | Température | Raison |
|-------------|-------------|--------|
| Dialogues NPC | 0.7-0.8 | Variété naturelle |
| Décisions combat | 0.3-0.5 | Cohérence tactique |
| Génération créatures | 0.6 | Créativité contrôlée |
| Descriptions | 0.8 | Prose variée |

## Battle Agents

### Hiérarchie

```
BattleAgent (interface)
├── RandomAgent      # Choix aléatoire
├── HeuristicAgent   # Règles tactiques
└── LLMAgent         # Raisonnement GPT
```

### Factory

```typescript
import { createBattleAgent } from '@/systems/battle/agents';

// Par difficulté
const agent = createBattleAgent('easy');    // RandomAgent
const agent = createBattleAgent('normal');  // HeuristicAgent
const agent = createBattleAgent('hard');    // HeuristicAgent
const agent = createBattleAgent('expert');  // LLMAgent (si API dispo)

// Usage
const decision = await agent.selectMove(observation);
// → { moveIndex: 2, reasoning: "Super efficace", confidence: 85 }
```

### HeuristicAgent - Règles

```typescript
// Priorités (score cumulatif)
1. Puissance de base (power / 10)
2. Bonus STAB (+15)
3. Super efficace (effectiveness * 20)
4. Pénalité peu efficace (-30)
5. Pénalité imprécision (-(100 - accuracy) / 2)
6. Bonus priorité si HP bas
7. Éviter status si HP critiques
8. Favoriser finisher si ennemi HP bas
9. Pénalité répétition (-10)
```

### LLMAgent - Prompt

```typescript
const systemPrompt = `Tu es un stratège de combat pour PokeClaude.
Analyse la situation et choisis le meilleur move.
Réponds en JSON: { "reasoning": "...", "selectedMove": "nom", "confidence": 0-100 }`;
```

### BattleObservation

```typescript
interface BattleObservation {
  myCreature: {
    name: string;
    types: string[];
    level: number;
    currentHp: number;
    maxHp: number;
    hpPercent: number;
    status: string | null;
    statModifiers: Record<string, number>;
    moves: MoveState[];
  };
  enemyCreature: {
    name: string;
    types: string[];
    level: number;
    currentHp: number;
    maxHp: number;
    hpPercent: number;
    status: string | null;
    statModifiers: Record<string, number>;
    moves: MoveState[];
  };
  turn: number;
  isWildBattle: boolean;
  history: TurnHistory[];
  typeMatchups: TypeMatchup[];
}
```

## Générateurs

### DescriptionGenerator

```typescript
import { descriptionGenerator } from '@/services/ai/generators';

// Génère une description pour une créature (par ID)
const desc = await descriptionGenerator.generateCreatureDescription(1);
// → "Une petite créature de feu à la queue enflammée..."

// Génère une description de lieu
const locDesc = await descriptionGenerator.generateLocationDescription(
  'Bourg Palette',
  'town'
);
```

### QuestGenerator

```typescript
import { questGenerator } from '@/services/ai/generators';

const quest = await questGenerator.generate({
  questType: 'catch',
  difficulty: 'normal',
  location: 'forest',
  npcName: 'Ranger'
});
// → { title, description, objective, reward, dialogue }
```

### CreatureGenerator

```typescript
import { creatureGenerator } from '@/services/ai/generators';

const creature = await creatureGenerator.generate({
  types: ['water', 'ice'],
  evolutionStage: 'mid',  // 'base' | 'mid' | 'final'
  theme: 'arctic'
});
// → { name, types, baseStats, description, abilities }
```

## Validation

### JSONValidator

```typescript
import { JSONValidator } from '@/services/ai/validators';

// Parse et valide du JSON
const result = JSONValidator.parseAndValidate<CreatureData>(jsonString, schema);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.errors);
}

// Valide un objet existant
const validation = JSONValidator.validate<Quest>(questData, questSchema);
```

### ContentValidator

```typescript
import { ContentValidator } from '@/services/ai/validators';

// Valide une description
const result = ContentValidator.validateDescription(text);
// → { isValid: boolean, sanitized: string, errors: string[] }

// Valide les stats d'une créature
ContentValidator.validateCreatureStats(stats, 'mid');

// Valide un move
ContentValidator.validateMove(move);
```

## Système de Dialogues

### Setup NPC

```typescript
// src/data/npcs/personalities.ts
export const NPC_PERSONALITIES = {
  mom: {
    id: 'mom',
    name: 'Maman',
    role: 'mother',
    traits: ['aimante', 'protectrice', 'inquiète'],
    speechStyle: 'Chaleureux, utilise des surnoms affectueux',
    knowledge: ['maison', 'famille', 'cuisine'],
    systemPrompt: '...'
  }
};
```

### Usage DialogueSystem

```typescript
import { dialogueSystem } from '@/systems/dialogue';

// Conversation avec mémoire
const response1 = await dialogueSystem.talk('mom', 'Je pars à l\'aventure !');
const response2 = await dialogueSystem.talk('mom', 'Tu te souviens ?');
// → Se souvient du contexte précédent

// Interaction rapide (sans historique)
const greeting = await dialogueSystem.quickTalk('mom');

// Reset mémoire
dialogueSystem.resetConversation('mom');
```

## Fallbacks

### Quand actifs

- `VITE_AI_ENABLED=false`
- API key manquante
- Erreur réseau / timeout
- Rate limiting

### Fallback automatique

```typescript
// Le système switch automatiquement
LLMAgent → HeuristicAgent
descriptionGenerator → getFallbackDescription(speciesId)
dialogueSystem → dialogueFallbacks.getResponse(npcId)
```

### Données fallback

```
src/data/fallbacks/
├── descriptions.ts  # Descriptions créatures
├── quests.ts        # Quêtes prédéfinies
└── index.ts         # Exports
```

## Events IA

```typescript
import { EventBus, AI_EVENTS } from '@/events';

// Agent réfléchit
EventBus.onAI(AI_EVENTS.AGENT_THINKING, ({ agentType, turn }) => {
  showThinkingIndicator();
});

// Décision prise
EventBus.onAI(AI_EVENTS.AGENT_DECISION, ({ moveIndex, reasoning, confidence }) => {
  hideThinkingIndicator();
});

// Dialogue reçu
EventBus.onAI(AI_EVENTS.DIALOGUE_RESPONSE, ({ npcId, response }) => {
  displayDialogue(response);
});

// Erreur IA
EventBus.onAI(AI_EVENTS.AGENT_ERROR, ({ agentType, error }) => {
  console.error('AI error:', error);
});
```

## Coûts & Optimisation

### Cache

```typescript
// Cache en mémoire avec TTL
AIService.chat(messages, {
  cacheKey: 'unique-key',
  cacheTTL: 60000  // 1 minute
});
```

### Token limits

| Modèle | Max tokens | Usage recommandé |
|--------|------------|------------------|
| gpt-5-mini | 150-300 | Dialogues, décisions |
| gpt-5 | 500-800 | Génération complexe |
