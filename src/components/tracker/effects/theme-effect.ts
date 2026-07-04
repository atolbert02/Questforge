import { GameTheme, EffectKind } from "@/lib/themes";

/**
 * Imperative, dependency-free themed particle burst.
 *
 * `playThemeEffect(theme, x, y)` spawns a short-lived overlay of particles
 * (and, for some themes, a comic-style banner) at the given screen point,
 * animated with the Web Animations API and cleaned up automatically.
 *
 * It's intentionally standalone (no React state) so any handler can fire it.
 */

type Shape = "dot" | "square" | "emoji";

interface EffectConfig {
  count: number;
  shape: Shape;
  emojis?: string[];
  /** Downward pull (px). Negative floats up (embers/leaves). */
  gravity: number;
  /** Initial spread velocity. */
  velocity: number;
  size: [number, number];
  /** Optional centered banner word. */
  banner?: string;
}

const CONFIG: Record<EffectKind, EffectConfig> = {
  confetti: { count: 26, shape: "square", gravity: 260, velocity: 260, size: [6, 11] },
  coin:     { count: 18, shape: "emoji", emojis: ["🪙", "⭐"], gravity: 300, velocity: 240, size: [16, 22] },
  star:     { count: 20, shape: "emoji", emojis: ["⭐", "✨", "💫"], gravity: 120, velocity: 220, size: [14, 22] },
  block:    { count: 16, shape: "square", gravity: 340, velocity: 200, size: [9, 14] },
  spell:    { count: 22, shape: "emoji", emojis: ["✨", "🔮", "✦"], gravity: 40, velocity: 200, size: [12, 20], banner: "✦ Spell cast! ✦" },
  pow:      { count: 22, shape: "square", gravity: 200, velocity: 300, size: [7, 13], banner: "POW!" },
  ember:    { count: 20, shape: "dot", gravity: -140, velocity: 150, size: [4, 8] },
  glitch:   { count: 24, shape: "square", gravity: 60, velocity: 320, size: [5, 16], banner: "⚠ CLEARED" },
  rune:     { count: 18, shape: "emoji", emojis: ["✦", "❖", "⟡"], gravity: 60, velocity: 200, size: [14, 20] },
  leaf:     { count: 18, shape: "emoji", emojis: ["🍃", "🌿", "🍂"], gravity: -60, velocity: 150, size: [14, 20] },
  capture:  { count: 20, shape: "emoji", emojis: ["⚡", "✨"], gravity: 160, velocity: 250, size: [14, 22], banner: "Gotcha!" },
  victory:  { count: 30, shape: "square", gravity: 240, velocity: 300, size: [7, 12], banner: "VICTORY!" },
  combo:    { count: 22, shape: "dot", gravity: 120, velocity: 280, size: [6, 12], banner: "COMBO!" },
};

function overlay(): HTMLElement {
  let el = document.getElementById("qf-fx-layer");
  if (!el) {
    el = document.createElement("div");
    el.id = "qf-fx-layer";
    el.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:1000;overflow:hidden;";
    document.body.appendChild(el);
  }
  return el;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function playThemeEffect(theme: GameTheme, x: number, y: number): void {
  if (typeof document === "undefined") return;
  const cfg = CONFIG[theme.effect.kind] ?? CONFIG.confetti;
  const colors = theme.effect.particleColors;
  const layer = overlay();

  for (let i = 0; i < cfg.count; i++) {
    const p = document.createElement("span");
    const size = rand(cfg.size[0], cfg.size[1]);
    const color = colors[i % colors.length];
    p.style.cssText = `position:absolute;left:${x}px;top:${y}px;will-change:transform,opacity;pointer-events:none;`;

    if (cfg.shape === "emoji" && cfg.emojis) {
      p.textContent = cfg.emojis[i % cfg.emojis.length];
      p.style.fontSize = `${size}px`;
      p.style.lineHeight = "1";
    } else {
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = color;
      p.style.borderRadius = cfg.shape === "dot" ? "50%" : "2px";
    }

    const angle = rand(0, Math.PI * 2);
    const speed = rand(cfg.velocity * 0.35, cfg.velocity);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed - cfg.velocity * 0.4;
    const spin = rand(-360, 360);
    const dur = rand(650, 1050);

    layer.appendChild(p);
    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy + cfg.gravity}px) rotate(${spin}deg)`,
          opacity: 0,
        },
      ],
      { duration: dur, easing: "cubic-bezier(0.25,0.6,0.4,1)", fill: "forwards" }
    ).finished.then(() => p.remove()).catch(() => p.remove());
  }

  if (cfg.banner) showBanner(theme, cfg.banner);
}

function showBanner(theme: GameTheme, text: string): void {
  const layer = overlay();
  const b = document.createElement("div");
  b.textContent = text;
  b.style.cssText = [
    "position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);",
    `font-family:${theme.fonts.display};`,
    `color:${theme.tokens.accent};`,
    "font-size:clamp(2.2rem,9vw,4.5rem);font-weight:900;letter-spacing:1px;",
    `text-shadow:0 2px 0 ${theme.tokens.onAccent}, 0 0 24px ${theme.tokens.accent}88;`,
    "pointer-events:none;white-space:nowrap;",
  ].join("");
  layer.appendChild(b);
  b.animate(
    [
      { transform: "translate(-50%,-50%) scale(0.4) rotate(-6deg)", opacity: 0 },
      { transform: "translate(-50%,-50%) scale(1.15) rotate(-3deg)", opacity: 1, offset: 0.35 },
      { transform: "translate(-50%,-50%) scale(1) rotate(0deg)", opacity: 1, offset: 0.7 },
      { transform: "translate(-50%,-60%) scale(1) rotate(0deg)", opacity: 0 },
    ],
    { duration: 1100, easing: "cubic-bezier(0.2,0.8,0.3,1)", fill: "forwards" }
  ).finished.then(() => b.remove()).catch(() => b.remove());
}
