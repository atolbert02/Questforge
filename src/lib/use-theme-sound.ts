import { GameTheme, EffectKind } from "./themes";

/**
 * Themed sound effects, synthesized live with the Web Audio API.
 *
 * We generate short tones in-browser (no audio files) so every cue is
 * original, instant, and free of licensing concerns. Each theme's effect kind
 * maps to a little musical recipe; a global mute flag lives in localStorage.
 */

const MUTE_KEY = "qf_muted";

export function isMuted(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {}
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type Wave = OscillatorType;
interface Note { f: number; t: number; d: number; }

/** Play a sequence of notes with a quick attack/decay envelope. */
function playSeq(notes: Note[], wave: Wave, peak = 0.16): void {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(n.f, now + n.t);
    g.gain.setValueAtTime(0, now + n.t);
    g.gain.linearRampToValueAtTime(peak, now + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    osc.connect(g).connect(ac.destination);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.02);
  }
}

/** Play a short pitch sweep (glide). */
function playSweep(from: number, to: number, dur: number, wave: Wave, peak = 0.16): void {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), now + dur);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

// Per-effect "complete" recipes.
const RECIPES: Record<EffectKind, () => void> = {
  coin:    () => playSeq([{ f: 988, t: 0, d: 0.08 }, { f: 1319, t: 0.08, d: 0.16 }], "square"),
  confetti:() => playSeq([{ f: 660, t: 0, d: 0.1 }, { f: 990, t: 0.07, d: 0.14 }], "triangle"),
  star:    () => playSweep(520, 1180, 0.32, "triangle"),
  block:   () => playSeq([{ f: 180, t: 0, d: 0.09 }, { f: 130, t: 0.06, d: 0.12 }], "square", 0.2),
  spell:   () => playSeq([{ f: 587, t: 0, d: 0.12 }, { f: 784, t: 0.09, d: 0.12 }, { f: 1047, t: 0.18, d: 0.2 }], "triangle"),
  pow:     () => playSeq([{ f: 220, t: 0, d: 0.06 }, { f: 440, t: 0.05, d: 0.14 }], "sawtooth", 0.18),
  ember:   () => playSweep(300, 160, 0.34, "sine", 0.14),
  glitch:  () => playSeq([{ f: 880, t: 0, d: 0.05 }, { f: 610, t: 0.05, d: 0.05 }, { f: 940, t: 0.1, d: 0.08 }], "square", 0.13),
  rune:    () => playSeq([{ f: 523, t: 0, d: 0.22 }, { f: 659, t: 0, d: 0.22 }, { f: 784, t: 0, d: 0.22 }], "sine", 0.1),
  leaf:    () => playSeq([{ f: 784, t: 0, d: 0.12 }, { f: 988, t: 0.08, d: 0.16 }], "triangle", 0.12),
  capture: () => playSeq([{ f: 440, t: 0, d: 0.08 }, { f: 330, t: 0.07, d: 0.08 }, { f: 660, t: 0.15, d: 0.16 }], "square"),
  victory: () => playSeq([{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.1, d: 0.12 }, { f: 784, t: 0.2, d: 0.12 }, { f: 1047, t: 0.3, d: 0.24 }], "sawtooth", 0.14),
  combo:   () => playSeq([{ f: 700, t: 0, d: 0.06 }, { f: 900, t: 0.06, d: 0.06 }, { f: 1150, t: 0.12, d: 0.12 }], "square", 0.14),
};

export type SoundEvent = "complete" | "achievement" | "levelUp";

export function playThemeSound(theme: GameTheme, event: SoundEvent): void {
  if (isMuted()) return;
  try {
    if (event === "complete") {
      (RECIPES[theme.effect.kind] ?? RECIPES.confetti)();
    } else if (event === "achievement") {
      // A fuller triumphant triad, tinted by the theme's waveform feel.
      playSeq(
        [{ f: 523, t: 0, d: 0.16 }, { f: 659, t: 0.12, d: 0.16 }, { f: 784, t: 0.24, d: 0.16 }, { f: 1047, t: 0.36, d: 0.3 }],
        "triangle",
        0.16
      );
    } else {
      playSweep(392, 1046, 0.4, "triangle", 0.16);
    }
  } catch {}
}
