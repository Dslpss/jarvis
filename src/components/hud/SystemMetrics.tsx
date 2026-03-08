"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function SystemMetrics() {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    memory: 45,
    network: 1.2,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 15) + 10,
        memory: 40 + Math.random() * 5,
        network: parseFloat((Math.random() * 2).toFixed(1)),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 font-mono text-[10px] text-[#00d4ff]/60 uppercase tracking-widest">
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Neural CPU</span>
          <span>{metrics.cpu}%</span>
        </div>
        <div className="w-full h-1 bg-[#00d4ff]/10 overflow-hidden">
          <motion.div
            className="h-full bg-[#00d4ff]/40"
            animate={{ width: `${metrics.cpu}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Memory Alloc</span>
          <span>{metrics.memory.toFixed(1)}GB</span>
        </div>
        <div className="w-full h-1 bg-[#00d4ff]/10 overflow-hidden">
          <motion.div
            className="h-full bg-[#00d4ff]/40"
            animate={{ width: `${(metrics.memory / 64) * 100}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Signal Strength</span>
          <span>{metrics.network} GB/S</span>
        </div>
        <div className="flex gap-0.5 h-1">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className={`flex-1 ${i < metrics.network * 5 ? 'bg-[#00d4ff]/40' : 'bg-[#00d4ff]/10'}`}
              animate={{ opacity: i < metrics.network * 5 ? 1 : 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
