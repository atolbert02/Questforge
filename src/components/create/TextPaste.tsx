"use client";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function TextPaste({ value, onChange }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste your project plan here — the more detail, the better your quests will be..."
      style={{
        width: "100%",
        minHeight: "300px",
        background: "#0d1117",
        border: "1px solid #1a2535",
        borderRadius: "12px",
        color: "#e2e8f0",
        padding: "16px",
        fontSize: "0.9rem",
        fontFamily: "DM Sans, sans-serif",
        resize: "vertical",
        outline: "none",
        lineHeight: 1.6,
      }}
      onFocus={(e) => (e.target.style.borderColor = "#f97316")}
      onBlur={(e) => (e.target.style.borderColor = "#1a2535")}
    />
  );
}
