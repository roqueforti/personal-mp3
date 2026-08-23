'use client';

import React, { useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  className?: string;
}

export default function AudioVisualizer({
  isPlaying,
  barCount = 28,
  className = 'h-12 w-full',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { analyserNode } = useAudio();
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    if (analyserNode) {
      bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Subtle resting animation when paused
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 10;
        }
      }

      const barWidth = (width / barCount) - 3;
      const step = Math.max(1, Math.floor(bufferLength / barCount));

      for (let i = 0; i < barCount; i++) {
        let val = dataArray[i * step] || 0;
        if (!isPlaying) {
          val = 8;
        }

        const percent = val / 255;
        const barHeight = Math.max(4, percent * height);
        const x = i * (barWidth + 3);
        const y = height - barHeight;

        // Solid energetic gradient for bars
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#4f46e5'); // Solid Indigo 600
        grad.addColorStop(1, '#818cf8'); // Solid Indigo 400

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(2, barWidth), barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={50}
      className={`${className} block`}
    />
  );
}
