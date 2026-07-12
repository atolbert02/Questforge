"use client";
import { Quest, TrackerConfig } from "@/lib/types";
import { PALETTE } from "../assets/sprites";
import { PIXEL_FONT, panel, pixelButton, smallText } from "./pixel";

interface Props {
  quest: Quest;
  done: boolean;
  config: TrackerConfig;
  onComplete: () => void;
  onUndo: () => void;
  onClose: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  learn: "📖 Villager",
  research: "🔍 Villager",
  build: "🧰 Chest",
  create: "✨ Chest",
  practice: "🔁 Shrine",
  document: "📜 Shrine",
};

/** Quest detail card. "Complete" writes straight to the real tracker state. */
export default function QuestDialog({ quest, done, config, onComplete, onUndo, onClose }: Props) {
  const skills = Object.keys(quest.skills ?? {})
    .map((id) => config.skills.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,15,27,0.7)", zIndex: 20 }} onClick={onClose}>
      <div style={{ ...panel, width: "min(460px, calc(100vw - 40px))" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={quest.name}>
        <div style={{ ...smallText, color: PALETTE.sky }}>
          {TYPE_LABEL[quest.type] ?? "❖ Quest"} {done && "· CLEARED"}
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", margin: "10px 0", lineHeight: 1.6, color: done ? PALETTE.slate : PALETTE.bone }}>
          {quest.name}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: PALETTE.slate, lineHeight: 1.5, marginBottom: "12px" }}>
          {quest.desc}
        </div>
        <div style={{ ...smallText, color: PALETTE.gold, marginBottom: "14px" }}>
          ★ {quest.xp} XP
          {skills.length > 0 && (
            <span style={{ color: PALETTE.sky }}>
              {"  ·  "}
              {skills.map((s) => `${s!.icon} ${s!.label}`).join("  ")}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {!done ? (
            <button autoFocus onClick={onComplete} style={pixelButton(PALETTE.green, PALETTE.ink)}>
              ✔ COMPLETE
            </button>
          ) : (
            <button onClick={onUndo} style={pixelButton(PALETTE.navy, PALETTE.slate)}>
              ↺ MARK INCOMPLETE
            </button>
          )}
          <button onClick={onClose} style={pixelButton(PALETTE.ink, PALETTE.bone)}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
