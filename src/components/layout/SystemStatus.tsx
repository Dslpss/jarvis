"use client";

import { useAppStore } from "@/stores/appStore";

export function SystemStatus() {
  const mode = useAppStore((s) => s.mode);

  return (
    <div className="flex items-center justify-between px-6 py-2 border-t border-[#00d4ff]/10 bg-[rgba(6,6,18,0.8)]">
      <div className="flex items-center gap-4">
        <span className="text-[10px] text-[#5a7a90] font-mono uppercase tracking-wider">
          Mode: {mode === "text" ? "Text" : "Voice"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
        <span className="text-[10px] text-[#5a7a90] font-mono uppercase tracking-wider">
          System Online
        </span>
      </div>
    </div>
  );
}
