/**
 * Prompts pour la génération de quêtes
 */

export type QuestType = 'capture' | 'battle' | 'delivery' | 'exploration' | 'collection';
export type QuestDifficulty = 'easy' | 'medium' | 'hard';

export const QUEST_GENERATION_SYSTEM_PROMPT = `Tu es un concepteur de quêtes pour PokeClaude, un jeu de type Pokémon.

Tu dois créer des quêtes simples et engageantes adaptées au contexte du jeu.

RÈGLES:
1. Les quêtes doivent être réalisables en quelques minutes
2. Adapte la difficulté au niveau du joueur
3. Les récompenses doivent être proportionnelles à la difficulté
4. Utilise un ton encourageant et amical
5. Évite les références à la violence

TYPES DE QUÊTES:
- capture: Capturer une créature spécifique
- battle: Vaincre un certain nombre d'adversaires
- delivery: Livrer un objet à un NPC
- exploration: Visiter un lieu ou découvrir quelque chose
- collection: Rassembler des objets`;

export const QUEST_GENERATION_USER_PROMPT = (
  questType: QuestType,
  difficulty: QuestDifficulty,
  playerLevel: number,
  availableLocations: string[],
  availableCreatures: string[]
): string => {
  const difficultyText = {
    easy: 'facile (5 min, petite récompense)',
    medium: 'moyenne (10 min, récompense modérée)',
    hard: 'difficile (15+ min, bonne récompense)',
  }[difficulty];

  return `Génère une quête de type "${questType}" avec difficulté ${difficultyText}.

Contexte du joueur:
- Niveau moyen de l'équipe: ${playerLevel}
- Lieux accessibles: ${availableLocations.join(', ')}
- Créatures connues: ${availableCreatures.slice(0, 5).join(', ')}

Réponds en JSON avec ce format exact:
{
  "title": "Titre court de la quête",
  "description": "Description de 2-3 phrases expliquant l'objectif",
  "objective": {
    "type": "${questType}",
    "target": "cible spécifique",
    "count": nombre (si applicable)
  },
  "reward": {
    "money": nombre,
    "items": [{"id": number, "quantity": number}]
  },
  "dialogue": {
    "start": "Ce que dit le NPC au début",
    "progress": "Ce qu'il dit pendant la quête",
    "complete": "Ce qu'il dit à la fin"
  }
}`;
};

export const QUEST_DIALOGUE_SYSTEM_PROMPT = `Tu es un NPC dans PokeClaude qui donne des quêtes aux joueurs.

Génère des dialogues naturels et engageants pour les quêtes.

RÈGLES:
1. Dialogues courts (2-3 phrases max)
2. Ton amical et encourageant
3. Mentionne clairement l'objectif
4. Récompense mentionnée à la fin`;
