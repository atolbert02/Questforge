"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FileDropzone from "@/components/create/FileDropzone";
import TextPaste from "@/components/create/TextPaste";
import GeneratingScreen from "@/components/create/GeneratingScreen";
import { saveTracker, emptyProgress } from "@/lib/tracker-storage";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name."); return; }
    if (tab === "upload" && !file) { setError("Please upload a file."); return; }
    if (tab === "paste" && !text.trim()) { setError("Please paste your project plan."); return; }

    setState("generating");

    const fd = new FormData();
    fd.append("name", name.trim());
    if (tab === "upload" && file) fd.append("file", file);
    else fd.append("text", text);

    try {
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Generation failed. Please try again.");
        setState("error");
        return;
      }
      saveTracker(data.tracker as TrackerConfig, emptyProgress());
      router.push("/tracker");
    } catch {
      setError("Network error. Please try again.");
      setState("error");
    }
  }

  if (state === "generating") return (
    <main style={{ background: "#05060e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <GeneratingScreen />
    </main>
  );

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
              placeholder="Alexandra"
              maxLength={50}
              style={{
                width: "100%", background: "#0d1117", border: "1px solid #1a2535",
                borderRadius: "8px", color: "#e2e8f0", padding: "10px 14px",
                fontSize: "0.95rem", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#f97316")}
              onBlur={(e) => (e.target.style.borderColor = "#1a2535")}
            />
          </div>

          <div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button type="button" style={tabStyle(tab === "upload")} onClick={() => setTab("upload")}>Upload File</button>
              <button type="button" style={tabStyle(tab === "paste")} onClick={() => setTab("paste")}>Paste Text</button>
            </div>
            {tab === "upload" ? (
              <FileDropzone onFile={setFile} />
            ) : (
              <TextPaste value={text} onChange={setText} />
            )}
          </div>

          {(error || state === "error") && (
            <div style={{ color: "#fb7185", background: "#fb718511", border: "1px solid #fb718533", borderRadius: "8px", padding: "12px 16px", fontSize: "0.9rem" }}>
              {error || "Something went wrong. Please try again."}
            </div>
          )}

          <button
            type="submit"
            style={{
              background: "#f97316", color: "#05060e", border: "none",
              borderRadius: "8px", padding: "14px", fontWeight: 700,
              fontSize: "1rem", cursor: "pointer", fontFamily: "Orbitron, sans-serif",
              letterSpacing: "1px",
            }}
          >
            GENERATE MY TRACKER →
          </button>
        </form>
      </div>
    </main>
  );
}
