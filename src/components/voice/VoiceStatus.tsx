"use client";

import type { VoiceStatus as VoiceStatusType } from "@/types/voice";

interface VoiceStatusProps {
  status: VoiceStatusType;
  errorMessage?: string | null;
}

const statusConfig: Record<VoiceStatusType, { label: string; color: string }> =
  {
    idle: { label: "Press the microphone to start", color: "text-[#5a7a90]" },
    connecting: {
      label: "Establishing connection...",
      color: "text-[#00d4ff]",
    },
    connected: {
      label: "Connected. Initializing audio...",
      color: "text-[#00ff88]",
    },
    listening: { label: "Listening...", color: "text-[#00d4ff]" },
    speaking: { label: "J.A.R.V.I.S. is speaking...", color: "text-[#0055ff]" },
    error: { label: "Connection error. Try again.", color: "text-[#ff0044]" },
  };

export function VoiceStatus({ status, errorMessage }: VoiceStatusProps) {
  const config = statusConfig[status];
  const displayLabel =
    status === "error" && errorMessage ? errorMessage : config.label;

  return (
    <div className="flex items-center justify-center min-h-[2rem]">
      <div className="flex items-center gap-2 font-mono text-sm">
        <span className="relative flex h-2 w-2">
          {(status === "connecting" ||
            status === "listening" ||
            status === "speaking") && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                status === "speaking" ? "bg-[#0055ff]" : "bg-[#00d4ff]"
              }`}
            />
          )}
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              status === "idle"
                ? "bg-[#5a7a90]"
                : status === "error"
                  ? "bg-[#ff0044]"
                  : status === "connected"
                    ? "bg-[#00ff88]"
                    : status === "speaking"
                      ? "bg-[#0055ff]"
                      : "bg-[#00d4ff]"
            }`}
          />
        </span>
        <span className={config.color}>{displayLabel}</span>
      </div>
    </div>
  );
}
