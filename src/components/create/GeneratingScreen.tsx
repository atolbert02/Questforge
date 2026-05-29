"use client";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Reading your project plan...",
  "Identifying phases and milestones...",
  "Designing your quest board...",
  "Crafting achievements...",
  "Finalizing your tracker...",
];

export default function GeneratingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "400px", gap: "32px",
    }}>
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          border: "3px solid #1a2535",
          borderTop: "3px solid #f97316",
          animation: "spin 1s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: "12px", borderRadius: "50%",
          border: "3px solid #1a253599",
          borderTop: "3px solid #22d3ee",
          animation: "spin 1.5s linear infinite reverse",
        }} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "Orbitron, sans-serif", color: "#f97316",
          fontSize: "0.75rem", letterSpacing: "3px", marginBottom: "12px",
        }}>
          GENERATING YOUR TRACKER
        </div>
        <div style={{ color: "#94a3b8", fontSize: "1rem", minHeight: "28px" }}>
          {MESSAGES[msgIdx]}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
