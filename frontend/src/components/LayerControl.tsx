'use client';

import React, { useState } from 'react';
import { Layers, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores';
import { LayerKey } from '@/types';

const LAYERS: { id: LayerKey; label: string; color: string }[] = [
  { id: 'flows',         label: 'Flow Routes',    color: '#6A95B7' },
  { id: 'ais_tracking',  label: 'AIS Vessels',    color: '#8CA5BC' },
  { id: 'weather',       label: 'Weather',        color: '#7C8E9F' },
  { id: 'news',          label: 'News Events',    color: '#A68462' },
  { id: 'price_heatmap', label: 'Price Heatmap',  color: '#A96A6A' },
  { id: 'anomalies',     label: 'Anomalies',      color: '#A96A6A' },
  { id: 'pipelines',     label: 'Pipelines',      color: '#6B7A96' },
  { id: 'incidents',     label: 'Incidents',      color: '#A96A6A' },
  { id: 'production_heatmap', label: 'Production Heatmap', color: '#9BAFC3' },
  { id: 'satellite',     label: 'Satellite',      color: '#78909C' },
  { id: 'terminals',     label: 'Terminals',      color: '#5D84A4' },
];

export default function LayerControl() {
  const { active_layers, toggle_layer } = useStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute bottom-8 right-4 z-30 flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="rounded-lg overflow-hidden"
            style={{
              background: 'rgba(10,14,39,0.95)',
              border: '1px solid rgba(105,138,167,0.28)',
              minWidth: '160px',
            }}
          >
            <div className="px-3 py-2 border-b border-[#1A1F3A]">
              <span className="text-[10px] font-mono text-[#A0A0A0] uppercase tracking-widest">Layers</span>
            </div>
            <div className="px-2 py-2 space-y-0.5">
              {LAYERS.map((layer) => {
                const active = active_layers.has(layer.id);
                return (
                  <button
                    key={layer.id}
                    onClick={() => toggle_layer(layer.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1A1F3A] transition-colors"
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: layer.color,
                        opacity: active ? 1 : 0.2,
                        boxShadow: active ? `0 0 4px ${layer.color}` : 'none',
                      }}
                    />
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: active ? '#E8E8E8' : '#696969' }}
                    >
                      {layer.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-mono transition-all"
        style={{
          background: 'rgba(10,14,39,0.95)',
          border: '1px solid rgba(105,138,167,0.35)',
          color: '#BCD1E4',
        }}
      >
        <Layers size={13} />
        <span>Layers</span>
        {expanded ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </button>
    </div>
  );
}
