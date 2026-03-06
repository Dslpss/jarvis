"use client";

import { useRef, useCallback, useEffect, useMemo } from "react";

export function useWaveformAnalyzer() {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const setAnalyser = useCallback((analyser: AnalyserNode | null) => {
    analyserRef.current = analyser;
    if (analyser) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    } else {
      dataArrayRef.current = null;
    }
  }, []);

  const getFrequencyData = useCallback((): Uint8Array | null => {
    if (!analyserRef.current || !dataArrayRef.current) return null;
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    return dataArrayRef.current;
  }, []);

  const getAverageAmplitude = useCallback((): number => {
    const data = getFrequencyData();
    if (!data) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    return sum / data.length / 255;
  }, [getFrequencyData]);

  useEffect(() => {
    return () => {
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({ setAnalyser, getFrequencyData, getAverageAmplitude }),
    [setAnalyser, getFrequencyData, getAverageAmplitude],
  );
}
