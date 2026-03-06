"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface DueReminder {
  id: number;
  content: string;
  remind_at: string;
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function useReminders() {
  const [dueReminders, setDueReminders] = useState<DueReminder[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkDue = useCallback(async () => {
    try {
      const res = await fetch("/api/reminders?type=due");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.reminders?.length > 0) {
        setDueReminders((prev) => [...prev, ...data.reminders]);
      }
    } catch {
      // silently ignore network errors
    }
  }, []);

  const dismiss = useCallback((id: number) => {
    setDueReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setDueReminders([]);
  }, []);

  useEffect(() => {
    // Initial check on mount via timeout to avoid sync setState
    const timeout = setTimeout(checkDue, 0);

    intervalRef.current = setInterval(checkDue, POLL_INTERVAL);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkDue]);

  return { dueReminders, dismiss, dismissAll };
}
