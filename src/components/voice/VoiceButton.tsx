'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { VoiceStatus } from '@/types/voice';

interface VoiceButtonProps {
  status: VoiceStatus;
  onClick: () => void;
}

/* ── SVG Icons ──────────────────────────────────────────────── */

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-6 h-6', className)}
    >
      <rect x="9" y="1" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function SoundWaveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-6 h-6', className)}
    >
      <path d="M2 12h2" />
      <path d="M6 8v8" />
      <path d="M10 4v16" />
      <path d="M14 6v12" />
      <path d="M18 8v8" />
      <path d="M22 12h-2" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={cn('w-6 h-6 animate-spin', className)}
    >
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('w-6 h-6', className)}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

/* ── Styles per status ──────────────────────────────────────── */

const buttonStyles: Record<VoiceStatus, string> = {
  idle: 'border-2 border-jarvis-primary-dim bg-transparent',
  connecting: 'border-2 border-jarvis-primary bg-jarvis-primary/5 animate-pulse',
  connected: 'border-2 border-jarvis-success bg-jarvis-success/10',
  listening:
    'border-2 border-jarvis-primary bg-jarvis-primary/15 shadow-[0_0_30px_rgba(0,212,255,0.3)]',
  speaking:
    'border-2 border-jarvis-secondary bg-jarvis-secondary/15 shadow-[0_0_30px_rgba(0,85,255,0.3)]',
  error: 'border-2 border-jarvis-error bg-jarvis-error/10',
};

const iconColors: Record<VoiceStatus, string> = {
  idle: 'text-jarvis-primary-dim',
  connecting: 'text-jarvis-primary',
  connected: 'text-jarvis-success',
  listening: 'text-jarvis-primary',
  speaking: 'text-jarvis-secondary',
  error: 'text-jarvis-error',
};

/* ── Component ──────────────────────────────────────────────── */

export function VoiceButton({ status, onClick }: VoiceButtonProps) {
  const renderIcon = () => {
    switch (status) {
      case 'connecting':
        return <SpinnerIcon className={iconColors[status]} />;
      case 'speaking':
        return <SoundWaveIcon className={iconColors[status]} />;
      case 'error':
        return <ErrorIcon className={iconColors[status]} />;
      default:
        return <MicrophoneIcon className={iconColors[status]} />;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulsing ring for listening state */}
      {status === 'listening' && (
        <motion.div
          className="absolute -inset-3 rounded-full border-2 border-jarvis-primary/50"
          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      <button
        type="button"
        onClick={onClick}
        className={cn(
          'relative w-20 h-20 sm:w-24 sm:h-24 rounded-full',
          'flex items-center justify-center',
          'transition-all duration-300 cursor-pointer',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-jarvis-primary/50',
          buttonStyles[status],
        )}
        aria-label={
          status === 'idle' || status === 'error'
            ? 'Start voice session'
            : 'Stop voice session'
        }
      >
        {renderIcon()}
      </button>
    </div>
  );
}
