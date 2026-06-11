import { TrackerConfig, Quest } from "./types";

/**
 * Orchestrates phased tracker generation entirely from the client:
 *   1. POST /api/generate/skeleton      (file/text -> skeleton + projectText)
 *   2. POST /api/generate/phase  xN     (parallel, one per phase, with retry)
 *   3. POST /api/generate/achievements  (after quest IDs exist)
 *   4. assemble -> validate happens in the caller
 *
 * onProgress is called with a 0..1 fraction and a human label so the UI can
 * show real progress instead of a fake spinner.
 */

export interface GenerateInput {
  name: string;
  file?: File | null;
  text?: string;
}

type Progress = (fraction: number, label: string) => void;

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Request to ${url} failed`);
  return data as T;
}

interface Skeleton {
  projectTitle: string;
  tagline: string;
  characterName: string;
  duration: string;
  theme: { accent: string; secondary: string };
  levels: { min: number; title: string }[];
  phases: { id: number; label: string; dates: string; color: string; tagline: string }[];
  skills: { id: string; label: string; icon: string; color: string }[];
}

async function fetchPhaseWithRetry(
  body: unknown,
  retries = 1
): Promise<{ phaseId: number; quests: Quest[] }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await postJSON<{ phaseId: number; quests: Quest[] }>("/api/generate/phase", body);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function generateTracker(
  input: GenerateInput,
  onProgress: Progress
): Promise<TrackerConfig> {
  /* 1. Skeleton — multipart because it may carry a file. */
  onProgress(0.05, "Reading your project plan...");
  const fd = new FormData();
  fd.append("name", input.name);
  if (input.file) fd.append("file", input.file);
  else fd.append("text", input.text ?? "");

  const skelRes = await fetch("/api/generate/skeleton", { method: "POST", body: fd });
  const skelData = await skelRes.json();
  if (!skelRes.ok || skelData.error) {
    throw new Error(skelData.error || "Could not analyze your project plan.");
  }
  const skeleton: Skeleton = skelData.skeleton;
  const projectText: string = skelData.projectText;

  onProgress(0.25, "Mapping out your phases...");

  /* 2. Phases in parallel. Progress ticks up as each one resolves. */
  const skillIds = skeleton.skills.map((s) => s.id);
  const total = skeleton.phases.length;
  let done = 0;

  const phasePromises = skeleton.phases.map((p) =>
    fetchPhaseWithRetry({
      phaseId: p.id,
      phaseLabel: p.label,
      phaseTagline: p.tagline,
      phaseDates: p.dates,
      projectTitle: skeleton.projectTitle,
      projectSummary: skeleton.tagline,
      skillIds,
      projectText,
    }).then((res) => {
      done++;
      onProgress(0.25 + 0.55 * (done / total), `Forging quests (${done}/${total} phases)...`);
      return res;
    })
  );

  const phaseResults = await Promise.all(phasePromises);

  // Assemble quests in phase order so the tracker reads top-to-bottom.
  const quests: Quest[] = phaseResults
    .sort((a, b) => a.phaseId - b.phaseId)
    .flatMap((r) => r.quests);

  /* 3. Achievements — needs real quest IDs. Non-fatal if it returns empty. */
  onProgress(0.85, "Crafting achievements...");
  let achievements: TrackerConfig["achievements"] = [];
  try {
    const achRes = await postJSON<{ achievements: TrackerConfig["achievements"] }>(
      "/api/generate/achievements",
      {
        projectTitle: skeleton.projectTitle,
        quests: quests.map((q) => ({ id: q.id, phase: q.phase, boss: q.boss, name: q.name })),
        phases: skeleton.phases.map((p) => ({ id: p.id, label: p.label })),
      }
    );
    achievements = achRes.achievements ?? [];
  } catch (err) {
    console.error("Achievements step failed, continuing without:", err);
  }

  onProgress(0.97, "Finalizing your tracker...");

  /* 4. Assemble the full config. */
  const config: TrackerConfig = {
    projectTitle: skeleton.projectTitle,
    tagline: skeleton.tagline,
    characterName: skeleton.characterName,
    duration: skeleton.duration,
    theme: skeleton.theme,
    levels: skeleton.levels,
    phases: skeleton.phases,
    skills: skeleton.skills,
    quests,
    achievements,
  };

  onProgress(1, "Done!");
  return config;
}
