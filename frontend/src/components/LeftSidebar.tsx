'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  Download,
  Eye,
  FilterX,
  GitBranch,
  Layers,
  Loader2,
  Map,
  Network,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useStore } from '@/stores';
import { Node, STATUS_COLOR, ViewMode } from '@/types';

interface LeftSidebarProps {
  nodes: Node[];
}

type RailTab = 'overview' | 'views' | 'simulate' | 'visualize' | 'signals' | 'research';
type SortMode = 'significance' | 'consumer';

interface RailItem {
  id: RailTab;
  label: string;
  Icon: React.ComponentType<any>;
}

interface OverviewCategoryDefinition {
  id: string;
  label: string;
  color: string;
  nodeTypes: string[];
  fallbackCount: number;
  valueLabel: string;
  significanceScore: number;
  consumerRank: number;
  sourceLabel: string;
}

interface ScenarioDefinition {
  id: string;
  label: string;
  impact: string;
  note: string;
}

const RAIL_ITEMS: RailItem[] = [
  { id: 'overview', label: 'Overview', Icon: Activity },
  { id: 'views', label: 'Views', Icon: Layers },
  { id: 'simulate', label: 'Simulate with Cerebro', Icon: SlidersHorizontal },
  { id: 'visualize', label: 'Visualize with Cerebro', Icon: Eye },
  { id: 'signals', label: 'Signals', Icon: Search },
  { id: 'research', label: 'AI Research', Icon: Cpu },
];

const AI_RESEARCH_QUERIES = [
  {
    id: 'demand_pulse',
    title: 'Demand Pulse Scan',
    description: 'Identify retail demand pressure clusters in the next 14 days.',
  },
  {
    id: 'supply_risk',
    title: 'Supply Risk Brief',
    description: 'Flag fragile links between upstream, depots, and terminals.',
  },
  {
    id: 'route_efficiency',
    title: 'Route Efficiency Study',
    description: 'Find potential reroutes that reduce bottlenecks to end consumers.',
  },
];

const VIEW_OPTIONS: Array<{ id: ViewMode; label: string; hint: string; Icon: React.ComponentType<any> }> = [
  { id: 'map', label: 'Operational Map', hint: 'Spatial command view', Icon: Map },
  { id: 'ecosystem', label: 'Ecosystem Graph', hint: 'Connectivity and dependencies', Icon: Network },
  { id: 'sankey', label: 'Flow Sankey', hint: 'Volume movement pathways', Icon: GitBranch },
  { id: 'upstream_intelligence', label: 'Upstream Intelligence', hint: 'Full market and nuance briefing', Icon: BarChart3 },
];

const OVERVIEW_CATEGORIES: OverviewCategoryDefinition[] = [
  {
    id: 'upstream',
    label: 'Upstream Producers',
    color: '#5A91B5',
    nodeTypes: ['upstream', 'upstream_field', 'upstream_ep', 'nnpc_ep'],
    fallbackCount: 4,
    valueLabel: '1.40M bpd',
    significanceScore: 100,
    consumerRank: 8,
    sourceLabel: 'IEA / NUPRC',
  },
  {
    id: 'refineries',
    label: 'Refineries',
    color: '#6E86A8',
    nodeTypes: ['refinery'],
    fallbackCount: 3,
    valueLabel: '380K bpd',
    significanceScore: 92,
    consumerRank: 5,
    sourceLabel: 'Refinery throughput',
  },
  {
    id: 'oml_blocks',
    label: 'OML Blocks',
    color: '#7E99B6',
    nodeTypes: [],
    fallbackCount: 53,
    valueLabel: '2.10M bpd lic.',
    significanceScore: 88,
    consumerRank: 9,
    sourceLabel: 'Lease benchmark',
  },
  {
    id: 'terminals',
    label: 'Terminals',
    color: '#4C7F9F',
    nodeTypes: ['terminal', 'export_terminal', 'import_point'],
    fallbackCount: 5,
    valueLabel: '900K bpd',
    significanceScore: 90,
    consumerRank: 3,
    sourceLabel: 'Export / import flow',
  },
  {
    id: 'pipelines',
    label: 'Pipelines',
    color: '#8B95B0',
    nodeTypes: ['pipeline'],
    fallbackCount: 2,
    valueLabel: '1.05M bpd',
    significanceScore: 87,
    consumerRank: 4,
    sourceLabel: 'Transit backbone',
  },
  {
    id: 'depots',
    label: 'Depots',
    color: '#8CA0B8',
    nodeTypes: ['depot', 'distribution_center', 'storage', 'distributor'],
    fallbackCount: 6,
    valueLabel: '2.10M m3 stg',
    significanceScore: 82,
    consumerRank: 2,
    sourceLabel: 'Storage / dispatch',
  },
  {
    id: 'jetties',
    label: 'Jetties',
    color: '#14B8A6',
    nodeTypes: ['jetty'],
    fallbackCount: 2,
    valueLabel: '220K bpd',
    significanceScore: 70,
    consumerRank: 6,
    sourceLabel: 'Marine loading',
  },
  {
    id: 'shipping_vessels',
    label: 'Shipping Vessels',
    color: '#5D88A9',
    nodeTypes: ['vessel', 'tanker', 'ship'],
    fallbackCount: 48,
    valueLabel: '48 tracked',
    significanceScore: 74,
    consumerRank: 7,
    sourceLabel: 'Port movement',
  },
  {
    id: 'retail_stations',
    label: 'Retail Stations',
    color: '#00E676',
    nodeTypes: ['retail_station', 'retail', 'retail_network'],
    fallbackCount: 1369,
    valueLabel: '280K bpd demand',
    significanceScore: 79,
    consumerRank: 1,
    sourceLabel: 'Consumer endpoint',
  },
];

const SIMULATION_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'demand_surge',
    label: 'Demand Surge +12%',
    impact: 'Depot drawdown in 5-7 days',
    note: 'Retail-heavy stress profile',
  },
  {
    id: 'pipeline_disruption',
    label: 'Pipeline Disruption',
    impact: 'Terminal queues +18%',
    note: 'Reroutes to coastal logistics',
  },
  {
    id: 'port_delay',
    label: 'Port Delay Window',
    impact: 'PMS inflow lag 48 hours',
    note: 'Jetty and vessel coupling risk',
  },
];

const normalizeType = (value: string) => value.toLowerCase().trim().replace(/[\s-]+/g, '_');

const formatCompact = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

export default function LeftSidebar({ nodes }: LeftSidebarProps) {
  const {
    enabled_node_types,
    toggle_node_type,
    enabled_statuses,
    toggle_status,
    active_view,
    set_view,
    chat_open,
    toggle_chat,
    add_chat_message,
    set_ai_thinking,
    set_ai_focus_nodes,
    set_camera,
  } = useStore();

  const [activeTab, setActiveTab] = useState<RailTab>('overview');
  const [sortMode, setSortMode] = useState<SortMode>('significance');
  const [isPinned, setIsPinned] = useState(false);
  const [isRailHovered, setIsRailHovered] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>(SIMULATION_SCENARIOS[0].id);
  const [sidebarActionRunning, setSidebarActionRunning] = useState<string | null>(null);

  const nodeTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((node) => {
      const normalized = normalizeType(node.node_type || '');
      if (!normalized) return;
      counts[normalized] = (counts[normalized] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((node) => {
      const status = (node.status || 'unknown').toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  const overviewRows = useMemo(
    () =>
      OVERVIEW_CATEGORIES.map((category) => {
        const liveCount = category.nodeTypes.reduce(
          (sum, nodeType) => sum + (nodeTypeCounts[nodeType] || 0),
          0
        );
        const count = liveCount > 0 ? liveCount : category.fallbackCount;
        const enabled =
          category.nodeTypes.length === 0
            ? true
            : category.nodeTypes.some((nodeType) => enabled_node_types.has(nodeType));

        return {
          ...category,
          count,
          enabled,
        };
      }),
    [nodeTypeCounts, enabled_node_types]
  );

  const sortedOverviewRows = useMemo(() => {
    const rows = [...overviewRows];
    if (sortMode === 'significance') {
      rows.sort((a, b) => b.significanceScore - a.significanceScore);
    } else {
      rows.sort((a, b) => a.consumerRank - b.consumerRank);
    }
    return rows;
  }, [overviewRows, sortMode]);

  const maxCategoryCount = useMemo(
    () => Math.max(...overviewRows.map((row) => row.count), 1),
    [overviewRows]
  );

  const retailStations =
    overviewRows.find((row) => row.id === 'retail_stations')?.count || 1369;
  const totalAssets = nodes.length > 0 ? nodes.length : 1396;
  const operationalCount = statusCounts.operational || 0;
  const operationalPct = totalAssets > 0 ? Math.round((operationalCount / totalAssets) * 100) : 0;

  const criticalSignalCount =
    (statusCounts.shutdown || 0) +
    (statusCounts.degraded || 0) +
    (statusCounts.maintenance || 0);

  const selectedScenarioDetails =
    SIMULATION_SCENARIOS.find((scenario) => scenario.id === selectedScenario) ||
    SIMULATION_SCENARIOS[0];

  const showPanel = isPinned || isRailHovered;

  const toggleCategoryNodeTypes = (nodeTypes: string[]) => {
    if (nodeTypes.length === 0) return;

    const uniqueTypes = Array.from(new Set(nodeTypes));
    const allEnabled = uniqueTypes.every((nodeType) => enabled_node_types.has(nodeType));

    uniqueTypes.forEach((nodeType) => {
      const currentlyEnabled = enabled_node_types.has(nodeType);
      if (allEnabled && currentlyEnabled) {
        toggle_node_type(nodeType);
      }
      if (!allEnabled && !currentlyEnabled) {
        toggle_node_type(nodeType);
      }
    });
  };

  const toggleSortMode = () => {
    setSortMode((current) => (current === 'significance' ? 'consumer' : 'significance'));
  };

  const handleInfrastructureRowClick = (row: (typeof overviewRows)[number]) => {
    if (row.id === 'upstream') {
      set_view('upstream_intelligence');
      setActiveTab('research');
      setIsPinned(true);
      return;
    }

    toggleCategoryNodeTypes(row.nodeTypes);
  };

  const exportVisibleNodes = () => {
    const filtered = nodes.filter((node) => {
      const nodeType = normalizeType(node.node_type || '');
      const status = (node.status || 'unknown').toLowerCase();
      return enabled_node_types.has(nodeType) && enabled_statuses.has(status);
    });

    if (!filtered.length) return;

    const header = ['id', 'name', 'node_type', 'state', 'status', 'latitude', 'longitude'];
    const rows = filtered.map((node) => [
      node.id,
      node.name,
      node.node_type,
      node.state || '',
      node.status,
      node.latitude,
      node.longitude,
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `visible_nodes_${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    const allCategoryTypes = Array.from(
      new Set(OVERVIEW_CATEGORIES.flatMap((category) => category.nodeTypes))
    );

    allCategoryTypes.forEach((nodeType) => {
      if (!enabled_node_types.has(nodeType)) {
        toggle_node_type(nodeType);
      }
    });

    Object.keys(STATUS_COLOR).forEach((status) => {
      if (!enabled_statuses.has(status)) {
        toggle_status(status);
      }
    });
  };

  const handleRailClick = (tab: RailTab) => {
    const sameTab = activeTab === tab;
    setActiveTab(tab);

    if (tab === 'overview') {
      setIsPinned(sameTab ? !isPinned : true);
      return;
    }

    setIsPinned(true);
  };

  const runJarvisAction = async (prompt: string, actionKey: string) => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || sidebarActionRunning) return;

    const messageId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSidebarActionRunning(actionKey);

    if (!chat_open) {
      toggle_chat();
    }

    add_chat_message({
      id: `${messageId}-u`,
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    });

    set_ai_thinking(true);

    let timeout: ReturnType<typeof setTimeout> | null = null;

    try {
      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedPrompt }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));
      const text = typeof payload?.text === 'string' && payload.text.trim().length
        ? payload.text
        : 'Cerebro completed the requested analysis.';

      add_chat_message({
        id: `${messageId}-a`,
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString(),
      });

      if (Array.isArray(payload?.actions)) {
        for (const action of payload.actions) {
          if (action?.type === 'zoom') {
            set_camera({
              longitude: Number(action.longitude),
              latitude: Number(action.latitude),
              zoom: Number(action.zoom),
            });
          }

          if (action?.type === 'focus_nodes' && Array.isArray(action.ids)) {
            set_ai_focus_nodes(action.ids as string[]);
          }

          if (action?.type === 'message' && typeof action.text === 'string') {
            add_chat_message({
              id: `${messageId}-${Math.random().toString(36).slice(2, 8)}`,
              role: 'assistant',
              content: action.text,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      add_chat_message({
        id: `${messageId}-e`,
        role: 'assistant',
        content: 'The AI request failed. Please retry in a few seconds.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
      set_ai_thinking(false);
      setSidebarActionRunning(null);
    }
  };

  const renderOverviewPanel = () => (
    <>
      <div className="px-4 pt-4 pb-3 border-b border-[#1A1F3A]">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="text-[18px] font-semibold text-[#E8F7FF] tracking-tight">PMS Supply Chain</div>
            <div className="text-[11px] font-mono text-[#6E88A6] mt-0.5">
              {formatCompact(totalAssets)} mapped assets | 1.40M bpd upstream baseline
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse-dot" />
              <span className="text-[10px] text-[#00E676] font-mono tracking-widest">LIVE INTELLIGENCE</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPinned((value) => !value)}
              className="px-2 py-1 rounded text-[9px] font-mono tracking-wider"
              style={{
                color: isPinned ? '#00D9FF' : '#6B7A96',
                border: `1px solid ${isPinned ? 'rgba(0,217,255,0.28)' : 'rgba(107,122,150,0.25)'}`,
                background: isPinned ? 'rgba(0,217,255,0.08)' : 'rgba(10,16,30,0.7)',
              }}
            >
              {isPinned ? 'PINNED' : 'PIN'}
            </button>
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded tracking-widest"
              style={{
                color: '#00D9FF',
                background: 'rgba(0,217,255,0.1)',
                border: '1px solid rgba(0,217,255,0.25)',
              }}
            >
              BETA
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded p-2" style={{ background: 'rgba(8,12,24,0.9)', border: '1px solid rgba(0,217,255,0.12)' }}>
            <div className="text-[16px] font-bold text-[#E8E8E8] font-mono leading-none">
              {retailStations.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#617188] font-mono mt-0.5 uppercase tracking-wide">Retail Stations</div>
          </div>

          <div className="rounded p-2" style={{ background: 'rgba(8,12,24,0.9)', border: '1px solid rgba(0,230,118,0.12)' }}>
            <div className="text-[16px] font-bold text-[#00E676] font-mono leading-none">
              {operationalCount.toLocaleString()}
            </div>
            <div className="text-[10px] text-[#617188] font-mono mt-0.5 uppercase tracking-wide">Operating</div>
          </div>

          <div className="rounded p-2" style={{ background: 'rgba(8,12,24,0.9)', border: '1px solid rgba(131,156,183,0.18)' }}>
            <div className="text-[16px] font-bold text-[#AFC7DE] font-mono leading-none">1.40M</div>
            <div className="text-[10px] text-[#617188] font-mono mt-0.5 uppercase tracking-wide">BPD Output</div>
          </div>
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-[#637995] uppercase tracking-widest">Operational Health</span>
            <span className="text-[10px] font-mono text-[#00E676]">{operationalPct}%</span>
          </div>
          <div className="h-1 rounded-full bg-[#141C34] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${operationalPct}%`,
                background:
                  operationalPct > 70
                    ? '#00E676'
                    : operationalPct > 40
                    ? '#F59E0B'
                    : '#FF1744',
                boxShadow: `0 0 8px ${
                  operationalPct > 70
                    ? '#00E67699'
                    : operationalPct > 40
                    ? '#F59E0B99'
                    : '#FF174499'
                }`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#637995] uppercase tracking-widest">Infrastructure Stack</span>
            <button
              onClick={toggleSortMode}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono"
              style={{
                color: '#86A3C1',
                background: 'rgba(18,27,48,0.9)',
                border: '1px solid rgba(99,121,149,0.35)',
              }}
              title={
                sortMode === 'significance'
                  ? 'Switch to consumer-proximity order'
                  : 'Switch to significance order'
              }
            >
              {sortMode === 'significance' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              <span>{sortMode === 'significance' ? 'Significance' : 'Consumer'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {sortedOverviewRows.map((row) => {
              const progress = `${Math.max(6, (row.count / maxCategoryCount) * 100)}%`;
              const interactive = row.nodeTypes.length > 0;

              return (
                <button
                  key={row.id}
                  onClick={() => handleInfrastructureRowClick(row)}
                  disabled={!interactive}
                  className="w-full rounded-2xl px-2.5 py-2 transition-colors text-left"
                  style={{
                    background: row.enabled ? 'rgba(15,23,42,0.65)' : 'rgba(11,16,30,0.45)',
                    border: `1px solid ${row.enabled ? 'rgba(100,130,166,0.25)' : 'rgba(45,58,80,0.28)'}`,
                    cursor: interactive ? 'pointer' : 'default',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: row.color,
                        opacity: row.enabled ? 1 : 0.25,
                        boxShadow: row.enabled ? `0 0 7px ${row.color}A0` : 'none',
                      }}
                    />
                    <span
                      className="flex-1 text-[12px] font-mono truncate"
                      style={{ color: row.enabled ? '#D8E7F6' : '#6B7A96' }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: row.enabled ? '#AFC4DA' : '#5B6A83' }}
                    >
                      {row.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-[#44556F]">|</span>
                    <span className="text-[10px] font-mono text-[#7EA2C8]">{row.valueLabel}</span>
                  </div>

                  <div className="capacity-bar ml-4">
                    <div
                      className="capacity-bar-fill"
                      style={{
                        width: row.enabled ? progress : '0%',
                        backgroundColor: row.color,
                        opacity: 0.55,
                      }}
                    />
                  </div>

                  <div className="ml-4 mt-1 text-[10px] font-mono text-[#546884] uppercase tracking-wide">
                    {row.sourceLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-4 border-t border-[#1A1F3A]" />

        <div className="px-4 py-3">
          <div className="text-[10px] font-mono text-[#637995] uppercase tracking-widest mb-2.5">
            Capacity Scale (BPD)
          </div>

          <div className="flex items-end gap-3 pl-1">
            <div className="relative flex items-end justify-center" style={{ width: 58, height: 58 }}>
              {[1, 0.72, 0.5, 0.32, 0.18].map((scale) => (
                <div
                  key={scale}
                  className="absolute rounded-full"
                  style={{
                    width: `${scale * 54}px`,
                    height: `${scale * 54}px`,
                    border: '1px solid rgba(126,162,200,0.35)',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              ))}
            </div>
            <div className="space-y-0.5 text-[10px] font-mono text-[#6E86A4] pb-0.5">
              <div>1M+ bpd</div>
              <div>500K bpd</div>
              <div>200K bpd</div>
              <div>50K bpd</div>
              <div>&lt;10K bpd</div>
            </div>
          </div>
        </div>

        <div className="mx-4 border-t border-[#1A1F3A]" />

        <div className="px-4 py-3">
          <div className="text-[10px] font-mono text-[#637995] uppercase tracking-widest mb-2">Status Filter</div>

          <div className="space-y-1">
            {Object.entries(STATUS_COLOR).map(([status, color]) => {
              const count = statusCounts[status] || 0;
              if (!count) return null;

              const enabled = enabled_statuses.has(status);

              return (
                <button
                  key={status}
                  onClick={() => toggle_status(status)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-[#131D37] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: color,
                        opacity: enabled ? 1 : 0.25,
                        boxShadow: enabled ? `0 0 5px ${color}80` : 'none',
                      }}
                    />
                    <span
                      className="text-[12px] font-mono capitalize"
                      style={{ color: enabled ? '#CFE1F2' : '#60728E' }}
                    >
                      {status}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6D83A0]">{count.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-[#1A1F3A]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-[#4D6080]">Cerebro Sync Ready</span>
          <div className="flex items-center gap-1">
            <Activity size={9} className="text-[#00E676]" />
            <span className="text-[10px] font-mono text-[#00E676]">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportVisibleNodes}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono hover:bg-[#131D37] transition-colors"
            style={{
              background: 'rgba(15,23,42,0.75)',
              color: '#BFD5EB',
              border: '1px solid rgba(112,140,170,0.3)',
            }}
          >
            <Download size={10} />
            <span>Export Visible</span>
          </button>

          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono hover:bg-[#131D37] transition-colors"
            style={{
              background: 'rgba(15,23,42,0.75)',
              color: '#BFD5EB',
              border: '1px solid rgba(112,140,170,0.3)',
            }}
          >
            <FilterX size={10} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </>
  );

  const renderViewsPanel = () => (
    <div className="p-4">
      <div className="mb-3">
        <div className="text-[15px] font-semibold text-[#E8F7FF]">Views</div>
        <div className="text-[10px] font-mono text-[#6E88A6] mt-0.5">Switch tactical perspectives</div>
      </div>

      <div className="space-y-1.5">
        {VIEW_OPTIONS.map((view) => {
          const active = active_view === view.id;
          return (
            <button
              key={view.id}
              onClick={() => set_view(view.id)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded transition-colors"
              style={{
                background: active ? 'rgba(0,217,255,0.12)' : 'rgba(15,23,42,0.6)',
                border: `1px solid ${active ? 'rgba(0,217,255,0.35)' : 'rgba(101,122,149,0.25)'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <view.Icon size={13} className={active ? 'text-[#00D9FF]' : 'text-[#7891AE]'} />
                <div className="text-left">
                  <div className="text-[11px] font-mono" style={{ color: active ? '#DDF5FF' : '#9AB1C9' }}>
                    {view.label}
                  </div>
                  <div className="text-[9px] font-mono text-[#607693]">{view.hint}</div>
                </div>
              </div>
              <ChevronRight size={12} className={active ? 'text-[#00D9FF]' : 'text-[#5E7491]'} />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSimulationPanel = () => (
    <div className="p-4">
      <div className="mb-3">
        <div className="text-[15px] font-semibold text-[#E8F7FF]">Cerebro Simulate</div>
        <div className="text-[10px] font-mono text-[#6E88A6] mt-0.5">Scenario sandbox aligned to PMS operations</div>
      </div>

      <div className="space-y-1.5">
        {SIMULATION_SCENARIOS.map((scenario) => {
          const active = selectedScenario === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className="w-full px-2.5 py-2 rounded text-left transition-colors"
              style={{
                background: active ? 'rgba(112,138,165,0.18)' : 'rgba(15,23,42,0.6)',
                border: `1px solid ${active ? 'rgba(112,138,165,0.34)' : 'rgba(101,122,149,0.25)'}`,
              }}
            >
              <div className="text-[11px] font-mono" style={{ color: active ? '#D5E7F7' : '#B9CDE2' }}>
                {scenario.label}
              </div>
              <div className="text-[9px] font-mono text-[#6C84A2] mt-0.5">{scenario.note}</div>
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 rounded px-2.5 py-2"
        style={{ background: 'rgba(14,23,43,0.9)', border: '1px solid rgba(104,129,159,0.25)' }}
      >
        <div className="text-[9px] font-mono text-[#6E88A6] uppercase tracking-widest">Projected Impact</div>
        <div className="text-[11px] font-mono text-[#D2E5F8] mt-1">{selectedScenarioDetails.impact}</div>
      </div>

      <button
        onClick={() =>
          runJarvisAction(
            `Run a Nigeria PMS supply-chain simulation for scenario: ${selectedScenarioDetails.label}. Context: ${selectedScenarioDetails.note}. Return the top risks, likely bottlenecks, and two operator actions.`,
            `scenario-${selectedScenarioDetails.id}`
          )
        }
        disabled={!!sidebarActionRunning}
        className="mt-3 w-full rounded px-2.5 py-2 text-[11px] font-mono transition-colors"
        style={{
          background: 'rgba(79,112,143,0.2)',
          border: '1px solid rgba(100,130,160,0.35)',
          color: '#D8E9F7',
          opacity: sidebarActionRunning ? 0.7 : 1,
        }}
      >
        <span className="inline-flex items-center gap-1.5">
          {sidebarActionRunning?.startsWith('scenario-') ? <Loader2 size={12} className="animate-spin" /> : null}
          {sidebarActionRunning?.startsWith('scenario-') ? 'Running Scenario...' : 'Run Scenario In Jarvis'}
        </span>
      </button>
    </div>
  );

  const renderVisualizePanel = () => (
    <div className="p-4">
      <div className="mb-3">
        <div className="text-[15px] font-semibold text-[#E8F7FF]">Cerebro Visualize</div>
        <div className="text-[10px] font-mono text-[#6E88A6] mt-0.5">Narrative lenses for decision support</div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => set_view('map')}
          className="w-full rounded px-2.5 py-2 text-left"
          style={{ background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(101,122,149,0.25)' }}
        >
          <div className="text-[11px] font-mono text-[#CAE0F5]">Operational Heat Lens</div>
          <div className="text-[9px] font-mono text-[#67809E] mt-0.5">Geospatial hot spots and bottlenecks</div>
        </button>

        <button
          onClick={() => set_view('ecosystem')}
          className="w-full rounded px-2.5 py-2 text-left"
          style={{ background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(101,122,149,0.25)' }}
        >
          <div className="text-[11px] font-mono text-[#CAE0F5]">Dependency Lens</div>
          <div className="text-[9px] font-mono text-[#67809E] mt-0.5">Critical nodes and propagation effects</div>
        </button>

        <button
          onClick={() => set_view('sankey')}
          className="w-full rounded px-2.5 py-2 text-left"
          style={{ background: 'rgba(15,23,42,0.65)', border: '1px solid rgba(101,122,149,0.25)' }}
        >
          <div className="text-[11px] font-mono text-[#CAE0F5]">Throughput Lens</div>
          <div className="text-[9px] font-mono text-[#67809E] mt-0.5">Flow volume concentration and drift</div>
        </button>
      </div>
    </div>
  );

  const renderSignalsPanel = () => (
    <div className="p-4">
      <div className="mb-3">
        <div className="text-[15px] font-semibold text-[#E8F7FF]">Signals</div>
        <div className="text-[10px] font-mono text-[#6E88A6] mt-0.5">Operational signal health and anomaly watch</div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <div className="rounded p-2" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(100,130,166,0.25)' }}>
          <div className="text-[13px] font-bold text-[#FF9A9A] font-mono leading-none">
            {criticalSignalCount.toLocaleString()}
          </div>
          <div className="text-[9px] font-mono text-[#6E88A6] mt-0.5">Critical Signals</div>
        </div>

        <div className="rounded p-2" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(100,130,166,0.25)' }}>
          <div className="text-[13px] font-bold text-[#8BE0FF] font-mono leading-none">
            {(statusCounts.unknown || 0).toLocaleString()}
          </div>
          <div className="text-[9px] font-mono text-[#6E88A6] mt-0.5">Unknown State</div>
        </div>
      </div>

      <div className="space-y-1">
        {Object.entries(STATUS_COLOR).map(([status, color]) => {
          const count = statusCounts[status] || 0;
          if (!count) return null;
          return (
            <div
              key={status}
              className="flex items-center justify-between px-2.5 py-1.5 rounded"
              style={{ background: 'rgba(15,23,42,0.55)', border: '1px solid rgba(101,122,149,0.2)' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}99` }} />
                <span className="text-[11px] font-mono capitalize text-[#C7DCEF]">{status}</span>
              </div>
              <span className="text-[10px] font-mono text-[#8FAAC8]">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderResearchPanel = () => (
    <div className="p-4">
      <div className="mb-3">
        <div className="text-[16px] font-semibold text-[#E8F7FF]">AI Research</div>
        <div className="text-[11px] font-mono text-[#6E88A6] mt-0.5">Rapid intelligence prompts for Cerebro-assisted analysis</div>
      </div>

      <div
        className="rounded-2xl px-3 py-2"
        style={{ background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(100,130,166,0.25)' }}
      >
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#CBE0F5]">
          <Cpu size={13} className="text-[#00D9FF]" />
          <span>Research copilot ready</span>
        </div>
        <div className="text-[10px] font-mono text-[#6F86A2] mt-1">
          Live results will bind to API-backed metrics and events.
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {AI_RESEARCH_QUERIES.map((query) => (
          <button
            key={query.id}
            onClick={() =>
              runJarvisAction(
                `${query.title}: ${query.description} Focus on Nigeria upstream-to-retail implications and mention specific chokepoints.`,
                `research-${query.id}`
              )
            }
            disabled={!!sidebarActionRunning}
            className="w-full rounded-2xl px-3 py-2 text-left transition-colors"
            style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(101,122,149,0.25)',
              opacity: sidebarActionRunning ? 0.72 : 1,
            }}
          >
            <div className="flex items-center gap-2">
              {sidebarActionRunning === `research-${query.id}` ? (
                <Loader2 size={12} className="text-[#7BB5DE] animate-spin" />
              ) : (
                <Search size={12} className="text-[#7BB5DE]" />
              )}
              <span className="text-[12px] font-mono text-[#CAE0F5]">{query.title}</span>
            </div>
            <div className="text-[10px] font-mono text-[#67809E] mt-1">{query.description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPanelBody = () => {
    if (activeTab === 'overview') return renderOverviewPanel();
    if (activeTab === 'views') return renderViewsPanel();
    if (activeTab === 'simulate') return renderSimulationPanel();
    if (activeTab === 'visualize') return renderVisualizePanel();
    if (activeTab === 'research') return renderResearchPanel();
    return renderSignalsPanel();
  };

  return (
    <div
      className="absolute left-0 top-11 bottom-0 z-40 pointer-events-none"
      onMouseEnter={() => setIsRailHovered(true)}
      onMouseLeave={() => setIsRailHovered(false)}
    >
      <div className="h-full flex items-stretch pl-2 py-2 pointer-events-auto">
        <div
          className="w-[56px] rounded-2xl p-2 flex flex-col items-center gap-1.5"
          style={{
            background: 'linear-gradient(180deg, rgba(7,12,24,0.95) 0%, rgba(5,9,20,0.9) 100%)',
            border: '1px solid rgba(0,217,255,0.14)',
            boxShadow: '0 10px 28px rgba(0,0,0,0.42)',
          }}
        >
          {RAIL_ITEMS.map((item) => {
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onMouseEnter={() => setActiveTab(item.id)}
                onClick={() => handleRailClick(item.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: active ? 'rgba(0,217,255,0.12)' : 'rgba(13,20,37,0.65)',
                  border: `1px solid ${active ? 'rgba(0,217,255,0.35)' : 'rgba(72,92,117,0.24)'}`,
                  color: active ? '#00D9FF' : '#6F89A7',
                  boxShadow: active ? '0 0 16px rgba(0,217,255,0.16)' : 'none',
                }}
                title={item.label}
              >
                <item.Icon size={14} />
              </button>
            );
          })}

          <div className="flex-1" />

          <div className="text-[8px] font-mono text-[#5A708D] tracking-widest">PMS</div>
        </div>

        <AnimatePresence>
          {showPanel && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="ml-2 w-[340px] h-full rounded-2xl flex flex-col overflow-hidden"
          style={{
            background:
              activeTab === 'overview'
                ? 'linear-gradient(180deg, rgba(8,12,24,0.97) 0%, rgba(5,9,20,0.95) 100%)'
                : 'linear-gradient(180deg, rgba(11,16,30,0.96) 0%, rgba(7,12,24,0.94) 100%)',
            border: '1px solid rgba(0,217,255,0.16)',
            boxShadow: '0 16px 36px rgba(2,8,20,0.6), 0 0 20px rgba(0,217,255,0.08)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {renderPanelBody()}
        </motion.div>
      )}
        </AnimatePresence>
      </div>
    </div>
  );
}
