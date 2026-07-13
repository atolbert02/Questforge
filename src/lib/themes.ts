import type { QuestType } from "./types";

/**
 * Game-inspired theme registry.
 *
 * Each theme is a full "skin": a palette (tokens), fonts, a quest-complete
 * effect, sound cues, an icon set, and an optional background texture.
 *
 * The teen picks one on the Create page; it's stored on the tracker as
 * `TrackerConfig.themeId` and resolved here with `getTheme()`.
 *
 * Names are deliberately descriptive (not trademarked) but evoke the game
 * that inspired them. All art/palettes/fonts are original or freely licensed.
 */

export type ThemeId =
  | "space" // default — matches the original QuestForge look
  | "kart"
  | "puffball"
  | "block"
  | "wizard"
  | "hero"
  | "nightmare"
  | "zombie"
  | "adventure"
  | "cozy"
  | "monster"
  | "dropsquad"
  | "kitty"
  | "elysian"
  | "reef";

export type EffectKind =
  | "confetti"
  | "coin"
  | "star"
  | "block"
  | "spell"
  | "pow"
  | "ember"
  | "glitch"
  | "rune"
  | "leaf"
  | "capture"
  | "victory"
  | "combo";

export interface ThemeTokens {
  /** Page background (deepest surface). */
  bgDeep: string;
  /** Card / panel background. */
  bgCard: string;
  /** Hover / elevated surface. */
  bgHover: string;
  /** Default border. */
  border: string;
  /** Stronger border (unchecked boxes, secondary buttons). */
  borderStrong: string;
  /** Primary text. */
  text: string;
  /** Muted / secondary text. */
  textMuted: string;
  /** Dim / tertiary text. */
  textDim: string;
  /** Brand accent — titles, progress, active states. */
  accent: string;
  /** Secondary brand color. */
  secondary: string;
  /** Success / completed (green-ish). */
  success: string;
  /** XP / reward highlight (gold-ish). */
  gold: string;
  /** Error / danger. */
  danger: string;
  /** Readable text laid over accent/success fills. */
  onAccent: string;
}

export interface ThemeFonts {
  display: string;
  body: string;
  mono: string;
  /** Google Fonts stylesheet URL for this theme's families. */
  googleFontsUrl: string;
}

export interface GameTheme {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Which game vibe it evokes (shown as a subtle hint in the picker). */
  inspiredBy: string;
  tokens: ThemeTokens;
  fonts: ThemeFonts;
  effect: {
    kind: EffectKind;
    particleColors: string[];
    /** Glow color for boss quests. */
    bossGlow: string;
  };
  sound: {
    complete: string;
    achievement: string;
    levelUp: string;
  };
  /** Optional CSS background applied to the tracker root. */
  background?: string;
  /** Emoji/glyph set keyed by quest type, plus a level-up glyph. */
  icons: Record<QuestType, string> & { levelUp: string };
}

const BASE_ICONS: Record<QuestType, string> & { levelUp: string } = {
  learn: "📖",
  build: "🔨",
  create: "✨",
  research: "🔍",
  practice: "🎯",
  document: "📝",
  levelUp: "⭐",
};

const sounds = (id: ThemeId) => ({
  complete: `/sounds/${id}/complete.mp3`,
  achievement: `/sounds/${id}/achievement.mp3`,
  levelUp: `/sounds/${id}/levelup.mp3`,
});

const GF = "https://fonts.googleapis.com/css2?";

export const THEMES: Record<ThemeId, GameTheme> = {
  space: {
    id: "space",
    name: "Space Station",
    blurb: "Neon cyberpunk command deck — the classic Questify look.",
    inspiredBy: "sci-fi",
    tokens: {
      bgDeep: "#0b0f19", bgCard: "#121826", bgHover: "#1b2436", border: "#283348",
      borderStrong: "#475569", text: "#e8eef7", textMuted: "#94a3b8", textDim: "#b4c0d4",
      accent: "#00e5ff", secondary: "#ff007f", success: "#3affc0", gold: "#ffc94d",
      danger: "#ff5470", onAccent: "#05060e",
    },
    fonts: {
      display: "'Orbitron', sans-serif",
      body: "'DM Sans', sans-serif",
      mono: "'IBM Plex Mono', monospace",
      googleFontsUrl: GF + "family=Orbitron:wght@400;700;900&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "confetti", particleColors: ["#00e5ff", "#ff007f", "#3affc0", "#ffc94d"], bossGlow: "#00e5ff" },
    sound: sounds("space"),
    background: "radial-gradient(circle at 50% 0%,#111a2e 0%,#0b0f19 70%)",
    icons: { ...BASE_ICONS, learn: "🛰️", build: "🔧", create: "✨", research: "🔬", practice: "🎯", document: "📡", levelUp: "🚀" },
  },

  kart: {
    id: "kart",
    name: "Kart Racer",
    blurb: "Rev the engine — checkered flags, coins, and pure speed.",
    inspiredBy: "kart racing",
    tokens: {
      bgDeep: "#44baed", bgCard: "#ffffff", bgHover: "#eaf7ff", border: "#b9d6f2",
      borderStrong: "#7fb0e0", text: "#0b2545", textMuted: "#5a7a9a", textDim: "#3d5a80",
      accent: "#ff3b3b", secondary: "#1e90ff", success: "#2ecc71", gold: "#ffb703",
      danger: "#e63946", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Racing Sans One', sans-serif",
      body: "'Rubik', sans-serif",
      mono: "'Roboto Mono', monospace",
      googleFontsUrl: GF + "family=Racing+Sans+One&family=Rubik:wght@400;600;700&family=Roboto+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "coin", particleColors: ["#ffb703", "#ff3b3b", "#1e90ff"], bossGlow: "#ff3b3b" },
    sound: sounds("kart"),
    background: "linear-gradient(180deg,#44baed 0%,#2fa8de 100%)",
    icons: { learn: "🏁", build: "🔧", create: "🎨", research: "🗺️", practice: "🏎️", document: "📋", levelUp: "🏆" },
  },

  puffball: {
    id: "puffball",
    name: "Puffball Quest",
    blurb: "Soft, sweet, and starry — bounce through candy-colored worlds.",
    inspiredBy: "pink puffball platformer",
    tokens: {
      bgDeep: "#f7e3f1", bgCard: "#ffffff", bgHover: "#fdeef7", border: "#f0c8e0",
      borderStrong: "#e79cc6", text: "#5a2a45", textMuted: "#a86a90", textDim: "#83486a",
      accent: "#ff62bb", secondary: "#99c2ff", success: "#ff84ba", gold: "#ffdf82",
      danger: "#ff5f7e", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Chango', cursive",
      body: "'Quicksand', sans-serif",
      mono: "'Space Mono', monospace",
      googleFontsUrl: GF + "family=Chango&family=Quicksand:wght@400;500;600&family=Space+Mono&display=swap",
    },
    effect: { kind: "star", particleColors: ["#ff62bb", "#99c2ff", "#ffdf82"], bossGlow: "#ff62bb" },
    sound: sounds("puffball"),
    background: "radial-gradient(circle at 50% 0%,#fdeef7 0%,#f7e3f1 60%)",
    icons: { learn: "📖", build: "🧩", create: "🍬", research: "🔍", practice: "💫", document: "📗", levelUp: "🌟" },
  },

  block: {
    id: "block",
    name: "Block Miner",
    blurb: "Mine, craft, and build block by block in a pixel world.",
    inspiredBy: "voxel sandbox",
    tokens: {
      bgDeep: "#e4d8c6", bgCard: "#f0e7d7", bgHover: "#e8dccb", border: "#cbbda6",
      borderStrong: "#a8977e", text: "#2b2420", textMuted: "#6b615a", textDim: "#4a423c",
      accent: "#5a9e28", secondary: "#8a5a2b", success: "#5a9e28", gold: "#c99a1e",
      danger: "#c0392b", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Press Start 2P', cursive",
      body: "'Inter', sans-serif",
      mono: "'Silkscreen', monospace",
      googleFontsUrl: GF + "family=Press+Start+2P&family=Inter:wght@400;600&family=Silkscreen:wght@400;700&display=swap",
    },
    effect: { kind: "block", particleColors: ["#5a9e28", "#8a5a2b", "#c99a1e"], bossGlow: "#5a9e28" },
    sound: sounds("block"),
    background: "linear-gradient(180deg,#ece0cf 0%,#ddd0bb 100%)",
    icons: { learn: "📕", build: "⛏️", create: "🧱", research: "🔦", practice: "⚒️", document: "📜", levelUp: "💎" },
  },

  wizard: {
    id: "wizard",
    name: "Wizard School",
    blurb: "Study spells in candlelit halls of crimson and gold.",
    inspiredBy: "wizarding school",
    tokens: {
      bgDeep: "#140b0b", bgCard: "#211212", bgHover: "#2e1a1a", border: "#4b2727",
      borderStrong: "#6b3c3c", text: "#ece6d3", textMuted: "#a88a8a", textDim: "#c9b7b7",
      accent: "#d4af37", secondary: "#8b2e2e", success: "#a14e4e", gold: "#d4af37",
      danger: "#a83232", onAccent: "#140b0b",
    },
    fonts: {
      display: "'Cinzel', serif",
      body: "'EB Garamond', serif",
      mono: "'Cormorant', serif",
      googleFontsUrl: GF + "family=Cinzel:wght@400;700;900&family=EB+Garamond:wght@400;500;600&family=Cormorant:wght@400;600&display=swap",
    },
    effect: { kind: "spell", particleColors: ["#d4af37", "#8b2e2e", "#eae0c0"], bossGlow: "#d4af37" },
    sound: sounds("wizard"),
    background: "radial-gradient(circle at 50% 120%,#301717 0%,#140b0b 70%)",
    icons: { learn: "📜", build: "🪄", create: "✨", research: "🔮", practice: "⚗️", document: "📖", levelUp: "🏅" },
  },

  hero: {
    id: "hero",
    name: "Super Hero",
    blurb: "POW! Bold comic-book action in primary colors.",
    inspiredBy: "superhero comic",
    tokens: {
      bgDeep: "#fff4e0", bgCard: "#fffdf8", bgHover: "#ffe9c9", border: "#ead4b4",
      borderStrong: "#d4b483", text: "#1a1626", textMuted: "#6b6478", textDim: "#433c52",
      accent: "#e63946", secondary: "#f4a300", success: "#2a9d8f", gold: "#ffc300",
      danger: "#e63946", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Bangers', cursive",
      body: "'Poppins', sans-serif",
      mono: "'Roboto Mono', monospace",
      googleFontsUrl: GF + "family=Bangers&family=Poppins:wght@400;600;700&family=Roboto+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "pow", particleColors: ["#e63946", "#f4a300", "#ffc300"], bossGlow: "#e63946" },
    sound: sounds("hero"),
    background: "linear-gradient(180deg,#fff8ea 0%,#ffe9c9 100%)",
    icons: { learn: "📖", build: "🛠️", create: "💥", research: "🔎", practice: "🦸", document: "🗞️", levelUp: "🌟" },
  },

  nightmare: {
    id: "nightmare",
    name: "Nightmare Maze",
    blurb: "A hushed, sepia dreamworld lit by a single lantern.",
    inspiredBy: "eerie puzzle-platformer",
    tokens: {
      bgDeep: "#141418", bgCard: "#0f1e2d", bgHover: "#1a2c3d", border: "#2b3a44",
      borderStrong: "#486e75", text: "#d8cbb8", textMuted: "#9a8f7d", textDim: "#b3a891",
      accent: "#ffd700", secondary: "#486e75", success: "#8a9a5b", gold: "#ffd700",
      danger: "#8b2717", onAccent: "#141418",
    },
    fonts: {
      display: "'Special Elite', cursive",
      body: "'Crimson Text', serif",
      mono: "'Special Elite', monospace",
      googleFontsUrl: GF + "family=Special+Elite&family=Crimson+Text:wght@400;600&display=swap",
    },
    effect: { kind: "ember", particleColors: ["#ffd700", "#8b2717", "#486e75"], bossGlow: "#ffd700" },
    sound: sounds("nightmare"),
    background: "radial-gradient(circle at 50% 40%,#1c1c22 0%,#141418 70%)",
    icons: { learn: "🕯️", build: "🔗", create: "🎭", research: "🔦", practice: "👣", document: "📓", levelUp: "🌙" },
  },

  zombie: {
    id: "zombie",
    name: "Zombie Survival",
    blurb: "Survive the outbreak — blood red and toxic green.",
    inspiredBy: "survival horror",
    tokens: {
      bgDeep: "#1e1f1a", bgCard: "#262820", bgHover: "#313327", border: "#3d4034",
      borderStrong: "#545845", text: "#d9e2ec", textMuted: "#8a9282", textDim: "#aab3a0",
      accent: "#a38a5e", secondary: "#4a5d4e", success: "#4a5d4e", gold: "#a38a5e",
      danger: "#5c1d1d", onAccent: "#1e1f1a",
    },
    fonts: {
      display: "'Oswald', sans-serif",
      body: "'Barlow', sans-serif",
      mono: "'Share Tech Mono', monospace",
      googleFontsUrl: GF + "family=Oswald:wght@400;600;700&family=Barlow:wght@400;600&family=Share+Tech+Mono&display=swap",
    },
    effect: { kind: "glitch", particleColors: ["#a38a5e", "#5c1d1d", "#4a5d4e"], bossGlow: "#a38a5e" },
    sound: sounds("zombie"),
    background: "radial-gradient(circle at 50% 100%,#26281f 0%,#1e1f1a 70%)",
    icons: { learn: "📋", build: "🔧", create: "☣️", research: "🧪", practice: "🔫", document: "📁", levelUp: "🧟" },
  },

  adventure: {
    id: "adventure",
    name: "Adventure Quest",
    blurb: "Explore vast wilds — runes, blades, and open skies.",
    inspiredBy: "open-world adventure",
    tokens: {
      bgDeep: "#ede6d2", bgCard: "#f7f2e4", bgHover: "#e3dac2", border: "#d3c7a6",
      borderStrong: "#b3a37a", text: "#23372e", textMuted: "#6a7c6e", textDim: "#47584c",
      accent: "#2f8f8d", secondary: "#b8891f", success: "#4f9e5c", gold: "#d9a94a",
      danger: "#cf6a4c", onAccent: "#ffffff",
    },
    fonts: {
      display: "'MedievalSharp', cursive",
      body: "'Spectral', serif",
      mono: "'Cutive Mono', monospace",
      googleFontsUrl: GF + "family=MedievalSharp&family=Spectral:wght@400;600&family=Cutive+Mono&display=swap",
    },
    effect: { kind: "rune", particleColors: ["#2f8f8d", "#b8891f", "#4f9e5c"], bossGlow: "#2f8f8d" },
    sound: sounds("adventure"),
    background: "linear-gradient(180deg,#f2ecda 0%,#e3dac2 100%)",
    icons: { learn: "📜", build: "⚒️", create: "🗡️", research: "🧭", practice: "🏹", document: "🗺️", levelUp: "🛡️" },
  },

  cozy: {
    id: "cozy",
    name: "Coastal Cove",
    blurb: "Sun, surf, and seashells — a breezy coastal escape.",
    inspiredBy: "cozy coastal life-sim",
    tokens: {
      bgDeep: "#eee0c9", bgCard: "#faf4e8", bgHover: "#f0e6d0", border: "#d8cbb0",
      borderStrong: "#bdcdd6", text: "#2e4756", textMuted: "#6b8493", textDim: "#47606e",
      accent: "#6096b4", secondary: "#93bfcf", success: "#6fb0a0", gold: "#e4b363",
      danger: "#e27d8a", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Comfortaa', cursive",
      body: "'Nunito', sans-serif",
      mono: "'Nanum Gothic Coding', monospace",
      googleFontsUrl: GF + "family=Comfortaa:wght@400;500;700&family=Nunito:wght@400;600;700&family=Nanum+Gothic+Coding&display=swap",
    },
    effect: { kind: "leaf", particleColors: ["#6096b4", "#93bfcf", "#e4b363"], bossGlow: "#6096b4" },
    sound: sounds("cozy"),
    background: "linear-gradient(180deg,#f3ead6 0%,#eaddc2 100%)",
    icons: { learn: "🐚", build: "🏖️", create: "🎨", research: "🔍", practice: "🌊", document: "📔", levelUp: "🌴" },
  },

  monster: {
    id: "monster",
    name: "Monster Tamer",
    blurb: "Catch, train, and battle — gotta level 'em all.",
    inspiredBy: "creature collector",
    tokens: {
      bgDeep: "#f2f2f2", bgCard: "#ffffff", bgHover: "#e6e6e6", border: "#d0d0d0",
      borderStrong: "#a8a8a8", text: "#1b2a4a", textMuted: "#5f6575", textDim: "#3f4558",
      accent: "#3b4cca", secondary: "#ff1f1f", success: "#46a144", gold: "#ffcb05",
      danger: "#ff1f1f", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Titan One', cursive",
      body: "'Poppins', sans-serif",
      mono: "'Roboto Mono', monospace",
      googleFontsUrl: GF + "family=Titan+One&family=Poppins:wght@400;600&family=Roboto+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "capture", particleColors: ["#3b4cca", "#ff1f1f", "#ffcb05"], bossGlow: "#ff1f1f" },
    sound: sounds("monster"),
    background: "linear-gradient(180deg,#f7f7f7 0%,#e9e9e9 100%)",
    icons: { learn: "📘", build: "🔧", create: "✨", research: "🔎", practice: "⚡", document: "📕", levelUp: "🏅" },
  },

  dropsquad: {
    id: "dropsquad",
    name: "Drop Squad",
    blurb: "Drop in, build up, and grab the Victory crown.",
    inspiredBy: "battle royale",
    tokens: {
      bgDeep: "#0e1726", bgCard: "#16223a", bgHover: "#1f2f4d", border: "#2a3d5c",
      borderStrong: "#3d5580", text: "#eaf1ff", textMuted: "#8595b0", textDim: "#b0bdd6",
      accent: "#a020f0", secondary: "#00ffff", success: "#228b22", gold: "#ffd700",
      danger: "#ff4d6d", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Teko', sans-serif",
      body: "'Rajdhani', sans-serif",
      mono: "'Chakra Petch', monospace",
      googleFontsUrl: GF + "family=Teko:wght@400;600;700&family=Rajdhani:wght@400;600;700&family=Chakra+Petch:wght@400;600&display=swap",
    },
    effect: { kind: "victory", particleColors: ["#a020f0", "#00ffff", "#ffd700"], bossGlow: "#a020f0" },
    sound: sounds("dropsquad"),
    background: "radial-gradient(circle at 50% 0%,#152238 0%,#0e1726 70%)",
    icons: { learn: "📖", build: "🏗️", create: "🎨", research: "🔍", practice: "🎯", document: "📋", levelUp: "👑" },
  },

  reef: {
    id: "reef",
    name: "Deep Reef",
    blurb: "Drift through sunlit shallows and coral gardens.",
    inspiredBy: "underwater survival",
    tokens: {
      bgDeep: "#cfe6d2", bgCard: "#eaf4e6", bgHover: "#dcebdd", border: "#b9d4be",
      borderStrong: "#8fb89c", text: "#244a41", textMuted: "#5e7d70", textDim: "#3e5f53",
      accent: "#659287", secondary: "#88bda4", success: "#7fb68f", gold: "#e8a87c",
      danger: "#c56b5b", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Exo 2', sans-serif",
      body: "'Jost', sans-serif",
      mono: "'Share Tech Mono', monospace",
      googleFontsUrl: GF + "family=Exo+2:wght@400;600;700&family=Jost:wght@400;500;600&family=Share+Tech+Mono&display=swap",
    },
    effect: { kind: "leaf", particleColors: ["#659287", "#88bda4", "#e8a87c"], bossGlow: "#659287" },
    sound: sounds("reef"),
    background: "linear-gradient(180deg,#e6f2dd 0%,#b1d3b9 100%)",
    icons: { learn: "🐠", build: "🪸", create: "🎨", research: "🔦", practice: "🫧", document: "📜", levelUp: "🌊" },
  },

  kitty: {
    id: "kitty",
    name: "Bows & Whiskers",
    blurb: "Ribbons, sparkles, and sweet little friends.",
    inspiredBy: "kawaii mascot",
    tokens: {
      bgDeep: "#fbefef", bgCard: "#ffffff", bgHover: "#ffe2e2", border: "#f5cbcb",
      borderStrong: "#e7b7c4", text: "#6b4a5a", textMuted: "#a98a9a", textDim: "#85667a",
      accent: "#e56aa0", secondary: "#c5b3d3", success: "#7fc8a9", gold: "#ffd59e",
      danger: "#f0728a", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Grandstander', cursive",
      body: "'Quicksand', sans-serif",
      mono: "'Space Mono', monospace",
      googleFontsUrl: GF + "family=Grandstander:wght@400;600;800&family=Quicksand:wght@400;500;600&family=Space+Mono&display=swap",
    },
    effect: { kind: "star", particleColors: ["#e56aa0", "#c5b3d3", "#ffd59e"], bossGlow: "#e56aa0" },
    sound: sounds("kitty"),
    background: "radial-gradient(circle at 50% 0%,#fff5f8 0%,#fbefef 60%)",
    icons: { learn: "📖", build: "🎀", create: "🧁", research: "🔍", practice: "💗", document: "📗", levelUp: "⭐" },
  },

  elysian: {
    id: "elysian",
    name: "Elysian Skies",
    blurb: "Sunlit temples, drifting clouds, and forgotten myth.",
    inspiredBy: "atmospheric myth adventure",
    tokens: {
      bgDeep: "#f8ede3", bgCard: "#fffbf5", bgHover: "#f0e4d6", border: "#e0cdbc",
      borderStrong: "#c9ae9a", text: "#3a2a31", textMuted: "#8a7078", textDim: "#5e4750",
      accent: "#853953", secondary: "#85586f", success: "#7c8b5a", gold: "#c9a24b",
      danger: "#a6413b", onAccent: "#fff7ef",
    },
    fonts: {
      display: "'Cormorant', serif",
      body: "'Spectral', serif",
      mono: "'Cutive Mono', monospace",
      googleFontsUrl: GF + "family=Cormorant:wght@500;600;700&family=Spectral:wght@400;600&family=Cutive+Mono&display=swap",
    },
    effect: { kind: "rune", particleColors: ["#853953", "#c9a24b", "#85586f"], bossGlow: "#c9a24b" },
    sound: sounds("elysian"),
    background: "radial-gradient(circle at 50% 0%,#fdf6ec 0%,#f0e4d6 70%)",
    icons: { learn: "📜", build: "🏛️", create: "🎨", research: "🕊️", practice: "🌿", document: "🏺", levelUp: "⚡" },
  },
};

/** Ordered list for the picker (default first). */
export const THEME_LIST: GameTheme[] = [
  THEMES.space, THEMES.kart, THEMES.puffball, THEMES.block, THEMES.wizard,
  THEMES.hero, THEMES.nightmare, THEMES.zombie, THEMES.adventure, THEMES.cozy,
  THEMES.monster, THEMES.dropsquad, THEMES.reef, THEMES.kitty, THEMES.elysian,
];

export const DEFAULT_THEME_ID: ThemeId = "space";

/** Resolve a theme by id, defaulting to Space Station for back-compat. */
export function getTheme(id?: string): GameTheme {
  return (id && THEMES[id as ThemeId]) || THEMES[DEFAULT_THEME_ID];
}

/**
 * Derive a cohesive per-phase color palette from a theme, so phase markers
 * match the chosen skin instead of random hex from the model.
 */
export function themePhaseColors(theme: GameTheme, n: number): string[] {
  const t = theme.tokens;
  const wheel = [t.accent, t.secondary, t.success, t.gold, t.danger, t.textDim];
  return Array.from({ length: Math.max(n, 0) }, (_, i) => wheel[i % wheel.length]);
}
