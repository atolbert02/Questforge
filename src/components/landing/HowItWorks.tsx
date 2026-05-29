export default function HowItWorks() {
  const steps = [
    { icon: "📄", title: "Upload Your Plan", desc: "Drop in a PDF, DOCX, or paste your project plan directly." },
    { icon: "⚡", title: "Claude Generates", desc: "AI analyzes your plan and builds custom phases, quests, and a skill tree." },
    { icon: "🎯", title: "Track & Conquer", desc: "Work through quests, earn XP, unlock achievements, and export your tracker." },
  ];

  return (
    <section style={{ padding: "60px 24px", borderTop: "1px solid #1a2535" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Orbitron, sans-serif", color: "#e2e8f0", fontSize: "1.2rem", marginBottom: "40px", letterSpacing: "2px" }}>HOW IT WORKS</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>{s.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: "8px", color: "#e2e8f0" }}>{s.title}</div>
              <div style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
