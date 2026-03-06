"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface SystemMetrics {
  cpu: number;
  memory: number;
  uptime: number;
}

export function ArmorDiagnostics() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 98.4,
    memory: 100,
    uptime: 0
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/system/metrics');
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch Jarvis diagnostics", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000); // 3-second refresh
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: "Arc Reactor (CPU)", value: metrics.cpu, unit: "%", color: "bg-cyan-500" },
    { label: "Armor Integrity (RAM)", value: metrics.memory, unit: "%", color: "bg-green-500" },
    { label: "Thrusters Temp", value: 35 + (Math.floor(metrics.cpu / 10)), unit: "°C", color: "bg-orange-500" },
    { label: "Oxygen Level", value: 100, unit: "%", color: "bg-blue-500" },
  ];

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-30"
    >
      <div className="flex flex-col gap-1 border-r-2 border-jarvis-primary/20 pr-4">
        <span className="text-[10px] font-mono text-jarvis-primary/60 uppercase tracking-[0.2em] text-right">
          Systems Check
        </span>
        <span className="text-[8px] font-mono text-jarvis-primary/40 uppercase text-right">
          Life Support Online
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-mono text-jarvis-primary/80 uppercase tracking-wider">
                {stat.label}
              </span>
              <span className="text-[11px] font-mono text-white/90 font-bold tabular-nums w-12 text-right">
                {stat.value.toFixed(1)}{stat.unit}
              </span>
            </div>
            {/* Minimal Progress Bar */}
            <div className="w-32 h-0.5 bg-white/5 relative overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${stat.label === "Oxygen Level" ? 100 : stat.value}%` }}
                 transition={{ duration: 1, ease: "easeInOut" }}
                 className={`absolute inset-y-0 left-0 ${stat.color} opacity-60 shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
               />
            </div>
          </div>
        ))}
      </div>

      {/* Pulsing Alert - Demo only */}
      <div className="mt-4 flex flex-col items-end gap-2 group">
        <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${metrics.cpu > 80 ? 'bg-red-600 animate-ping' : 'bg-jarvis-primary/40'}`} />
            <span className={`text-[8px] font-mono uppercase ${metrics.cpu > 80 ? 'text-red-500' : 'text-jarvis-primary/40'}`}>
              {metrics.cpu > 80 ? 'Alert: High CPU Load' : 'Status: Nominal'}
            </span>
        </div>
        <div className="w-24 h-[1px] bg-white/5" />
      </div>
    </motion.div>
  );
}
