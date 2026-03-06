'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { cn } from '@/lib/cn';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <GlassPanel className="mx-4 mb-4 p-3 flex items-end gap-3" glow>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => { setText(e.target.value); handleInput(); }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        className={cn(
          'flex-1 bg-transparent resize-none outline-none text-sm text-[#e0f0ff] placeholder-[#2a3a4a]',
          'scrollbar-thin scrollbar-thumb-[#00d4ff]/20'
        )}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
          'border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]',
          'hover:bg-[#00d4ff]/20 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-none'
        )}
      >
        {disabled ? (
          <span className="w-4 h-4 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>
    </GlassPanel>
  );
}
