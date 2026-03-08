"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const POLL_INTERVAL = 60_000; // 1 minute

export function useSystemMonitor() {
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkMonitor = useCallback(async () => {
    try {
      const res = await fetch("/api/system/monitor");
      if (!res.ok) return;
      const data = await res.json();
      
      if (data.success && data.changes?.length > 0) {
        setAlerts(prev => [
          ...prev, 
          ...data.changes.map((f: string) => `Arquivo alterado: ${f}`)
        ]);
        
        // Sound notification
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgipGGcF9mc42teleWgHRxf5Ors5dhNjRdho+DcF5mbY+xtpFjOTdeg46FcV5mc4+ws5RkOThdg4yBb11kbouusJNjODZcgYqAbV1ib4muq49gNjRbf4h+a1xhboesp41eMzJZfYZ7aVtfbIWqpIpcMTBXe4R5Z1pdbIKno4haMC9Wd4F1ZVlcanykoYZXLy1UdX9yY1haaHqhn4RVLStSc31wYVdYZnidnIFTKypRcXtvX1ZWZXaampxQLilPb3lsXlVVY3SYl3hOLShNbXdrXFRTYXKWlHVMKyZLa3VpWlNRX3CTkXJKKiVJaXNnV1FPXm6Rj3BIKiRHZ3FlVlBNXGyOjG1GKCFFZm9jVE9MW2uMimtEJyBDZG1hUk5KWWmKiGlCJx9BYmtfUExIV2eHhWc/");
          audio.volume = 0.2;
          audio.play();
        } catch {}
      }
    } catch {
      // ignore errors
    }
  }, []);

  const dismissAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(checkMonitor, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkMonitor]);

  return { alerts, dismissAlert };
}
