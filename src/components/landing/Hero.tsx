import Link from "next/link";

export default function Hero() {
  return (
    <section style={{ textAlign: "center", padding: "80px 24px 60px" }}>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: "0.75rem", color: "#f97316", letterSpacing: "3px", marginBottom: "20px" }}>
        TURN PLANS INTO QUESTS
      </div>
      <h1 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "clamp(1.8rem, 5vw, 3rem)", color: "#e2e8f0", lineHeight: 1.2, marginBottom: "20px", maxWidth: "700px", margin: "0 auto 20px" }}>
        Turn Any Project Plan<br /><span style={{ color: "#f97316" }}>Into a Game</span>
      </h1>
      <p style={{ color: "#64748b", fontSize: "1.1rem", maxWidth: "520px", margin: "0 auto 40px", lineHeight: 1.6 }}>
        Upload a PDF, DOCX, or paste your plan. Questify analyzes it and builds a personalized quest tracker in seconds.
      </p>
      <Link href="/create" style={{ background: "#f97316", color: "#05060e", padding: "14px 36px", borderRadius: "8px", fontWeight: 700, textDecoration: "none", fontSize: "1rem", fontFamily: "Orbitron, sans-serif", letterSpacing: "1px", display: "inline-block" }}>
        GENERATE MY TRACKER →
      </Link>
    </section>
  );
}
