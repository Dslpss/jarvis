"use client";

import { cn } from "@/lib/cn";

interface MuteButtonProps {
  muted: boolean;
  onClick: () => void;
  visible: boolean;
}

function MicOnIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}>
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4", className)}>
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export function MuteButton({ muted, onClick, visible }: MuteButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        "border transition-all duration-200 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-jarvis-primary/50",
        muted
          ? "border-jarvis-error/60 bg-jarvis-error/10 text-jarvis-error"
          : "border-jarvis-primary-dim/40 bg-white/5 text-jarvis-primary-dim hover:text-jarvis-primary hover:border-jarvis-primary/40",
      )}
      aria-label={muted ? "Unmute microphone" : "Mute microphone"}
      title={muted ? "Mic muted — click to unmute" : "Mute mic"}>
      {muted ? <MicOffIcon /> : <MicOnIcon />}
    </button>
  );
}
