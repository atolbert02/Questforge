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
  | "beat";

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
    blurb: "Neon cyberpunk command deck — the classic QuestForge look.",
    inspiredBy: "sci-fi",
    tokens: {
      bgDeep: "#05060e", bgCard: "#0d1117", bgHover: "#131a26", border: "#1a2535",
      borderStrong: "#374151", text: "#e2e8f0", textMuted: "#64748b", textDim: "#94a3b8",
      accent: "#f97316", secondary: "#22d3ee", success: "#4ade80", gold: "#fbbf24",
      danger: "#fb7185", onAccent: "#05060e",
    },
    fonts: {
      display: "'Orbitron', sans-serif",
      body: "'DM Sans', sans-serif",
      mono: "'IBM Plex Mono', monospace",
      googleFontsUrl: GF + "family=Orbitron:wght@400;700;900&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "confetti", particleColors: ["#f97316", "#22d3ee", "#4ade80", "#a78bfa"], bossGlow: "#f97316" },
    sound: sounds("space"),
    icons: { ...BASE_ICONS, learn: "🛰️", build: "🔧", create: "✨", research: "🔬", practice: "🎯", document: "📡", levelUp: "🚀" },
  },

  kart: {
    id: "kart",
    name: "Kart Racer",
    blurb: "Rev the engine — checkered flags, coins, and pure speed.",
    inspiredBy: "kart racing",
    tokens: {
      bgDeep: "#eaf4ff", bgCard: "#ffffff", bgHover: "#dbeeff", border: "#b9d6f2",
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
    background: "linear-gradient(180deg,#eaf4ff 0%,#dbeeff 100%)",
    icons: { learn: "🏁", build: "🔧", create: "🎨", research: "🗺️", practice: "🏎️", document: "📋", levelUp: "🏆" },
  },

  puffball: {
    id: "puffball",
    name: "Puffball Quest",
    blurb: "Soft, sweet, and starry — bounce through candy-colored worlds.",
    inspiredBy: "pink puffball platformer",
    tokens: {
      bgDeep: "#fff0f6", bgCard: "#ffffff", bgHover: "#ffe0ef", border: "#ffc2dd",
      borderStrong: "#ff8fbf", text: "#5a2a45", textMuted: "#b06a8a", textDim: "#8a4a6a",
      accent: "#ff5fa2", secondary: "#7cc7ff", success: "#7ed957", gold: "#ffd25f",
      danger: "#ff5f7e", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Baloo 2', cursive",
      body: "'Quicksand', sans-serif",
      mono: "'Space Mono', monospace",
      googleFontsUrl: GF + "family=Baloo+2:wght@400;700;800&family=Quicksand:wght@400;500;600&family=Space+Mono&display=swap",
    },
    effect: { kind: "star", particleColors: ["#ff5fa2", "#7cc7ff", "#ffd25f"], bossGlow: "#ff5fa2" },
    sound: sounds("puffball"),
    background: "radial-gradient(circle at 50% 0%,#ffe0ef 0%,#fff0f6 60%)",
    icons: { learn: "📖", build: "🧩", create: "🍬", research: "🔍", practice: "💫", document: "📗", levelUp: "🌟" },
  },

  block: {
    id: "block",
    name: "Block Miner",
    blurb: "Mine, craft, and build block by block in a pixel world.",
    inspiredBy: "voxel sandbox",
    tokens: {
      bgDeep: "#1a1a1a", bgCard: "#2b2b2b", bgHover: "#3a3a3a", border: "#4a4a4a",
      borderStrong: "#5a5a5a", text: "#e8e8e8", textMuted: "#9a9a9a", textDim: "#bdbdbd",
      accent: "#6abe30", secondary: "#8a5a2b", success: "#6abe30", gold: "#f2c94c",
      danger: "#d64b4b", onAccent: "#0d160a",
    },
    fonts: {
      display: "'Press Start 2P', cursive",
      body: "'Inter', sans-serif",
      mono: "'Silkscreen', monospace",
      googleFontsUrl: GF + "family=Press+Start+2P&family=Inter:wght@400;600&family=Silkscreen:wght@400;700&display=swap",
    },
    effect: { kind: "block", particleColors: ["#6abe30", "#8a5a2b", "#f2c94c"], bossGlow: "#6abe30" },
    sound: sounds("block"),
    icons: { learn: "📕", build: "⛏️", create: "🧱", research: "🔦", practice: "⚒️", document: "📜", levelUp: "💎" },
  },

  wizard: {
    id: "wizard",
    name: "Wizard School",
    blurb: "Study spells in candlelit halls of emerald and gold.",
    inspiredBy: "wizarding school",
    tokens: {
      bgDeep: "#0b1410", bgCard: "#12211a", bgHover: "#1a2e24", border: "#274b3f",
      borderStrong: "#3c6b57", text: "#ece6d3", textMuted: "#8aa89a", textDim: "#b7c9bd",
      accent: "#d4af37", secondary: "#2e8b57", success: "#4ea172", gold: "#d4af37",
      danger: "#a83232", onAccent: "#0b1410",
    },
    fonts: {
      display: "'Cinzel', serif",
      body: "'EB Garamond', serif",
      mono: "'Cormorant', serif",
      googleFontsUrl: GF + "family=Cinzel:wght@400;700;900&family=EB+Garamond:wght@400;500;600&family=Cormorant:wght@400;600&display=swap",
    },
    effect: { kind: "spell", particleColors: ["#d4af37", "#2e8b57", "#eae0c0"], bossGlow: "#d4af37" },
    sound: sounds("wizard"),
    background: "radial-gradient(circle at 50% 120%,#173025 0%,#0b1410 70%)",
    icons: { learn: "📜", build: "🪄", create: "✨", research: "🔮", practice: "⚗️", document: "📖", levelUp: "🏅" },
  },

  hero: {
    id: "hero",
    name: "Super Hero",
    blurb: "POW! Bold comic-book action in primary colors.",
    inspiredBy: "superhero comic",
    tokens: {
      bgDeep: "#0a1024", bgCard: "#121a3a", bgHover: "#1a244d", border: "#2a3768",
      borderStrong: "#3d4f8f", text: "#f5f7ff", textMuted: "#8b95c4", textDim: "#b3bce0",
      accent: "#ff2b4e", secondary: "#2b6bff", success: "#37d67a", gold: "#ffd23f",
      danger: "#ff2b4e", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Bangers', cursive",
      body: "'Poppins', sans-serif",
      mono: "'Roboto Mono', monospace",
      googleFontsUrl: GF + "family=Bangers&family=Poppins:wght@400;600;700&family=Roboto+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "pow", particleColors: ["#ff2b4e", "#2b6bff", "#ffd23f"], bossGlow: "#ff2b4e" },
    sound: sounds("hero"),
    icons: { learn: "📖", build: "🛠️", create: "💥", research: "🔎", practice: "🦸", document: "🗞️", levelUp: "🌟" },
  },

  nightmare: {
    id: "nightmare",
    name: "Nightmare Maze",
    blurb: "A hushed, sepia dreamworld lit by a single lantern.",
    inspiredBy: "eerie puzzle-platformer",
    tokens: {
      bgDeep: "#0d0b09", bgCard: "#171310", bgHover: "#221c16", border: "#322a22",
      borderStrong: "#4a3e30", text: "#d8cbb8", textMuted: "#7a6f5f", textDim: "#a1937d",
      accent: "#d9863d", secondary: "#6b5a3e", success: "#8a9a5b", gold: "#c89b4a",
      danger: "#8a3b2f", onAccent: "#0d0b09",
    },
    fonts: {
      display: "'Special Elite', cursive",
      body: "'Crimson Text', serif",
      mono: "'Special Elite', monospace",
      googleFontsUrl: GF + "family=Special+Elite&family=Crimson+Text:wght@400;600&display=swap",
    },
    effect: { kind: "ember", particleColors: ["#d9863d", "#8a3b2f", "#c89b4a"], bossGlow: "#d9863d" },
    sound: sounds("nightmare"),
    background: "radial-gradient(circle at 50% 40%,#1a140e 0%,#0d0b09 70%)",
    icons: { learn: "🕯️", build: "🔗", create: "🎭", research: "🔦", practice: "👣", document: "📓", levelUp: "🌙" },
  },

  zombie: {
    id: "zombie",
    name: "Zombie Survival",
    blurb: "Survive the outbreak — blood red and toxic green.",
    inspiredBy: "survival horror",
    tokens: {
      bgDeep: "#0a0c0a", bgCard: "#141814", bgHover: "#1e241e", border: "#2b332b",
      borderStrong: "#3f4a3f", text: "#d6e0d0", textMuted: "#6f7a6a", textDim: "#94a08c",
      accent: "#b81414", secondary: "#7fff00", success: "#7fdd3a", gold: "#c9b458",
      danger: "#b81414", onAccent: "#f0fff0",
    },
    fonts: {
      display: "'Oswald', sans-serif",
      body: "'Barlow', sans-serif",
      mono: "'Share Tech Mono', monospace",
      googleFontsUrl: GF + "family=Oswald:wght@400;600;700&family=Barlow:wght@400;600&family=Share+Tech+Mono&display=swap",
    },
    effect: { kind: "glitch", particleColors: ["#7fff00", "#8b0f0f", "#b81414"], bossGlow: "#b81414" },
    sound: sounds("zombie"),
    background: "radial-gradient(circle at 50% 100%,#141a12 0%,#0a0c0a 70%)",
    icons: { learn: "📋", build: "🔧", create: "☣️", research: "🧪", practice: "🔫", document: "📁", levelUp: "🧟" },
  },

  adventure: {
    id: "adventure",
    name: "Adventure Quest",
    blurb: "Explore vast wilds — runes, blades, and open skies.",
    inspiredBy: "open-world adventure",
    tokens: {
      bgDeep: "#0c1512", bgCard: "#14231d", bgHover: "#1d3229", border: "#2a473b",
      borderStrong: "#3d6b57", text: "#e6f0e2", textMuted: "#86a596", textDim: "#aecabb",
      accent: "#5bc0be", secondary: "#c9a227", success: "#7bd389", gold: "#e0c068",
      danger: "#cf6a4c", onAccent: "#0c1512",
    },
    fonts: {
      display: "'MedievalSharp', cursive",
      body: "'Spectral', serif",
      mono: "'Cutive Mono', monospace",
      googleFontsUrl: GF + "family=MedievalSharp&family=Spectral:wght@400;600&family=Cutive+Mono&display=swap",
    },
    effect: { kind: "rune", particleColors: ["#5bc0be", "#c9a227", "#7bd389"], bossGlow: "#5bc0be" },
    sound: sounds("adventure"),
    background: "linear-gradient(180deg,#0f1c17 0%,#0c1512 100%)",
    icons: { learn: "📜", build: "⚒️", create: "🗡️", research: "🧭", practice: "🏹", document: "🗺️", levelUp: "🛡️" },
  },

  cozy: {
    id: "cozy",
    name: "Cozy Farm",
    blurb: "Plant, tend, and grow at a gentle, wholesome pace.",
    inspiredBy: "cozy life-sim",
    tokens: {
      bgDeep: "#fbf6e9", bgCard: "#ffffff", bgHover: "#f3ead2", border: "#e3d5b0",
      borderStrong: "#c9b57e", text: "#4a3f2a", textMuted: "#9a8a63", textDim: "#6f6144",
      accent: "#e0902f", secondary: "#7cb518", success: "#7cb518", gold: "#f2b134",
      danger: "#d1495b", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Fredoka', sans-serif",
      body: "'Nunito', sans-serif",
      mono: "'Nanum Gothic Coding', monospace",
      googleFontsUrl: GF + "family=Fredoka:wght@400;500;600&family=Nunito:wght@400;600;700&family=Nanum+Gothic+Coding&display=swap",
    },
    effect: { kind: "leaf", particleColors: ["#7cb518", "#e0902f", "#f2b134"], bossGlow: "#e0902f" },
    sound: sounds("cozy"),
    background: "linear-gradient(180deg,#fdfaf0 0%,#f3ead2 100%)",
    icons: { learn: "🌱", build: "🔨", create: "🎨", research: "🔍", practice: "🧺", document: "📔", levelUp: "🌾" },
  },

  monster: {
    id: "monster",
    name: "Monster Tamer",
    blurb: "Catch, train, and battle — gotta level 'em all.",
    inspiredBy: "creature collector",
    tokens: {
      bgDeep: "#f2f7ff", bgCard: "#ffffff", bgHover: "#e4edff", border: "#c3d4ee",
      borderStrong: "#8fb0dd", text: "#1b2a4a", textMuted: "#5f7595", textDim: "#3f5578",
      accent: "#ee1515", secondary: "#3b4cca", success: "#4dad5b", gold: "#ffcb05",
      danger: "#ee1515", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Baloo 2', cursive",
      body: "'Poppins', sans-serif",
      mono: "'Roboto Mono', monospace",
      googleFontsUrl: GF + "family=Baloo+2:wght@400;700;800&family=Poppins:wght@400;600&family=Roboto+Mono:wght@400;500&display=swap",
    },
    effect: { kind: "capture", particleColors: ["#ee1515", "#ffcb05", "#3b4cca"], bossGlow: "#ee1515" },
    sound: sounds("monster"),
    background: "linear-gradient(180deg,#f2f7ff 0%,#e4edff 100%)",
    icons: { learn: "📘", build: "🔧", create: "✨", research: "🔎", practice: "⚡", document: "📕", levelUp: "🏅" },
  },

  dropsquad: {
    id: "dropsquad",
    name: "Drop Squad",
    blurb: "Drop in, build up, and grab the Victory crown.",
    inspiredBy: "battle royale",
    tokens: {
      bgDeep: "#0d0a1f", bgCard: "#171233", bgHover: "#221a4a", border: "#322a63",
      borderStrong: "#4a3d8f", text: "#f0edff", textMuted: "#8b82c4", textDim: "#b3aae0",
      accent: "#8a4fff", secondary: "#2ec5ff", success: "#37d67a", gold: "#ffd23f",
      danger: "#ff4d6d", onAccent: "#ffffff",
    },
    fonts: {
      display: "'Teko', sans-serif",
      body: "'Rajdhani', sans-serif",
      mono: "'Chakra Petch', monospace",
      googleFontsUrl: GF + "family=Teko:wght@400;600;700&family=Rajdhani:wght@400;600;700&family=Chakra+Petch:wght@400;600&display=swap",
    },
    effect: { kind: "victory", particleColors: ["#8a4fff", "#2ec5ff", "#ffd23f"], bossGlow: "#8a4fff" },
    sound: sounds("dropsquad"),
    background: "radial-gradient(circle at 50% 0%,#1c1450 0%,#0d0a1f 70%)",
    icons: { learn: "📖", build: "🏗️", create: "🎨", research: "🔍", practice: "🎯", document: "📋", levelUp: "👑" },
  },

  beat: {
    id: "beat",
    name: "Beat Drop",
    blurb: "Feel the rhythm — neon pulses and combo streaks.",
    inspiredBy: "rhythm arcade",
    tokens: {
      bgDeep: "#0a0612", bgCard: "#150c26", bgHover: "#21123a", border: "#331a52",
      borderStrong: "#4d2a7a", text: "#f5ecff", textMuted: "#9a7ac4", textDim: "#c0a3e0",
      accent: "#ff2bd6", secondary: "#00e5ff", success: "#3affc0", gold: "#ffe14d",
      danger: "#ff2b6b", onAccent: "#0a0612",
    },
    fonts: {
      display: "'Audiowide', sans-serif",
      body: "'Rajdhani', sans-serif",
      mono: "'Share Tech Mono', monospace",
      googleFontsUrl: GF + "family=Audiowide&family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&display=swap",
    },
    effect: { kind: "combo", particleColors: ["#ff2bd6", "#00e5ff", "#ffe14d"], bossGlow: "#ff2bd6" },
    sound: sounds("beat"),
    background: "radial-gradient(circle at 50% 100%,#1a0a2e 0%,#0a0612 70%)",
    icons: { learn: "🎧", build: "🎛️", create: "🎨", research: "🔊", practice: "🥁", document: "🎼", levelUp: "🎵" },
  },
};

/** Ordered list for the picker (default first). */
export const THEME_LIST: GameTheme[] = [
  THEMES.space, THEMES.kart, THEMES.puffball, THEMES.block, THEMES.wizard,
  THEMES.hero, THEMES.nightmare, THEMES.zombie, THEMES.adventure, THEMES.cozy,
  THEMES.monster, THEMES.dropsquad, THEMES.beat,
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
