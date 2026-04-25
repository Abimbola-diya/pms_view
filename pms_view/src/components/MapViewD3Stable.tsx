'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useStore } from '@/stores';
import { Node, Flow } from '@/types';

interface MapViewProps {
  nodes: Node[];
  flows: Flow[];
}

// Professional color palette
const COLORS = {
  upstream: '#ff6b35',
  refinery: '#c77dff',
  terminal: '#ec4899',
  importer: '#0ea5e9',
  depot: '#fbbf24',
  retail: '#10b981',
  fpso: '#f97316',
  background: '#0a0e17',
  surface1: '#0f1520',
  surface2: '#141b28',
  gridLight: 'rgba(107, 122, 150, 0.08)',
  textPrimary: '#f8fafc',
  textSecondary: '#b0c0dd',
  textMuted: '#6b7a96',
  danger: '#ef4444',
  warning: '#f97316',
  success: '#22c55e',
  accent: '#0ea5e9',
};

// Node type to color mapping
const NODE_TYPE_COLORS: Record<string, string> = {
  upstream_field: COLORS.upstream,
  upstream_ep: COLORS.upstream,
  nnpc_ep: COLORS.upstream,
  refinery: COLORS.refinery,
  terminal: COLORS.terminal,
  export_terminal: COLORS.terminal,
  jetty: COLORS.terminal,
  fpso: COLORS.fpso,
  importer: COLORS.importer,
  import_point: COLORS.importer,
  depot: COLORS.depot,
  distribution_center: COLORS.depot,
  retail_station: COLORS.retail,
  retail_network: COLORS.retail,
  storage: COLORS.depot,
  pipeline: COLORS.textMuted,
};

// Simple 2D projection for Nigeria
const nigeriaProj = (lon: number, lat: number, width: number, height: number) => {
  // Nigeria bounds approximately
  const bounds = [[2, 4], [15, 14.5]]; // [west, south] to [east, north]
  const x = ((lon - bounds[0][0]) / (bounds[1][0] - bounds[0][0])) * width;
  const y = ((bounds[1][1] - lat) / (bounds[1][1] - bounds[0][1])) * height;
  return [x, y];
};

export default function MapViewD3({ nodes, flows }: MapViewProps) {
  const {
    enabled_node_types,
    enabled_statuses,
    selected_node,
    set_selected_node,
    set_hovered_node,
    highlighted_nodes,
    ai_focus_nodes,
    active_layers,
  } = useStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ node: Node; x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Filter visible nodes
  const visibleNodes = useMemo(
    () =>
      nodes.filter(
        (n) =>
          enabled_node_types.has(n.node_type.toLowerCase()) &&
          enabled_statuses.has(n.status.toLowerCase())
      ),
    [nodes, enabled_node_types, enabled_statuses]
  );

  // Build flow graph
  const flowData = useMemo(() => {
    if (!active_layers.has('flows')) return [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    return flows
      .filter((f) => nodeMap.has(f.source_node_id) && nodeMap.has(f.destination_node_id))
      .map((f) => {
        const src = nodeMap.get(f.source_node_id)!;
        const dst = nodeMap.get(f.destination_node_id)!;
        return {
          id: f.id,
          source: src,
          target: dst,
          volume: f.volume_bpd || 1000,
        };
      });
  }, [flows, nodes, active_layers]);

  // Helpers
  const getNodeColor = useCallback(
    (node: Node) => {
      if (node.id === selected_node) return COLORS.accent;
      if (highlighted_nodes.has(node.id) || ai_focus_nodes.includes(node.id)) return '#fbbf24';
      return NODE_TYPE_COLORS[node.node_type.toLowerCase()] || COLORS.textSecondary;
    },
    [selected_node, highlighted_nodes, ai_focus_nodes]
  );

  const getNodeRadius = useCallback(
    (node: Node) => {
      const isSelected = node.id === selected_node;
      const isHighlighted = highlighted_nodes.has(node.id) || ai_focus_nodes.includes(node.id);
      const base = Math.min(4 + Math.log(Math.max(node.capacity_bpd || 50000, 1)) / 2, 12);
      return base * (isSelected ? 1.8 : isHighlighted ? 1.4 : 1);
    },
    [selected_node, highlighted_nodes, ai_focus_nodes]
  );

  // Handle canvas rendering
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    setDimensions({ width, height });

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = COLORS.gridLight;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw flows
    ctx.strokeStyle = 'rgba(107, 122, 150, 0.3)';
    ctx.lineWidth = 0.5;
    flowData.forEach((flow) => {
      const [x1, y1] = nigeriaProj(flow.source.longitude, flow.source.latitude, width, height);
      const [x2, y2] = nigeriaProj(flow.target.longitude, flow.target.latitude, width, height);
      ctx.strokeStyle = NODE_TYPE_COLORS[flow.source.node_type.toLowerCase()] || COLORS.textSecondary;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    visibleNodes.forEach((node) => {
      const [x, y] = nigeriaProj(node.longitude, node.latitude, width, height);
      const radius = getNodeRadius(node);
      const color = getNodeColor(node);

      // Glow effect
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Main circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Status dot
      ctx.fillStyle =
        node.status === 'operational'
          ? COLORS.success
          : node.status === 'maintenance'
            ? COLORS.warning
            : COLORS.danger;
      ctx.beginPath();
      ctx.arc(x + radius + 3, y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Label (only if not too many nodes)
      if (visibleNodes.length < 60) {
        ctx.font = '8px "JetBrains Mono"';
        ctx.fillStyle = COLORS.textSecondary;
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.7;
        ctx.fillText(node.name.substring(0, 12), x, y + radius + 12);
        ctx.globalAlpha = 1;
      }
    });

  }, [visibleNodes, flowData, getNodeColor, getNodeRadius, selected_node, highlighted_nodes, ai_focus_nodes]);

  // Handle mouse interactions
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || dimensions.width === 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if hovering over a node
      let hoveredNode: Node | null = null;
      for (const node of visibleNodes) {
        const [px, py] = nigeriaProj(node.longitude, node.latitude, dimensions.width, dimensions.height);
        const radius = getNodeRadius(node);
        const dist = Math.hypot(x - px, y - py);
        if (dist < radius * 2) {
          hoveredNode = node;
          break;
        }
      }

      if (hoveredNode) {
        setTooltip({
          node: hoveredNode,
          x: e.pageX,
          y: e.pageY,
        });
        set_hovered_node(hoveredNode.id);
        (e.target as HTMLCanvasElement).style.cursor = 'pointer';
      } else {
        setTooltip(null);
        set_hovered_node(null);
        (e.target as HTMLCanvasElement).style.cursor = 'grab';
      }
    },
    [visibleNodes, dimensions, getNodeRadius, set_hovered_node]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || dimensions.width === 0) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicked on a node
      for (const node of visibleNodes) {
        const [px, py] = nigeriaProj(node.longitude, node.latitude, dimensions.width, dimensions.height);
        const radius = getNodeRadius(node);
        const dist = Math.hypot(x - px, y - py);
        if (dist < radius * 2) {
          set_selected_node(node.id);
          break;
        }
      }
    },
    [visibleNodes, dimensions, getNodeRadius, set_selected_node]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black"
      style={{ background: COLORS.background }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
      />

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
          }}
        >
          <div
            className="rounded px-3 py-2 text-xs font-mono shadow-xl"
            style={{
              background: 'rgba(10, 14, 39, 0.96)',
              border: '1px solid rgba(14, 165, 233, 0.4)',
              backdropFilter: 'blur(10px)',
              minWidth: '200px',
              boxShadow: '0 0 20px rgba(14, 165, 233, 0.2)',
            }}
          >
            <div className="text-[#0ea5e9] font-bold truncate">{tooltip.node.name}</div>
            <div className="text-[#6b7a96] text-[10px] mt-1 capitalize">
              {tooltip.node.node_type.replace(/_/g, ' ')}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    tooltip.node.status === 'operational'
                      ? COLORS.success
                      : tooltip.node.status === 'maintenance'
                        ? COLORS.warning
                        : COLORS.danger,
                }}
              />
              <span className="text-[#b0c0dd] text-[10px] capitalize">
                {tooltip.node.status}
              </span>
            </div>
            {tooltip.node.capacity_bpd && (
              <div className="text-[#0ea5e9] text-[10px] mt-2 font-mono">
                Capacity: {(tooltip.node.capacity_bpd / 1000).toFixed(1)}K BOPD
              </div>
            )}
            {tooltip.node.state && (
              <div className="text-[#6b7a96] text-[9px] mt-1">📍 {tooltip.node.state}</div>
            )}
          </div>
        </div>
      )}

      {/* Map info overlay */}
      <div
        className="absolute bottom-6 left-6 text-[10px] font-mono pointer-events-none z-10"
        style={{
          color: COLORS.textSecondary,
          textShadow: '0 0 10px rgba(14, 165, 233, 0.2)',
        }}
      >
        <div style={{ color: COLORS.accent }}>📡 Nigeria Petroleum Network</div>
        <div className="mt-1" style={{ color: COLORS.textMuted }}>
          {visibleNodes.length} nodes · {flowData.length} flows
        </div>
      </div>

      {/* Legend */}
      <div
        className="absolute top-24 right-4 text-[9px] font-mono z-10"
        style={{
          color: COLORS.textSecondary,
          background: 'rgba(10, 14, 39, 0.8)',
          border: '1px solid rgba(14, 165, 233, 0.2)',
          padding: '12px',
          borderRadius: '6px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ color: COLORS.accent, marginBottom: '8px', fontSize: '10px', fontWeight: 'bold' }}>
          LEGEND
        </div>
        {[
          ['Upstream', COLORS.upstream],
          ['Refinery', COLORS.refinery],
          ['Terminal', COLORS.terminal],
          ['Importer', COLORS.importer],
          ['Depot', COLORS.depot],
          ['Retail', COLORS.retail],
        ].map(([label, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: color,
              }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {visibleNodes.length === 0 && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ zIndex: 400 }}
        >
          <div className="text-center">
            <div className="text-[#0ea5e9] text-sm font-mono mb-2 font-bold">
              ⏳ INITIALIZING SPATIAL CORE
            </div>
            <div className="text-[#6b7a96] text-xs font-mono">
              Loading Nigeria petroleum network topology...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
