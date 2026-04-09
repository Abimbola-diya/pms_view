'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MapPin, ArrowUpRight, ArrowDownLeft, Zap, Info } from 'lucide-react';
import { useStore } from '@/stores';
import { Node, Flow, NODE_TYPE_CONFIG, STATUS_COLOR } from '@/types';

interface NodeDetailPanelProps {
  node: Node | null;
  flows: Flow[];
  allNodes: Node[];
}

export default function NodeDetailPanel({ node, flows, allNodes }: NodeDetailPanelProps) {
  const { set_selected_node, detail_panel_open, set_camera, set_highlighted_nodes } = useStore();

  const nodeMap = useMemo(() => new Map(allNodes.map((n) => [n.id, n])), [allNodes]);

  const connectedFlows = useMemo(() => {
    if (!node) return { inbound: [], outbound: [] };
    return {
      inbound: flows.filter((f) => f.destination_node_id === node.id),
      outbound: flows.filter((f) => f.source_node_id === node.id),
    };
  }, [node, flows]);

  const nearbyNodes = useMemo(() => {
    if (!node) return [];
    return allNodes
      .filter((n) => n.id !== node.id)
      .map((n) => {
        const dlat = n.latitude - node.latitude;
        const dlon = n.longitude - node.longitude;
        const dist = Math.sqrt(dlat * dlat + dlon * dlon) * 111;
        return { node: n, dist };
      })
      .filter((x) => x.dist < 150)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 10);
  }, [node, allNodes]);

  const maxFlowVolume = useMemo(() => {
    const all = [...connectedFlows.inbound, ...connectedFlows.outbound];
    return Math.max(...all.map((f) => f.volume_bpd || 0), 1);
  }, [connectedFlows]);

  const config = node ? NODE_TYPE_CONFIG[node.node_type.toLowerCase()] : null;
  const statusColor = node ? STATUS_COLOR[node.status.toLowerCase()] || '#78909C' : '#78909C';

  const googleMapsUrl = node
    ? `https://www.google.com/maps/@${node.latitude},${node.longitude},15z/data=!3m1!1e3`
    : '';

  const handleClose = () => set_selected_node(null);

  const handleHighlightConnected = () => {
    if (!node) return;
    const ids = [
      ...connectedFlows.inbound.map((f) => f.source_node_id),
      ...connectedFlows.outbound.map((f) => f.destination_node_id),
    ];
    set_highlighted_nodes(ids);
  };

  const formatVol = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString();

  return (
    <AnimatePresence>
      {detail_panel_open && node && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute right-0 top-0 bottom-0 w-[340px] z-30 flex flex-col overflow-hidden"
          style={{ background: 'rgba(8,11,30,0.97)', borderLeft: '1px solid rgba(0,217,255,0.12)' }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-3 border-b border-[#1A1F3A]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-[13px] font-bold text-[#E8E8E8] font-mono leading-tight">
                  {node.name}
                </h2>
                <div className="text-[10px] text-[#555] font-mono mt-0.5">
                  {[node.state, node.lga].filter(Boolean).join(' · ') || 'Nigeria'}
                </div>
              </div>
              <button onClick={handleClose} className="text-[#555] hover:text-[#E8E8E8] transition-colors flex-shrink-0 mt-0.5">
                <X size={14} />
              </button>
            </div>

            {/* Type + Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="node-badge"
                style={{ color: config?.color || '#A0A0A0', borderColor: `${config?.color || '#A0A0A0'}35`, backgroundColor: `${config?.color || '#A0A0A0'}0D` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config?.color || '#A0A0A0' }} />
                {config?.label || node.node_type}
              </span>
              <span
                className="node-badge"
                style={{ color: statusColor, borderColor: `${statusColor}35`, backgroundColor: `${statusColor}0D` }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: statusColor }} />
                {node.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">

            {/* Key metrics */}
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {node.capacity_bpd ? (
                <div className="bg-[#0D1117] rounded p-2.5 hud-bracket">
                  <div className="text-[9px] text-[#555] font-mono uppercase tracking-widest">Capacity</div>
                  <div className="text-[18px] font-bold text-[#E8E8E8] font-mono mt-0.5 leading-none">
                    {formatVol(node.capacity_bpd)}
                  </div>
                  <div className="text-[9px] text-[#555] font-mono">BPD</div>
                </div>
              ) : (
                <div className="bg-[#0D1117] rounded p-2.5">
                  <div className="text-[9px] text-[#555] font-mono uppercase tracking-widest">Capacity</div>
                  <div className="text-[13px] font-mono text-[#444] mt-1">N/A</div>
                </div>
              )}
              <div className="bg-[#0D1117] rounded p-2.5 hud-bracket">
                <div className="text-[9px] text-[#555] font-mono uppercase tracking-widest">Connections</div>
                <div className="text-[18px] font-bold text-[#00D9FF] font-mono mt-0.5 leading-none">
                  {connectedFlows.inbound.length + connectedFlows.outbound.length}
                </div>
                <div className="text-[9px] text-[#555] font-mono">flows</div>
              </div>
            </div>

            {/* Coordinates + Site Analysis */}
            <div className="px-4 pb-3">
              <div
                className="rounded p-2.5 flex items-center justify-between"
                style={{ background: 'rgba(0,217,255,0.04)', border: '1px solid rgba(0,217,255,0.1)' }}
              >
                <div className="flex items-center gap-2">
                  <MapPin size={11} className="text-[#555]" />
                  <span className="text-[10px] font-mono text-[#A0A0A0]">
                    {node.latitude.toFixed(5)}, {node.longitude.toFixed(5)}
                  </span>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded transition-all"
                  style={{ color: '#00D9FF', background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)' }}
                >
                  Site analysis <ExternalLink size={8} />
                </a>
              </div>
            </div>

            <div className="mx-4 border-t border-[#1A1F3A]" />

            {/* Connected Flows */}
            {(connectedFlows.outbound.length > 0 || connectedFlows.inbound.length > 0) && (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">
                    Connected Flows ({connectedFlows.inbound.length + connectedFlows.outbound.length})
                  </span>
                  <button
                    onClick={handleHighlightConnected}
                    className="text-[9px] font-mono text-[#00D9FF] hover:text-[#E8E8E8] transition-colors"
                  >
                    Highlight all
                  </button>
                </div>

                {connectedFlows.outbound.slice(0, 5).map((flow) => {
                  const dest = nodeMap.get(flow.destination_node_id);
                  const volPct = flow.volume_bpd ? (flow.volume_bpd / maxFlowVolume) * 100 : 0;
                  return (
                    <div key={flow.id} className="py-1.5 border-b border-[#0D1117] last:border-0">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight size={10} className="text-[#00D9FF] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-[#D0D0D0] truncate">
                            {dest?.name || '—'}
                          </div>
                          <div className="text-[9px] font-mono text-[#555] capitalize">
                            {(flow.product_type || flow.flow_type || '').replace(/_/g, ' ')}
                            {flow.transport_mode ? ` · ${flow.transport_mode}` : ''}
                          </div>
                        </div>
                        {flow.volume_bpd && (
                          <span className="text-[9px] font-mono text-[#A0A0A0] flex-shrink-0">
                            {formatVol(flow.volume_bpd)} BPD
                          </span>
                        )}
                      </div>
                      {flow.volume_bpd && (
                        <div className="capacity-bar mt-1 ml-4">
                          <div className="capacity-bar-fill" style={{ width: `${volPct}%`, backgroundColor: '#00D9FF', opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {connectedFlows.inbound.slice(0, 4).map((flow) => {
                  const src = nodeMap.get(flow.source_node_id);
                  const volPct = flow.volume_bpd ? (flow.volume_bpd / maxFlowVolume) * 100 : 0;
                  return (
                    <div key={flow.id} className="py-1.5 border-b border-[#0D1117] last:border-0">
                      <div className="flex items-center gap-2">
                        <ArrowDownLeft size={10} className="text-[#1ABC9C] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-[#D0D0D0] truncate">
                            {src?.name || '—'}
                          </div>
                          <div className="text-[9px] font-mono text-[#555] capitalize">
                            {(flow.product_type || flow.flow_type || '').replace(/_/g, ' ')}
                          </div>
                        </div>
                        {flow.volume_bpd && (
                          <span className="text-[9px] font-mono text-[#A0A0A0] flex-shrink-0">
                            {formatVol(flow.volume_bpd)} BPD
                          </span>
                        )}
                      </div>
                      {flow.volume_bpd && (
                        <div className="capacity-bar mt-1 ml-4">
                          <div className="capacity-bar-fill" style={{ width: `${volPct}%`, backgroundColor: '#1ABC9C', opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {nearbyNodes.length > 0 && <div className="mx-4 border-t border-[#1A1F3A]" />}

            {/* Nearby Facilities */}
            {nearbyNodes.length > 0 && (
              <div className="px-4 py-3">
                <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-2">
                  Nearby Facilities ({nearbyNodes.length})
                </div>
                <div>
                  {nearbyNodes.map(({ node: nearby, dist }) => {
                    const nc = NODE_TYPE_CONFIG[nearby.node_type.toLowerCase()];
                    const sc = STATUS_COLOR[nearby.status.toLowerCase()] || '#78909C';
                    return (
                      <div key={nearby.id} className="flex items-center gap-2 py-1.5 border-b border-[#0D1117] last:border-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: nc?.color || '#A0A0A0' }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-[#D0D0D0] truncate">{nearby.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] font-mono" style={{ color: nc?.color || '#A0A0A0' }}>
                              {nc?.label || nearby.node_type}
                            </span>
                            <span className="text-[#333]">·</span>
                            <span className="text-[9px] font-mono" style={{ color: sc }}>{nearby.status}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-[#555] flex-shrink-0">{dist.toFixed(0)} km</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metadata */}
            {node.metadata && Object.keys(node.metadata).length > 0 && (
              <>
                <div className="mx-4 border-t border-[#1A1F3A]" />
                <div className="px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info size={10} className="text-[#555]" />
                    <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Metadata</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(node.metadata).slice(0, 8).map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <span className="text-[9px] font-mono text-[#555] flex-shrink-0 capitalize min-w-[80px]">
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] font-mono text-[#A0A0A0] break-all">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
