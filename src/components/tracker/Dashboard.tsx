"use client";
import { TrackerConfig, TrackerProgress, Level } from "@/lib/types";

interface Props {
  config: TrackerConfig;
  progress: TrackerProgress;
  completedSet: Set<string>;
  totalXP: number;
  level: Level;
  unlockedSet: Set<string>;
  onToggle: (id: string) => void;
}

export default function Dashboard({ config, progress, completedSet, totalXP, level, unlockedSet, onToggle }: Props) {
  const total = config.quests.length;
  const completed = progress.completed.length;
  const bossDone = config.quests.filter((q) => q.boss && completedSet.has(q.id)).length;
  const bossTotal = config.quests.filter((q) => q.boss).length;
  const recentQuests = config.quests.filter((q) => completedSet.has(q.id)).slice(-3).reverse();
  const accent = config.theme.accent;

  const statCard = (value: string | number, label: string) => (
    <div style={{ background: "#0d1117", border: "1px solid #1a2535", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
      <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "1.6rem", color: accent }}>{value}</div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.68rem", color: "#64748b", marginTop: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {statCard(totalXP, "Total XP")}
        {statCard(`${completed}/${total}`, "Quests Done")}
        {statCard(`${bossDone}/${bossTotal}`, "Boss Battles")}
        {statCard(unlockedSet.size, "Achievements")}
        {statCard(progress.streak, "Day Streak")}
      </div>

      <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "2px", color: "#64748b", borderBottom: "1px solid #1a2535", paddingBottom: "8px", marginBottom: "12px" }}>
        CURRENT LEVEL
      </div>
      <div style={{ background: "#0d1117", border: `1px solid ${accent}44`, borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
        <div style={{ fontWeight: 600, color: accent }}>{level.title}</div>
        <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "4px" }}>{config.characterName} · {config.duration}</div>
      </div>

      {recentQuests.length > 0 && (
        <>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "0.7rem", letterSpacing: "2px", color: "#64748b", borderBottom: "1px solid #1a2535", paddingBottom: "8px", marginBottom: "12px" }}>
            RECENTLY COMPLETED
          </div>
          {recentQuests.map((q) => (
            <div key={q.id} onClick={() => onToggle(q.id)} style={{ background: "#4ade8011", border: "1px solid #4ade8033", borderRadius: "8px", padding: "14px 16px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", opacity: 0.7 }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px" }}>✓</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{q.name}</div>
                <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.72rem", color: "#fbbf24", marginTop: "2px" }}>+{q.xp} XP</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
