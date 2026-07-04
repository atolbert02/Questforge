"use client";
import { useState, useRef, useEffect } from "react";
import { TrackerConfig, TrackerProgress } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { saveProgress } from "@/lib/tracker-storage";
import { evaluateAchievements } from "@/lib/achievements";
import { exportTrackerHTML } from "@/lib/export-html";
import { playThemeEffect } from "./effects/theme-effect";
import { playThemeSound, isMuted, setMuted } from "@/lib/use-theme-sound";
import Dashboard from "./Dashboard";
import QuestList from "./QuestList";
import SkillTree from "./SkillTree";
import Roadmap from "./Roadmap";
import Achievements from "./Achievements";

type Tab = "dashboard" | "quests" | "skills" | "roadmap" | "achievements";

interface Props {
  config: TrackerConfig;
  initialProgress: TrackerProgress;
  onNewTracker?: () => void;
  /** Read-only mode used while the tracker is still being generated. */
  preview?: boolean;
}

export function getLevel(xp: number, levels: TrackerConfig["levels"]) {
  let idx = 0;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].min) idx = i;
  }
  return { idx, level: levels[idx], next: levels[idx + 1] };
}

export default function TrackerShell({ config, initialProgress, onNewTracker, preview = false }: Props) {
  const [progress, setProgress] = useState<TrackerProgress>(initialProgress);
  const [activeTab, setActiveTab] = useState<Tab>(preview ? "quests" : "dashboard");
  const [toast, setToast] = useState("");
  const [muted, setMutedState] = useState(false);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const theme = getTheme(config.themeId);
  const t = theme.tokens;
  const f = theme.fonts;

  // Load the active theme's Google Fonts (only this theme's families).
  useEffect(() => {
    const linkId = "qf-active-theme-font";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = f.googleFontsUrl;
  }, [f.googleFontsUrl]);

  const completedSet = new Set(progress.completed);
  const totalXP = config.quests
    .filter((q) => completedSet.has(q.id))
    .reduce((sum, q) => sum + q.xp, 0);
  const { idx: levelIdx, level, next } = getLevel(totalXP, config.levels);
  const unlockedSet = evaluateAchievements(config.achievements, config.quests, progress);
  const xpPct = next ? Math.round(((totalXP - level.min) / (next.min - level.min)) * 100) : 100;

  useEffect(() => {
    prevUnlockedRef.current = new Set(unlockedSet);
  });

  // Sync mute state from storage + track pointer for the burst origin.
  useEffect(() => {
    setMutedState(isMuted());
    const onPointer = (e: PointerEvent) => { pointerRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointerdown", onPointer, true);
    return () => window.removeEventListener("pointerdown", onPointer, true);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function toggleQuest(id: string) {
    if (preview) return; // interactions disabled while generating
    const completing = !completedSet.has(id);
    const newCompleted = completing
      ? [...progress.completed, id]
      : progress.completed.filter((c) => c !== id);
    const newProgress = { ...progress, completed: newCompleted };
    setProgress(newProgress);
    saveProgress(newProgress);
    if (completing) {
      const q = config.quests.find((q) => q.id === id);
      showToast(`Quest complete! +${q?.xp ?? 0} XP`);

      // Themed burst + sound at the click point.
      const { x, y } = pointerRef.current;
      playThemeEffect(theme, x || window.innerWidth / 2, y || window.innerHeight / 3);
      playThemeSound(theme, "complete");

      // Detect a level-up from the new XP total and celebrate it too.
      const newXP = config.quests.filter((qq) => new Set(newCompleted).has(qq.id)).reduce((s, qq) => s + qq.xp, 0);
      const newLevel = getLevel(newXP, config.levels);
      if (newLevel.idx > levelIdx) {
        setTimeout(() => {
          playThemeEffect(theme, window.innerWidth / 2, window.innerHeight / 3);
          playThemeSound(theme, "levelUp");
          showToast(`${theme.icons.levelUp} Level up — ${newLevel.level.title}!`);
        }, 550);
      }
    }
  }

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }

  const accent = config.theme?.accent ?? t.accent;

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "quests", label: "Quests" },
    { key: "skills", label: "Skills" },
    { key: "roadmap", label: "Roadmap" },
    { key: "achievements", label: "Achievements" },
  ];

  return (
    <div style={{ background: theme.background ?? t.bgDeep, color: t.text, fontFamily: f.body, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: f.display, color: accent, fontSize: "1.3rem", marginBottom: "2px" }}>
                {config.projectTitle}
              </h1>
              <div style={{ color: t.textMuted, fontSize: "0.85rem" }}>{config.tagline}</div>
              <div style={{ marginTop: "10px" }}>
                <div style={{ background: t.border, borderRadius: "4px", height: "8px", maxWidth: "360px" }}>
                  <div style={{ background: accent, height: "8px", borderRadius: "4px", width: `${xpPct}%`, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", maxWidth: "360px", marginTop: "4px" }}>
                  <span style={{ fontFamily: f.mono, fontSize: "0.72rem", color: t.textMuted }}>{level.title}</span>
                  <span style={{ fontFamily: f.mono, fontSize: "0.72rem", color: t.textMuted }}>
                    {next ? `${totalXP} / ${next.min} XP` : `${totalXP} XP (MAX)`}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={toggleMute}
                title={muted ? "Unmute sounds" : "Mute sounds"}
                aria-label={muted ? "Unmute sounds" : "Mute sounds"}
                style={{ background: "transparent", color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", fontSize: "0.9rem", lineHeight: 1 }}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              {!preview && (
                <>
                  <button
                    onClick={() => exportTrackerHTML(config, progress)}
                    style={{ background: t.border, color: t.text, border: `1px solid ${t.borderStrong}`, borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    Download HTML
                  </button>
                  <button
                    onClick={onNewTracker}
                    style={{ background: "transparent", color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem" }}
                  >
                    New Tracker
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", gap: "0", overflowX: "auto" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "14px 20px", background: "transparent", border: "none",
                borderBottom: activeTab === tab.key ? `2px solid ${accent}` : "2px solid transparent",
                color: activeTab === tab.key ? accent : t.textMuted,
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        {activeTab === "dashboard" && <Dashboard config={config} progress={progress} completedSet={completedSet} totalXP={totalXP} level={level} unlockedSet={unlockedSet} onToggle={toggleQuest} />}
        {activeTab === "quests" && <QuestList config={config} completedSet={completedSet} onToggle={toggleQuest} preview={preview} />}
        {activeTab === "skills" && <SkillTree config={config} completedSet={completedSet} />}
        {activeTab === "roadmap" && <Roadmap config={config} completedSet={completedSet} />}
        {activeTab === "achievements" && <Achievements config={config} completedSet={completedSet} unlockedSet={unlockedSet} prevUnlockedSet={prevUnlockedRef.current} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          background: t.success, color: t.onAccent, padding: "12px 24px",
          borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", zIndex: 999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
