"use client";
import { useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
}

export default function FileDropzone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert("File must be under 10MB.");
      return;
    }
    setFileName(file.name);
    onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      style={{
        border: `2px dashed ${dragging ? "#f97316" : "#1a2535"}`,
        borderRadius: "12px",
        padding: "48px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging ? "#f9731611" : "#0d1117",
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📄</div>
      {fileName ? (
        <div style={{ color: "#4ade80", fontWeight: 600 }}>✓ {fileName}</div>
      ) : (
        <>
          <div style={{ color: "#e2e8f0", fontWeight: 600, marginBottom: "6px" }}>Drop your file here</div>
          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>PDF, DOCX, or TXT — max 10MB</div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
