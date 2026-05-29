"use client";
import { useState } from "react";
import { TrackerConfig } from "@/lib/types";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
  onToggle: (id: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  learn: "#22d3ee", build: "#f97316", create: "#a78bfa",
  research: "#fbbf24", practice: "#4ade80", document: "#fb7185",
};

export default function QuestList({ config, completedSet, onToggle }: Props) {
  const [phaseFilter, setPhaseFilter] = useState<number | null>(null);

  const phases = config.phases;
  const filtered = phaseFilter !== null
    ? config.quests.filter((q) => q.phase === phaseFilter)
    : config.quests;

  const grouped = phases
    .filter((p) => phaseFilter === null || p.id === phaseFilter)
    .map((p) => ({ phase: p, quests: filtered.filter((q) => q.phase === p.id) }));

  return (
    <div>
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
        return (
          <div key={phase.id}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "2px", color: phase.color, borderBottom: "1px solid #1a2535", paddingBottom: "8px", marginBottom: "10px", marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
              <span>{phase.label}</span>
              <span style={{ color: "#64748b" }}>{pDone}/{quests.length}</span>
            </div>
            {quests.map((q) => {
              const done = completedSet.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => onToggle(q.id)}
                  style={{
                    background: done ? "#4ade8011" : "#0d1117",
                    border: `1px solid ${q.boss ? config.theme.accent + "66" : done ? "#4ade8033" : "#1a2535"}`,
                    borderRadius: "8px", padding: "14px 16px", marginBottom: "8px",
                    display: "flex", alignItems: "flex-start", gap: "12px",
                    cursor: "pointer", opacity: done ? 0.65 : 1, transition: "all 0.2s",
                    boxShadow: q.boss && !done ? `0 0 12px ${config.theme.accent}33` : "none",
                  }}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: `2px solid ${done ? "#4ade80" : "#374151"}`, background: done ? "#4ade80" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px", fontSize: "12px", color: "#05060e" }}>
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
