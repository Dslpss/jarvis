'use client';

import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/cn';

export function ModeToggle() {
  const { mode, setMode } = useAppStore();

  return (
    <div className="flex items-center rounded-lg border border-[#00d4ff]/15 bg-[rgba(10,15,30,0.5)] p-1 gap-1">
      <button
        onClick={() => setMode('text')}
        className={cn(
          'px-4 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-all duration-300',
          mode === 'text'
            ? 'bg-[#00d4ff]/15 text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.15)]'
            : 'text-[#5a7a90] hover:text-[#00d4ff]/60'
        )}
      >
        TEXT
      </button>
      <button
        onClick={() => setMode('voice')}
        className={cn(
          'px-4 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-all duration-300',
          mode === 'voice'
            ? 'bg-[#00d4ff]/15 text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.15)]'
            : 'text-[#5a7a90] hover:text-[#00d4ff]/60'
        )}
      >
        VOICE
      </button>
    </div>
  );
}
