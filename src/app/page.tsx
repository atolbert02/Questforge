import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#05060e" }}>
      <h1 style={{ fontFamily: "Orbitron, sans-serif", color: "#f97316", fontSize: "2.5rem", textAlign: "center", marginBottom: "16px" }}>
        Turn Any Project Plan Into a Game
      </h1>
      <p style={{ color: "#64748b", maxWidth: "520px", textAlign: "center", marginBottom: "40px", fontSize: "1.1rem" }}>
        Upload a PDF, DOCX, or paste your plan. Claude analyzes it and builds a personalized quest tracker in seconds.
      </p>
      <Link href="/create" style={{ background: "#f97316", color: "#05060e", padding: "14px 32px", borderRadius: "8px", fontWeight: 700, textDecoration: "none", fontSize: "1rem" }}>
        Generate My Tracker →
      </Link>
    </main>
  );
}
