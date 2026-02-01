import type { MapData } from './testMap';

// Tile types:
// 0 = grass (walkable)
// 1 = wall (collision) - utilisé pour bâtiments
// 2 = path (walkable)
// 3 = tall grass (walkable, encounter zone)
// 4 = water (collision)
// 10 = house_wall (collision, façade maison)
// 11 = lab_wall (collision, façade labo)
// 12 = door_home (walkable, trigger)
// 13 = door_lab (walkable, trigger)

export const townMap: MapData = {
  width: 20,
  height: 15,
  playerStart: { col: 10, row: 8 }, // Devant la maison du joueur
  tiles: [
    // Row 0 - Bordure nord (hautes herbes = route bloquée)
    1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1,
    // Row 1 - Hautes herbes bloquantes
    1, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 1,
    // Row 2 - Zone herbe normale
    1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1,
    // Row 3 - Laboratoire (haut)
    1, 0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1,
    // Row 4 - Laboratoire (milieu)
    1, 0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 2, 0, 1, 1, 1, 1, 0, 0, 1,
    // Row 5 - Laboratoire (bas) avec porte
    1, 0, 1, 1, 13, 1, 1, 0, 2, 0, 0, 2, 0, 1, 1, 1, 1, 0, 0, 1,
    // Row 6 - Chemin devant labo
    1, 0, 0, 2, 2, 2, 0, 0, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1,
    // Row 7 - Maison joueur (haut)
    1, 0, 0, 2, 0, 0, 0, 0, 2, 1, 1, 1, 1, 0, 0, 4, 4, 4, 0, 1,
    // Row 8 - Maison joueur (milieu) avec porte
    1, 0, 0, 2, 0, 0, 0, 0, 2, 1, 12, 1, 1, 0, 0, 4, 4, 4, 0, 1,
    // Row 9 - Chemin principal
    1, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 1,
    // Row 10 - Zone sud
    1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
    // Row 11 - Étang décoratif
    1, 0, 0, 0, 4, 4, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 1,
    // Row 12 - Zone sud
    1, 0, 0, 0, 4, 4, 0, 0, 2, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 1,
    // Row 13 - Sortie sud (vers WorldScene)
    1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1,
    // Row 14 - Bordure sud
    1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
};

// Positions spéciales dans le village
export const TOWN_POSITIONS = {
  playerHome: { col: 10, row: 8 },    // Porte de la maison
  lab: { col: 4, row: 5 },            // Porte du laboratoire
  signTown: { col: 6, row: 9 },       // Panneau du village
  signLab: { col: 2, row: 6 },        // Panneau du labo
  signRoute: { col: 10, row: 1 },     // Panneau route (bloqué)
  southExit: { col: 9, row: 14 },     // Sortie vers WorldScene
};

// Zones de trigger
export const TOWN_TRIGGERS = {
  homeDoor: { col: 10, row: 8, destination: 'HomeScene' },
  labDoor: { col: 4, row: 5, destination: 'StarterSelectScene' },
  routeBlocked: [
    { col: 5, row: 0 }, { col: 6, row: 0 }, { col: 7, row: 0 },
    { col: 8, row: 0 }, { col: 9, row: 0 }, { col: 10, row: 0 },
    { col: 11, row: 0 }, { col: 12, row: 0 }, { col: 13, row: 0 },
    { col: 14, row: 0 },
  ],
  southExit: [
    { col: 7, row: 14 }, { col: 8, row: 14 }, { col: 9, row: 14 },
    { col: 10, row: 14 }, { col: 11, row: 14 },
  ],
};

// Bâtiments (pour le rendu)
export const TOWN_BUILDINGS = {
  playerHome: {
    topLeft: { col: 9, row: 7 },
    width: 4,
    height: 2,
    doorCol: 10,
  },
  laboratory: {
    topLeft: { col: 2, row: 3 },
    width: 5,
    height: 3,
    doorCol: 4,
  },
  otherHouse: {
    topLeft: { col: 13, row: 4 },
    width: 4,
    height: 2,
    doorCol: 14,
  },
};
