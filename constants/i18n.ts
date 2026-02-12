/**
 * EcoHero: Flood Fighters — Internationalization (English + Urdu)
 */

export type Language = 'en' | 'ur';

const translations = {
  // ---- Title screen ----
  appTitle: { en: 'EcoHero', ur: '\u0627\u06CC\u06A9\u0648 \u06C1\u06CC\u0631\u0648' },
  appSubtitle: { en: 'Flood Fighters', ur: '\u0633\u06CC\u0644\u0627\u0628 \u0633\u06D2 \u0628\u0686\u0627\u0624' },
  tagline: { en: 'Learn green skills. Save EcoVille!', ur: '\u0633\u0628\u0632 \u0645\u06C1\u0627\u0631\u062A\u06CC\u06BA \u0633\u06CC\u06A9\u06BE\u06CC\u06BA\u06D4 \u0627\u06CC\u06A9\u0648\u0648\u0644 \u0628\u0686\u0627\u0626\u06CC\u06BA!' },
  play: { en: 'Play', ur: '\u06A9\u06BE\u06CC\u0644\u06CC\u06BA' },
  myProfile: { en: 'My Profile', ur: '\u0645\u06CC\u0631\u06CC \u067E\u0631\u0648\u0641\u0627\u0626\u0644' },
  stars: { en: 'stars', ur: '\u0633\u062A\u0627\u0631\u06D2' },
  greenScore: { en: 'Green Score', ur: '\u0633\u0628\u0632 \u0633\u06A9\u0648\u0631' },
  footer: { en: 'Mainstreaming Green Skills for Climate Adaptation', ur: '\u0645\u0648\u0633\u0645\u06CC\u0627\u062A\u06CC \u0645\u0648\u0627\u0641\u0642\u062A \u06A9\u06D2 \u0644\u06CC\u06D2 \u0633\u0628\u0632 \u0645\u06C1\u0627\u0631\u062A\u06CC\u06BA' },

  // ---- World map ----
  worldMap: { en: 'World Map', ur: '\u0639\u0627\u0644\u0645\u06CC \u0646\u0642\u0634\u06C1' },
  locked: { en: 'Locked', ur: '\u0645\u0642\u0641\u0644' },
  starsNeeded: { en: 'stars needed', ur: '\u0633\u062A\u0627\u0631\u06D2 \u0636\u0631\u0648\u0631\u06CC' },
  levels: { en: 'levels', ur: '\u0645\u0631\u0627\u062D\u0644' },

  // ---- Levels screen ----
  selectLevel: { en: 'Select Level', ur: '\u0645\u0631\u062D\u0644\u06C1 \u0645\u0646\u062A\u062E\u0628 \u06A9\u0631\u06CC\u06BA' },

  // ---- Insulation world titles ----
  w1Title: { en: 'Insulation', ur: '\u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646' },
  w1Subtitle: { en: 'Keep the Heat Out', ur: '\u06AF\u0631\u0645\u06CC \u06A9\u0648 \u0628\u0627\u06C1\u0631 \u0631\u06A9\u06BE\u06CC\u06BA' },
  w1Description: {
    en: 'The sun is scorching! Learn how insulation keeps buildings cool by blocking heat rays from entering through roofs, walls, and windows.',
    ur: '\u0633\u0648\u0631\u062C \u062A\u067E \u0631\u06C1\u0627 \u06C1\u06D2! \u062C\u0627\u0646\u06CC\u06BA \u06A9\u06C1 \u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646 \u0686\u06BE\u062A\u060C \u062F\u06CC\u0648\u0627\u0631\u0648\u06BA \u0627\u0648\u0631 \u06A9\u06BE\u0691\u06A9\u06CC\u0648\u06BA \u0633\u06D2 \u06AF\u0631\u0645\u06CC \u06A9\u06CC \u0634\u0639\u0627\u0639\u0648\u06BA \u06A9\u0648 \u0631\u0648\u06A9 \u06A9\u0631 \u0639\u0645\u0627\u0631\u062A\u0648\u06BA \u06A9\u0648 \u0679\u06BE\u0646\u0688\u0627 \u0631\u06A9\u06BE\u062A\u06CC \u06C1\u06D2\u06D4',
  },

  // ---- Insulation level titles ----
  roofShield: { en: 'Roof Shield', ur: '\u0686\u06BE\u062A \u06A9\u06CC \u0688\u06BE\u0644' },
  hotWalls: { en: 'Hot Walls', ur: '\u06AF\u0631\u0645 \u062F\u06CC\u0648\u0627\u0631\u06CC\u06BA' },
  fullProtection: { en: 'Full Protection', ur: '\u0645\u06A9\u0645\u0644 \u062A\u062D\u0641\u0638' },

  // ---- Insulation level descriptions ----
  roofShieldDesc: {
    en: 'The sun is heating the roof! Add insulation to block the heat rays.',
    ur: '\u0633\u0648\u0631\u062C \u0686\u06BE\u062A \u06A9\u0648 \u06AF\u0631\u0645 \u06A9\u0631 \u0631\u06C1\u0627 \u06C1\u06D2! \u06AF\u0631\u0645\u06CC \u06A9\u06CC \u0634\u0639\u0627\u0639\u0648\u06BA \u0631\u0648\u06A9\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646 \u0644\u06AF\u0627\u0626\u06CC\u06BA\u06D4',
  },
  hotWallsDesc: {
    en: 'Sun rays are blasting through the walls! Insulate the right side to keep cool.',
    ur: '\u0633\u0648\u0631\u062C \u06A9\u06CC \u0634\u0639\u0627\u0639\u06CC\u06BA \u062F\u06CC\u0648\u0627\u0631\u0648\u06BA \u0633\u06D2 \u06AF\u0632\u0631 \u0631\u06C1\u06CC \u06C1\u06CC\u06BA! \u0679\u06BE\u0646\u0688\u06A9 \u0631\u06A9\u06BE\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u062F\u0627\u0626\u06CC\u06BA \u0637\u0631\u0641 \u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646 \u0644\u06AF\u0627\u0626\u06CC\u06BA\u06D4',
  },
  fullProtectionDesc: {
    en: 'Insulate both the roof AND the wall to fully protect the house from heat.',
    ur: '\u06AF\u06BE\u0631 \u06A9\u0648 \u06AF\u0631\u0645\u06CC \u0633\u06D2 \u0645\u06A9\u0645\u0644 \u0628\u0686\u0627\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u0686\u06BE\u062A \u0627\u0648\u0631 \u062F\u06CC\u0648\u0627\u0631 \u062F\u0648\u0646\u0648\u06BA \u067E\u0631 \u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646 \u0644\u06AF\u0627\u0626\u06CC\u06BA\u06D4',
  },

  // ---- Type labels ----
  typeInsulation: { en: 'Insulation', ur: '\u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646' },

  // ---- Insulation game ----
  insulated: { en: 'insulated', ur: '\u0627\u0646\u0633\u0648\u0644\u06CC\u0679\u0688' },
  sunScorching: { en: 'THE SUN IS SCORCHING', ur: '\u0633\u0648\u0631\u062C \u062A\u067E \u0631\u06C1\u0627 \u06C1\u06D2' },
  dropHere: { en: 'Bring insulation here!', ur: '\u06CC\u06C1\u0627\u06BA \u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646 \u0644\u0627\u0626\u06CC\u06BA!' },
  insulatedLabel: { en: 'Insulated', ur: '\u0627\u0646\u0633\u0648\u0644\u06CC\u0679\u0688' },
  dragInsulation: { en: 'Drag insulation to the house', ur: '\u0627\u0646\u0633\u0648\u0644\u06CC\u0634\u0646 \u06A9\u0648 \u06AF\u06BE\u0631 \u06A9\u06CC \u0637\u0631\u0641 \u06A9\u06BE\u06CC\u0646\u0686\u06CC\u06BA' },
  roof: { en: 'Roof', ur: '\u0686\u06BE\u062A' },
  wall: { en: 'Wall', ur: '\u062F\u06CC\u0648\u0627\u0631' },
  rightWall: { en: 'Right Wall', ur: '\u062F\u0627\u0626\u06CC\u06BA \u062F\u06CC\u0648\u0627\u0631' },
  allInsulated: { en: 'All zones insulated!', ur: '\u062A\u0645\u0627\u0645 \u062C\u06AF\u06C1\u06CC\u06BA \u0627\u0646\u0633\u0648\u0644\u06CC\u0679\u0688!' },
  tooHot: { en: 'Too hot!', ur: '\u0628\u06C1\u062A \u06AF\u0631\u0645\u06CC!' },
  veryWarm: { en: 'Very warm', ur: '\u0628\u06C1\u062A \u06AF\u0631\u0645' },
  warm: { en: 'Warm', ur: '\u06AF\u0631\u0645' },
  comfortable: { en: 'Comfortable!', ur: '\u0622\u0631\u0627\u0645\u062F\u06C1!' },
  niceCool: { en: 'Nice & cool!', ur: '\u0679\u06BE\u0646\u0688\u0627 \u0648 \u062E\u0648\u0634\u06AF\u0648\u0627\u0631!' },

  // ---- Level complete ----
  perfectScore: { en: 'Perfect Score!', ur: '\u0628\u06C1\u062A\u0631\u06CC\u0646 \u0633\u06A9\u0648\u0631!' },
  greatJob: { en: 'Great Job!', ur: '\u0634\u0627\u0628\u0627\u0634!' },
  goodEffort: { en: 'Good Effort!', ur: '\u0627\u0686\u06BE \u06A9\u0627\u0645!' },
  tryAgain: { en: 'Try Again!', ur: '\u062F\u0648\u0628\u0627\u0631\u06C1 \u06A9\u0648\u0634\u0634 \u06A9\u0631\u06CC\u06BA!' },
  score: { en: 'Score', ur: '\u0633\u06A9\u0648\u0631' },
  nextLevel: { en: 'Next Level', ur: '\u0627\u06AF\u0644\u0627 \u0645\u0631\u062D\u0644\u06C1' },
  retry: { en: 'Retry', ur: '\u062F\u0648\u0628\u0627\u0631\u06C1' },
  worldMapBtn: { en: 'World Map', ur: '\u0639\u0627\u0644\u0645\u06CC \u0646\u0642\u0634\u06C1' },

  // ---- Profile ----
  profile: { en: 'Profile', ur: '\u067E\u0631\u0648\u0641\u0627\u0626\u0644' },
  badges: { en: 'Badges', ur: '\u0628\u06CC\u062C\u0632' },
  resetProgress: { en: 'Reset Progress', ur: '\u062A\u0631\u0642\u06CC \u0631\u06CC\u0633\u06CC\u0679 \u06A9\u0631\u06CC\u06BA' },

  // ---- Common ----
  back: { en: 'Back', ur: '\u0648\u0627\u067E\u0633' },
  goBack: { en: 'Go Back', ur: '\u0648\u0627\u067E\u0633 \u062C\u0627\u0626\u06CC\u06BA' },
  language: { en: 'English', ur: '\u0627\u0631\u062F\u0648' },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Language): string {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
}

export default translations;
