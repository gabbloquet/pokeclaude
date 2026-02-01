/**
 * Copie et redimensionne les créatures Retromon pour PokeClaude
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const RETROMON_DIR = path.join(__dirname, '../public/assets/sprites/creatures/Retromon Free Pack/Retromon Free Pack/Update 2/Retromon Freebies');
const SUPER_PACK_DIR = path.join(__dirname, '../public/assets/sprites/creatures/Retromon Free Pack/Retromon Free Pack/Update 2/Super Pack Freebies');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/sprites/creatures');
const OUTPUT_SIZE = 64;

// Mapping: nom PokeClaude → { dir, file }
const CREATURE_MAP = {
  // Ligne Feu
  'flamling': { dir: RETROMON_DIR, file: 'Firehound_Front.png' },
  'flamero': { dir: RETROMON_DIR, file: 'Firehound_Front_02.png' },
  'flamaster': { dir: RETROMON_DIR, file: 'Firefox_Front_02.png' },  // Firefox = Feu/Vol

  // Ligne Eau
  'aqualing': { dir: RETROMON_DIR, file: 'Turtle_Front.png' },
  'aquaro': { dir: RETROMON_DIR, file: 'Turtle_Front_02.png' },
  'aquaster': { dir: SUPER_PACK_DIR, file: 'Fish_Front_02.png' },  // Fish = Eau pure

  // Ligne Plante
  'leafling': { dir: RETROMON_DIR, file: '1_Cactus_Front.png' },
  'leafero': { dir: RETROMON_DIR, file: 'Cactus_Front_02.png' },
  'leafaster': { dir: SUPER_PACK_DIR, file: 'Eel_Front_02.png' },  // Eel = Plante/Poison vibe

  // Ligne Électrik
  'sparkit': { dir: RETROMON_DIR, file: 'Ghost_Front.png' },
  'sparkolt': { dir: RETROMON_DIR, file: 'Ghost_Front_02.png' },
};

async function setupCreatures() {
  console.log('Setting up creature sprites...\n');

  for (const [name, source] of Object.entries(CREATURE_MAP)) {
    const sourcePath = path.join(source.dir, source.file);
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`);

    if (!fs.existsSync(sourcePath)) {
      console.log(`  ⚠ Missing: ${source.file}`);
      continue;
    }

    await sharp(sourcePath)
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, {
        kernel: sharp.kernel.nearest,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(outputPath);

    console.log(`  ✓ ${name}.png`);
  }

  console.log(`\n✅ ${Object.keys(CREATURE_MAP).length} creatures setup!`);
}

setupCreatures().catch(console.error);
