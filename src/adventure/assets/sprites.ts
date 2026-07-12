/**
 * Placeholder pixel art, generated at runtime — zero binary assets shipped.
 *
 * Every sprite is drawn from a small character-grid template onto a canvas,
 * using at most 3 opaque colors from one fixed 16-color palette (a classic
 * NES-style constraint), then handed to Pixi with nearest-neighbor scaling.
 *
 * SWAPPING IN REAL ART (e.g. Kenney CC0 isometric packs): put PNGs under
 * public/adventure/ and set the `url` field on the matching MANIFEST entry.
 * The loader prefers `url` over `generate`. See ../README.md.
 */

export const PALETTE = {
  ink: "#0f0f1b",
  navy: "#1b2a5e",
  blue: "#3f6ad8",
  sky: "#7ec8e8",
  pine: "#1e6f50",
  green: "#3fb950",
  lime: "#a8e72e",
  soil: "#7a4a24",
  tan: "#c98f4e",
  sand: "#e8d5a0",
  ember: "#d13b27",
  orange: "#ef8f2f",
  gold: "#f7d51d",
  violet: "#7b4dbb",
  slate: "#8a8fa3",
  bone: "#f4f4ec",
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const TILE_W = 32;
export const TILE_H = 16;
export const TILE_DEPTH = 10;

/**
 * Draw a character-grid template. Chars 1/2/3 map to palette colors.
 * Sprites get a 1px ink outline (classic NES readability against any tile).
 */
function fromTemplate(rows: string[], colors: [PaletteKey, PaletteKey?, PaletteKey?]): HTMLCanvasElement {
  const h = rows.length;
  const w = rows[0].length;
  const filled = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const ch = rows[y][x];
    return ch !== "." && ch !== " ";
  };
  const c = document.createElement("canvas");
  c.width = w + 2;
  c.height = h + 2;
  const g = c.getContext("2d")!;
  g.fillStyle = PALETTE.ink;
  for (let y = -1; y <= h; y++) {
    for (let x = -1; x <= w; x++) {
      if (filled(x, y)) continue;
      if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) {
        g.fillRect(x + 1, y + 1, 1, 1);
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      const key = colors[Number(ch) - 1];
      if (!key) continue;
      g.fillStyle = PALETTE[key];
      g.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  return c;
}

/** Deterministic tiny hash for speckle patterns. */
function speck(x: number, y: number): boolean {
  return ((x * 31 + y * 17 + ((x * y) % 7)) % 13) === 0;
}

/**
 * An isometric floor tile: diamond top face + extruded left/right side faces.
 * 3 colors: top, speckle, side.
 */
function makeTile(top: PaletteKey, dot: PaletteKey, side: PaletteKey): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TILE_W;
  c.height = TILE_H + TILE_DEPTH;
  const g = c.getContext("2d")!;
  const rowW = (r: number) => (r < TILE_H / 2 ? 4 * (r + 1) : 4 * (TILE_H - r));
  // Side faces: the bottom half of the diamond, extruded down.
  g.fillStyle = PALETTE[side];
  for (let r = TILE_H / 2; r < TILE_H; r++) {
    const w = rowW(r);
    g.fillRect(TILE_W / 2 - w / 2, r, w, TILE_DEPTH);
  }
  // Top face.
  g.fillStyle = PALETTE[top];
  for (let r = 0; r < TILE_H; r++) {
    const w = rowW(r);
    g.fillRect(TILE_W / 2 - w / 2, r, w, 1);
  }
  // Speckles on the top face.
  g.fillStyle = PALETTE[dot];
  for (let r = 2; r < TILE_H - 2; r++) {
    const w = rowW(r) - 4;
    for (let x = TILE_W / 2 - w / 2; x < TILE_W / 2 + w / 2; x += 2) {
      if (speck(x, r)) g.fillRect(x, r, 2, 1);
    }
  }
  return c;
}

/** Zone tile variants cycle by phase index: grass, sand, stone, snow, ember, violet. */
export const TILE_VARIANTS: [PaletteKey, PaletteKey, PaletteKey][] = [
  ["green", "lime", "pine"],
  ["sand", "tan", "soil"],
  ["slate", "bone", "navy"],
  ["bone", "sky", "slate"],
  ["orange", "gold", "ember"],
  ["violet", "blue", "navy"],
];

const CHEST_CLOSED = [
  "................",
  "....11111111....",
  "...1222222221...",
  "...1222222221...",
  "...1111111111...",
  "...1222332221...",
  "...1222332221...",
  "...1222222221...",
  "...1111111111...",
  "................",
];

const CHEST_OPEN = [
  "...1111111111...",
  "...1333333331...",
  "...1333333331...",
  "...1111111111...",
  "....12222221....",
  "...1222222221...",
  "...1222222221...",
  "...1222222221...",
  "...1111111111...",
  "................",
];

const NPC = [
  "....1111....",
  "...111111...",
  "...133331...",
  "...133331...",
  "....1111....",
  "..22222222..",
  ".2222222222.",
  ".2232222322.",
  ".2222222222.",
  "..22222222..",
  "...222222...",
  "...22..22...",
  "...11..11...",
];

const SHRINE = [
  "......33......",
  ".....3333.....",
  "......33......",
  "....111111....",
  "...11222211...",
  "...12222221...",
  "...12222221...",
  "...11222211...",
  "....111111....",
  "..1111111111..",
  ".111111111111.",
];

const HERO_A = [
  "...1111...",
  "..111111..",
  "..133331..",
  "..133331..",
  "...1111...",
  "..222222..",
  ".22222222.",
  ".22222222.",
  "..222222..",
  "...2..2...",
  "...1..1...",
  "..11..11..",
];

const HERO_B = [
  "...1111...",
  "..111111..",
  "..133331..",
  "..133331..",
  "...1111...",
  "..222222..",
  ".22222222.",
  ".22222222.",
  "..222222..",
  "..2....2..",
  "..1....1..",
  ".11....11.",
];

const BOSS = [
  ".....2........2.....",
  "....22........22....",
  "...222222222222.....",
  "..22222222222222....",
  ".222332222223322....",
  ".222332222223322....",
  ".222222222222222222.",
  ".222222112211222222.",
  ".2222221122112222...",
  ".222222222222222....",
  "..2222222222222.....",
  "...22.222222.22.....",
  "...22..2222..22.....",
  "..222..2222..222....",
];

const BOSS_DOWN = [
  "....................",
  "......111111........",
  ".....11222211.......",
  ".....12222221.......",
  ".....12233221.......",
  ".....12233221.......",
  ".....12222221.......",
  "....111111111.......",
  "...11111111111......",
];

const GATE = [
  ".11..........11.",
  ".111111111111111",
  ".112222222222211",
  ".112222222222211",
  ".112211221122211",
  ".112211221122211",
  ".112211221122211",
  ".112211221122211",
  ".112211221122211",
  ".112211221122211",
  ".11..........11.",
  ".11..........11.",
];

const FLAG = [
  ".1........",
  ".122222...",
  ".12233222.",
  ".12222222.",
  ".1223322..",
  ".122222...",
  ".1........",
  ".1........",
  ".1........",
  ".1........",
  ".1........",
  ".1........",
];

const TREE = [
  ".....1111.....",
  "...11111111...",
  "..1111111111..",
  "..1121111211..",
  "..1111111111..",
  "...11111111...",
  ".....1111.....",
  "......33......",
  "......33......",
  ".....3333.....",
];

export type SpriteKey =
  | "chestClosed"
  | "chestOpen"
  | "npc"
  | "npcDone"
  | "shrine"
  | "shrineLit"
  | "heroA"
  | "heroB"
  | "boss"
  | "bossDown"
  | "gate"
  | "flag"
  | "flagLit"
  | "tree";

export interface SpriteSource {
  generate: () => HTMLCanvasElement;
  /** Set to a public/ path (e.g. "/adventure/chest.png") to use real art. */
  url?: string;
}

/** Hero tunic color follows the rank tier (level index, cycling). */
export const HERO_TIER_COLORS: PaletteKey[] = ["blue", "violet", "orange", "ember", "gold", "bone"];

export function makeHero(frame: "A" | "B", tunic: PaletteKey): HTMLCanvasElement {
  return fromTemplate(frame === "A" ? HERO_A : HERO_B, ["soil", tunic, "tan"]);
}

export const MANIFEST: Record<SpriteKey, SpriteSource> = {
  chestClosed: { generate: () => fromTemplate(CHEST_CLOSED, ["soil", "tan", "gold"]) },
  chestOpen: { generate: () => fromTemplate(CHEST_OPEN, ["soil", "tan", "gold"]) },
  npc: { generate: () => fromTemplate(NPC, ["tan", "blue", "bone"]) },
  npcDone: { generate: () => fromTemplate(NPC, ["tan", "slate", "bone"]) },
  shrine: { generate: () => fromTemplate(SHRINE, ["slate", "navy", "violet"]) },
  shrineLit: { generate: () => fromTemplate(SHRINE, ["slate", "sky", "gold"]) },
  heroA: { generate: () => makeHero("A", "blue") },
  heroB: { generate: () => makeHero("B", "blue") },
  boss: { generate: () => fromTemplate(BOSS, ["bone", "ember", "gold"]) },
  bossDown: { generate: () => fromTemplate(BOSS_DOWN, ["slate", "navy", "bone"]) },
  gate: { generate: () => fromTemplate(GATE, ["slate", "soil", "ink"]) },
  flag: { generate: () => fromTemplate(FLAG, ["slate", "navy", "slate"]) },
  flagLit: { generate: () => fromTemplate(FLAG, ["soil", "gold", "ember"]) },
  tree: { generate: () => fromTemplate(TREE, ["pine", "lime", "soil"]) },
};

export function makeTileVariant(variant: number): HTMLCanvasElement {
  const [top, dot, side] = TILE_VARIANTS[variant % TILE_VARIANTS.length];
  return makeTile(top, dot, side);
}

/** Bridge plank tile connecting zones. */
export function makeBridgeTile(): HTMLCanvasElement {
  return makeTile("tan", "soil", "soil");
}
