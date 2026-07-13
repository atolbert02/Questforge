/**
 * Per-theme Adventure Mode styling.
 *
 * Adventure Mode used to be one fixed pixel skin. This maps the active theme
 * (config.themeId) to a "style profile" that drives the overworld background,
 * ground tile colors, overlay mood, chrome, and font — so Kart/Kirby feel
 * smooth and bright while Nightmare/Zombie feel like a hand-drawn sketch.
 *
 * The pixel sprites (hero, chests, trees) stay as-is; per-theme feel comes
 * from background + tiles + overlay + chrome + font (+ a sketch filter).
 */
import { GameTheme, ThemeId, themePhaseColors } from "@/lib/themes";

export type AdventureProfile = "pixel" | "smooth" | "sketch" | "neon";

/** Which visual family each theme's overworld adopts. */
const PROFILE_BY_THEME: Record<ThemeId, AdventureProfile> = {
  block: "pixel",
  kart: "smooth",
  puffball: "smooth",
  cozy: "smooth",
  hero: "smooth",
  monster: "smooth",
  adventure: "smooth",
  wizard: "smooth",
  nightmare: "sketch",
  zombie: "sketch",
  space: "neon",
  dropsquad: "neon",
  reef: "smooth",
  kitty: "smooth",
  elysian: "smooth",
};

export interface AdventureChrome {
  panelBg: string;
  border: string;
  borderWidth: number;
  radius: number;
  shadow: string;
  text: string;
  accent: string;
  font: string;
  pixelated: boolean;
}

export interface AdventureStyle {
  profile: AdventureProfile;
  /** Overworld backdrop (Pixi renderer background). */
  background: string;
  /** Per-zone ground tiles as [top, speckle, side] hex triples. */
  tiles: [string, string, string][];
  overlay: "crt" | "scanline" | "paper" | "none";
  sketch: boolean;
  fontFamily: string;
  fontUrl: string;
  chrome: AdventureChrome;
  accent: string;
}

const PIXEL_FONT = "'Press Start 2P', monospace";
const PIXEL_FONT_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

const clamp = (n: number) => Math.max(0, Math.min(255, n));

/** Lighten (amt>0) or darken (amt<0) a hex color; amt in -1..1. */
function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const f = (v: number) => (amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  const to = (v: number) => clamp(Math.round(f(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function getAdventureStyle(theme: GameTheme): AdventureStyle {
  const t = theme.tokens;
  const profile = PROFILE_BY_THEME[theme.id] ?? "pixel";
  const isPixel = profile === "pixel";

  // One tile triple per phase color, so each zone's ground matches the theme.
  const tiles = themePhaseColors(theme, 6).map(
    (c) => [c, shade(c, 0.28), shade(c, -0.32)] as [string, string, string]
  );

  const overlay =
    profile === "sketch" ? "paper" : profile === "neon" ? "crt" : profile === "pixel" ? "scanline" : "none";

  const chrome: AdventureChrome = {
    panelBg: t.bgCard,
    border: isPixel ? t.text : t.borderStrong,
    borderWidth: profile === "smooth" ? 2 : 3,
    radius: profile === "smooth" ? 14 : profile === "sketch" ? 3 : 0,
    shadow:
      profile === "neon"
        ? `0 0 18px ${t.accent}66`
        : profile === "smooth"
        ? "0 8px 24px rgba(0,0,0,0.25)"
        : `4px 4px 0 ${t.bgDeep}`,
    text: t.text,
    accent: t.accent,
    font: isPixel ? PIXEL_FONT : theme.fonts.display,
    pixelated: isPixel,
  };

  return {
    profile,
    background: t.bgDeep,
    tiles,
    overlay,
    sketch: profile === "sketch",
    fontFamily: isPixel ? PIXEL_FONT : theme.fonts.display,
    fontUrl: isPixel ? PIXEL_FONT_URL : theme.fonts.googleFontsUrl,
    chrome,
    accent: t.accent,
  };
}
