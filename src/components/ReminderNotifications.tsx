"use client";

import { useReminders } from "@/hooks/useReminders";
import { useEffect, useRef } from "react";

function speakReminder(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(`Lembrete: ${text}`);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.volume = 0.8;
  window.speechSynthesis.speak(utterance);
}

export function ReminderNotifications() {
  const { dueReminders, dismiss } = useReminders();
  const spokenIdsRef = useRef<Set<number>>(new Set());

  // Speak + play sound when new reminders arrive
  useEffect(() => {
    const newReminders = dueReminders.filter(
      (r) => !spokenIdsRef.current.has(r.id),
    );
    if (newReminders.length === 0) return;

    for (const r of newReminders) {
      spokenIdsRef.current.add(r.id);
      speakReminder(r.content);
    }

    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgipGGcF9mc42teleWgHRxf5Ors5dhNjRdho+DcF5mbY+xtpFjOTdeg46FcV5mc4+ws5RkOThdg4yBb11kbouusJNjODZcgYqAbV1ib4muq49gNjRbf4h+a1xhboesp41eMzJZfYZ7aVtfbIWqpIpcMTBXe4R5Z1pdbIKno4haMC9Wd4F1ZVlcanykoYZXLy1UdX9yY1haaHqhn4RVLStSc31wYVdYZnidnIFTKypRcXtvX1ZWZXaampxQLilPb3lsXlVVY3SYl3hOLShNbXdrXFRTYXKWlHVMKyZLa3VpWlNRX3CTkXJKKiVJaXNnV1FPXm6Rj3BIKiRHZ3FlVlBNXGyOjG1GKCFFZm9jVE9MW2uMimtEJyBDZG1hUk5KWWmKiGlCJx9BYmtfUExIV2eHhWc/",
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {
      // ignore audio errors
    }
  }, [dueReminders]);

  if (dueReminders.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {dueReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="relative bg-[#0a1628]/95 border border-cyan-500/60 rounded-lg p-4 shadow-lg shadow-cyan-500/20 animate-in slide-in-from-right duration-300">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-lg bg-cyan-500/5 pointer-events-none" />

          <div className="relative">
            <button
              onClick={() => dismiss(reminder.id)}
              className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-cyan-900/80 text-cyan-400/70 hover:text-white hover:bg-cyan-700/80 transition-colors text-xs cursor-pointer"
              aria-label="Fechar">
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-400 text-xs font-mono uppercase tracking-wider">
                Lembrete
              </span>
            </div>

            <p className="text-white/90 text-sm leading-relaxed">
              {reminder.content}
            </p>

            <div className="flex items-center justify-between mt-3">
              <span className="text-cyan-500/50 text-xs font-mono">
                {new Date(reminder.remind_at).toLocaleString("pt-BR")}
              </span>
              <button
                onClick={() => dismiss(reminder.id)}
                className="text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors font-mono cursor-pointer">
                DISPENSAR
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
