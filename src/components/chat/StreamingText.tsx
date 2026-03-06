'use client';

import { cn } from '@/lib/cn';

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingText({ text, isStreaming = false, className }: StreamingTextProps) {
  return (
    <div className={cn('whitespace-pre-wrap break-words', className)}>
      {text}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-0.5 bg-[#00d4ff] animate-pulse align-middle" />
      )}
    </div>
  );
}
