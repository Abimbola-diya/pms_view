'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Eye, EyeOff, Activity } from 'lucide-react';
import { useStore } from '@/stores';
import { Node, NODE_TYPE_CONFIG, STATUS_COLOR } from '@/types';

interface LeftSidebarProps {
  nodes: Node[];
}

export default function LeftSidebar({ nodes }: LeftSidebarProps) {
  const { enabled_node_types, toggle_node_type, enabled_statuses, toggle_status, sidebar_open, enabled_operators, toggle_operator, enabled_basins, toggle_basin } = useStore();

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => { const t = n.node_type.toLowerCase(); counts[t] = (counts[t] || 0) + 1; });
    return counts;
  }, [nodes]);

  const typeCapacity = useMemo(() => {
    const caps: Record<string, number> = {};
    nodes.forEach((n) => { const t = n.node_type.toLowerCase(); caps[t] = (caps[t] || 0) + (n.capacity_bpd || 0); });
    return caps;
  }, [nodes]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => { const s = n.status.toLowerCase(); counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [nodes]);

  const totalCapacity = useMemo(() => nodes.reduce((s, n) => s + (n.capacity_bpd || 0), 0), [nodes]);
  const maxTypeCapacity = useMemo(() => Math.max(...Object.values(typeCapacity), 1), [typeCapacity]);
  const maxTypeCount = useMemo(() => Math.max(...Object.values(typeCounts), 1), [typeCounts]);

  const operationalCount = statusCounts['operational'] || 0;
  const operationalPct = nodes.length > 0 ? Math.round((operationalCount / nodes.length) * 100) : 0;

  const sortedTypes = useMemo(() =>
    Object.entries(NODE_TYPE_CONFIG)
      .filter(([type]) => (typeCounts[type] || 0) > 0)
      .sort((a, b) => (typeCounts[b[0]] || 0) - (typeCounts[a[0]] || 0)),
    [typeCounts]
  );

  const formatCapacity = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toString();
  };

  // Operators and Basins (derived from node metadata/operator fields)
  const operatorCounts = useMemo(() => {
    const m: Record<string, { count: number; cap: number }> = {};
    nodes.forEach((n) => {
      const op = (n.operator || (n.metadata && (n.metadata as any).operator) || 'Unknown') as string;
      if (!op) return;
      m[op] = m[op] || { count: 0, cap: 0 };
      m[op].count += 1;
      m[op].cap += n.capacity_bpd || 0;
    });
    return m;
  }, [nodes]);

  const basinCounts = useMemo(() => {
    const m: Record<string, { count: number; cap: number }> = {};
    nodes.forEach((n) => {
      const basin = (n.basin || (n.metadata && (n.metadata as any).basin) || 'Unspecified') as string;
      if (!basin) return;
      m[basin] = m[basin] || { count: 0, cap: 0 };
      m[basin].count += 1;
      m[basin].cap += n.capacity_bpd || 0;
    });
    return m;
  }, [nodes]);

  return (
    <AnimatePresence>
      {sidebar_open && (
        <motion.div
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute left-0 top-0 bottom-0 w-[280px] z-30 flex flex-col"
          style={{
            background: 'linear-gradient(180deg, rgba(13,17,23,0.85) 0%, rgba(8,11,30,0.9) 100%)',
            backdropFilter: 'blur(6px)',
            borderRight: '1px solid rgba(0,217,255,0.15)',
            boxShadow: '0 0 20px rgba(0,217,255,0.1)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-3.5 pb-3 border-b border-[#1A1F3A]">
            <div className="flex items-start justify-between mb-2.5">
              <div>
                <div className="text-[13px] font-bold text-[#E8E8E8] font-mono tracking-wide leading-tight">
                  Nigeria Crude Intelligence
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse-dot" />
                  <span className="text-[9px] text-[#00E676] font-mono tracking-widest">LIVE DATA</span>
                </div>
              </div>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded tracking-widest"
                style={{ color: '#00D9FF', background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.25)' }}
              >
                BETA
              </span>
            </div>

            {/* Summary stats grid */}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-[#0D1117] rounded p-2">
                <div className="text-[16px] font-bold text-[#E8E8E8] font-mono leading-none">
                  {nodes.length.toLocaleString()}
                </div>
                <div className="text-[9px] text-[#555] font-mono mt-0.5 uppercase tracking-wide">Facilities</div>
              </div>
              <div className="bg-[#0D1117] rounded p-2">
                <div className="text-[16px] font-bold text-[#00E676] font-mono leading-none">
                  {operationalCount.toLocaleString()}
                </div>
                <div className="text-[9px] text-[#555] font-mono mt-0.5 uppercase tracking-wide">Operating</div>
              </div>
              <div className="bg-[#0D1117] rounded p-2">
                <div className="text-[16px] font-bold text-[#FFD700] font-mono leading-none">
                  {totalCapacity > 0 ? formatCapacity(totalCapacity) : '—'}
                </div>
                <div className="text-[9px] text-[#555] font-mono mt-0.5 uppercase tracking-wide">BPD Cap.</div>
              </div>
            </div>

            {/* Operational health bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Operational Health</span>
                <span className="text-[9px] font-mono text-[#00E676]">{operationalPct}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#1A1F3A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${operationalPct}%`,
                    background: operationalPct > 70 ? '#00E676' : operationalPct > 40 ? '#FFA500' : '#FF1744',
                    boxShadow: `0 0 6px ${operationalPct > 70 ? '#00E676' : operationalPct > 40 ? '#FFA500' : '#FF1744'}80`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">

            {/* Operators */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Operator</span>
                  <span className="text-[9px] font-mono text-[#555]">Count</span>
                </div>

                <div className="space-y-1">
                  {Object.entries(operatorCounts)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([op, v]) => {
                      const enabled = enabled_operators.has(op);
                      return (
                        <button
                          key={op}
                          onClick={() => toggle_operator(op)}
                          className="w-full px-2 py-1.5 rounded hover:bg-[#1A1F3A] transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono" style={{ color: enabled ? '#D0D0D0' : '#666' }}>{op}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#555]">{v.count}</div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="mx-4 border-t border-[#1A1F3A]" />

            {/* Basins */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Basin / Region</span>
                  <span className="text-[9px] font-mono text-[#555]">Count</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(basinCounts)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([basin, v]) => {
                      const enabled = enabled_basins.has(basin);
                      return (
                        <button
                          key={basin}
                          onClick={() => toggle_basin(basin)}
                          className="w-full px-2 py-1.5 rounded hover:bg-[#1A1F3A] transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono" style={{ color: enabled ? '#D0D0D0' : '#666' }}>{basin}</span>
                          </div>
                          <div className="text-[10px] font-mono text-[#555]">{v.count}</div>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="mx-4 border-t border-[#1A1F3A]" />

            {/* Facility Types */}
              <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Facility Type</span>
                <div className="flex items-center gap-2 text-[9px] font-mono text-[#555]">
                  <span>Count</span>
                  <span className="text-[#333]">|</span>
                  <span>BPD</span>
                </div>
              </div>

              <div className="space-y-0">
                {sortedTypes.map(([type, config]) => {
                  const count = typeCounts[type] || 0;
                  const cap = typeCapacity[type] || 0;
                  const enabled = enabled_node_types.has(type);
                  const countPct = (count / maxTypeCount) * 100;
                  const capPct = maxTypeCapacity > 0 ? (cap / maxTypeCapacity) * 100 : 0;

                  return (
                    <button
                      key={type}
                      onClick={() => toggle_node_type(type)}
                      className="w-full px-2 py-1.5 rounded hover:bg-[#1A1F3A] transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: config.color,
                            opacity: enabled ? 1 : 0.2,
                            boxShadow: enabled ? `0 0 5px ${config.color}80` : 'none',
                          }}
                        />
                        <span
                          className="flex-1 text-left text-[11px] font-mono transition-colors truncate"
                          style={{ color: enabled ? '#D0D0D0' : '#444' }}
                        >
                          {config.label}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] font-mono" style={{ color: enabled ? '#A0A0A0' : '#444' }}>
                            {count.toLocaleString()}
                          </span>
                          {cap > 0 && (
                            <span className="text-[9px] font-mono text-[#555]">
                              {formatCapacity(cap)}
                            </span>
                          )}
                          {!enabled && <EyeOff size={9} className="text-[#444]" />}
                        </div>
                      </div>
                      {/* Count bar */}
                      <div className="capacity-bar ml-4">
                        <div
                          className="capacity-bar-fill"
                          style={{
                            width: enabled ? `${countPct}%` : '0%',
                            backgroundColor: config.color,
                            opacity: 0.5,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mx-4 border-t border-[#1A1F3A]" />

            {/* Bubble size legend */}
            <div className="px-4 py-3">
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-2.5">
                Bubble Size (Capacity BPD)
              </div>
              <div className="flex items-end gap-3 pl-1">
                <div className="relative flex items-end justify-center" style={{ width: 56, height: 56 }}>
                  {[1, 0.72, 0.5, 0.32, 0.18].map((scale, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: `${scale * 52}px`,
                        height: `${scale * 52}px`,
                        border: '1px solid rgba(160,160,160,0.3)',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    />
                  ))}
                </div>
                <div className="space-y-0.5 text-[9px] font-mono text-[#555] pb-0.5">
                  <div>100K+ BPD</div>
                  <div>50K BPD</div>
                  <div>20K BPD</div>
                  <div>5K BPD</div>
                  <div>&lt;1K BPD</div>
                </div>
              </div>
            </div>

            <div className="mx-4 border-t border-[#1A1F3A]" />

            {/* Status */}
            <div className="px-4 py-3">
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest mb-2">Status</div>
              <div className="space-y-0">
                {Object.entries(STATUS_COLOR).map(([status, color]) => {
                  const count = statusCounts[status] || 0;
                  if (count === 0) return null;
                  const enabled = enabled_statuses.has(status);
                  const pct = nodes.length > 0 ? (count / nodes.length) * 100 : 0;
                  return (
                    <button
                      key={status}
                      onClick={() => toggle_status(status)}
                      className="w-full px-2 py-1.5 rounded hover:bg-[#1A1F3A] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color, opacity: enabled ? 1 : 0.2 }}
                        />
                        <span
                          className="flex-1 text-left text-[11px] font-mono capitalize"
                          style={{ color: enabled ? '#D0D0D0' : '#444' }}
                        >
                          {status}
                        </span>
                        <span className="text-[10px] font-mono text-[#555]">{count}</span>
                      </div>
                      <div className="capacity-bar ml-4">
                        <div
                          className="capacity-bar-fill"
                          style={{ width: enabled ? `${pct}%` : '0%', backgroundColor: color, opacity: 0.5 }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#1A1F3A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-mono text-[#333]">Nigeria Crude · v1.0</span>
              <div className="flex items-center gap-1">
                <Activity size={9} className="text-[#00E676]" />
                <span className="text-[9px] font-mono text-[#00E676]">LIVE</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // compute visible nodes according to current filters
                  const filtered = nodes.filter((n) => {
                    if (!enabled_node_types.has(n.node_type.toLowerCase())) return false;
                    if (!enabled_statuses.has(n.status.toLowerCase())) return false;
                    if (enabled_operators && enabled_operators.size > 0) {
                      const op = (n.operator || (n.metadata && (n.metadata as any).operator) || 'Unknown').toString();
                      if (!enabled_operators.has(op)) return false;
                    }
                    if (enabled_basins && enabled_basins.size > 0) {
                      const basin = (n.basin || (n.metadata && (n.metadata as any).basin) || 'Unspecified').toString();
                      if (!enabled_basins.has(basin)) return false;
                    }
                    return true;
                  });

                  if (!filtered || filtered.length === 0) return;
                  const header = ['id', 'name', 'node_type', 'state', 'operator', 'basin', 'latitude', 'longitude', 'capacity_bpd'];
                  const rows = filtered.map((r) => [
                    r.id,
                    r.name,
                    r.node_type,
                    r.state || '',
                    (r.operator || (r.metadata && (r.metadata as any).operator) || ''),
                    (r.basin || (r.metadata && (r.metadata as any).basin) || ''),
                    r.latitude?.toString() || '',
                    r.longitude?.toString() || '',
                    (r.capacity_bpd || '').toString(),
                  ]);
                  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `visible_nodes_${Date.now()}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 rounded bg-[#0D1117] text-[11px] font-mono hover:bg-[#131823]"
              >
                Export Visible CSV
              </button>
              <button
                onClick={() => {
                  // clear operator & basin filters
                  // toggling each currently enabled to remove them
                  Array.from(enabled_operators).forEach((op) => toggle_operator(op));
                  Array.from(enabled_basins).forEach((b) => toggle_basin(b));
                }}
                className="px-3 py-1 rounded bg-[#0D1117] text-[11px] font-mono hover:bg-[#131823]"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
