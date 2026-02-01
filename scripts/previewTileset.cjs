/**
 * Extrait TOUS les tiles avec leurs coordonnées pour identification visuelle
 * Usage: node scripts/previewTileset.cjs
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TILE_SIZE = 16;

async function extractAllTiles() {
  const inputPath = path.join(__dirname, '../public/assets/sprites/tiles/TilesetGrass/overworld_tileset_grass.png');
  const outputDir = path.join(__dirname, '../public/assets/sprites/tiles/preview');

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const metadata = await sharp(inputPath).metadata();
  const cols = Math.floor(metadata.width / TILE_SIZE);
  const rows = Math.floor(metadata.height / TILE_SIZE);

  console.log(`Tileset: ${cols}x${rows} tiles (${cols * rows} total)`);
  console.log(`Extracting to ./public/assets/sprites/tiles/preview/\n`);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const filename = `tile_${String(y).padStart(2, '0')}_${String(x).padStart(2, '0')}.png`;

      await sharp(inputPath)
        .extract({
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE
        })
        .resize(32, 32, { kernel: sharp.kernel.nearest })
        .toFile(path.join(outputDir, filename));
    }
    console.log(`Row ${y}: tiles 0-${cols - 1}`);
  }

  console.log(`\n✅ Extracted ${cols * rows} tiles`);
  console.log(`Format: tile_ROW_COL.png (ex: tile_05_03.png = row 5, col 3)`);
}

extractAllTiles();
