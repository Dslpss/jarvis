import { cn } from '@/lib/cn';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassPanel({ children, className, glow = false }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[rgba(0,212,255,0.12)] bg-[rgba(10,15,30,0.6)] backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        glow && 'shadow-[0_0_30px_rgba(0,212,255,0.08),inset_0_1px_0_rgba(255,255,255,0.03)]',
        className
      )}
    >
      {children}
    </div>
  );
}
