import { StoredTracker, TrackerConfig, TrackerProgress } from "./types";

const STORAGE_KEY = "questforge_tracker_v1";

export const emptyProgress = (): TrackerProgress => ({
  completed: [],
  streak: 0,
  lastDate: "",
});

export function saveTracker(config: TrackerConfig, progress: TrackerProgress): void {
  try {
    const stored: StoredTracker = { config, progress, createdAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {}
}

export function loadTracker(): StoredTracker | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTracker) : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: TrackerProgress): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored: StoredTracker = JSON.parse(raw);
    stored.progress = progress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {}
}

export function clearTracker(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
