"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadTracker, clearTracker } from "@/lib/tracker-storage";
import { StoredTracker } from "@/lib/types";
import TrackerShell from "@/components/tracker/TrackerShell";

export default function TrackerPage() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredTracker | null | "loading">("loading");

  useEffect(() => {
    const data = loadTracker();
    if (!data) router.push("/create");
    else setStored(data);
  }, [router]);

  if (stored === "loading" || stored === null) return null;

  return (
    <TrackerShell
      config={stored.config}
      initialProgress={stored.progress}
      onNewTracker={() => { clearTracker(); router.push("/create"); }}
    />
  );
}
