import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "QuestForge — Turn Any Plan Into a Game",
  description: "Upload a project plan and Claude builds you a personalized gamified quest tracker.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
