/**
 * Définition des événements liés à l'IA
 * Pour la communication entre les systèmes IA et le reste du jeu
 */

export const AI_EVENTS = {
  // === Dialogue IA ===
  DIALOGUE_LOADING: 'ai:dialogue:loading',
  DIALOGUE_RESPONSE: 'ai:dialogue:response',
  DIALOGUE_ERROR: 'ai:dialogue:error',
  DIALOGUE_FALLBACK: 'ai:dialogue:fallback',

  // === Génération ===
  GENERATION_START: 'ai:generation:start',
  GENERATION_COMPLETE: 'ai:generation:complete',
  GENERATION_ERROR: 'ai:generation:error',

  // === Agent de combat ===
  AGENT_THINKING: 'ai:agent:thinking',
  AGENT_DECISION: 'ai:agent:decision',
  AGENT_ERROR: 'ai:agent:error',

  // === Service ===
  SERVICE_AVAILABLE: 'ai:service:available',
  SERVICE_UNAVAILABLE: 'ai:service:unavailable',
  QUOTA_WARNING: 'ai:quota:warning',
  QUOTA_EXCEEDED: 'ai:quota:exceeded',
} as const;

// Types pour le typage fort des payloads
export interface AIEventPayloads {
  [AI_EVENTS.DIALOGUE_LOADING]: { npcId: string };
  [AI_EVENTS.DIALOGUE_RESPONSE]: { npcId: string; response: string };
  [AI_EVENTS.DIALOGUE_ERROR]: { npcId: string; error: string };
  [AI_EVENTS.DIALOGUE_FALLBACK]: { npcId: string; fallbackResponse: string };

  [AI_EVENTS.GENERATION_START]: { type: 'creature' | 'quest' | 'description'; id?: string };
  [AI_EVENTS.GENERATION_COMPLETE]: { type: 'creature' | 'quest' | 'description'; result: unknown };
  [AI_EVENTS.GENERATION_ERROR]: { type: 'creature' | 'quest' | 'description'; error: string };

  [AI_EVENTS.AGENT_THINKING]: { agentType: string; turn: number };
  [AI_EVENTS.AGENT_DECISION]: {
    agentType: string;
    moveIndex: number;
    reasoning?: string;
    confidence?: number;
  };
  [AI_EVENTS.AGENT_ERROR]: { agentType: string; error: string };

  [AI_EVENTS.SERVICE_AVAILABLE]: undefined;
  [AI_EVENTS.SERVICE_UNAVAILABLE]: { reason: string };
  [AI_EVENTS.QUOTA_WARNING]: { usedTokens: number; limitTokens: number; percentUsed: number };
  [AI_EVENTS.QUOTA_EXCEEDED]: { usedTokens: number; limitTokens: number };
}

// Type helper
export type AIEventType = keyof typeof AI_EVENTS;
export type AIEventName = (typeof AI_EVENTS)[AIEventType];
