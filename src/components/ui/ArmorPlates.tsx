"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ArmorPlatesProps {
  className?: string;
}

export function ArmorPlates({ className }: ArmorPlatesProps) {
  return (
    <div className={cn("fixed inset-0 pointer-events-none z-40", className)}>
      {/* Top Left Plate */}
      <motion.div
        initial={{ x: -100, y: -100, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-0 left-0 w-64 h-32"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-jarvis-background-paper to-transparent opacity-40" 
             style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" }} />
        <div className="absolute top-4 left-4 w-1 h-8 bg-jarvis-primary/40" />
        <div className="absolute top-4 left-4 w-8 h-1 bg-jarvis-primary/40" />
        <div className="absolute top-8 left-8 flex gap-1">
          <div className="w-1 h-1 bg-jarvis-primary animate-pulse" />
          <div className="w-1 h-1 bg-jarvis-primary/40" />
          <div className="w-1 h-1 bg-jarvis-primary/40" />
        </div>
      </motion.div>

      {/* Top Right Plate */}
      <motion.div
        initial={{ x: 100, y: -100, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="absolute top-0 right-0 w-64 h-32"
      >
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-jarvis-background-paper to-transparent opacity-40"
             style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 15% 100%)" }} />
             
        {/* Status Indicator */}
        <div className="absolute top-8 right-8 flex items-center gap-2">
          <span className="text-[8px] font-mono text-jarvis-primary-dim uppercase tracking-widest">Targeting System</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
        </div>
      </motion.div>

      {/* Bottom Left Plate */}
      <motion.div
        initial={{ x: -100, y: 100, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="absolute bottom-0 left-0 w-72 h-40"
      >
        <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-tr from-jarvis-background-paper to-transparent opacity-40"
             style={{ clipPath: "polygon(0 0, 80% 0, 100% 100%, 0% 100%)" }} />
        
        {/* Decorative corner */}
        <div className="absolute bottom-6 left-6 w-12 h-1 bg-jarvis-primary/20" />
        <div className="absolute bottom-6 left-6 w-1 h-12 bg-jarvis-primary/20" />
      </motion.div>

      {/* Bottom Right Plate */}
      <motion.div
        initial={{ x: 100, y: 100, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        className="absolute bottom-0 right-0 w-72 h-40"
      >
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tl from-jarvis-background-paper to-transparent opacity-40"
             style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0% 100%)" }} />
        
        {/* Telemetry feed - Mock */}
        <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 opacity-60">
          <div className="w-16 h-0.5 bg-jarvis-primary/30" />
          <div className="w-12 h-0.5 bg-jarvis-primary/30" />
          <div className="w-20 h-0.5 bg-jarvis-primary/30" />
        </div>
      </motion.div>

      {/* Side Scanners */}
      <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-transparent via-jarvis-primary/20 to-transparent" />
      <div className="absolute inset-y-0 right-4 w-px bg-gradient-to-b from-transparent via-jarvis-primary/20 to-transparent" />
    </div>
  );
}
