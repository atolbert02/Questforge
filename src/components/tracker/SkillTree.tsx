"use client";
import { TrackerConfig } from "@/lib/types";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
}

export default function SkillTree({ config, completedSet }: Props) {
  const skillXP: Record<string, number> = {};
  config.skills.forEach((s) => (skillXP[s.id] = 0));
  config.quests
    .filter((q) => completedSet.has(q.id))
    .forEach((q) => {
      Object.entries(q.skills).forEach(([id, xp]) => {
        if (skillXP[id] !== undefined) skillXP[id] += xp;
      });
    });

  const maxXP = Math.max(...Object.values(skillXP), 1);

  return (
    <div>
      {config.skills.map((s) => {
        const xp = skillXP[s.id] ?? 0;
        const pct = Math.round((xp / maxXP) * 100);
        return (
          <div key={s.id} style={{ background: "#0d1117", border: "1px solid #1a2535", borderRadius: "8px", padding: "16px 20px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>{s.icon}</span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{s.label}</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.78rem", color: "#64748b", marginLeft: "auto" }}>{xp} XP</span>
            </div>
            <div style={{ background: "#1a2535", borderRadius: "4px", height: "8px" }}>
              <div style={{ background: s.color, height: "8px", borderRadius: "4px", width: `${pct}%`, transition: "width 0.4s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
