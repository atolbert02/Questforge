"use client";
import { TrackerConfig } from "@/lib/types";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
  unlockedSet: Set<string>;
}

export default function Achievements({ config, unlockedSet }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
      {config.achievements.map((a) => {
        const unlocked = unlockedSet.has(a.id);
        return (
          <div key={a.id} style={{ background: "#0d1117", border: `1px solid ${unlocked ? "#fbbf2466" : "#1a2535"}`, borderRadius: "10px", padding: "20px 16px", textAlign: "center", opacity: unlocked ? 1 : 0.4, filter: unlocked ? "none" : "grayscale(1)", transition: "all 0.3s" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{a.icon}</div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px" }}>{a.name}</div>
            <div style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.4 }}>{a.desc}</div>
            {unlocked && <div style={{ marginTop: "10px", fontFamily: "IBM Plex Mono, monospace", fontSize: "0.68rem", color: "#fbbf24" }}>UNLOCKED</div>}
          </div>
        );
      })}
    </div>
  );
}
