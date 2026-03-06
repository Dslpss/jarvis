'use client';

import { useRef, useEffect } from 'react';
import type { VoiceStatus } from '@/types/voice';

interface WaveformVisualizerProps {
  analyserNode: AnalyserNode | null;
  status: VoiceStatus;
}

const BAR_COUNT = 64;
const COLOR_LISTENING = '#00d4ff';
const COLOR_SPEAKING = '#0055ff';
const BASE_CIRCLE_COLOR = 'rgba(0, 212, 255, 0.08)';
const BREATHING_COLOR = 'rgba(0, 212, 255, 0.2)';
const SPINNER_COLOR = 'rgba(0, 212, 255, 0.6)';

export function WaveformVisualizer({ analyserNode, status }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle devicePixelRatio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const size = rect.width;
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.25;
    const maxBarLength = 60;

    // Create data array for frequency data
    const dataArray = analyserNode
      ? new Uint8Array(analyserNode.frequencyBinCount)
      : null;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size);

      // -- Always draw the dim base circle ring --
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = BASE_CIRCLE_COLOR;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.stroke();

      // Secondary shifted ring for "Holographic Refraction"
      ctx.beginPath();
      ctx.arc(centerX + 1, centerY + 1, baseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.03)';
      ctx.stroke();

      const isActive =
        (status === 'listening' || status === 'speaking') &&
        analyserNode !== null &&
        dataArray !== null;

      if (isActive) {
        // -- Active state: draw frequency bars --
        analyserNode.getByteFrequencyData(dataArray);

        const step = Math.floor(dataArray.length / BAR_COUNT);
        const color = status === 'listening' ? COLOR_LISTENING : COLOR_SPEAKING;

        // Central "Energy Core" glow
        const avgFreq = dataArray.reduce((src, val) => src + val, 0) / dataArray.length;
        const coreOpacity = (avgFreq / 255) * 0.15;
        const coreRadius = baseRadius * 0.8;
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, coreRadius);
        gradient.addColorStop(0, color.replace(')', ', ' + coreOpacity + ')').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineCap = 'round';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;

        for (let i = 0; i < BAR_COUNT; i++) {
          const angle = (i / BAR_COUNT) * 2 * Math.PI;
          const freqValue = dataArray[i * step] ?? 0;
          const barLength = (freqValue / 255) * maxBarLength;

          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          const x1 = centerX + cosA * baseRadius;
          const y1 = centerY + sinA * baseRadius;
          const x2 = centerX + cosA * (baseRadius + barLength);
          const y2 = centerY + sinA * (baseRadius + barLength);

          // Mirroring for symmetry and "Stark" high-tech feel
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      } else if (status === 'connecting') {
        // -- Connecting: breathing circle + rotating spinner arc --
        const breathOffset = Math.sin(time * 0.002) * 8;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + breathOffset, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Rotating partial arc (spinner)
        const spinAngle = (time * 0.003) % (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + 15, spinAngle, spinAngle + Math.PI * 0.8);
        ctx.strokeStyle = SPINNER_COLOR;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = SPINNER_COLOR;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      } else {
        // -- Idle / connected / error: subtle breathing circle --
        const breathOffset = Math.sin(time * 0.0015) * 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius + breathOffset, 0, Math.PI * 2);
        ctx.strokeStyle = BREATHING_COLOR;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner very subtle ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius - 10 - breathOffset * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, status]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]"
      />
    </div>
  );
}
