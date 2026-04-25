"use client";

import React, { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

interface Arc {
  id: string;
  sourcePosition: [number, number]; // [lon, lat]
  targetPosition: [number, number];
  color: [number, number, number];
  volume: number;
}

export default function FlowParticles({ map, arcs }: { map: LeafletMap | null; arcs: Arc[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);

  useEffect(() => {
    const dprGetter = () => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

    function resize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = dprGetter();
      const rect = canvas.parentElement?.getBoundingClientRect() ?? canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Build particle list for arcs
    const build = () => {
      particlesRef.current = [];
      arcs.forEach((a) => {
        const count = Math.min(20, Math.max(1, Math.round((a.volume || 1000) / 20000)));
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            arc: a,
            progress: Math.random(),
            speed: 0.2 + Math.random() * 0.6,
            src: null,
            dst: null,
          });
        }
      });
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !map) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current.forEach((p) => {
        const srcPoint = map.latLngToContainerPoint([p.arc.sourcePosition[1], p.arc.sourcePosition[0]]);
        const dstPoint = map.latLngToContainerPoint([p.arc.targetPosition[1], p.arc.targetPosition[0]]);
        p.src = srcPoint;
        p.dst = dstPoint;

        const sx = p.src.x;
        const sy = p.src.y;
        const dx = p.dst.x;
        const dy = p.dst.y;
        const vx = dx - sx;
        const vy = dy - sy;

        const px = sx + vx * p.progress;
        const py = sy + vy * p.progress;

        const nx = -vy;
        const ny = vx;
        const nlen = Math.hypot(nx, ny) || 1;
        const amp = Math.min(60, Math.max(8, (p.arc.volume || 1000) / 10000));
        const offset = Math.sin(p.progress * Math.PI) * amp;
        const ox = (nx / nlen) * offset;
        const oy = (ny / nlen) * offset;
        const x = px + ox;
        const y = py + oy;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.arc.color[0]},${p.arc.color[1]},${p.arc.color[2]},0.95)`;
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        p.progress += p.speed * 0.016;
        if (p.progress > 1) p.progress = 0;
      });
      rafRef.current = requestAnimationFrame(draw);
    };

    // Initialize
    resize();
    build();
    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const onMove = () => build();
    map?.on('move', onMove);
    map?.on('zoom', onMove);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current as number);
      map?.off('move', onMove);
      map?.off('zoom', onMove);
    };
  }, [map, arcs]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
