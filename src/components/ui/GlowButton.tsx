import { cn } from '@/lib/cn';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

export function GlowButton({
  children,
  className,
  variant = 'primary',
  loading = false,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={cn(
        'relative px-4 py-2 rounded-lg font-medium transition-all duration-300 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[#00d4ff]/50',
        variant === 'primary' && [
          'border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]',
          'hover:bg-[#00d4ff]/20 hover:border-[#00d4ff]/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]',
          'active:bg-[#00d4ff]/30 active:shadow-[0_0_30px_rgba(0,212,255,0.3)]',
        ],
        variant === 'ghost' && [
          'border border-transparent text-[#5a7a90]',
          'hover:text-[#00d4ff] hover:border-[#00d4ff]/20',
        ],
        (disabled || loading) && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
