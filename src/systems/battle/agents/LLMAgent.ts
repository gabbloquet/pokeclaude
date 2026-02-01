/**
 * Agent LLM - Utilise GPT pour raisonner sur le combat
 * Le plus intelligent mais aussi le plus coûteux
 */

import type {
  BattleAgent,
  BattleObservation,
  AgentDecision,
  TurnHistory,
} from './BattleAgent';
import { AIService } from '@/services/ai';
import { JSONValidator } from '@/services/ai/validators/JSONValidator';
import { EventBus, AI_EVENTS } from '@/events';
import { HeuristicAgent } from './HeuristicAgent';

interface LLMDecision {
  reasoning: string;
  selectedMove: string;
  confidence: number;
}

const BATTLE_AGENT_SYSTEM_PROMPT = `Tu es un stratège de combat pour PokeClaude, un jeu de type Pokémon.

Ton rôle est d'analyser la situation de combat et de choisir le meilleur move.

STRATÉGIES IMPORTANTES:
1. Les avantages de type sont cruciaux (x2 ou x4 de dégâts)
2. Le STAB (Same Type Attack Bonus) donne x1.5 aux attaques du même type que la créature
3. Privilégie les moves offensifs quand tu as l'avantage
4. Les moves de statut sont utiles si tu as du temps
5. La vitesse détermine qui frappe en premier (sauf moves prioritaires)
6. Ne gaspille pas de tours sur des moves inefficaces (type immunité)

RÈGLES DE RÉPONSE:
- Sois concis dans ton raisonnement (2-3 phrases)
- Choisis toujours un des moves disponibles
- La confiance reflète ta certitude (0-100)
- Réponds uniquement en JSON`;

export class LLMAgent implements BattleAgent {
  readonly name = 'LLMAgent';
  readonly type = 'llm' as const;

  private fallbackAgent: HeuristicAgent;
  private turnHistory: TurnHistory[] = [];

  constructor() {
    this.fallbackAgent = new HeuristicAgent();
  }

  async selectMove(observation: BattleObservation): Promise<AgentDecision> {
    // Vérifier si l'IA est disponible
    if (!AIService.isAvailable()) {
      console.log('[LLMAgent] AI not available, using HeuristicAgent');
      return this.fallbackAgent.selectMove(observation);
    }

    EventBus.emitAI(AI_EVENTS.AGENT_THINKING, {
      agentType: this.name,
      turn: observation.turn,
    });

    try {
      const userPrompt = this.buildUserPrompt(observation);

      const response = await AIService.chat(
        [
          { role: 'system', content: BATTLE_AGENT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.3, // Plus déterministe pour les décisions de combat
          maxTokens: 200,
          jsonMode: true,
          timeout: 5000, // Court timeout pour ne pas ralentir le jeu
          cacheKey: this.generateCacheKey(observation),
          cacheTTL: 30 * 1000, // Cache court (30s)
        }
      );

      // Parser la réponse
      const decision = this.parseDecision(response.content, observation);

      EventBus.emitAI(AI_EVENTS.AGENT_DECISION, {
        agentType: this.name,
        moveIndex: decision.moveIndex,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
      });

      return decision;
    } catch (error) {
      console.error('[LLMAgent] Error:', error);

      EventBus.emitAI(AI_EVENTS.AGENT_ERROR, {
        agentType: this.name,
        error: (error as Error).message,
      });

      // Fallback vers l'agent heuristique
      return this.fallbackAgent.selectMove(observation);
    }
  }

  /**
   * Construit le prompt utilisateur avec l'état du combat
   */
  private buildUserPrompt(observation: BattleObservation): string {
    const my = observation.myCreature;
    const enemy = observation.enemyCreature;

    const movesText = my.moves
      .map((m, i) => `${i + 1}. ${m.name} (${m.type}, ${m.power || 'status'} PWR, ${m.accuracy}% ACC)`)
      .join('\n');

    const historyText = observation.history.length > 0
      ? observation.history
          .slice(-3)
          .map((h) => `Tour ${h.turn}: Moi: ${h.myMove || 'N/A'}, Ennemi: ${h.enemyMove || 'N/A'}`)
          .join('\n')
      : 'Premier tour';

    const typeMatchupsText = observation.typeMatchups
      .map((tm) => `${tm.moveName}: x${tm.effectiveness}`)
      .join(', ');

    return `ÉTAT DU COMBAT (Tour ${observation.turn}):

MA CRÉATURE: ${my.name} (${my.types.join('/')})
HP: ${my.hpPercent}% | Status: ${my.status || 'OK'}

ENNEMI: ${enemy.name} (${enemy.types.join('/')})
HP: ${enemy.hpPercent}% | Status: ${enemy.status || 'OK'}

MES MOVES DISPONIBLES:
${movesText}

EFFICACITÉS DE TYPE:
${typeMatchupsText || 'Aucune donnée'}

HISTORIQUE:
${historyText}

Analyse la situation et choisis le meilleur move.
Réponds en JSON: {"reasoning": "...", "selectedMove": "nom exact du move", "confidence": 0-100}`;
  }

  /**
   * Parse la décision du LLM
   */
  private parseDecision(
    content: string,
    observation: BattleObservation
  ): AgentDecision {
    try {
      const result = JSONValidator.parseAndValidate<LLMDecision>(content, {
        type: 'object',
        required: ['selectedMove', 'reasoning', 'confidence'],
        properties: {
          selectedMove: { type: 'string' },
          reasoning: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
        },
      });

      if (result.success && result.data) {
        const { selectedMove, reasoning, confidence } = result.data;

        // Trouver l'index du move
        const moveIndex = observation.myCreature.moves.findIndex(
          (m) => m.name.toLowerCase() === selectedMove.toLowerCase()
        );

        if (moveIndex !== -1) {
          return { moveIndex, reasoning, confidence };
        }

        // Si le move n'est pas trouvé exactement, essayer une correspondance partielle
        const partialIndex = observation.myCreature.moves.findIndex(
          (m) => m.name.toLowerCase().includes(selectedMove.toLowerCase()) ||
                 selectedMove.toLowerCase().includes(m.name.toLowerCase())
        );

        if (partialIndex !== -1) {
          return {
            moveIndex: partialIndex,
            reasoning: reasoning + ' (correspondance partielle)',
            confidence: Math.max(0, confidence - 20),
          };
        }
      }
    } catch (error) {
      console.warn('[LLMAgent] Parse error:', error);
    }

    // Fallback: utiliser l'agent heuristique
    console.log('[LLMAgent] Could not parse response, using heuristic fallback');
    return this.fallbackAgent.selectMove(observation) as unknown as AgentDecision;
  }

  /**
   * Génère une clé de cache pour éviter les appels répétés
   */
  private generateCacheKey(observation: BattleObservation): string {
    const my = observation.myCreature;
    const enemy = observation.enemyCreature;

    // Clé basée sur les HP (par tranches de 10%) et le nombre de moves
    const myHpBucket = Math.floor(my.hpPercent / 10);
    const enemyHpBucket = Math.floor(enemy.hpPercent / 10);

    return `battle-agent:${my.name}:${myHpBucket}:${enemy.name}:${enemyHpBucket}:${observation.turn}`;
  }

  onTurnEnd(result: TurnHistory): void {
    this.turnHistory.push(result);

    // Garder seulement les 10 derniers tours
    if (this.turnHistory.length > 10) {
      this.turnHistory.shift();
    }
  }

  reset(): void {
    this.turnHistory = [];
  }
}
