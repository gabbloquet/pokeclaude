// Constantes locales pour éviter dépendance circulaire avec game.config
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Couleurs de l'intro
export const INTRO_COLORS = {
  background: 0x1a1a2e,
  backgroundGradient: 0x16213e,
  textBox: 0xf8f8f8,
  textBoxBorder: 0x333333,
  text: '#000000',
  highlight: 0xffcc00,
  menuBg: 0xffffff,
  menuBorder: 0x333333,
  selected: 0x3498db,
  keyboard: {
    bg: 0xf0f0f0,
    key: 0xffffff,
    keyBorder: 0x333333,
    keySelected: 0xffcc00,
    keyHover: 0xe0e0e0,
  },
};

// Positions UI
export const INTRO_UI = {
  textBox: {
    x: 50,
    y: GAME_HEIGHT - 150,
    width: GAME_WIDTH - 100,
    height: 120,
  },
  professor: {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2 - 80,
    scale: 3,
  },
  creature: {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2 + 20,
    scale: 2,
  },
  nameInput: {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2 - 50,
    maxLength: 10,
    minLength: 1,
  },
  keyboard: {
    x: GAME_WIDTH / 2 - 175,
    y: GAME_HEIGHT / 2 - 20,
    keySize: 40,
    keySpacing: 5,
    columns: 10,
  },
  starterSelect: {
    ballSpacing: 120,
    ballY: GAME_HEIGHT / 2 - 40,
    previewY: GAME_HEIGHT / 2 + 80,
  },
};

// Timings des animations (en ms)
export const INTRO_TIMINGS = {
  fadeIn: 1000,
  fadeOut: 800,
  professorAppear: 500,
  creatureAppear: 600,
  textSpeed: 30,
  transitionDelay: 500,
  ballBounce: 200,
  starterReveal: 400,
};

// Starters disponibles
export const STARTER_OPTIONS = [
  {
    speciesId: 1,
    name: 'Flamling',
    type: 'fire',
    description: 'Ardent et courageux',
    position: 'left',
  },
  {
    speciesId: 4,
    name: 'Aqualing',
    type: 'water',
    description: 'Calme et réfléchi',
    position: 'center',
  },
  {
    speciesId: 7,
    name: 'Leafling',
    type: 'grass',
    description: 'Doux et persévérant',
    position: 'right',
  },
];

// Caractères du clavier virtuel
export const KEYBOARD_CHARS = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z', ' ', '-', '.', '\''],
  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
  ['k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't'],
  ['u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3'],
  ['4', '5', '6', '7', '8', '9', 'DEL', 'DEL', 'OK', 'OK'],
];

// Types de tiles pour les maps d'intro
export const INTRO_TILES = {
  GRASS: 0,
  WALL: 1,
  PATH: 2,
  TALL_GRASS: 3,
  WATER: 4,
  FLOOR_WOOD: 5,
  FLOOR_TILE: 6,
  STAIRS_UP: 7,
  STAIRS_DOWN: 8,
  DOOR: 9,
  DOOR_MAT: 10,
};

// Positions de spawn
export const SPAWN_POSITIONS = {
  home: {
    bedroom: { col: 4, row: 2 },
    downstairs: { col: 4, row: 6 },
  },
  town: {
    fromHome: { col: 10, row: 8 },
    fromLab: { col: 5, row: 6 },
  },
};
