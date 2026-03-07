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

      {/* Code cards — floating overlay at the bottom */}
      {codeCards.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4">
          <div className="flex flex-col items-center gap-3 max-h-72 overflow-y-auto scrollbar-thin">
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
