/**
 * Prompts pour la génération de créatures
 */

import type { CreatureType } from '@/types/creature.types';

export const CREATURE_DESCRIPTION_SYSTEM_PROMPT = `Tu es un expert en créatures fantastiques pour un jeu de type Pokémon appelé PokeClaude.

Ton rôle est de générer des descriptions courtes, engageantes et adaptées à un public familial pour les créatures du jeu.

RÈGLES:
1. Les descriptions doivent faire 1-2 phrases (max 150 caractères)
2. Évite les références à la violence ou la mort
3. Mentionne des caractéristiques physiques ou comportementales
4. Utilise un ton enthousiaste mais informatif
5. En français uniquement`;

export const CREATURE_DESCRIPTION_USER_PROMPT = (
  name: string,
  types: CreatureType[],
  isEvolved: boolean
): string => {
  const typesFr = types.map(t => translateType(t)).join('/');
  const evolutionContext = isEvolved
    ? 'C\'est une forme évoluée.'
    : 'C\'est une créature de base.';

  return `Génère une description Pokédex pour:
Nom: ${name}
Type(s): ${typesFr}
${evolutionContext}

Réponds uniquement avec la description, sans guillemets ni formatage.`;
};

export const CREATURE_GENERATION_SYSTEM_PROMPT = `Tu es un concepteur de créatures pour PokeClaude.

Tu dois créer des créatures équilibrées et originales en JSON.

CONTRAINTES:
- BST (Base Stat Total) entre 300-330 pour les formes de base
- BST entre 400-450 pour les formes intermédiaires
- BST entre 500-535 pour les formes finales
- Les stats individuelles vont de 20 à 130
- Les noms doivent être originaux et prononçables
- Les types doivent être cohérents avec le concept

TYPES DISPONIBLES: normal, fire, water, grass, electric, ice, fighting, poison, ground, flying, psychic, bug, rock, ghost, dragon, dark, steel, fairy`;

export const CREATURE_GENERATION_USER_PROMPT = (
  concept: string,
  tier: 'base' | 'intermediate' | 'final'
): string => {
  const bstRange = {
    base: '300-330',
    intermediate: '400-450',
    final: '500-535',
  }[tier];

  return `Crée une créature basée sur ce concept: "${concept}"
Tier: ${tier} (BST cible: ${bstRange})

Réponds en JSON avec ce format exact:
{
  "name": "NomCréature",
  "types": ["type1", "type2 (optionnel)"],
  "description": "Description courte",
  "baseStats": {
    "hp": number,
    "attack": number,
    "defense": number,
    "specialAttack": number,
    "specialDefense": number,
    "speed": number
  },
  "signature": "Caractéristique unique ou capacité signature"
}`;
};

/**
 * Traduit un type en français
 */
export function translateType(type: CreatureType): string {
  const translations: Record<CreatureType, string> = {
    normal: 'Normal',
    fire: 'Feu',
    water: 'Eau',
    grass: 'Plante',
    electric: 'Électrik',
    ice: 'Glace',
    fighting: 'Combat',
    poison: 'Poison',
    ground: 'Sol',
    flying: 'Vol',
    psychic: 'Psy',
    bug: 'Insecte',
    rock: 'Roche',
    ghost: 'Spectre',
    dragon: 'Dragon',
    dark: 'Ténèbres',
    steel: 'Acier',
    fairy: 'Fée',
  };

  return translations[type] || type;
}
