"use client";

import { useAppStore } from "@/stores/appStore";
import { ParticleField } from "./background/ParticleField";
import { HudOverlay } from "./background/HudOverlay";
import { Header } from "./layout/Header";
import { SystemStatus } from "./layout/SystemStatus";
import { ChatPanel } from "./chat/ChatPanel";
import { VoicePanel } from "./voice/VoicePanel";
import { ReminderNotifications } from "./ReminderNotifications";
import { SystemAlerts } from "./layout/SystemAlerts";

export function JarvisApp() {
  const mode = useAppStore((s) => s.mode);

  return (
    <div className="relative h-screen overflow-hidden bg-[#060612]">
      {/* Background layer */}
      <ParticleField />
      <HudOverlay />

      {/* Reminder notifications */}
      <ReminderNotifications />
      <SystemAlerts />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        <Header />
        <main className="flex-1 overflow-hidden">
          {mode === "text" ? <ChatPanel /> : <VoicePanel />}
        </main>
        <SystemStatus />
      </div>
    </div>
  );
}
