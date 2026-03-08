"use client";

import { useVoice } from "@/hooks/useVoice";
import { HudFrame } from "@/components/ui/HudFrame";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { VoiceButton } from "./VoiceButton";
import { VoiceStatus } from "./VoiceStatus";
import { MuteButton } from "./MuteButton";
import { VoiceSelector } from "./VoiceSelector";
import { VoiceCodeCardComponent } from "./CodeExecutionCard";
import { BriefingCard } from "./BriefingCard";

export function VoicePanel() {
  const {
    status,
    errorMessage,
    muted,
    uiCards,
    startSession,
    stopSession,
    toggleMute,
    dismissCard,
    captureAnalyser,
    playbackAnalyser,
  } = useVoice();

  const isActive =
    status === "listening" || status === "speaking" || status === "connected";

  const activeAnalyser =
    status === "speaking"
      ? playbackAnalyser()
      : status === "listening" && !muted
        ? captureAnalyser()
        : null;

  const handleToggle = () => {
    if (status === "idle" || status === "error") {
      startSession();
    } else {
      stopSession();
    }
  };

  return (
    <div className="relative h-full w-full">
      <HudFrame className="h-full w-full max-w-xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-6 h-full w-full p-4">
          <WaveformVisualizer analyserNode={activeAnalyser} status={status} />

          <div className="flex items-center gap-4">
            <VoiceButton status={status} onClick={handleToggle} />
            <MuteButton muted={muted} onClick={toggleMute} visible={isActive} />
          </div>
          <VoiceStatus status={status} errorMessage={errorMessage} />
          <VoiceSelector disabled={isActive || status === "connecting"} />
        </div>
      </HudFrame>

      {/* UI cards — right side on desktop, bottom sheet on mobile */}
      {uiCards.length > 0 && (
        <div
          className="fixed z-50 
          bottom-0 left-0 right-0 max-h-[50vh] p-3
          sm:bottom-auto sm:left-auto sm:top-24 sm:right-6 sm:w-auto sm:max-h-[calc(100vh-10rem)] sm:p-0
          overflow-y-auto scrollbar-thin">
          <div className="flex flex-col gap-3 items-end">
            {uiCards.map((card) => {
              if (card.type === "briefing") {
                return (
                  <BriefingCard
                    key={card.id}
                    card={card}
                    onDismiss={dismissCard}
                  />
                );
              }
              return (
                <VoiceCodeCardComponent
                  key={card.id}
                  card={card}
                  onDismiss={dismissCard}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
