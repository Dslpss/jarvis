import { cn } from '@/lib/cn';

interface HudFrameProps {
  children: React.ReactNode;
  className?: string;
  scanLine?: boolean;
}

export function HudFrame({ children, className, scanLine = false }: HudFrameProps) {
  return (
    <div className={cn('relative group', className)}>
      {/* Corner brackets with glow */}
      <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.2)] pointer-events-none transition-all duration-500 group-hover:border-[#00d4ff]/60 group-hover:w-8 group-hover:h-8" />
      <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.2)] pointer-events-none transition-all duration-500 group-hover:border-[#00d4ff]/60 group-hover:w-8 group-hover:h-8" />
      <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.2)] pointer-events-none transition-all duration-500 group-hover:border-[#00d4ff]/60 group-hover:w-8 group-hover:h-8" />
      <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#00d4ff]/40 shadow-[0_0_10px_rgba(0,212,255,0.2)] pointer-events-none transition-all duration-500 group-hover:border-[#00d4ff]/60 group-hover:w-8 group-hover:h-8" />

      {/* Subtle inner grid/gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00d4ff]/[0.02] to-transparent pointer-events-none" />

      {/* Scan line */}
      {scanLine && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff] to-transparent animate-[scanline_8s_linear_infinite]" />
        </div>
      )}

      {/* Decorative dots */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
        <div className="w-1 h-1 rounded-full bg-[#00d4ff]/20" />
        <div className="w-1 h-1 rounded-full bg-[#00d4ff]/40" />
        <div className="w-1 h-1 rounded-full bg-[#00d4ff]/20" />
      </div>

      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
