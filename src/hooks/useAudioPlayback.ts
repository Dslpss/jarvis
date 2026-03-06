"use client";

import { useRef, useCallback, useMemo } from "react";
import { base64ToArrayBuffer, pcm16ToFloat32 } from "@/lib/audio-utils";
import { AUDIO } from "@/lib/constants";

export function useAudioPlayback() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const getOrCreateContext = useCallback(() => {
    if (
      !audioContextRef.current ||
      audioContextRef.current.state === "closed"
    ) {
      const ctx = new AudioContext({ sampleRate: AUDIO.OUTPUT_SAMPLE_RATE });
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      nextPlayTimeRef.current = 0;
    }
    return audioContextRef.current!;
  }, []);

  const enqueue = useCallback(
    (base64PcmData: string) => {
      const ctx = getOrCreateContext();
      const arrayBuffer = base64ToArrayBuffer(base64PcmData);
      const pcm16 = new Int16Array(arrayBuffer);
      const float32 = pcm16ToFloat32(pcm16);

      const audioBuffer = ctx.createBuffer(
        1,
        float32.length,
        AUDIO.OUTPUT_SAMPLE_RATE,
      );
      audioBuffer.copyToChannel(new Float32Array(float32), 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current!);

      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
    },
    [getOrCreateContext],
  );

  const clearQueue = useCallback(() => {
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
  }, []);

  const stop = useCallback(() => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    nextPlayTimeRef.current = 0;
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return useMemo(
    () => ({ enqueue, clearQueue, stop, getAnalyser }),
    [enqueue, clearQueue, stop, getAnalyser],
  );
}
