import type { CSSProperties } from "react";
import { PALETTE } from "../assets/sprites";

/** Shared chunky-pixel UI styles for Adventure Mode overlays. */

export const PIXEL_FONT = "'Press Start 2P', monospace";

export const panel: CSSProperties = {
  background: PALETTE.navy,
  border: `3px solid ${PALETTE.bone}`,
  boxShadow: `0 0 0 3px ${PALETTE.ink}, 6px 6px 0 ${PALETTE.ink}`,
  color: PALETTE.bone,
  fontFamily: PIXEL_FONT,
  imageRendering: "pixelated",
  padding: "20px",
};

export const pixelButton = (bg: string, color: string): CSSProperties => ({
  background: bg,
  color,
  border: `3px solid ${PALETTE.bone}`,
  borderRadius: 0,
  padding: "10px 16px",
  cursor: "pointer",
  fontFamily: PIXEL_FONT,
  fontSize: "0.65rem",
  boxShadow: `3px 3px 0 ${PALETTE.ink}`,
});

export const smallText: CSSProperties = {
  fontFamily: PIXEL_FONT,
  fontSize: "0.55rem",
  lineHeight: 1.9,
};
