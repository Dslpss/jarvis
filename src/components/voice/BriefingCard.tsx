"use client";

import { cn } from "@/lib/cn";

export interface BriefingData {
  weather: {
    temp: string;
    condition: string;
    city: string;
  };
  news: Array<{
    title: string;
    url: string;
  }>;
  agenda: Array<{
    content: string;
    time: string;
  }>;
}

export interface VoiceBriefingCard {
  id: string;
  type: "briefing";
  data: BriefingData;
  timestamp: number;
}

interface BriefingCardProps {
  card: VoiceBriefingCard;
  onDismiss: (id: string) => void;
}

export function BriefingCard({ card, onDismiss }: BriefingCardProps) {
  const { weather, news, agenda } = card.data;

  return (
    <div className="relative w-80 bg-[#0a1628]/95 border border-cyan-500/40 rounded-xl overflow-hidden shadow-2xl shadow-cyan-900/20 animate-in fade-in slide-in-from-right-4 duration-500 backdrop-blur-md">
      {/* Glow Header */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400 text-[10px] font-mono uppercase tracking-[0.2em]">Relatório Diário</span>
          </div>
          <button 
            onClick={() => onDismiss(card.id)}
            className="text-cyan-500/50 hover:text-cyan-400 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Weather Section */}
        <div className="mb-6 bg-cyan-500/5 rounded-lg p-3 border border-cyan-500/10">
          <div className="text-white/60 text-[10px] font-mono uppercase mb-1">Clima em {weather.city}</div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-light text-white">{weather.temp}</span>
            <span className="text-xs text-white/80">{weather.condition}</span>
          </div>
        </div>

        {/* Agenda Section */}
        <div className="mb-6">
          <div className="text-cyan-400/60 text-[10px] font-mono uppercase mb-2">Sua Agenda</div>
          <div className="space-y-2">
            {agenda.length > 0 ? agenda.map((item, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <span className="text-cyan-500 font-mono">{item.time}</span>
                <span className="text-white/90 truncate">{item.content}</span>
              </div>
            )) : <p className="text-white/40 text-xs italic">Sem compromissos para hoje.</p>}
          </div>
        </div>

        {/* News Section */}
        <div>
          <div className="text-cyan-400/60 text-[10px] font-mono uppercase mb-2">Principais Notícias</div>
          <div className="space-y-3">
            {news.map((item, i) => (
              <a 
                key={i} 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <p className="text-[11px] text-white/80 group-hover:text-cyan-400 transition-colors leading-relaxed line-clamp-2">
                  • {item.title}
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-cyan-500/10 flex justify-between items-center text-[9px] font-mono text-cyan-500/30 uppercase">
          <span>Sistemas Operacionais</span>
          <span>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
    </div>
  );
}
