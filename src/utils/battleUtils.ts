import type {
  BattleCreature,
  CreatureInstance,
  Move,
  BaseStats,
} from '@/types/creature.types';
import { getSpecies } from '@/data/creatures/species';
import { getTypeEffectiveness } from '@/data/types/typeChart';
import { calculateAllStats } from './creatureUtils';
import { getBurnAttackModifier, getParalysisSpeedModifier } from '@/systems/battle/StatusSystem';

export function createBattleCreature(instance: CreatureInstance): BattleCreature {
  const species = getSpecies(instance.speciesId);
  if (!species) {
    throw new Error(`Species with ID ${instance.speciesId} not found`);
  }

  return {
    instance,
    species,
    currentHp: instance.currentHp,
    statModifiers: {
      hp: 0,
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
    },
    battleStatModifiers: {
      accuracy: 0,
      evasion: 0,
    },
    isConfused: false,
    isFlinched: false,
    turnsInBattle: 0,
  };
}

export function getModifiedStat(
  creature: BattleCreature,
  stat: keyof BaseStats
): number {
  const baseStats = calculateAllStats(
    creature.species,
    creature.instance.level,
    creature.instance.ivs,
    creature.instance.evs
  );

  const baseStat = baseStats[stat];
  const modifier = creature.statModifiers[stat];

  // Stat stage multipliers: -6 to +6
  const multipliers = [2 / 8, 2 / 7, 2 / 6, 2 / 5, 2 / 4, 2 / 3, 2 / 2, 3 / 2, 4 / 2, 5 / 2, 6 / 2, 7 / 2, 8 / 2];
  const multiplierIndex = Math.max(0, Math.min(12, modifier + 6));

  return Math.floor(baseStat * multipliers[multiplierIndex]);
}

/**
 * Liste des attaques à haut taux critique
 * Ces attaques ont un multiplicateur x8 sur le taux critique
 */
const HIGH_CRIT_MOVES = [
  'Tranche',
  'Pince-Masse',
  "Tranch'Herbe",
  'Coupe Psycho',
  "Coup d'Boule",
  'Aéropique',
  'Coup Bas',
  'Tranche Nuit',
  'Lame de Roc',
  'Cross Poison',
];

/**
 * Calcule le taux critique d'une attaque selon la formule Gen 1
 *
 * Formule de base : base_speed / 2 (cappé à 255) / 256
 * Pour les attaques à haut taux critique : multiplicateur x8
 *
 * @param attacker La créature attaquante
 * @param move L'attaque utilisée
 * @returns La probabilité de coup critique (entre 0 et 1)
 */
export function calculateCriticalRate(attacker: BattleCreature, move: Move): number {
  // Récupère la vitesse de base de l'espèce
  const baseSpeed = attacker.species.baseStats.speed;

  // Formule Gen 1 : base_speed / 2, cappé à 255
  let critThreshold = Math.min(255, Math.floor(baseSpeed / 2));

  // Multiplicateur x8 pour les attaques à haut taux critique
  if (HIGH_CRIT_MOVES.includes(move.name)) {
    critThreshold = Math.min(255, critThreshold * 8);
  }

  // Probabilité = threshold / 256
  return critThreshold / 256;
}

/**
 * Calcule les dégâts d'une attaque
 *
 * Intègre :
 * - Taux critique basé sur la vitesse (Gen 1)
 * - Multiplicateur critique x2
 * - Malus d'attaque physique de -50% si brûlé
 * - STAB et efficacité de type
 */
export function calculateDamage(
  attacker: BattleCreature,
  defender: BattleCreature,
  move: Move
): { damage: number; isCritical: boolean; effectiveness: number } {
  if (move.category === 'status' || move.power === null) {
    return { damage: 0, isCritical: false, effectiveness: 1 };
  }

  const level = attacker.instance.level;

  // Attack and defense based on move category
  let attackStat =
    move.category === 'physical'
      ? getModifiedStat(attacker, 'attack')
      : getModifiedStat(attacker, 'specialAttack');

  const defenseStat =
    move.category === 'physical'
      ? getModifiedStat(defender, 'defense')
      : getModifiedStat(defender, 'specialDefense');

  // Malus de brûlure sur les attaques physiques (-50%)
  if (move.category === 'physical') {
    attackStat = Math.floor(attackStat * getBurnAttackModifier(attacker));
  }

  // Base damage calculation
  const baseDamage =
    Math.floor(((2 * level) / 5 + 2) * move.power * (attackStat / defenseStat)) / 50 + 2;

  // Critical hit calculation using Gen 1 formula
  const critRate = calculateCriticalRate(attacker, move);
  const isCritical = Math.random() < critRate;

  // Multiplicateur critique : x2 (au lieu de x1.5)
  const criticalMultiplier = isCritical ? 2 : 1;

  // Random factor (85-100%)
  const randomFactor = (Math.floor(Math.random() * 16) + 85) / 100;

  // STAB (Same Type Attack Bonus)
  const stab = attacker.species.types.includes(move.type) ? 1.5 : 1;

  // Type effectiveness
  const effectiveness = getTypeEffectiveness(move.type, defender.species.types);

  // Final damage
  const finalDamage = Math.max(
    1,
    Math.floor(baseDamage * criticalMultiplier * randomFactor * stab * effectiveness)
  );

  return { damage: finalDamage, isCritical, effectiveness };
}

/**
 * Multiplicateurs pour les stages de précision/esquive (-6 à +6)
 * Stage 0 = 3/3 (100%)
 * Stage +1 = 4/3, +2 = 5/3, etc.
 * Stage -1 = 3/4, -2 = 3/5, etc.
 */
const ACCURACY_EVASION_MULTIPLIERS: Record<string, number> = {
  '-6': 3 / 9,  // 33%
  '-5': 3 / 8,  // 37.5%
  '-4': 3 / 7,  // 43%
  '-3': 3 / 6,  // 50%
  '-2': 3 / 5,  // 60%
  '-1': 3 / 4,  // 75%
  '0': 3 / 3,   // 100%
  '1': 4 / 3,   // 133%
  '2': 5 / 3,   // 167%
  '3': 6 / 3,   // 200%
  '4': 7 / 3,   // 233%
  '5': 8 / 3,   // 267%
  '6': 9 / 3,   // 300%
};

/**
 * Récupère le multiplicateur pour un stage de précision ou d'esquive
 */
export function getAccuracyEvasionMultiplier(stage: number): number {
  const clampedStage = Math.max(-6, Math.min(6, stage));
  return ACCURACY_EVASION_MULTIPLIERS[clampedStage.toString()] ?? 1;
}

/**
 * Vérifie si une attaque touche sa cible
 *
 * Formule : finalAccuracy = moveAccuracy * (accMultiplier / evaMultiplier)
 *
 * @param move L'attaque utilisée
 * @param attacker La créature attaquante (pour le stage de précision)
 * @param defender La créature défenseur (pour le stage d'esquive)
 * @returns true si l'attaque touche, false sinon
 */
export function checkAccuracy(
  move: Move,
  attacker?: BattleCreature,
  defender?: BattleCreature
): boolean {
  // Attaques qui ne ratent jamais (accuracy = 0 ou très spéciales)
  if (move.accuracy === 0) {
    return true;
  }

  let finalAccuracy = move.accuracy;

  // Si on a les informations de combat, appliquer les modificateurs
  if (attacker && defender) {
    const accStage = attacker.battleStatModifiers?.accuracy ?? 0;
    const evaStage = defender.battleStatModifiers?.evasion ?? 0;

    const accMultiplier = getAccuracyEvasionMultiplier(accStage);
    const evaMultiplier = getAccuracyEvasionMultiplier(evaStage);

    // Formule : accuracy = move.accuracy * (accMultiplier / evaMultiplier)
    finalAccuracy = move.accuracy * (accMultiplier / evaMultiplier);
  }

  // Cap à 100%
  finalAccuracy = Math.min(100, finalAccuracy);

  return Math.random() * 100 < finalAccuracy;
}

/**
 * Applique un changement au stage de précision ou d'esquive
 */
export function applyBattleStatChange(
  creature: BattleCreature,
  stat: 'accuracy' | 'evasion',
  change: number
): { success: boolean; message: string } {
  const currentMod = creature.battleStatModifiers[stat];
  const newMod = Math.max(-6, Math.min(6, currentMod + change));

  if (newMod === currentMod) {
    if (change > 0) {
      return {
        success: false,
        message: `${creature.species.name} ne peut plus augmenter sa ${stat === 'accuracy' ? 'Précision' : 'Esquive'} !`,
      };
    } else {
      return {
        success: false,
        message: `${creature.species.name} ne peut plus baisser sa ${stat === 'accuracy' ? 'Précision' : 'Esquive'} !`,
      };
    }
  }

  creature.battleStatModifiers[stat] = newMod;

  const changeDesc = change > 0 ? 'augmente' : 'diminue';
  const intensity = Math.abs(change) > 1 ? ' fortement' : '';
  const statName = stat === 'accuracy' ? 'Précision' : 'Esquive';

  return {
    success: true,
    message: `${creature.species.name} : ${statName} ${changeDesc}${intensity} !`,
  };
}

/**
 * Détermine quelle créature attaque en premier
 *
 * Ordre de priorité :
 * 1. Priorité de l'attaque
 * 2. Vitesse effective (avec modificateurs de statut comme paralysie)
 * 3. Aléatoire si égalité
 */
export function determineFirstAttacker(
  creature1: BattleCreature,
  move1: Move,
  creature2: BattleCreature,
  move2: Move
): 'creature1' | 'creature2' {
  // Priority comparison first
  if (move1.priority !== move2.priority) {
    return move1.priority > move2.priority ? 'creature1' : 'creature2';
  }

  // Speed comparison (avec modificateur de paralysie)
  let speed1 = getModifiedStat(creature1, 'speed');
  let speed2 = getModifiedStat(creature2, 'speed');

  // Appliquer le modificateur de paralysie (-50% vitesse)
  speed1 = Math.floor(speed1 * getParalysisSpeedModifier(creature1));
  speed2 = Math.floor(speed2 * getParalysisSpeedModifier(creature2));

  if (speed1 !== speed2) {
    return speed1 > speed2 ? 'creature1' : 'creature2';
  }

  // Random if tied
  return Math.random() < 0.5 ? 'creature1' : 'creature2';
}

export function getEffectivenessMessage(effectiveness: number): string {
  if (effectiveness === 0) return 'Ça n\'a aucun effet...';
  if (effectiveness < 1) return 'Ce n\'est pas très efficace...';
  if (effectiveness > 1) return 'C\'est super efficace !';
  return '';
}

export function applyStatChange(
  creature: BattleCreature,
  stat: keyof BaseStats,
  change: number
): { success: boolean; message: string } {
  const currentMod = creature.statModifiers[stat];
  const newMod = Math.max(-6, Math.min(6, currentMod + change));

  if (newMod === currentMod) {
    if (change > 0) {
      return { success: false, message: `${creature.species.name} ne peut plus augmenter son ${getStatName(stat)} !` };
    } else {
      return { success: false, message: `${creature.species.name} ne peut plus baisser son ${getStatName(stat)} !` };
    }
  }

  creature.statModifiers[stat] = newMod;

  const changeDesc = change > 0 ? 'augmente' : 'diminue';
  const intensity = Math.abs(change) > 1 ? ' fortement' : '';
  return {
    success: true,
    message: `${creature.species.name} : ${getStatName(stat)} ${changeDesc}${intensity} !`,
  };
}

function getStatName(stat: keyof BaseStats): string {
  const names: Record<keyof BaseStats, string> = {
    hp: 'PV',
    attack: 'Attaque',
    defense: 'Défense',
    specialAttack: 'Attaque Spé.',
    specialDefense: 'Défense Spé.',
    speed: 'Vitesse',
  };
  return names[stat];
}
