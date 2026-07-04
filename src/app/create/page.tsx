"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FileDropzone from "@/components/create/FileDropzone";
import TextPaste from "@/components/create/TextPaste";
import TrackerShell from "@/components/tracker/TrackerShell";
import { saveTracker, emptyProgress } from "@/lib/tracker-storage";
import { validateConfig } from "@/lib/validate-config";
import { generateTracker } from "@/lib/generate-client";
import { TrackerConfig } from "@/lib/types";

type State = "idle" | "generating" | "error";
type InputTab = "upload" | "paste";

export default function CreatePage() {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [tab, setTab] = useState<InputTab>("upload");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  // Real progress (0..1) + label, driven by the orchestrator.
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  // Partial tracker snapshots so the tracker fills in live as phases resolve.
  const [partial, setPartial] = useState<TrackerConfig | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name."); return; }
    if (tab === "upload" && !file) { setError("Please upload a file."); return; }
    if (tab === "paste" && !text.trim()) { setError("Please paste your project plan."); return; }

    setState("generating");
    setProgress(0);
    setProgressLabel("Starting...");
    setPartial(null);

    try {
      const config = await generateTracker(
        { name: name.trim(), file: tab === "upload" ? file : null, text },
        (fraction, label) => { setProgress(fraction); setProgressLabel(label); },
        (snapshot) => setPartial(snapshot)
      );

      const validation = validateConfig(config);
      if (!validation.valid) {
        console.error("Assembled config invalid:", validation.errors);
        setError("The generated tracker was incomplete. Please try again.");
        setState("error");
        return;
      }

      saveTracker(config, emptyProgress());
      router.push("/tracker");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
      setState("error");
    }
  }

  if (state === "generating") {
    const pct = Math.round(progress * 100);

    // Before the skeleton arrives, show a centered progress bar.
    if (!partial) {
      return (
        <main style={{ background: "#05060e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
          <div style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", color: "#f97316", fontSize: "0.75rem", letterSpacing: "3px", marginBottom: "24px" }}>
              GENERATING YOUR TRACKER
            </div>
            <div style={{ background: "#1a2535", borderRadius: "6px", height: "10px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#f97316", borderRadius: "6px", transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>{progressLabel}</span>
              <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "#64748b", fontSize: "0.85rem" }}>{pct}%</span>
            </div>
          </div>
        </main>
      );
    }

    // Once the skeleton exists, render the tracker live with a slim status bar on top.
    return (
      <div style={{ background: "#05060e", minHeight: "100vh" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#0d1117ee", borderBottom: "1px solid #1a2535", backdropFilter: "blur(6px)" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "10px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", color: "#f97316", fontSize: "0.7rem", letterSpacing: "2px", whiteSpace: "nowrap" }}>
              {progressLabel}
            </span>
            <div style={{ flex: 1, background: "#1a2535", borderRadius: "6px", height: "6px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "#f97316", borderRadius: "6px", transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", color: "#64748b", fontSize: "0.8rem" }}>{pct}%</span>
          </div>
        </div>
        <TrackerShell config={partial} initialProgress={emptyProgress()} preview />
      </div>
    );
  }

  const tabStyle = (active: boolean) => ({
    padding: "8px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: 600,
    fontSize: "0.85rem", border: "1px solid",
    borderColor: active ? "#f97316" : "#1a2535",
    background: active ? "#f9731622" : "transparent",
    color: active ? "#f97316" : "#64748b",
  });

  return (
    <main style={{ background: "#05060e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        <a href="/" style={{ color: "#64748b", fontSize: "0.85rem", textDecoration: "none", display: "block", marginBottom: "32px" }}>← Back</a>
        <h1 style={{ fontFamily: "Orbitron, sans-serif", color: "#f97316", fontSize: "1.5rem", marginBottom: "8px" }}>
          Generate Your Tracker
        </h1>
        <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "0.9rem" }}>
          Upload your project plan and Claude will build a personalized gamified quest tracker.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ color: "#94a3b8", fontSize: "0.85rem", display: "block", marginBottom: "8px" }}>Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type Your Name Here"
              maxLength={50}
              style={{ width: "100%", background: "#0d1117", border: "1px solid #1a2535", borderRadius: "8px", color: "#e2e8f0", padding: "10px 14px", fontSize: "0.95rem", outline: "none" }}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "#1a2535")}
            />
          </div>

          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button type="button" style={tabStyle(tab === "upload")} onClick={() => setTab("upload")}>Upload File</button>
              <button type="button" style={tabStyle(tab === "paste")} onClick={() => setTab("paste")}>Paste Text</button>
            </div>
            {tab === "upload" ? <FileDropzone onFile={setFile} /> : <TextPaste value={text} onChange={setText} />}
          </div>

          {(error || state === "error") && (
            <div style={{ color: "#fb7185", background: "#fb718511", border: "1px solid #fb718533", borderRadius: "8px", padding: "12px 16px", fontSize: "0.9rem" }}>
              {error || "Something went wrong. Please try again."}
            </div>
          )}

          <button
            type="submit"
            style={{ background: "#f97316", color: "#05060e", border: "none", borderRadius: "8px", padding: "14px", fontWeight: 700, fontSize: "1rem", cursor: "pointer", fontFamily: "Orbitron, sans-serif", letterSpacing: "1px" }}
          >
            GENERATE MY TRACKER →
          </button>
        </form>
      </div>
    </main>
  );
}
