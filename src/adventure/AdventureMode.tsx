"use client";
import { Component, ReactNode, useEffect, useState } from "react";
import { TrackerConfig, TrackerProgress } from "@/lib/types";
import { getTheme } from "@/lib/themes";
import { AdventureSettings, loadSettings, resolveSettings, saveSettings } from "./settings";

/**
 * Adventure Mode — an isometric pixel-art view over the SAME tracker state.
 *
 * This component is loaded lazily (next/dynamic) from TrackerShell. It owns
 * no quest state: it receives `config`/`progress` and reports completions
 * through `onToggleQuest`, the exact function the tracker's checkboxes call.
 * Remove the feature by deleting src/adventure/ and the toggle in TrackerShell.
 */

export interface AdventureModeProps {
  config: TrackerConfig;
  progress: TrackerProgress;
  onToggleQuest: (id: string) => void;
  onClose: () => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";
const FONT_URL = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";

/** Catches any render/runtime error in the game and falls back gracefully. */
class GameErrorBoundary extends Component<
  { onClose: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <LoadFailed onClose={this.props.onClose} />;
    return this.props.children;
  }
}

export function LoadFailed({ onClose }: { onClose: () => void }) {
  return (
    <div style={overlayStyle}>
      <div style={{ textAlign: "center", padding: "32px", maxWidth: "420px" }}>
        <div style={{ fontSize: "2rem", marginBottom: "16px" }}>🗺️</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", color: "#f4f4ec", lineHeight: 1.8 }}>
          Adventure Mode couldn&apos;t load on this device.
        </div>
        <div style={{ color: "#8a8fa3", fontSize: "0.85rem", marginTop: "12px", lineHeight: 1.6 }}>
          No worries — every quest is still right here in your tracker.
        </div>
        <button onClick={onClose} style={buttonStyle}>
          Back to tracker
        </button>
      </div>
    </div>
  );
}

export default function AdventureMode(props: AdventureModeProps) {
  const [settings, setSettings] = useState<AdventureSettings>(() => loadSettings());

  // Load the pixel font once while Adventure Mode is open (same pattern the
  // tracker uses for theme fonts in TrackerShell).
  useEffect(() => {
    const id = "qf-adventure-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
  }, []);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSettings(patch: Partial<AdventureSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  const effective = resolveSettings(settings);
  const theme = getTheme(props.config.themeId);

  return (
    <div style={overlayStyle} role="dialog" aria-label="Adventure Mode">
      <GameErrorBoundary onClose={props.onClose}>
        <GameStage
          {...props}
          reduceFx={effective.reduceFx}
          crt={effective.crt}
          settings={settings}
          onUpdateSettings={updateSettings}
          accent={props.config.theme?.accent ?? theme.tokens.accent}
        />
      </GameErrorBoundary>
    </div>
  );
}

interface GameStageProps extends AdventureModeProps {
  reduceFx: boolean;
  crt: boolean;
  settings: AdventureSettings;
  onUpdateSettings: (patch: Partial<AdventureSettings>) => void;
  accent: string;
}

/** Placeholder stage — replaced by the real isometric engine in the next step. */
function GameStage({ onClose }: GameStageProps) {
  return (
    <div style={{ textAlign: "center", padding: "32px" }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", color: "#f4f4ec", lineHeight: 1.8 }}>
        Generating overworld…
      </div>
      <button onClick={onClose} style={buttonStyle}>
        Back to tracker
      </button>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "#0f0f1b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "24px",
  background: "#1b2a5e",
  color: "#f4f4ec",
  border: "2px solid #3f6ad8",
  borderRadius: "0",
  padding: "12px 20px",
  cursor: "pointer",
  fontFamily: PIXEL_FONT,
  fontSize: "0.7rem",
};
