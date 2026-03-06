"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export function TacticalReticle() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 200 };
  const sx = useSpring(mouseX, springConfig);
  const sy = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <motion.div
        style={{
          x: sx,
          y: sy,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="relative"
      >
        {/* Central Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-[1px] bg-jarvis-primary/60" />
          <div className="h-4 w-[1px] bg-jarvis-primary/60" />
        </div>

        {/* Outer Rotating Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-24 h-24 border border-dashed border-jarvis-primary/20 rounded-full" />
        </motion.div>

        {/* Tactical Brackets */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 relative">
            {/* Top Left Bracket */}
            <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-jarvis-primary/40" />
            {/* Top Right Bracket */}
            <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-jarvis-primary/40" />
            {/* Bottom Left Bracket */}
            <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-jarvis-primary/40" />
            {/* Bottom Right Bracket */}
            <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-jarvis-primary/40" />
          </div>
        </div>

        {/* Coordinate Readout */}
        <div className="absolute top-10 left-10 flex flex-col gap-0.5">
          <span className="text-[8px] font-mono text-jarvis-primary/60 tabular-nums">SCANNING...</span>
          <div className="flex gap-2">
            <span className="text-[7px] font-mono text-jarvis-primary/40">LAT: 34.0522</span>
            <span className="text-[7px] font-mono text-jarvis-primary/40">LNG: -118.2437</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
