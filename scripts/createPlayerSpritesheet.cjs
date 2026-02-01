/**
 * Combine les frames du joueur en spritesheet 4x4 (4 directions x 4 frames)
 * Ordre: down, left, right, up (comme le code actuel)
 */

const sharp = require('sharp');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../public/assets/sprites/player/Top down character template by RgsDev/Character without weapon');
const OUTPUT = path.join(__dirname, '../public/assets/sprites/player/player_new.png');

const FRAME_SIZE = 64; // Source size
const OUTPUT_SIZE = 32; // Target size per frame

// 4 directions x 4 frames = 16 frames total
const DIRECTIONS = ['down', 'left', 'right', 'up'];

async function createSpritesheet() {
  const composites = [];

  for (let dirIndex = 0; dirIndex < DIRECTIONS.length; dirIndex++) {
    const dir = DIRECTIONS[dirIndex];

    for (let frame = 1; frame <= 4; frame++) {
      // Try idle frames (walk has same structure)
      const filePath = path.join(INPUT_DIR, 'idle', `idle ${dir}${frame}.png`);

      const resizedFrame = await sharp(filePath)
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { kernel: sharp.kernel.nearest })
        .toBuffer();

      composites.push({
        input: resizedFrame,
        left: (frame - 1) * OUTPUT_SIZE,
        top: dirIndex * OUTPUT_SIZE
      });
    }
  }

  // Create 128x128 canvas (4x4 grid of 32x32)
  await sharp({
    create: {
      width: 4 * OUTPUT_SIZE,
      height: 4 * OUTPUT_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .toFile(OUTPUT);

  console.log(`✅ Created spritesheet: ${OUTPUT}`);
  console.log(`   Size: ${4 * OUTPUT_SIZE}x${4 * OUTPUT_SIZE} (4x4 grid of ${OUTPUT_SIZE}x${OUTPUT_SIZE})`);
}

createSpritesheet().catch(console.error);
