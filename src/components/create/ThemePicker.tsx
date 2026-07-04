"use client";
import { useEffect } from "react";
import { THEME_LIST, ThemeId, GameTheme } from "@/lib/themes";

interface Props {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
}

/** Inject every theme's fonts once so the picker previews look authentic. */
function useAllThemeFonts() {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];
    THEME_LIST.forEach((t) => {
      const id = `qf-font-${t.id}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = t.fonts.googleFontsUrl;
      document.head.appendChild(link);
      links.push(link);
    });
    return () => links.forEach((l) => l.remove());
  }, []);
}

function ThemeCard({ theme, selected, onSelect }: { theme: GameTheme; selected: boolean; onSelect: () => void }) {
  const t = theme.tokens;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        textAlign: "left",
        background: theme.background ?? t.bgDeep,
        border: `2px solid ${selected ? t.accent : "#1a2535"}`,
        borderRadius: "12px",
        padding: "14px",
        cursor: "pointer",
        color: t.text,
        position: "relative",
        transition: "transform 0.15s, border-color 0.15s",
        transform: selected ? "translateY(-2px)" : "none",
        boxShadow: selected ? `0 0 0 3px ${t.accent}33` : "none",
      }}
    >
      {selected && (
        <span style={{ position: "absolute", top: "10px", right: "10px", width: "22px", height: "22px", borderRadius: "50%", background: t.accent, color: t.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700 }}>✓</span>
      )}
      <div style={{ fontFamily: theme.fonts.display, color: t.accent, fontSize: "1.05rem", lineHeight: 1.2, marginBottom: "4px", paddingRight: "24px" }}>
        {theme.name}
      </div>
      <div style={{ fontFamily: theme.fonts.body, color: t.textMuted, fontSize: "0.78rem", lineHeight: 1.4, minHeight: "34px" }}>
        {theme.blurb}
      </div>
      <div style={{ display: "flex", gap: "6px", marginTop: "12px", alignItems: "center" }}>
        {[t.accent, t.secondary, t.success, t.gold].map((c, i) => (
          <span key={i} style={{ width: "18px", height: "18px", borderRadius: "5px", background: c, border: `1px solid ${t.border}` }} />
        ))}
        <span style={{ marginLeft: "auto", fontFamily: theme.fonts.mono, fontSize: "0.62rem", color: t.textDim, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {theme.inspiredBy}
        </span>
      </div>
    </button>
  );
}

export default function ThemePicker({ value, onChange }: Props) {
  useAllThemeFonts();
  return (
    <div>
      <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "10px" }}>
        Choose your theme
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
        {THEME_LIST.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={value === theme.id}
            onSelect={() => onChange(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}
