"use client";
import { useState, useCallback } from "react";
import { TrackerConfig } from "@/lib/types";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
  onToggle: (id: string) => void;
  /** While generating, phases with no quests yet show a shimmer placeholder. */
  preview?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  learn: "#22d3ee", build: "#f97316", create: "#a78bfa",
  research: "#fbbf24", practice: "#4ade80", document: "#fb7185",
};

const KEYFRAMES = `
@keyframes questPop {
  0%   { transform: scale(1); }
  30%  { transform: scale(0.95); }
  65%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}
@keyframes checkStamp {
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  60%  { transform: scale(1.3) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes xpFloat {
  0%   { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-50px); opacity: 0; }
}
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function ShimmerRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: "58px", borderRadius: "8px", marginBottom: "8px",
            background: "linear-gradient(90deg, #0d1117 0%, #131a26 50%, #0d1117 100%)",
            backgroundSize: "800px 100%",
            animation: "shimmer 1.3s ease-in-out infinite",
            border: "1px solid #1a2535",
          }}
        />
      ))}
    </>
  );
}

export default function QuestList({ config, completedSet, onToggle, preview = false }: Props) {
  const [phaseFilter, setPhaseFilter] = useState<number | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const [floatingXP, setFloatingXP] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((id: string) => {
    const wasIncomplete = !completedSet.has(id);
    onToggle(id);
    if (wasIncomplete) {
      setRecentlyCompleted((prev) => new Set(Array.from(prev).concat(id)));
      setFloatingXP((prev) => new Set(Array.from(prev).concat(id)));
      setTimeout(() => setRecentlyCompleted((prev) => { const n = new Set(prev); n.delete(id); return n; }), 650);
      setTimeout(() => setFloatingXP((prev) => { const n = new Set(prev); n.delete(id); return n; }), 850);
    }
  }, [completedSet, onToggle]);

  const phases = config.phases;
  const filtered = phaseFilter !== null
    ? config.quests.filter((q) => q.phase === phaseFilter)
    : config.quests;

  const grouped = phases
    .filter((p) => phaseFilter === null || p.id === phaseFilter)
    .map((p) => ({ phase: p, quests: filtered.filter((q) => q.phase === p.id) }));

  return (
    <div>
      <style>{KEYFRAMES}</style>
      {/* Phase filter */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        <button
          onClick={() => setPhaseFilter(null)}
          style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, borderColor: phaseFilter === null ? "#f97316" : "#1a2535", background: phaseFilter === null ? "#f9731622" : "transparent", color: phaseFilter === null ? "#f97316" : "#64748b" }}
        >All</button>
        {phases.map((p) => (
          <button
            key={p.id}
            onClick={() => setPhaseFilter(phaseFilter === p.id ? null : p.id)}
            style={{ padding: "6px 14px", borderRadius: "6px", border: "1px solid", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, borderColor: phaseFilter === p.id ? p.color : "#1a2535", background: phaseFilter === p.id ? p.color + "22" : "transparent", color: phaseFilter === p.id ? p.color : "#64748b" }}
          >{p.label}</button>
        ))}
      </div>

      {grouped.map(({ phase, quests }) => {
        const pDone = quests.filter((q) => completedSet.has(q.id)).length;
        const pending = preview && quests.length === 0;
        return (
          <div key={phase.id}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "2px", color: phase.color, borderBottom: "1px solid #1a2535", paddingBottom: "8px", marginBottom: "10px", marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <span>{phase.label}</span>
              <span style={{ color: "#64748b" }}>{pending ? "forging…" : `${pDone}/${quests.length}`}</span>
            </div>
            {pending && <ShimmerRows />}
            {quests.map((q) => {
              const done = completedSet.has(q.id);
              const popping = recentlyCompleted.has(q.id);
              const showXP = floatingXP.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggle(q.id)}
                  style={{
                    position: "relative",
                    background: done ? "#4ade8011" : "#0d1117",
                    border: `1px solid ${q.boss ? config.theme.accent + "66" : done ? "#4ade8033" : "#1a2535"}`,
                    borderRadius: "8px", padding: "14px 16px", marginBottom: "8px",
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    cursor: "pointer", opacity: done ? 0.65 : 1, transition: "opacity 0.2s, border-color 0.2s",
                    boxShadow: q.boss && !done ? `0 0 12px ${config.theme.accent}33` : "none",
                    animation: popping ? "questPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97)" : "none",
                  }}
                >
                  {showXP && (
                    <span style={{
                      position: "absolute", top: "8px", right: "16px",
                      fontFamily: "Orbitron, sans-serif", fontSize: "0.85rem",
                      color: "#fbbf24", fontWeight: 700, pointerEvents: "none",
                      animation: "xpFloat 0.85s ease-out forwards",
                    }}>+{q.xp} XP</span>
                  )}
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "4px",
                    border: `2px solid ${done ? "#4ade80" : "#374151"}`,
                    background: done ? "#4ade80" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "2px", fontSize: "12px", color: "#05060e",
                    animation: popping ? "checkStamp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)" : "none",
                  }}>
                    {done && "✓"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      {q.name}
                      {q.boss && <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.65rem", color: config.theme.accent, border: `1px solid ${config.theme.accent}44`, background: config.theme.accent + "11", borderRadius: "4px", padding: "1px 6px" }}>⚔️ BOSS</span>}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px", lineHeight: 1.5 }}>{q.desc}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.7rem", color: "#fbbf24", background: "#fbbf2411", border: "1px solid #fbbf2433", borderRadius: "4px", padding: "2px 8px" }}>+{q.xp} XP</span>
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.7rem", color: TYPE_COLORS[q.type] ?? "#64748b", background: (TYPE_COLORS[q.type] ?? "#64748b") + "11", border: `1px solid ${(TYPE_COLORS[q.type] ?? "#64748b")}33`, borderRadius: "4px", padding: "2px 8px" }}>{q.type}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
