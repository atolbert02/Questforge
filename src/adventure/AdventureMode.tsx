"use client";
import { Component, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { TrackerConfig, TrackerProgress } from "@/lib/types";
import { getLevel } from "@/components/tracker/TrackerShell";
import { getTheme } from "@/lib/themes";
import { evaluateAchievements } from "@/lib/achievements";
import { AdventureSettings, loadSettings, resolveSettings, saveSettings } from "./settings";
import { buildWorld } from "./world/mapping";
import type { AdventureGame, FocusTarget } from "./engine/game";
import { getAdventureStyle, type AdventureStyle } from "./style";
import { PALETTE } from "./assets/sprites";
import { PIXEL_FONT, panel, pixelButton, smallText } from "./ui/pixel";
import Hud from "./ui/Hud";
import QuestDialog from "./ui/QuestDialog";
import BossDialog from "./ui/BossDialog";
import SettingsPanel from "./ui/SettingsPanel";

/**
 * Adventure Mode — an isometric pixel-art view over the SAME tracker state.
 *
 * Loaded lazily (next/dynamic) from TrackerShell, so pixi.js and all game
 * code stay out of the base bundle. It owns no quest state: it receives
 * `config`/`progress` and reports completions through `onToggleQuest` — the
 * exact function the tracker's checkboxes call. Remove the feature by
 * deleting src/adventure/ and the toggle block in TrackerShell.
 */

export interface AdventureModeProps {
  config: TrackerConfig;
  progress: TrackerProgress;
  onToggleQuest: (id: string) => void;
  onClose: () => void;
}

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
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "32px", maxWidth: "420px" }}>
        <div style={{ fontSize: "2rem", marginBottom: "16px" }}>🗺️</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", color: PALETTE.bone, lineHeight: 1.8 }}>
          Adventure Mode couldn&apos;t load on this device.
        </div>
        <div style={{ color: PALETTE.slate, fontSize: "0.85rem", marginTop: "12px", lineHeight: 1.6 }}>
          No worries — every quest is still right here in your tracker.
        </div>
        <button onClick={onClose} style={{ ...pixelButton(PALETTE.navy, PALETTE.bone), marginTop: "24px" }}>
          Back to tracker
        </button>
      </div>
    </div>
  );
}

export default function AdventureMode(props: AdventureModeProps) {
  const [settings, setSettings] = useState<AdventureSettings>(() => loadSettings());
  const style = useMemo(() => getAdventureStyle(getTheme(props.config.themeId)), [props.config.themeId]);

  // Always load the pixel font (fallback UI uses it), plus this theme's font.
  useEffect(() => {
    const ensure = (id: string, href: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };
    ensure("qf-adventure-font", FONT_URL);
    if (style.fontUrl && style.fontUrl !== FONT_URL) {
      ensure(`qf-adventure-font-${props.config.themeId ?? "default"}`, style.fontUrl);
    }
  }, [style.fontUrl, props.config.themeId]);

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
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  const effective = resolveSettings(settings);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: style.background }} role="dialog" aria-label="Adventure Mode">
      <GameErrorBoundary onClose={props.onClose}>
        <GameStage
          {...props}
          style={style}
          reduceFx={effective.reduceFx}
          crt={effective.crt}
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      </GameErrorBoundary>
    </div>
  );
}

interface GameStageProps extends AdventureModeProps {
  style: AdventureStyle;
  reduceFx: boolean;
  crt: boolean;
  settings: AdventureSettings;
  onUpdateSettings: (patch: Partial<AdventureSettings>) => void;
}

type Dialog =
  | { type: "quest" | "boss"; questId: string }
  | { type: "marker"; achievementId: string };

function GameStage(props: GameStageProps) {
  const { config, progress, onToggleQuest, onClose } = props;
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<AdventureGame | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [banner, setBanner] = useState<{ text: string; color: string } | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLevelRef = useRef<number | null>(null);
  const completeInitRef = useRef<boolean | null>(null);

  const world = useMemo(() => buildWorld(config), [config]);
  const completedSet = useMemo(() => new Set(progress.completed), [progress.completed]);
  const totalXP = config.quests
    .filter((q) => completedSet.has(q.id))
    .reduce((sum, q) => sum + q.xp, 0);
  const allComplete =
    config.quests.length > 0 &&
    completedSet.size === config.quests.length &&
    evaluateAchievements(config.achievements, config.quests, progress).size === config.achievements.length;
  const { idx: levelIdx, level, next } = getLevel(totalXP, config.levels);
  const xpPct = next ? Math.round(((totalXP - level.min) / (next.min - level.min)) * 100) : 100;

  const isTouch = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches,
    []
  );

  function showBanner(text: string, color: string) {
    setBanner({ text, color });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 2600);
  }

  // ---- engine lifecycle -------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let game: AdventureGame | null = null;
    (async () => {
      try {
        const { AdventureGame } = await import("./engine/game");
        game = await AdventureGame.create(
          hostRef.current!,
          config,
          world,
          {
            onFocus: (t) => setFocus(t),
            onInteract: (t) => {
              if (t.kind === "marker") setDialog({ type: "marker", achievementId: t.id });
              else setDialog({ type: t.kind, questId: t.id });
            },
            onZoneChange: (zi) => setZoneIdx(zi),
          },
          {
            completed: new Set(progressRef.current.completed),
            levelIdx: levelRef.current,
            reduceFx: reduceFxRef.current,
          },
          props.style
        );
        if (cancelled) {
          game.destroy();
          return;
        }
        gameRef.current = game;
        setStatus("ready");
      } catch (err) {
        console.error("[adventure] engine failed to start:", err);
        if (!cancelled) setStatus("failed");
      }
    })();
    return () => {
      cancelled = true;
      game?.destroy();
      gameRef.current = null;
    };
    // The world is rebuilt only if config changes; engine restarts with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  // Refs so the async init above always reads current values without re-running.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const levelRef = useRef(levelIdx);
  levelRef.current = levelIdx;
  const reduceFxRef = useRef(props.reduceFx);
  reduceFxRef.current = props.reduceFx;

  // ---- tracker state -> world (runs on every progress change) -----------
  useEffect(() => {
    gameRef.current?.updateState(completedSet, levelIdx);
    if (prevLevelRef.current !== null && levelIdx > prevLevelRef.current) {
      gameRef.current?.levelUpBurst();
      showBanner(`⬆ LEVEL UP! ${level.title.toUpperCase()}`, PALETTE.gold);
    }
    prevLevelRef.current = levelIdx;

    // 100% completion — fire once on the false→true transition (not on mount at 100%).
    if (completeInitRef.current === null) {
      completeInitRef.current = allComplete;
    } else if (allComplete && !completeInitRef.current) {
      completeInitRef.current = true;
      gameRef.current?.levelUpBurst();
      showBanner("🏆 WORLD COMPLETE!", PALETTE.gold);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSet, levelIdx, level.title, status, allComplete]);

  useEffect(() => {
    gameRef.current?.setReduceFx(props.reduceFx);
  }, [props.reduceFx, status]);

  // Pause world input while any dialog is open.
  useEffect(() => {
    gameRef.current?.setPaused(dialog !== null || showSettings);
  }, [dialog, showSettings, status]);

  // ---- dialog data ------------------------------------------------------
  const dialogQuest =
    dialog && dialog.type !== "marker" ? config.quests.find((q) => q.id === dialog.questId) : undefined;
  const dialogAch =
    dialog?.type === "marker" ? config.achievements.find((a) => a.id === dialog.achievementId) : undefined;

  function completeFromGame(questId: string, isBoss: boolean) {
    const quest = config.quests.find((q) => q.id === questId);
    if (!quest || completedSet.has(questId)) return;
    onToggleQuest(questId); // the tracker's own mutation — single source of truth
    showBanner(
      isBoss ? `👑 BOSS DEFEATED! +${quest.xp} XP` : `✔ QUEST CLEARED! +${quest.xp} XP`,
      isBoss ? PALETTE.ember : PALETTE.green
    );
  }

  const focusPrompt = useMemo(() => {
    if (!focus) return null;
    if (focus.kind === "marker") {
      const a = config.achievements.find((x) => x.id === focus.id);
      return a ? `VIEW: ${a.name}` : null;
    }
    const q = config.quests.find((x) => x.id === focus.id);
    if (!q) return null;
    if (completedSet.has(q.id)) return `REVISIT: ${q.name}`;
    return focus.kind === "boss" ? `CHALLENGE: ${q.name}` : `OPEN: ${q.name}`;
  }, [focus, config, completedSet]);

  const zone = world.zones[zoneIdx];
  const zoneLabel = zone ? `🗺 ${zone.phase.label}` : "";

  if (status === "failed") return <LoadFailed onClose={onClose} />;

  const style = props.style;

  return (
    <div style={{ position: "absolute", inset: 0, imageRendering: style.chrome.pixelated ? "pixelated" : "auto" }}>
      {/* Pixi mounts its canvas here. Sketch themes get a hand-drawn wobble. */}
      <div
        ref={hostRef}
        style={{ position: "absolute", inset: 0, filter: style.sketch ? "url(#adv-sketch)" : undefined }}
      />

      {status === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: style.chrome.font, fontSize: "0.75rem", color: style.chrome.text }}>
            Generating overworld…
          </div>
        </div>
      )}

      {status === "ready" && (
        <Hud
          rank={level.title}
          levelIdx={levelIdx}
          totalXP={totalXP}
          nextMin={next ? next.min : null}
          xpPct={xpPct}
          zoneLabel={zoneLabel}
          focusPrompt={focusPrompt}
          isTouch={!!isTouch}
          onSettings={() => setShowSettings(true)}
          onClose={onClose}
        />
      )}

      {banner && (
        <div style={{ position: "absolute", top: "18%", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 25, pointerEvents: "none" }}>
          <div style={{ ...panel, borderColor: banner.color, color: banner.color, fontSize: "0.75rem", padding: "14px 22px" }}>
            {banner.text}
          </div>
        </div>
      )}

      {dialogQuest && dialog?.type === "quest" && (
        <QuestDialog
          quest={dialogQuest}
          done={completedSet.has(dialogQuest.id)}
          config={config}
          onComplete={() => {
            completeFromGame(dialogQuest.id, false);
            setDialog(null);
          }}
          onUndo={() => {
            onToggleQuest(dialogQuest.id);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialogQuest && dialog?.type === "boss" && (
        <BossDialog
          quest={dialogQuest}
          done={completedSet.has(dialogQuest.id)}
          onDefeat={() => completeFromGame(dialogQuest.id, true)}
          onUndo={() => {
            onToggleQuest(dialogQuest.id);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
          onStrike={() => gameRef.current?.shake()}
        />
      )}

      {dialogAch && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,15,27,0.7)", zIndex: 20 }} onClick={() => setDialog(null)}>
          <div style={{ ...panel, width: "min(420px, calc(100vw - 40px))" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={dialogAch.name}>
            <div style={{ ...smallText, color: PALETTE.violet }}>🏆 ACHIEVEMENT</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: "0.8rem", margin: "10px 0", lineHeight: 1.6 }}>
              {dialogAch.icon} {dialogAch.name}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: PALETTE.slate, lineHeight: 1.5, marginBottom: "14px" }}>
              {dialogAch.desc}
            </div>
            <button onClick={() => setDialog(null)} style={pixelButton(PALETTE.ink, PALETTE.bone)}>
              CLOSE
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel settings={props.settings} onUpdate={props.onUpdateSettings} onClose={() => setShowSettings(false)} />
      )}

      <StyleOverlay style={style} />
      {props.crt && <CrtOverlay />}
      {style.sketch && <SketchFilterDef />}
    </div>
  );
}

/** Per-profile atmosphere: scanlines (pixel), soft grain+vignette (sketch), else none. */
function StyleOverlay({ style }: { style: AdventureStyle }) {
  if (style.overlay === "none" || style.overlay === "crt") return null;
  if (style.overlay === "scanline") {
    return (
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 15, pointerEvents: "none",
        background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 3px)" }} />
    );
  }
  // paper (sketch): warm grain + heavy vignette for a hand-drawn, storybook feel.
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 15, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, mixBlendMode: "multiply",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        opacity: 0.25 }} />
      <div style={{ position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)" }} />
    </div>
  );
}

/** Hidden SVG filter that gives sketch themes a subtle hand-drawn displacement. */
function SketchFilterDef() {
  return (
    <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="adv-sketch">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * CRT flavor as a pure-CSS overlay: scanlines + vignette + a hint of screen
 * curvature via corner rounding. Toggleable in settings; defaults off when
 * prefers-reduced-motion is set. Never intercepts input.
 */
function CrtOverlay() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 15, pointerEvents: "none", borderRadius: "24px / 18px", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "repeating-linear-gradient(0deg, rgba(15,15,27,0.22) 0px, rgba(15,15,27,0.22) 1px, transparent 1px, transparent 3px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 52%, rgba(5,5,12,0.55) 100%)",
        }}
      />
    </div>
  );
}
