import type { MapData } from './testMap';

// Tile types étendus pour l'intro:
// 0 = grass (walkable)
// 1 = wall (collision)
// 2 = path (walkable)
// 3 = tall grass (walkable, encounter zone)
// 4 = water (collision)
// 5 = floor_wood (walkable, intérieur)
// 6 = floor_tile (walkable, labo)
// 7 = stairs (walkable, trigger zone)
// 8 = door (walkable, trigger zone)
// 9 = furniture (collision)

// Map de la maison (2 étages combinés)
// Étage: lignes 0-4, RDC: lignes 5-9
export const homeMap: MapData = {
  width: 8,
  height: 10,
  playerStart: { col: 4, row: 2 }, // Chambre
  tiles: [
    // === ÉTAGE (Chambre) ===
    // Row 0 - Mur nord
    1, 1, 1, 1, 1, 1, 1, 1,
    // Row 1 - Lit et bureau
    1, 9, 9, 5, 5, 9, 9, 1,
    // Row 2 - Zone libre
    1, 5, 5, 5, 5, 5, 5, 1,
    // Row 3 - Zone libre avec escalier
    1, 5, 5, 5, 5, 5, 7, 1,
    // Row 4 - Mur bas étage (séparation visuelle)
    1, 1, 1, 1, 1, 1, 1, 1,
    // === REZ-DE-CHAUSSÉE ===
    // Row 5 - Mur nord RDC avec escalier
    1, 1, 7, 1, 1, 1, 1, 1,
    // Row 6 - Cuisine/salon
    1, 9, 5, 5, 9, 9, 5, 1,
    // Row 7 - Zone libre (mère ici)
    1, 5, 5, 5, 5, 5, 5, 1,
    // Row 8 - Porte de sortie
    1, 5, 5, 8, 8, 5, 5, 1,
    // Row 9 - Mur sud
    1, 1, 1, 1, 1, 1, 1, 1,
  ],
};

// Positions spéciales dans la maison
export const HOME_POSITIONS = {
  bedroom: { col: 4, row: 2 },      // Spawn initial (lit)
  stairsUp: { col: 6, row: 3 },     // Escalier montant (à l'étage)
  stairsDown: { col: 2, row: 5 },   // Escalier descendant (au RDC)
  mom: { col: 4, row: 7 },          // Position de la mère
  door: { col: 3, row: 8 },         // Porte de sortie
  pc: { col: 5, row: 1 },           // PC (bureau)
  bed: { col: 1, row: 1 },          // Lit
};

// Zones de trigger
export const HOME_TRIGGERS = {
  stairsUp: { col: 6, row: 3, destination: 'downstairs' },
  stairsDown: { col: 2, row: 5, destination: 'upstairs' },
  door: [
    { col: 3, row: 8 },
    { col: 4, row: 8 },
  ],
};
