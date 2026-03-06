"use client";

import { useRef, useCallback, useMemo } from "react";
import {
  float32ToPcm16,
  arrayBufferToBase64,
  downsample,
} from "@/lib/audio-utils";
import { AUDIO } from "@/lib/constants";

export function useAudioCapture() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const start = useCallback(async (onChunk: (base64: string) => void) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    await audioContext.audioWorklet.addModule(
      "/worklets/audio-capture-processor.js",
    );
    const workletNode = new AudioWorkletNode(
      audioContext,
      "audio-capture-processor",
    );
    workletNodeRef.current = workletNode;

    const nativeSampleRate = audioContext.sampleRate;

    workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      let samples = event.data;
      if (nativeSampleRate !== AUDIO.INPUT_SAMPLE_RATE) {
        samples = downsample(
          samples,
          nativeSampleRate,
          AUDIO.INPUT_SAMPLE_RATE,
        );
      }
      const pcm16 = float32ToPcm16(samples);
      const base64 = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
      onChunk(base64);
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);
  }, []);

  const stop = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return useMemo(
    () => ({ start, stop, getAnalyser }),
    [start, stop, getAnalyser],
  );
}
