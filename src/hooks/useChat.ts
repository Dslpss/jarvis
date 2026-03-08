'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ChatMessage } from '@/types/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handler = () => setMessages([]);
    if (typeof window !== 'undefined') {
      window.addEventListener("jarvis-clear", handler);
      return () => window.removeEventListener("jarvis-clear", handler);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        
        if (fullText.includes('[CLEAR_SCREEN]')) {
          window.dispatchEvent(new CustomEvent("jarvis-clear"));
          fullText = fullText.replace('[CLEAR_SCREEN]', '').trim();
          // We continue because the model might still be talking after the clear
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, text: fullText } : m
          )
        );
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, text: fullText, isStreaming: false }
            : m
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errorText = err instanceof Error ? err.message : 'An error occurred';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, text: `Error: ${errorText}`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [messages, isStreaming]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, sendMessage, stopStreaming, clearMessages };
}
