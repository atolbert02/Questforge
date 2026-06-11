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

  async function readStream(res: Response): Promise<string> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    return text;
  }

  function parseJSON(text: string): unknown {
    const objStart = text.indexOf("{");
    const objEnd = text.lastIndexOf("}");
    const arrStart = text.indexOf("[");
    const arrEnd = text.lastIndexOf("]");
    try {
      if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
        return JSON.parse(text.slice(arrStart, arrEnd + 1));
      }
      if (objStart !== -1) {
        return JSON.parse(text.slice(objStart, objEnd + 1));
      }
    } catch {}
    return null;
  }

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
      // ── Step 1: skeleton ──────────────────────────────────────────
      fd.append("step", "skeleton");
      const res1 = await fetch("/api/generate", { method: "POST", body: fd });
      if (!res1.ok) {
        const data = await res1.json().catch(() => ({}));
        setError(data.error || "Generation failed. Please try again.");
        setState("error");
        return;
      }
      const raw1 = await readStream(res1);

      // Extract projectText sentinel appended by the server
      const sentinelMatch = raw1.match(/__PROJECT_TEXT__([\s\S]*?)__END__/);
      const projectText = sentinelMatch ? JSON.parse(sentinelMatch[1]) : "";
      const skeletonText = raw1.replace(/__PROJECT_TEXT__[\s\S]*?__END__/, "");
      const skeleton = parseJSON(skeletonText) as { phases: { id: number; label: string; tagline: string }[]; skills: { id: string; label: string }[] } | null;
      if (!skeleton) { setError("Generation failed at skeleton step. Please try again."); setState("error"); return; }

      // ── Step 2: quests ────────────────────────────────────────────
      const fd2 = new FormData();
      fd2.append("step", "quests");
      fd2.append("text", projectText);
      fd2.append("phases", JSON.stringify(skeleton.phases));
      fd2.append("skills", JSON.stringify(skeleton.skills));
      const res2 = await fetch("/api/generate", { method: "POST", body: fd2 });
      if (!res2.ok) {
        const data = await res2.json().catch(() => ({}));
        setError(data.error || "Generation failed at quests step. Please try again.");
        setState("error");
        return;
      }
      const raw2 = await readStream(res2);
      const quests = parseJSON(raw2);
      if (!Array.isArray(quests)) { setError("Generation failed at quests step. Please try again."); setState("error"); return; }

      // ── Step 3: achievements ──────────────────────────────────────
      const questIds = quests.map((q: { id: string }) => q.id);
      const bossQuestIds = quests.filter((q: { boss: boolean }) => q.boss).map((q: { id: string }) => q.id);
      const fd3 = new FormData();
      fd3.append("step", "achievements");
      fd3.append("questIds", JSON.stringify(questIds));
      fd3.append("bossQuestIds", JSON.stringify(bossQuestIds));
      fd3.append("phaseCount", String(skeleton.phases.length));
      const res3 = await fetch("/api/generate", { method: "POST", body: fd3 });
      if (!res3.ok) {
        const data = await res3.json().catch(() => ({}));
        setError(data.error || "Generation failed at achievements step. Please try again.");
        setState("error");
        return;
      }
      const raw3 = await readStream(res3);
      const achievements = parseJSON(raw3);
      if (!Array.isArray(achievements)) { setError("Generation failed at achievements step. Please try again."); setState("error"); return; }

      // ── Assemble & save ───────────────────────────────────────────
      const config = { ...skeleton, quests, achievements };
      saveTracker(config as TrackerConfig, emptyProgress());
      router.push("/tracker");
    } catch (err) {
      const isDev = process.env.NODE_ENV === "development";
      setError(isDev ? `Error: ${String(err)}` : "Network error — check your connection and try again.");
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
