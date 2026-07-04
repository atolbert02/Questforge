"use client";
import { useState, useEffect } from "react";
import { TrackerConfig } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { playThemeSound } from "@/lib/use-theme-sound";

interface Props {
  config: TrackerConfig;
  completedSet: Set<string>;
  unlockedSet: Set<string>;
  prevUnlockedSet: Set<string>;
}

const keyframes = (glow: string) => `
@keyframes flipReveal {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(180deg); }
}
@keyframes particleBurst {
  0%   { transform: translate(0,0) scale(1.2); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
@keyframes achGlow {
  0%, 100% { box-shadow: 0 0 8px ${glow}66; }
  50%       { box-shadow: 0 0 24px ${glow}aa, 0 0 48px ${glow}33; }
}
`;

function Particles({ colors }: { colors: string[] }) {
  const particles = Array.from({ length: 10 }, (_, i) => {
    const angle = (i / 10) * 360 + Math.random() * 36;
    const dist = 40 + Math.random() * 40;
    const tx = Math.round(Math.cos((angle * Math.PI) / 180) * dist);
    const ty = Math.round(Math.sin((angle * Math.PI) / 180) * dist);
    return { tx, ty, size: 4 + Math.random() * 4 };
  });

  return (
    <>
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: `${p.size}px`, height: `${p.size}px`,
            borderRadius: "50%",
            background: colors[i % colors.length],
            pointerEvents: "none",
            // @ts-expect-error CSS custom properties
            "--tx": `${p.tx}px`,
            "--ty": `${p.ty}px`,
            animation: "particleBurst 0.8s ease-out forwards",
          }}
        />
      ))}
    </>
  );
}

export default function Achievements({ config, unlockedSet, prevUnlockedSet }: Props) {
  const [flipping, setFlipping] = useState<Set<string>>(new Set());
  const [showParticles, setShowParticles] = useState<Set<string>>(new Set());

  const theme = getTheme(config.themeId);
  const t = theme.tokens;
  const f = theme.fonts;
  const particleColors = theme.effect.particleColors;

  useEffect(() => {
    const newlyUnlocked = config.achievements
      .filter((a) => unlockedSet.has(a.id) && !prevUnlockedSet.has(a.id))
      .map((a) => a.id);

    if (newlyUnlocked.length === 0) return;

    playThemeSound(theme, "achievement");
    setFlipping((prev) => new Set(Array.from(prev).concat(newlyUnlocked)));
    setTimeout(() => {
      setShowParticles((prev) => new Set(Array.from(prev).concat(newlyUnlocked)));
      setTimeout(() => {
        setFlipping((prev) => { const n = new Set(prev); newlyUnlocked.forEach((id) => n.delete(id)); return n; });
        setShowParticles((prev) => { const n = new Set(prev); newlyUnlocked.forEach((id) => n.delete(id)); return n; });
      }, 850);
    }, 620);
  }, [unlockedSet, prevUnlockedSet, config.achievements]);

  return (
    <div>
      <style>{keyframes(t.gold)}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "12px" }}>
        {config.achievements.map((a) => {
          const unlocked = unlockedSet.has(a.id);
          const isFlipping = flipping.has(a.id);
          const hasParticles = showParticles.has(a.id);

          return (
            <div
              key={a.id}
              style={{ perspective: "600px", position: "relative" }}
            >
              <div
                style={{
                  background: t.bgCard,
                  border: `1px solid ${unlocked ? `${t.gold}66` : t.border}`,
                  borderRadius: "10px", padding: "20px 16px", textAlign: "center",
                  opacity: unlocked ? 1 : 0.4,
                  filter: unlocked ? "none" : "grayscale(1)",
                  transition: "opacity 0.3s, filter 0.3s",
                  animation: isFlipping
                    ? "flipReveal 0.6s cubic-bezier(0.4,0,0.2,1) forwards"
                    : unlocked ? "achGlow 2.5s ease-in-out infinite" : "none",
                  transformStyle: "preserve-3d",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{a.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "6px" }}>{a.name}</div>
                <div style={{ color: t.textMuted, fontSize: "0.8rem", lineHeight: 1.4 }}>{a.desc}</div>
                {unlocked && (
                  <div style={{ marginTop: "10px", fontFamily: f.mono, fontSize: "0.68rem", color: t.gold }}>
                    ✦ UNLOCKED
                  </div>
                )}
              </div>
              {hasParticles && <Particles colors={particleColors} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
