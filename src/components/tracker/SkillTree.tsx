"use client";
import { TrackerConfig } from "@/lib/types";
import { getTheme } from "@/lib/themes";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
}

export default function SkillTree({ config, completedSet }: Props) {
  const theme = getTheme(config.themeId);
  const t = theme.tokens;
  const f = theme.fonts;

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
          <div key={s.id} style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: "8px", padding: "16px 20px", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>{s.icon}</span>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{s.label}</span>
              <span style={{ fontFamily: f.mono, fontSize: "0.78rem", color: t.textMuted, marginLeft: "auto" }}>{xp} XP</span>
            </div>
            <div style={{ background: t.border, borderRadius: "4px", height: "8px" }}>
              <div style={{ background: s.color, height: "8px", borderRadius: "4px", width: `${pct}%`, transition: "width 0.4s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
