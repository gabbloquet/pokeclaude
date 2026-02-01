/**
 * Descriptions de fallback pour les créatures
 * Utilisées quand l'IA n'est pas disponible
 */

import type { CreatureType } from '@/types/creature.types';

/**
 * Descriptions par défaut par espèce ID
 */
export const speciesDescriptions: Record<number, string> = {
  1: 'Une petite créature dont la flamme sur la queue indique sa vitalité. Il adore les endroits chauds.',
  2: 'Sa flamme brûle plus intensément lorsqu\'il est en colère. Il peut projeter des boules de feu.',
  3: 'Ses ailes puissantes lui permettent de voler à haute altitude. Sa flamme peut faire fondre la roche.',
  4: 'Sa carapace devient brillante après une averse. Il aime nager dans les eaux claires.',
  5: 'Ses oreilles détectent les courants sous-marins. Il peut rester sous l\'eau pendant des heures.',
  6: 'Les canons sur sa carapace peuvent projeter de l\'eau avec une force incroyable.',
  7: 'La graine sur son dos grandit en absorbant les rayons du soleil. Il fait souvent la sieste.',
  8: 'Le bourgeon sur son dos fleurit quand il absorbe assez de nutriments. Une douce odeur s\'en dégage.',
  9: 'La fleur sur son dos peut projeter un pollen soporifique. Son parfum apaise les créatures nerveuses.',
  10: 'Ses joues stockent de l\'électricité. Quand il est content, des étincelles en jaillissent.',
  11: 'Il peut générer assez d\'électricité pour alimenter une ville. Son pelage crépite d\'énergie.',
};

/**
 * Templates de descriptions par type
 * Utilisés pour générer des descriptions si l'espèce n'a pas de description
 */
export const typeDescriptionTemplates: Record<CreatureType, string[]> = {
  fire: [
    'Sa température corporelle élevée le rend chaud au toucher.',
    'Des flammes dansent sur son corps quand il est excité.',
    'Il préfère les climats chauds et secs.',
  ],
  water: [
    'Il se déplace avec grâce dans l\'eau.',
    'Ses écailles brillent magnifiquement au soleil.',
    'Il peut respirer aussi bien dans l\'eau que sur terre.',
  ],
  grass: [
    'Il absorbe la lumière du soleil pour se nourrir.',
    'Un doux parfum floral émane de son corps.',
    'Les plantes poussent plus vite en sa présence.',
  ],
  electric: [
    'Son corps génère constamment de l\'électricité statique.',
    'Des étincelles jaillissent quand il court.',
    'Il peut illuminer les endroits sombres avec son énergie.',
  ],
  normal: [
    'Une créature commune mais attachante.',
    'On le trouve dans de nombreux environnements.',
    'Facile à dresser et très loyal.',
  ],
  ice: [
    'Son souffle peut geler l\'eau instantanément.',
    'Il préfère les régions froides et enneigées.',
    'Des cristaux de glace ornent son corps.',
  ],
  fighting: [
    'Il s\'entraîne constamment pour devenir plus fort.',
    'Ses muscles puissants lui donnent une force remarquable.',
    'Il respecte les adversaires qui font preuve de courage.',
  ],
  poison: [
    'Son corps produit des toxines puissantes.',
    'Il faut le manipuler avec précaution.',
    'Étrangement, ses toxines peuvent servir de remèdes.',
  ],
  ground: [
    'Il peut creuser des tunnels à grande vitesse.',
    'Il est plus à l\'aise sous terre qu\'en surface.',
    'Il peut détecter les vibrations dans le sol.',
  ],
  flying: [
    'Ses ailes puissantes lui permettent de voler haut.',
    'Il aime planer sur les courants d\'air chaud.',
    'On peut souvent le voir survoler les montagnes.',
  ],
  psychic: [
    'Son esprit possède des pouvoirs mystérieux.',
    'Il peut sentir les émotions des êtres autour de lui.',
    'Ses yeux semblent voir au-delà du visible.',
  ],
  bug: [
    'Malgré sa petite taille, il est étonnamment résilient.',
    'Il vit en harmonie avec la nature.',
    'Ses antennes captent des signaux imperceptibles.',
  ],
  rock: [
    'Son corps est aussi dur que la pierre.',
    'Il peut rester immobile pendant des jours.',
    'Les attaques physiques ne lui font presque rien.',
  ],
  ghost: [
    'Il apparaît souvent au crépuscule.',
    'Sa nature mystérieuse intrigue les chercheurs.',
    'On dit qu\'il peut traverser les murs.',
  ],
  dragon: [
    'Une aura de puissance émane de lui.',
    'Les légendes parlent de sa lignée ancienne.',
    'Seuls les dresseurs expérimentés peuvent l\'apprivoiser.',
  ],
  dark: [
    'Il préfère agir dans l\'ombre.',
    'Son regard perçant semble lire dans les pensées.',
    'Il est rusé et difficile à prévoir.',
  ],
  steel: [
    'Son corps métallique reflète la lumière.',
    'Il est pratiquement insensible aux poisons.',
    'Sa défense est quasiment impénétrable.',
  ],
  fairy: [
    'Une aura de magie l\'entoure.',
    'Il apporte chance et bonheur à qui le croise.',
    'Ses pouvoirs défient toute explication.',
  ],
};

/**
 * Génère une description de fallback pour une créature
 */
export function getFallbackDescription(
  speciesId: number,
  name: string,
  types: CreatureType[]
): string {
  // Vérifier si une description spécifique existe
  if (speciesDescriptions[speciesId]) {
    return speciesDescriptions[speciesId];
  }

  // Sinon, utiliser un template basé sur le type principal
  const primaryType = types[0];
  const templates = typeDescriptionTemplates[primaryType] || typeDescriptionTemplates.normal;
  const template = templates[Math.floor(Math.random() * templates.length)];

  return `${name}: ${template}`;
}
