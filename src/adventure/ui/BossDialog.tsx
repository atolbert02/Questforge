"use client";
import { useState } from "react";
import { Quest } from "@/lib/types";
import { PALETTE } from "../assets/sprites";
import { PIXEL_FONT, panel, pixelButton, smallText } from "./pixel";

interface Props {
  quest: Quest;
  done: boolean;
  onDefeat: () => void;
  onUndo: () => void;
  onClose: () => void;
  onStrike: () => void; // camera shake hook (no-op when effects reduced)
}

const MAX_HP = 3;

/**
 * A boss "encounter": three deliberate strikes, not a twitch fight. The third
 * strike completes the underlying tracker task (with its existing XP).
 */
export default function BossDialog({ quest, done, onDefeat, onUndo, onClose, onStrike }: Props) {
  const [hp, setHp] = useState(done ? 0 : MAX_HP);
  const defeated = hp === 0;

  function strike() {
    if (defeated) return;
    onStrike();
    const next = hp - 1;
    setHp(next);
    if (next === 0) onDefeat();
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,15,27,0.8)", zIndex: 20 }} onClick={onClose}>
      <div style={{ ...panel, width: "min(460px, calc(100vw - 40px))", borderColor: defeated ? PALETTE.bone : PALETTE.ember }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Boss: ${quest.name}`}>
        <div style={{ ...smallText, color: PALETTE.ember }}>
          👹 BOSS {defeated && "· DEFEATED"}
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", margin: "10px 0", lineHeight: 1.6 }}>
          {quest.name}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: PALETTE.slate, lineHeight: 1.5, marginBottom: "12px" }}>
          {quest.desc}
        </div>
        <div style={{ ...smallText, marginBottom: "14px" }} aria-label={`Boss health: ${hp} of ${MAX_HP}`}>
          {Array.from({ length: MAX_HP }, (_, i) => (
            <span key={i} style={{ marginRight: "6px", color: i < hp ? PALETTE.ember : PALETTE.slate }}>
              {i < hp ? "❤" : "🖤"}
            </span>
          ))}
          <span style={{ color: PALETTE.gold, marginLeft: "8px" }}>reward: {quest.xp} XP</span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!defeated ? (
            <button autoFocus onClick={strike} style={pixelButton(PALETTE.ember, PALETTE.bone)}>
              ⚔ STRIKE!
            </button>
          ) : done ? (
            <button onClick={onUndo} style={pixelButton(PALETTE.navy, PALETTE.slate)}>
              ↺ REVIVE BOSS (mark incomplete)
            </button>
          ) : null}
          <button onClick={onClose} style={pixelButton(PALETTE.ink, PALETTE.bone)}>
            {defeated ? "CLOSE" : "FLEE"}
          </button>
        </div>
      </div>
    </div>
  );
}
