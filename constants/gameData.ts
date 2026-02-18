// =============================================================================
// EcoHero: Flood Fighters — Game Data
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MiniGameType = 'quiz' | 'flood-defense' | 'eco-builder' | 'sorting' | 'insulation-game' | 'windows-game' | 'roof-garden-game' | 'build-home';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FloodDefenseItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  effectiveness: number; // 1-3
}

export interface EcoBuilderItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  greenPoints: number;
  /** How many degrees (°C) this item drops the house temperature. */
  tempEffect: number;
  category: 'insulation' | 'energy' | 'water' | 'nature';
}

export interface SortingItem {
  id: string;
  name: string;
  emoji: string;
  correctBin: 'recycle' | 'compost' | 'landfill';
}

// ---------------------------------------------------------------------------
// Insulation Game Types
// ---------------------------------------------------------------------------

export type InsulationZoneId = 'roof' | 'right-wall' | 'right-window';

export interface InsulationMaterial {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tempEffect: number; // degrees of cooling when applied
  points: number;
  applicableTo: InsulationZoneId[];
}

export interface InsulationLevelConfig {
  activeZones: InsulationZoneId[];
  availableMaterials: string[]; // material IDs
  startTemp: number;
  targetTemp: number;
  timeLimit?: number; // seconds (optional)
}

export interface Level {
  id: string;
  worldId: string;
  order: number;
  title: string;
  type: MiniGameType;
  description: string;
  difficulty: 1 | 2 | 3;
  starsRequired: number; // stars needed from previous levels to unlock
  fact: string; // educational fact shown after completion
}

export interface World {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  gradientEnd: string;
  description: string;
  starsToUnlock: number; // total stars needed to unlock this world
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  condition: string; // human-readable condition
}

// ---------------------------------------------------------------------------
// Worlds
// ---------------------------------------------------------------------------

export const WORLDS: World[] = [
  {
    id: 'w1',
    order: 1,
    title: 'Insulation',
    subtitle: 'Keep the Heat Out',
    emoji: '\u{1F3E0}', // 🏠
    color: '#E65100',
    gradientEnd: '#FF8A65',
    description:
      'The sun is scorching! Learn how insulation keeps buildings cool by blocking heat rays from entering through roofs, walls, and windows.',
    starsToUnlock: 0,
  },
  {
    id: 'w5',
    order: 2,
    title: 'Windows',
    subtitle: 'Layered Glass Cooling',
    emoji: '\u{1FA9F}', // 🪟
    color: '#00838F',
    gradientEnd: '#4DD0E1',
    description:
      'Compare single, double, and triple-layer windows. See how each layer blocks more heat rays and keeps families cooler.',
    starsToUnlock: 6,
  },
  {
    id: 'w8',
    order: 3,
    title: 'Roof Garden',
    subtitle: 'Plants on the Roof',
    emoji: '\u{1F33B}', // 🌻
    color: '#2E7D32',
    gradientEnd: '#66BB6A',
    description:
      'Green roofs keep buildings cooler and help nature. Drag plants onto the roof to create your roof garden.',
    starsToUnlock: 6,
  },
  {
    id: 'w7',
    order: 4,
    title: 'Build your home',
    subtitle: 'Explore in 3D',
    emoji: '\u{1F3D7}', // 🏗
    color: '#5D4037',
    gradientEnd: '#8D6E63',
    description:
      'Walk around in a 3D world. Use the joystick to move your character and explore your home.',
    starsToUnlock: 12,
  },
];

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export const LEVELS: Level[] = [
  // ---- World 1: Insulation (3 levels: learn, Roof, Walls) ----
  {
    id: 'w1-l0',
    worldId: 'w1',
    order: 1,
    title: 'What is Insulation?',
    type: 'insulation-game',
    description: 'Learn what insulation is and how it keeps buildings cool.',
    difficulty: 1,
    starsRequired: 0,
    fact: 'Insulation acts as a barrier against heat. In hot weather it keeps heat out; in cold weather it keeps warmth in.',
  },
  {
    id: 'w1-l1',
    worldId: 'w1',
    order: 2,
    title: 'Roof',
    type: 'insulation-game',
    description: 'The sun is heating the roof! Add insulation to block the heat rays.',
    difficulty: 1,
    starsRequired: 0,
    fact: 'Up to 25% of a home\u2019s heat is gained through an uninsulated roof. Roof insulation is the single most effective upgrade!',
  },
  {
    id: 'w1-l2',
    worldId: 'w1',
    order: 3,
    title: 'Walls',
    type: 'insulation-game',
    description: 'Sun rays are blasting through the walls! Insulate the right side to keep cool.',
    difficulty: 1,
    starsRequired: 1,
    fact: 'Uninsulated walls can let in 35% of unwanted heat during summer, making rooms uncomfortable.',
  },

  // ---- World 5: Windows (2 levels: learn then practice) ----
  {
    id: 'w5-l1',
    worldId: 'w5',
    order: 1,
    title: 'What Are Window Layers?',
    type: 'windows-game',
    description: 'Learn what window layers mean and how they block heat.',
    difficulty: 1,
    starsRequired: 0,
    fact: 'Double and triple glazing reduce heat transfer significantly, keeping indoor temperatures more comfortable.',
  },
  {
    id: 'w5-l2',
    worldId: 'w5',
    order: 2,
    title: 'Add the Right Window',
    type: 'windows-game',
    description: 'Choose the best window to keep everyone cool.',
    difficulty: 1,
    starsRequired: 0,
    fact: 'Triple-layer windows block the most heat and keep families comfortable on hot days.',
  },

  // ---- World 7: Build your home ----
  {
    id: 'w7-l1',
    worldId: 'w7',
    order: 1,
    title: 'Explore Your Home',
    type: 'build-home',
    description: 'Move around with the joystick and explore the 3D world.',
    difficulty: 1,
    starsRequired: 0,
    fact: 'Exploring your space helps you understand how to make it more climate-friendly.',
  },

  // ---- World 8: Roof Garden (1 level) ----
  {
    id: 'w8-l1',
    worldId: 'w8',
    order: 1,
    title: 'Plants on the Roof',
    type: 'roof-garden-game',
    description: 'Drag plants to the roof to create a green roof and keep the house cool.',
    difficulty: 1,
    starsRequired: 0,
    fact: 'Green roofs absorb heat, reduce stormwater runoff, and provide habitat for wildlife.',
  },
];

// ---------------------------------------------------------------------------
// Quiz Questions — grouped by level
// ---------------------------------------------------------------------------

export const QUIZ_QUESTIONS: Record<string, QuizQuestion[]> = {
  'w2-l1': [
    {
      id: 'q1',
      question: 'What does insulation do in a building?',
      options: [
        'Makes it look nicer',
        'Keeps heat in during winter and out during summer',
        'Makes it taller',
        'Adds more rooms',
      ],
      correctIndex: 1,
      explanation: 'Insulation acts as a barrier, reducing heat transfer to keep buildings comfortable.',
    },
    {
      id: 'q2',
      question: 'Where is the most heat lost in an uninsulated house?',
      options: ['Windows', 'The roof', 'The floor', 'The front door'],
      correctIndex: 1,
      explanation: 'Up to 25% of heat is lost through an uninsulated roof, as hot air rises.',
    },
    {
      id: 'q3',
      question: 'Which is a natural insulation material?',
      options: ['Plastic bags', 'Sheep wool', 'Aluminium foil', 'Glass'],
      correctIndex: 1,
      explanation: 'Sheep wool is an excellent natural insulator, sustainable and effective.',
    },
    {
      id: 'q4',
      question: 'How does better insulation help fight climate change?',
      options: [
        'It doesn\'t help',
        'Less energy is needed for heating/cooling, reducing CO\u2082 emissions',
        'It makes buildings waterproof',
        'It creates more electricity',
      ],
      correctIndex: 1,
      explanation: 'Better insulation = less energy for heating/cooling = fewer greenhouse gas emissions.',
    },
  ],
  'w2-l4': [
    {
      id: 'q1',
      question: 'Which material is most resistant to flood damage?',
      options: ['Carpet', 'Ceramic tile', 'Cardboard', 'Untreated wood'],
      correctIndex: 1,
      explanation: 'Ceramic tile resists water damage and can be easily cleaned after a flood.',
    },
    {
      id: 'q2',
      question: 'What is a "permeable" surface?',
      options: [
        'A surface that blocks all water',
        'A surface that allows water to pass through',
        'A surface that is always wet',
        'A painted surface',
      ],
      correctIndex: 1,
      explanation: 'Permeable surfaces let water soak into the ground, reducing surface flooding.',
    },
    {
      id: 'q3',
      question: 'Why are raised buildings better in flood-prone areas?',
      options: [
        'They look taller',
        'Water flows underneath without entering the home',
        'They use less paint',
        'They are cheaper',
      ],
      correctIndex: 1,
      explanation: 'Raising a building allows floodwater to pass beneath it, protecting the interior.',
    },
  ],
  'w3-l2': [
    {
      id: 'q1',
      question: 'What is a "carbon footprint"?',
      options: [
        'A footprint made of charcoal',
        'The total CO\u2082 emissions caused by a person or activity',
        'A type of shoe',
        'A plant species',
      ],
      correctIndex: 1,
      explanation: 'Your carbon footprint measures the greenhouse gases produced by your daily activities.',
    },
    {
      id: 'q2',
      question: 'Which activity has the biggest carbon footprint?',
      options: [
        'Walking to school',
        'Eating local vegetables',
        'Flying in an aeroplane',
        'Reading a book',
      ],
      correctIndex: 2,
      explanation: 'Air travel produces a large amount of CO\u2082 per passenger per kilometre.',
    },
    {
      id: 'q3',
      question: 'How can you reduce your carbon footprint?',
      options: [
        'Use more plastic bags',
        'Walk, cycle, or use public transport',
        'Leave all lights on',
        'Throw away food',
      ],
      correctIndex: 1,
      explanation: 'Choosing low-carbon transport is one of the best ways to reduce emissions.',
    },
    {
      id: 'q4',
      question: 'What are greenhouse gases?',
      options: [
        'Gases found only in greenhouses',
        'Gases that trap heat in Earth\'s atmosphere',
        'Gases that make plants grow',
        'Gases from green paint',
      ],
      correctIndex: 1,
      explanation: 'Greenhouse gases (like CO\u2082 and methane) trap heat, warming our planet.',
    },
  ],
  'w3-l4': [
    {
      id: 'q1',
      question: 'Which uses the least energy?',
      options: [
        'LED light bulb',
        'Incandescent light bulb',
        'Halogen light bulb',
        'Leaving lights on all day',
      ],
      correctIndex: 0,
      explanation: 'LEDs use up to 80% less energy than traditional incandescent bulbs.',
    },
    {
      id: 'q2',
      question: 'What is renewable energy?',
      options: [
        'Energy from fossil fuels',
        'Energy from sources that won\'t run out (sun, wind, water)',
        'Energy that is very expensive',
        'Energy that only works at night',
      ],
      correctIndex: 1,
      explanation: 'Renewable energy comes from naturally replenishing sources like solar, wind, and hydro.',
    },
    {
      id: 'q3',
      question: 'How can you save energy at home?',
      options: [
        'Open windows with heating on',
        'Turn off devices when not in use',
        'Leave the fridge door open',
        'Run appliances when empty',
      ],
      correctIndex: 1,
      explanation: 'Turning off electronics when not in use prevents wasted "standby" energy.',
    },
  ],
  'w4-l1': [
    {
      id: 'q1',
      question: 'What should a community flood plan include?',
      options: [
        'A list of favourite foods',
        'Evacuation routes, emergency contacts, and meeting points',
        'A recipe book',
        'A shopping list',
      ],
      correctIndex: 1,
      explanation: 'Good flood plans include evacuation routes, emergency numbers, and safe meeting points.',
    },
    {
      id: 'q2',
      question: 'Who should be involved in making a flood plan?',
      options: [
        'Only the mayor',
        'Everyone in the community',
        'Only firefighters',
        'Only adults',
      ],
      correctIndex: 1,
      explanation: 'Community resilience works best when everyone — including young people — is involved.',
    },
    {
      id: 'q3',
      question: 'What is "climate adaptation"?',
      options: [
        'Ignoring climate change',
        'Moving to another planet',
        'Adjusting to climate effects to reduce harm',
        'Making the weather hotter',
      ],
      correctIndex: 2,
      explanation:
        'Climate adaptation means preparing for and adjusting to the impacts of climate change.',
    },
    {
      id: 'q4',
      question: 'Why is working together important for climate adaptation?',
      options: [
        'It isn\'t important',
        'One person can fix everything alone',
        'Communities are stronger when everyone contributes',
        'It saves money on snacks',
      ],
      correctIndex: 2,
      explanation: 'Collective action multiplies impact — together, communities can tackle huge challenges.',
    },
  ],
  'w4-l4': [
    {
      id: 'q1',
      question: 'What is the greenhouse effect?',
      options: [
        'Growing plants in a greenhouse',
        'Gases trapping heat in the atmosphere like glass in a greenhouse',
        'Painting buildings green',
        'A new type of garden',
      ],
      correctIndex: 1,
      explanation:
        'The greenhouse effect is when atmospheric gases trap the Sun\'s heat, warming Earth.',
    },
    {
      id: 'q2',
      question: 'Which green practice helps reduce flooding?',
      options: [
        'Paving over all grass',
        'Planting trees and creating rain gardens',
        'Building taller buildings',
        'Using more concrete',
      ],
      correctIndex: 1,
      explanation: 'Trees and rain gardens absorb water, slowing runoff and reducing flood risk.',
    },
    {
      id: 'q3',
      question: 'What is the best way to describe "green skills"?',
      options: [
        'Skills for painting',
        'Knowledge and abilities that help protect the environment',
        'Skills that only scientists need',
        'Playing in the garden',
      ],
      correctIndex: 1,
      explanation:
        'Green skills are practical abilities everyone can learn to live more sustainably.',
    },
    {
      id: 'q4',
      question: 'How can children help with climate adaptation?',
      options: [
        'They can\'t help at all',
        'Learn green skills, spread awareness, and take action at home and school',
        'Only by donating money',
        'By ignoring the problem',
      ],
      correctIndex: 1,
      explanation:
        'Children are powerful agents of change! Learning and sharing green skills helps everyone.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Flood Defense Items
// ---------------------------------------------------------------------------

export const FLOOD_DEFENSE_ITEMS: FloodDefenseItem[] = [
  {
    id: 'sandbag',
    name: 'Sandbag',
    emoji: '\u{1F9F1}', // 🧱
    description: 'Stack to create barriers against rising water.',
    effectiveness: 1,
  },
  {
    id: 'barrier',
    name: 'Flood Barrier',
    emoji: '\u{1F6A7}', // 🚧
    description: 'A sturdy metal barrier that blocks large amounts of water.',
    effectiveness: 2,
  },
  {
    id: 'drain',
    name: 'Storm Drain',
    emoji: '\u{1F573}', // 🕳
    description: 'Channels water underground and away from buildings.',
    effectiveness: 3,
  },
  {
    id: 'pump',
    name: 'Water Pump',
    emoji: '\u{1F4A7}', // 💧
    description: 'Pumps floodwater away quickly.',
    effectiveness: 2,
  },
  {
    id: 'levee',
    name: 'Earth Levee',
    emoji: '\u{26F0}', // ⛰
    description: 'A raised earth embankment to hold back water.',
    effectiveness: 3,
  },
];

// ---------------------------------------------------------------------------
// Eco Builder Items
// ---------------------------------------------------------------------------

export const ECO_BUILDER_ITEMS: EcoBuilderItem[] = [
  {
    id: 'solar',
    name: 'Solar Panel',
    emoji: '\u{2600}', // ☀
    description: 'Generates clean electricity from sunlight.',
    greenPoints: 15,
    tempEffect: 3,
    category: 'energy',
  },
  {
    id: 'green-roof',
    name: 'Green Roof',
    emoji: '\u{1F33F}', // 🌿
    description: 'Plants on the roof absorb rain and insulate.',
    greenPoints: 20,
    tempEffect: 4,
    category: 'water',
  },
  {
    id: 'insulation',
    name: 'Wall Insulation',
    emoji: '\u{1F9F1}', // 🧱
    description: 'Keeps warmth in and cold out, saving energy.',
    greenPoints: 15,
    tempEffect: 5,
    category: 'insulation',
  },
  {
    id: 'rain-garden',
    name: 'Rain Garden',
    emoji: '\u{1F33A}', // 🌺
    description: 'Collects rainwater and lets it soak into the ground.',
    greenPoints: 15,
    tempEffect: 2,
    category: 'water',
  },
  {
    id: 'double-glazing',
    name: 'Double Glazing',
    emoji: '\u{1FA9F}', // 🪟
    description: 'Two layers of glass reduce heat loss through windows.',
    greenPoints: 10,
    tempEffect: 4,
    category: 'insulation',
  },
  {
    id: 'rainwater-tank',
    name: 'Rainwater Tank',
    emoji: '\u{1FAA3}', // 🪣
    description: 'Collects roof water for garden use.',
    greenPoints: 10,
    tempEffect: 1,
    category: 'water',
  },
  {
    id: 'tree',
    name: 'Shade Tree',
    emoji: '\u{1F333}', // 🌳
    description: 'Provides shade, absorbs CO\u2082, and reduces runoff.',
    greenPoints: 15,
    tempEffect: 3,
    category: 'nature',
  },
  {
    id: 'permeable-paving',
    name: 'Permeable Paving',
    emoji: '\u{1F532}', // 🔲
    description: 'Lets water drain through instead of running off.',
    greenPoints: 10,
    tempEffect: 1,
    category: 'water',
  },
];

// ---------------------------------------------------------------------------
// Sorting Items
// ---------------------------------------------------------------------------

export const SORTING_ITEMS: SortingItem[] = [
  { id: 's1', name: 'Plastic Bottle', emoji: '\u{1F9F4}', correctBin: 'recycle' },
  { id: 's2', name: 'Banana Peel', emoji: '\u{1F34C}', correctBin: 'compost' },
  { id: 's3', name: 'Newspaper', emoji: '\u{1F4F0}', correctBin: 'recycle' },
  { id: 's4', name: 'Apple Core', emoji: '\u{1F34E}', correctBin: 'compost' },
  { id: 's5', name: 'Broken Plate', emoji: '\u{1FAD8}', correctBin: 'landfill' },
  { id: 's6', name: 'Aluminium Can', emoji: '\u{1F964}', correctBin: 'recycle' },
  { id: 's7', name: 'Tea Bag', emoji: '\u{1FAD6}', correctBin: 'compost' },
  { id: 's8', name: 'Glass Jar', emoji: '\u{1FAD9}', correctBin: 'recycle' },
  { id: 's9', name: 'Styrofoam Cup', emoji: '\u{1F964}', correctBin: 'landfill' },
  { id: 's10', name: 'Egg Shells', emoji: '\u{1F95A}', correctBin: 'compost' },
  { id: 's11', name: 'Cardboard Box', emoji: '\u{1F4E6}', correctBin: 'recycle' },
  { id: 's12', name: 'Crisp Packet', emoji: '\u{1F36A}', correctBin: 'landfill' },
  { id: 's13', name: 'Grass Clippings', emoji: '\u{1F33E}', correctBin: 'compost' },
  { id: 's14', name: 'Tin Foil', emoji: '\u{1F4BF}', correctBin: 'recycle' },
  { id: 's15', name: 'Nappy / Diaper', emoji: '\u{1F476}', correctBin: 'landfill' },
  { id: 's16', name: 'Coffee Grounds', emoji: '\u{2615}', correctBin: 'compost' },
  { id: 's17', name: 'Plastic Bag', emoji: '\u{1F6CD}', correctBin: 'landfill' },
  { id: 's18', name: 'Steel Can', emoji: '\u{1F3AA}', correctBin: 'recycle' },
];

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export const BADGES: Badge[] = [
  {
    id: 'first-star',
    name: 'First Star',
    emoji: '\u{2B50}', // ⭐
    description: 'Earned your very first star!',
    condition: 'Complete any level',
  },
  {
    id: 'insulation-pro',
    name: 'Insulation Pro',
    emoji: '\u{1F3E0}', // 🏠
    description: 'Completed World 1: Insulation.',
    condition: 'Complete all World 1 levels',
  },
  {
    id: 'green-builder',
    name: 'Green Builder',
    emoji: '\u{1F3D7}', // 🏗
    description: 'Completed World 2: Green Builder.',
    condition: 'Complete all World 2 levels',
  },
  {
    id: 'eco-warrior',
    name: 'Eco Warrior',
    emoji: '\u{267B}', // ♻
    description: 'Completed World 3: Eco Warrior.',
    condition: 'Complete all World 3 levels',
  },
  {
    id: 'community-hero',
    name: 'Community Hero',
    emoji: '\u{1F6E1}', // 🛡
    description: 'Completed World 4: Community Shield.',
    condition: 'Complete all World 4 levels',
  },
  {
    id: 'perfect-score',
    name: 'Perfect Score',
    emoji: '\u{1F31F}', // 🌟
    description: 'Got 3 stars on a level!',
    condition: 'Earn 3 stars on any level',
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    emoji: '\u{1F9E0}', // 🧠
    description: 'Answered 20 quiz questions correctly.',
    condition: 'Answer 20 quiz questions correctly',
  },
  {
    id: 'eco-hero',
    name: 'EcoHero',
    emoji: '\u{1F9B8}', // 🦸
    description: 'Completed every level in the game!',
    condition: 'Complete all 20 levels',
  },
  {
    id: 'green-score-100',
    name: 'Green Champion',
    emoji: '\u{1F3C6}', // 🏆
    description: 'Reached a Green Score of 100!',
    condition: 'Accumulate 100 Green Score points',
  },
];

// ---------------------------------------------------------------------------
// Insulation Game — Materials & Level Configs
// ---------------------------------------------------------------------------

export const INSULATION_MATERIALS: InsulationMaterial[] = [
  {
    id: 'insulation',
    name: 'Insulation',
    emoji: '\u{1F9F1}', // 🧱
    description: 'A thick insulation layer that blocks heat from passing through, keeping the house cool inside.',
    tempEffect: 6,
    points: 15,
    applicableTo: ['roof', 'right-wall'],
  },
];

export const INSULATION_LEVEL_CONFIGS: Record<string, InsulationLevelConfig> = {
  'w1-l1': {
    activeZones: ['roof'],
    availableMaterials: ['insulation'],
    startTemp: 38,
    targetTemp: 30,
  },
  'w1-l2': {
    activeZones: ['right-wall'],
    availableMaterials: ['insulation'],
    startTemp: 38,
    targetTemp: 30,
  },
};

export function getInsulationMaterial(id: string): InsulationMaterial | undefined {
  return INSULATION_MATERIALS.find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// Helper to get levels for a world
// ---------------------------------------------------------------------------

export function getLevelsForWorld(worldId: string): Level[] {
  return LEVELS.filter((l) => l.worldId === worldId).sort(
    (a, b) => a.order - b.order,
  );
}

export function getWorldById(worldId: string): World | undefined {
  return WORLDS.find((w) => w.id === worldId);
}

export function getLevelById(levelId: string): Level | undefined {
  return LEVELS.find((l) => l.id === levelId);
}
