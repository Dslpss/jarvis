"use client";

import { useVoice } from "@/hooks/useVoice";
import { HudFrame } from "@/components/ui/HudFrame";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { VoiceButton } from "./VoiceButton";
import { VoiceStatus } from "./VoiceStatus";
import { MuteButton } from "./MuteButton";
import { VoiceSelector } from "./VoiceSelector";
import { VoiceCodeCardComponent } from "./CodeExecutionCard";

export function VoicePanel() {
  const {
    status,
    errorMessage,
    muted,
    codeCards,
    startSession,
    stopSession,
    toggleMute,
    dismissCodeCard,
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

      {/* Code cards — left side on desktop, bottom sheet on mobile */}
      {codeCards.length > 0 && (
        <div
          className="fixed z-50 
          bottom-0 left-0 right-0 max-h-[50vh] p-3
          sm:bottom-auto sm:right-auto sm:top-20 sm:left-4 sm:w-[28rem] sm:max-h-[calc(100vh-10rem)] sm:p-0
          overflow-y-auto scrollbar-thin">
          <div className="flex flex-col gap-3">
            {codeCards.map((card) => (
              <VoiceCodeCardComponent
                key={card.id}
                card={card}
                onDismiss={dismissCodeCard}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
