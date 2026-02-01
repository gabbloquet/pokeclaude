/**
 * Extrait les tiles essentiels du TilesetGrass (16x16 → 32x32)
 * Coordonnées identifiées visuellement via previewTileset.cjs
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TILE_SIZE_SOURCE = 16;
const TILE_SIZE_OUTPUT = 32;

// Format: { name: { row, col } } - coordonnées tile_ROW_COL
const TILES = {
  // Terrain de base
  grass: { row: 0, col: 0 },           // Herbe simple
  grass_detail: { row: 0, col: 4 },    // Herbe avec détails
  grass_flowers_blue: { row: 1, col: 1 }, // Herbe + fleurs bleues
  grass_flowers_yellow: { row: 3, col: 1 }, // Herbe + fleurs jaunes

  // Hautes herbes (forêt dense = zone de rencontres)
  tallGrass: { row: 5, col: 6 },       // Forêt dense
  tallGrass_var: { row: 5, col: 8 },   // Variante forêt

  // Chemins
  path: { row: 1, col: 4 },            // Chemin principal
  path_corner: { row: 2, col: 5 },     // Coin chemin

  // Eau
  water: { row: 5, col: 1 },           // Eau profonde
  water_edge: { row: 4, col: 1 },      // Bord eau/herbe

  // Obstacles (murs/arbres)
  wall: { row: 8, col: 6 },            // Falaise/mur
  wall_top: { row: 7, col: 6 },        // Haut de falaise
  rock: { row: 9, col: 7 },            // Rocher
};

async function extractTiles() {
  const inputPath = path.join(__dirname, '../public/assets/sprites/tiles/TilesetGrass/overworld_tileset_grass.png');
  const outputDir = path.join(__dirname, '../public/assets/sprites/tiles/new');

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('Extracting tiles...\n');

  for (const [name, coords] of Object.entries(TILES)) {
    const left = coords.col * TILE_SIZE_SOURCE;
    const top = coords.row * TILE_SIZE_SOURCE;

    await sharp(inputPath)
      .extract({ left, top, width: TILE_SIZE_SOURCE, height: TILE_SIZE_SOURCE })
      .resize(TILE_SIZE_OUTPUT, TILE_SIZE_OUTPUT, { kernel: sharp.kernel.nearest })
      .toFile(path.join(outputDir, `${name}.png`));

    console.log(`  ✓ ${name}.png (row ${coords.row}, col ${coords.col})`);
  }

  console.log(`\n✅ ${Object.keys(TILES).length} tiles → ./public/assets/sprites/tiles/new/`);
}

extractTiles();
