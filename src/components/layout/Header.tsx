"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { ModeToggle } from "./ModeToggle";

export function Header() {
  const [time, setTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <GlassPanel className="flex items-center justify-between px-6 py-4 rounded-none border-x-0 border-t-0 border-b border-b-[#00d4ff]/20 z-50">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-[#00d4ff]/20 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.8)] animate-pulse" />
            <h1 className="text-xl font-bold tracking-[0.2em] text-[#00d4ff] font-[var(--font-orbitron)] drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]">
              J.A.R.V.I.S.
            </h1>
          </div>
        </div>

        <div className="hidden md:flex flex-col border-l border-[#5a7a90]/30 pl-6">
          <span className="text-[9px] text-[#5a7a90] font-bold tracking-[0.1em] uppercase">
            Status do Sistema
          </span>
          <span className="text-[10px] text-[#00ff88] font-bold tracking-[0.05em] uppercase animate-pulse">
            Online
          </span>
        </div>
      </div>

      <ModeToggle />

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex flex-col items-end border-r border-[#5a7a90]/30 pr-8">
          <span className="text-[9px] text-[#5a7a90] font-bold tracking-[0.1em] uppercase">
            Protocolo Atual
          </span>
          <span className="text-[10px] text-[#e0f0ff] font-bold tracking-[0.05em] uppercase">
            Mark VII
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-[#5a7a90] font-bold tracking-[0.1em] uppercase">
            Tempo Local
          </span>
          <span className="text-sm text-[#e0f0ff] font-[var(--font-orbitron)] tabular-nums tracking-wider">
            {time}
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="ml-4 p-2 rounded-lg border border-[#5a7a90]/30 text-[#5a7a90] hover:text-[#ff0044] hover:border-[#ff0044]/40 hover:bg-[#ff0044]/10 transition-all duration-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </GlassPanel>
  );
}
