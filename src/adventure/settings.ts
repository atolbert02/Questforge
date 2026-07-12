/**
 * Adventure Mode local settings (CRT overlay, reduced effects).
 *
 * Stored separately from tracker data so deleting this feature leaves the
 * tracker's storage untouched. `null` means "auto": follow the user's
 * prefers-reduced-motion setting.
 */

const SETTINGS_KEY = "qf_adventure_settings_v1";

export interface AdventureSettings {
  /** CRT scanline overlay. null = auto (on, unless reduced motion). */
  crt: boolean | null;
  /** Reduce glows, pulses, shakes. null = auto (follows reduced motion). */
  reduceFx: boolean | null;
}

export function loadSettings(): AdventureSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { crt: null, reduceFx: null, ...JSON.parse(raw) };
  } catch {}
  return { crt: null, reduceFx: null };
}

export function saveSettings(s: AdventureSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Resolve the effective values, treating null as "auto from reduced motion". */
export function resolveSettings(s: AdventureSettings) {
  const prm = prefersReducedMotion();
  return {
    crt: s.crt ?? !prm,
    reduceFx: s.reduceFx ?? prm,
  };
}
