"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { HudFrame } from "@/components/ui/HudFrame";

export function ChatPanel() {
  const { messages, isStreaming, sendMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <HudFrame className="flex-1 overflow-hidden mx-4 mt-4" scanLine>
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto py-6 space-y-4 scrollbar-thin scrollbar-thumb-[#00d4ff]/10 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 relative">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-[#00d4ff]/20 blur-xl animate-pulse" />
                <div className="w-20 h-20 rounded-full border-2 border-[#00d4ff]/40 flex items-center justify-center relative bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                  <span className="text-3xl font-bold text-[#00d4ff] font-[var(--font-orbitron)] animate-[glow_2s_ease-in-out_infinite_alternate]">
                    J
                  </span>
                  {/* Rotating ring */}
                  <div className="absolute -inset-2 border-t-2 border-b-2 border-[#00d4ff]/20 rounded-full animate-[spin_10s_linear_infinite]" />
                </div>
              </div>
              <h2 className="text-xl text-[#00d4ff] font-semibold mb-2 font-[var(--font-orbitron)] tracking-wider">
                SISTEMA J.A.R.V.I.S. ONLINE
              </h2>
              <p className="text-sm text-[#5a7a90] max-w-sm font-medium">
                Pronto para auxiliar em qualquer tarefa, Senhor.
              </p>
            </div>
          ) : (
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
          )}
        </div>
      </HudFrame>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
