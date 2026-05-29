"use client";
import { useState, useRef, useEffect } from "react";
import { TrackerConfig, TrackerProgress } from "@/lib/types";
import { saveProgress } from "@/lib/tracker-storage";
import { evaluateAchievements } from "@/lib/achievements";
import { exportTrackerHTML } from "@/lib/export-html";
import Dashboard from "./Dashboard";
import QuestList from "./QuestList";
import SkillTree from "./SkillTree";
import Roadmap from "./Roadmap";
import Achievements from "./Achievements";

type Tab = "dashboard" | "quests" | "skills" | "roadmap" | "achievements";

interface Props {
  config: TrackerConfig;
  initialProgress: TrackerProgress;
  onNewTracker: () => void;
}

export function getLevel(xp: number, levels: TrackerConfig["levels"]) {
  let idx = 0;
  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].min) idx = i;
  }
  return { idx, level: levels[idx], next: levels[idx + 1] };
}

export default function TrackerShell({ config, initialProgress, onNewTracker }: Props) {
  const [progress, setProgress] = useState<TrackerProgress>(initialProgress);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState("");
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  const completedSet = new Set(progress.completed);
  const totalXP = config.quests
    .filter((q) => completedSet.has(q.id))
    .reduce((sum, q) => sum + q.xp, 0);
  const { level, next } = getLevel(totalXP, config.levels);
  const unlockedSet = evaluateAchievements(config.achievements, config.quests, progress);
  const xpPct = next ? Math.round(((totalXP - level.min) / (next.min - level.min)) * 100) : 100;

  useEffect(() => {
    prevUnlockedRef.current = new Set(unlockedSet);
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  function toggleQuest(id: string) {
    const newCompleted = completedSet.has(id)
      ? progress.completed.filter((c) => c !== id)
      : [...progress.completed, id];
    const newProgress = { ...progress, completed: newCompleted };
    setProgress(newProgress);
    saveProgress(newProgress);
    if (!completedSet.has(id)) {
      const q = config.quests.find((q) => q.id === id);
      showToast(`Quest complete! +${q?.xp ?? 0} XP`);
    }
  }

  const accent = config.theme.accent;

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "quests", label: "Quests" },
    { key: "skills", label: "Skills" },
    { key: "roadmap", label: "Roadmap" },
    { key: "achievements", label: "Achievements" },
  ];

  return (
    <div style={{ background: "#05060e", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a2535", padding: "20px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: "Orbitron, sans-serif", color: accent, fontSize: "1.3rem", marginBottom: "2px" }}>
                {config.projectTitle}
              </h1>
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>{config.tagline}</div>
              <div style={{ marginTop: "10px" }}>
                <div style={{ background: "#1a2535", borderRadius: "4px", height: "8px", maxWidth: "360px" }}>
                  <div style={{ background: accent, height: "8px", borderRadius: "4px", width: `${xpPct}%`, transition: "width 0.4s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", maxWidth: "360px", marginTop: "4px" }}>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.72rem", color: "#64748b" }}>{level.title}</span>
                  <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.72rem", color: "#64748b" }}>
                    {next ? `${totalXP} / ${next.min} XP` : `${totalXP} XP (MAX)`}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => exportTrackerHTML(config, progress)}
                style={{ background: "#1a2535", color: "#e2e8f0", border: "1px solid #374151", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem" }}
              >
                Download HTML
              </button>
              <button
                onClick={onNewTracker}
                style={{ background: "transparent", color: "#64748b", border: "1px solid #1a2535", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontSize: "0.8rem" }}
              >
                New Tracker
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #1a2535", padding: "0 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", gap: "0", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "14px 20px", background: "transparent", border: "none",
                borderBottom: activeTab === t.key ? `2px solid ${accent}` : "2px solid transparent",
                color: activeTab === t.key ? accent : "#64748b",
                cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        {activeTab === "dashboard" && <Dashboard config={config} progress={progress} completedSet={completedSet} totalXP={totalXP} level={level} unlockedSet={unlockedSet} onToggle={toggleQuest} />}
        {activeTab === "quests" && <QuestList config={config} completedSet={completedSet} onToggle={toggleQuest} />}
        {activeTab === "skills" && <SkillTree config={config} completedSet={completedSet} />}
        {activeTab === "roadmap" && <Roadmap config={config} completedSet={completedSet} />}
        {activeTab === "achievements" && <Achievements config={config} completedSet={completedSet} unlockedSet={unlockedSet} prevUnlockedSet={prevUnlockedRef.current} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          background: "#4ade80", color: "#05060e", padding: "12px 24px",
          borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", zIndex: 999,
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
