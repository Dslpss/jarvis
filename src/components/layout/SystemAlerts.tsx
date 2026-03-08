"use client";

import { useSystemMonitor } from "@/hooks/useSystemMonitor";

export function SystemAlerts() {
  const { alerts, dismissAlert } = useSystemMonitor();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 flex flex-col gap-2 max-w-sm">
      {alerts.map((alert, i) => (
        <div 
          key={i}
          className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 shadow-lg shadow-red-500/10 animate-in slide-in-from-left duration-300"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-[10px] font-mono uppercase tracking-widest">Alerta de Sistema</span>
            </div>
            <button 
              onClick={() => dismissAlert(i)}
              className="text-red-500/50 hover:text-red-400 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-white/80 text-xs mt-1 font-mono">{alert}</p>
        </div>
      ))}
    </div>
  );
}
