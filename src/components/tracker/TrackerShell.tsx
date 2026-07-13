"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { TrackerConfig, TrackerProgress } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { saveProgress } from "@/lib/tracker-storage";
import { evaluateAchievements } from "@/lib/achievements";
import { exportTrackerHTML } from "@/lib/export-html";
import { playThemeEffect } from "./effects/theme-effect";
import { playThemeSound, isMuted, setMuted } from "@/lib/use-theme-sound";
// Adventure Mode is fully code-split: pixi.js and all game code load only
// when the toggle is pressed. Delete src/adventure/ + this block to remove it.
const AdventureMode = dynamic(() => import("@/adventure/AdventureMode"), {
  ssr: false,
  loading: () => (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0f0f1b", display: "flex", alignItems: "center", justifyContent: "center", color: "#f4f4ec", fontFamily: "monospace", fontSize: "0.85rem" }}>
      Entering the overworld…
    </div>
  ),
});

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
  const [adventureOpen, setAdventureOpen] = useState(false);
  const prevUnlockedRef = useRef<Set<string>>(new Set());
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showCompletion, setShowCompletion] = useState(false);
  const celebratedRef = useRef(false);

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

      // 100% completion: every quest done AND every achievement unlocked. Fires once.
      const newUnlocked = evaluateAchievements(config.achievements, config.quests, newProgress);
      const allDone =
        config.quests.length > 0 &&
        new Set(newCompleted).size === config.quests.length &&
        newUnlocked.size === config.achievements.length;
      if (allDone && !celebratedRef.current) {
        celebratedRef.current = true;
        [200, 500, 800, 1100, 1400].forEach((d) =>
          setTimeout(
            () =>
              playThemeEffect(
                theme,
                window.innerWidth * (0.25 + Math.random() * 0.5),
                window.innerHeight * (0.2 + Math.random() * 0.35)
              ),
            d
          )
        );
        setTimeout(() => playThemeSound(theme, "levelUp"), 250);
        setTimeout(() => setShowCompletion(true), 700);
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
                    onClick={() => setAdventureOpen(true)}
                    title="Explore your quests as an isometric world"
                    style={{ background: accent, color: t.onAccent, border: `1px solid ${t.borderStrong}`, borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
                  >
                    ⚔️ Adventure
                  </button>
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

      {/* Adventure Mode — same state, different view. See src/adventure/README.md */}
      {adventureOpen && !preview && (
        <AdventureMode
          config={config}
          progress={progress}
          onToggleQuest={toggleQuest}
          onClose={() => setAdventureOpen(false)}
        />
      )}

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

      {showCompletion && (
        <CompletionScreen
          theme={theme}
          totalXP={totalXP}
          questCount={config.quests.length}
          achievementCount={config.achievements.length}
          finalTitle={level.title}
          onClose={() => setShowCompletion(false)}
          onDownload={() => exportTrackerHTML(config, progress)}
        />
      )}
    </div>
  );
}

/** Full-screen themed celebration shown once the tracker hits 100%. */
function CompletionScreen({
  theme, totalXP, questCount, achievementCount, finalTitle, onClose, onDownload,
}: {
  theme: ReturnType<typeof getTheme>;
  totalXP: number;
  questCount: number;
  achievementCount: number;
  finalTitle: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const t = theme.tokens;
  const f = theme.fonts;
  const stat = (value: string | number, label: string) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: f.display, fontSize: "1.6rem", color: t.accent }}>{value}</div>
      <div style={{ fontFamily: f.mono, fontSize: "0.65rem", color: t.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px" }}>{label}</div>
    </div>
  );
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        animation: "qfCompFade 0.4s ease",
      }}
    >
      <style>{`
        @keyframes qfCompFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes qfCompPop { 0% { transform: scale(0.85); opacity: 0 } 60% { transform: scale(1.03) } 100% { transform: scale(1); opacity: 1 } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, calc(100vw - 40px))", background: t.bgCard,
          border: `2px solid ${t.accent}`, borderRadius: "16px", padding: "36px 28px",
          textAlign: "center", boxShadow: `0 0 60px ${t.accent}55`,
          animation: "qfCompPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
        role="dialog"
        aria-label="Tracker complete"
      >
        <div style={{ fontSize: "3rem", marginBottom: "8px" }}>{theme.icons.levelUp}🏆</div>
        <div style={{ fontFamily: f.mono, fontSize: "0.7rem", letterSpacing: "3px", color: t.gold, marginBottom: "10px" }}>
          100% COMPLETE
        </div>
        <h2 style={{ fontFamily: f.display, fontSize: "1.7rem", color: t.accent, margin: "0 0 6px", lineHeight: 1.15 }}>
          Quest Complete!
        </h2>
        <p style={{ color: t.textMuted, fontSize: "0.9rem", margin: "0 0 24px", lineHeight: 1.5 }}>
          You cleared every quest and unlocked every achievement. True {finalTitle}.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "28px", flexWrap: "wrap" }}>
          {stat(questCount, "Quests")}
          {stat(totalXP, "Total XP")}
          {stat(achievementCount, "Achievements")}
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onDownload}
            style={{ background: t.accent, color: t.onAccent, border: "none", borderRadius: "8px", padding: "12px 20px", fontWeight: 700, fontFamily: f.display, cursor: "pointer", fontSize: "0.95rem" }}
          >
            Download My Tracker
          </button>
          <button
            onClick={onClose}
            style={{ background: "transparent", color: t.textMuted, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "12px 20px", cursor: "pointer", fontSize: "0.9rem" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
