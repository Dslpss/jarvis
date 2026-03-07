"use client";

import { cn } from "@/lib/cn";

interface CodeBlockProps {
  code: string;
  language?: string;
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
  sh: "Shell",
  sql: "SQL",
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const label = language
    ? LANG_LABELS[language.toLowerCase()] || language
    : "Code";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#00d4ff]/20 bg-[#0a0f1a]/80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#0d1525]/90 border-b border-[#00d4ff]/10">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00d4ff]/70 font-[var(--font-orbitron)]">
          {label}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded",
            "text-[#5a7a90]/70 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10",
            "transition-colors duration-200 cursor-pointer",
          )}>
          Copiar
        </button>
      </div>

      {/* Code */}
      <pre className="px-4 py-3 overflow-x-auto">
        <code className="text-[13px] leading-relaxed text-[#b8d4e8] font-mono">
          {code}
        </code>
      </pre>
    </div>
  );
}
