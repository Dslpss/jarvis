'use client';

import { ChatMessage as ChatMessageType } from '@/types/chat';
import { StreamingText } from './StreamingText';
import { cn } from '@/lib/cn';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={cn('flex gap-3 px-4', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar for Jarvis */}
      {!isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center shadow-[0_0_10px_rgba(0,212,255,0.2)]">
          <span className="text-xs font-bold text-[#00d4ff] font-[var(--font-orbitron)]">J</span>
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] px-5 py-3 rounded-2xl relative transition-all duration-300',
          isUser
            ? 'bg-[#0055ff]/10 border border-[#0055ff]/20 rounded-tr-none text-right ml-12'
            : 'bg-[#00d4ff]/5 border border-[#00d4ff]/20 rounded-tl-none mr-12 backdrop-blur-md shadow-[0_0_15px_rgba(0,212,255,0.05)]'
        )}
      >
        {/* Holographic accent for Jarvis messages */}
        {!isUser && (
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#00d4ff]/[0.03] to-transparent pointer-events-none rounded-2xl" />
        )}

        {message.isStreaming ? (
          <StreamingText
            text={message.text}
            isStreaming={message.isStreaming}
            className="text-sm text-[#e0f0ff] leading-relaxed"
          />
        ) : (
          <p className="text-sm text-[#e0f0ff] leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}
        <div className={cn("flex items-center gap-1 mt-2", isUser ? "justify-end" : "justify-start")}>
          <span className="text-[9px] uppercase tracking-tighter text-[#5a7a90]/70 font-bold">{isUser ? 'USUÁRIO' : 'JARVIS'}</span>
          <span className="text-[10px] text-[#5a7a90]/50 font-medium">•</span>
          <span className="text-[9px] text-[#5a7a90]/70 font-medium">{time}</span>
        </div>
      </div>
    </div>
  );
}
