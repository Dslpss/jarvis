"use client";

import { cn } from "@/lib/cn";
import { useState } from "react";

export type VoiceCodeCardMode = "display" | "execution";

export interface VoiceCodeCard {
  id: string;
  mode: VoiceCodeCardMode;
  language: string;
  code: string;
  title?: string;
  // Execution-only fields
  output?: string;
  error?: string;
  success?: boolean;
  executionTimeMs?: number;
  timestamp: number;
}

interface VoiceCodeCardProps {
  card: VoiceCodeCard;
  onDismiss: (id: string) => void;
}

const LANG_LABELS: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  python: "Python",
  py: "Python",
  typescript: "TypeScript",
  ts: "TypeScript",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  bash: "Bash",
  sql: "SQL",
  java: "Java",
  c: "C",
  cpp: "C++",
  go: "Go",
  rust: "Rust",
};

export function VoiceCodeCardComponent({
  card,
  onDismiss,
}: VoiceCodeCardProps) {
  const [expanded, setExpanded] = useState(true);
  const label = LANG_LABELS[card.language.toLowerCase()] || card.language;
  const isExecution = card.mode === "execution";
  const hasError = isExecution && card.error;

  const handleCopy = () => {
    navigator.clipboard.writeText(card.code);
  };

  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-xl overflow-hidden border backdrop-blur-md",
        hasError
          ? "border-red-500/30 bg-[#1a0a0a]/90"
          : "border-[#00d4ff]/30 bg-[#0a0f1a]/90",
      )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1525]/90 border-b border-[#00d4ff]/10">
        <div className="flex items-center gap-2">
          {isExecution && (
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                card.success
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                  : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
              )}
            />
          )}
          {!isExecution && (
            <div className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_6px_rgba(0,212,255,0.6)]" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00d4ff]/70">
            {card.title || label}
          </span>
          {isExecution && card.executionTimeMs !== undefined && (
            <span className="text-[9px] text-[#5a7a90]/50">
              {card.executionTimeMs}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="text-[10px] text-[#5a7a90]/70 hover:text-[#00d4ff] transition-colors px-1.5 py-0.5 cursor-pointer">
            Copiar
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-[#5a7a90]/70 hover:text-[#00d4ff] transition-colors px-1.5 py-0.5 cursor-pointer">
            {expanded ? "▼" : "▶"}
          </button>
          <button
            onClick={() => onDismiss(card.id)}
            className="text-[10px] text-[#5a7a90]/70 hover:text-red-400 transition-colors px-1.5 py-0.5 cursor-pointer">
            ✕
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Code */}
          <div
            className={cn(
              "px-4 py-3",
              isExecution && "border-b border-[#00d4ff]/5",
            )}>
            <pre className="overflow-x-auto max-h-60 overflow-y-auto scrollbar-thin">
              <code className="text-[12px] leading-relaxed text-[#b8d4e8] font-mono">
                {card.code}
              </code>
            </pre>
          </div>

          {/* Output (execution mode only) */}
          {isExecution && (card.output || card.error) && (
            <div className="px-4 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5a7a90]/50 mb-1 block">
                Output
              </span>
              <pre className="overflow-x-auto max-h-32 overflow-y-auto scrollbar-thin">
                <code
                  className={cn(
                    "text-[12px] leading-relaxed font-mono",
                    card.success ? "text-emerald-300/90" : "text-red-300/90",
                  )}>
                  {card.error || card.output}
                </code>
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
