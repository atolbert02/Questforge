"use client";
import { TrackerConfig } from "@/lib/types";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
}

export default function Roadmap({ config, completedSet }: Props) {
  return (
    <div style={{ position: "relative", paddingLeft: "28px" }}>
      <div style={{ position: "absolute", left: "10px", top: 0, bottom: 0, width: "2px", background: "#1a2535" }} />
      {config.phases.map((phase) => {
        const quests = config.quests.filter((q) => q.phase === phase.id);
        const pDone = quests.filter((q) => completedSet.has(q.id)).length;
        const pct = quests.length ? Math.round((pDone / quests.length) * 100) : 0;
        const isComplete = pDone === quests.length && quests.length > 0;
        return (
          <div key={phase.id} style={{ position: "relative", marginBottom: "36px" }}>
            <div style={{ position: "absolute", left: "-22px", width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${phase.color}`, background: isComplete ? phase.color : "#05060e", top: "2px" }} />
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.8rem", letterSpacing: "1px", color: phase.color, marginBottom: "4px" }}>{phase.label}</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.75rem", color: "#64748b", marginBottom: "6px" }}>{phase.dates}</div>
            <div style={{ color: "#94a3b8", fontSize: "0.88rem", marginBottom: "8px" }}>{phase.tagline}</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.72rem", color: "#64748b" }}>{pDone}/{quests.length} quests · {pct}% complete</div>
            <div style={{ background: "#1a2535", borderRadius: "4px", height: "4px", maxWidth: "200px", marginTop: "6px" }}>
              <div style={{ background: phase.color, height: "4px", borderRadius: "4px", width: `${pct}%`, transition: "width 0.4s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
