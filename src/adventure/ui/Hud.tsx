"use client";
import { PALETTE } from "../assets/sprites";
import { PIXEL_FONT, pixelButton, smallText } from "./pixel";

interface Props {
  rank: string;
  levelIdx: number;
  totalXP: number;
  nextMin: number | null;
  xpPct: number;
  zoneLabel: string;
  focusPrompt: string | null;
  isTouch: boolean;
  onSettings: () => void;
  onClose: () => void;
}

/** Heads-up display: rank + XP (live tracker values), zone name, controls. */
export default function Hud({ rank, levelIdx, totalXP, nextMin, xpPct, zoneLabel, focusPrompt, isTouch, onSettings, onClose }: Props) {
  return (
    <>
      {/* Top-left: rank + XP, straight from tracker state. */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, background: "rgba(15,15,27,0.85)", border: `2px solid ${PALETTE.bone}`, padding: "10px 12px", maxWidth: "min(300px, 60vw)" }}>
        <div style={{ ...smallText, color: PALETTE.gold }}>
          Lv.{levelIdx + 1} {rank.toUpperCase()}
        </div>
        <div style={{ background: PALETTE.ink, border: `1px solid ${PALETTE.slate}`, height: "10px", width: "170px", marginTop: "6px" }}>
          <div style={{ background: PALETTE.gold, height: "100%", width: `${xpPct}%` }} />
        </div>
        <div style={{ ...smallText, color: PALETTE.slate, marginTop: "4px" }}>
          {nextMin !== null ? `${totalXP}/${nextMin} XP` : `${totalXP} XP (MAX)`}
        </div>
      </div>

      {/* Top-right: zone + buttons. */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ ...smallText, background: "rgba(15,15,27,0.85)", border: `2px solid ${PALETTE.bone}`, padding: "10px 12px", color: PALETTE.sky, maxWidth: "40vw" }}>
          {zoneLabel}
        </div>
        <button onClick={onSettings} aria-label="Adventure settings" style={pixelButton(PALETTE.ink, PALETTE.bone)}>⚙</button>
        <button onClick={onClose} aria-label="Exit Adventure Mode" style={pixelButton(PALETTE.ember, PALETTE.bone)}>✕</button>
      </div>

      {/* Bottom: interaction prompt / controls hint. */}
      <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.6rem", background: "rgba(15,15,27,0.85)", border: `2px solid ${focusPrompt ? PALETTE.gold : PALETTE.slate}`, color: focusPrompt ? PALETTE.gold : PALETTE.slate, padding: "10px 14px", lineHeight: 1.7, textAlign: "center", maxWidth: "calc(100vw - 32px)" }}>
          {focusPrompt
            ? isTouch
              ? `TAP AGAIN: ${focusPrompt}`
              : `[E / SPACE] ${focusPrompt}`
            : isTouch
              ? "TAP THE GROUND TO WALK · TAP OBJECTS TO INTERACT"
              : "WASD / ARROWS: MOVE · E: INTERACT · ESC: EXIT"}
        </div>
      </div>
    </>
  );
}
