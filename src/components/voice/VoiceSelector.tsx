"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { VOICES } from "@/lib/constants";
import { useAppStore } from "@/stores/appStore";

interface VoiceSelectorProps {
  disabled?: boolean;
}

export function VoiceSelector({ disabled }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedVoice = useAppStore((s) => s.selectedVoice);
  const setSelectedVoice = useAppStore((s) => s.setSelectedVoice);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVoice = VOICES.find((v) => v.id === selectedVoice) || VOICES[0];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3 relative" ref={containerRef}>
      <span className="font-mono text-[9px] text-jarvis-primary-dim uppercase tracking-[0.3em] font-bold">
        Comms
      </span>

      <div className="relative group">
        {/* Trigger Button */}
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-48 px-3 py-1.5",
            "bg-black/40 border border-jarvis-primary/30",
            "hover:bg-jarvis-primary/10 hover:border-jarvis-primary/60 hover:shadow-[0_0_15px_rgba(0,212,255,0.1)]",
            "transition-all duration-300 relative overflow-hidden",
            isOpen && "border-jarvis-primary/80 bg-jarvis-primary/5",
            disabled && "opacity-40 cursor-not-allowed border-white/10"
          )}
        >
          {/* Scanline hover effect */}
          <div className="absolute inset-x-0 h-[1px] bg-jarvis-primary/20 top-0 translate-y-[-100%] group-hover:translate-y-[200%] transition-transform duration-1000" />
          
          <span className="font-mono text-[11px] text-jarvis-primary uppercase truncate tracking-widest">
            {currentVoice.label}
          </span>
          
          {/* HUD Chevron */}
          <svg
            className={cn("w-3 h-3 text-jarvis-primary transition-transform duration-300", isOpen && "rotate-180")}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 4L6 8L10 4" strokeLinecap="square" />
          </svg>
        </button>

        {/* Dropdown Menu - Opens UPWARDS now */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute bottom-full mb-1 left-0 w-full z-50",
                "bg-black/90 border border-jarvis-primary/40 backdrop-blur-md",
                "shadow-[0_-10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(0,212,255,0.05)]"
              )}
            >
              {/* Header inside dropdown */}
              <div className="px-3 py-1 bg-jarvis-primary/10 border-b border-jarvis-primary/20">
                <span className="text-[7px] font-mono text-jarvis-primary/60 uppercase tracking-widest">Available Frequency</span>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 border-b border-white/5",
                      "font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 relative group/opt",
                      selectedVoice === voice.id 
                        ? "text-jarvis-primary bg-jarvis-primary/10" 
                        : "text-white/60 hover:text-jarvis-primary hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{voice.label}</span>
                      <span className="text-[8px] opacity-40">{voice.gender === 'male' ? '[M]' : '[F]'}</span>
                    </div>

                    {/* Active side indicator */}
                    {selectedVoice === voice.id && (
                       <motion.div 
                         layoutId="active-opt"
                         className="absolute left-0 top-0 bottom-0 w-0.5 bg-jarvis-primary shadow-[0_0_8px_#00d4ff]"
                       />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer info */}
              <div className="px-2 py-1 flex justify-between items-center opacity-30">
                 <div className="flex gap-1">
                    <div className="w-1 h-1 bg-jarvis-primary" />
                    <div className="w-1 h-1 bg-jarvis-primary" />
                 </div>
                 <span className="text-[6px] font-mono">ENCRYPTED CHANNEL</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
