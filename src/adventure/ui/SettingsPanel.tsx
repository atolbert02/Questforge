"use client";
import { AdventureSettings, prefersReducedMotion, resolveSettings } from "../settings";
import { PALETTE } from "../assets/sprites";
import { PIXEL_FONT, panel, pixelButton, smallText } from "./pixel";

interface Props {
  settings: AdventureSettings;
  onUpdate: (patch: Partial<AdventureSettings>) => void;
  onClose: () => void;
}

export default function SettingsPanel({ settings, onUpdate, onClose }: Props) {
  const effective = resolveSettings(settings);
  const prm = prefersReducedMotion();

  const row = (label: string, value: boolean, onToggle: () => void) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
      <span style={smallText}>{label}</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={value}
        style={pixelButton(value ? PALETTE.green : PALETTE.ink, value ? PALETTE.ink : PALETTE.slate)}
      >
        {value ? "ON" : "OFF"}
      </button>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,15,27,0.7)", zIndex: 30 }} onClick={onClose}>
      <div style={{ ...panel, width: "min(400px, calc(100vw - 40px))" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Adventure settings">
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.75rem", marginBottom: "18px" }}>⚙ SETTINGS</div>
        {row("CRT SCANLINES", effective.crt, () => onUpdate({ crt: !effective.crt }))}
        {row("REDUCE EFFECTS", effective.reduceFx, () => onUpdate({ reduceFx: !effective.reduceFx }))}
        {prm && (
          <div style={{ ...smallText, color: PALETTE.sky, marginBottom: "14px" }}>
            Your system prefers reduced motion — effects default off.
          </div>
        )}
        <div style={{ ...smallText, color: PALETTE.slate, marginBottom: "16px" }}>
          Sound follows the tracker&apos;s 🔊 mute toggle.
        </div>
        <button onClick={onClose} style={pixelButton(PALETTE.ink, PALETTE.bone)}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
