'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Factory,
  Gauge,
  Globe2,
  RefreshCcw,
  Settings2,
} from 'lucide-react';

type LensKey = 'finance' | 'volume' | 'economics' | 'risk' | 'geopolitics' | 'operations';
type LensWeights = Record<LensKey, number>;

interface ProducerShare {
  name: string;
  code: string;
  value: number;
  share: number;
}

interface GlobalProductionMetric {
  value: number;
  unit: string;
  context: string;
  trendText: string;
  topProducers: ProducerShare[];
  series: number[];
}

interface BrentMetric {
  value: number;
  unit: string;
  context: string;
  trendText: string;
  rangeLow: number;
  rangeHigh: number;
  alert: string;
  series: number[];
}

interface YieldItem {
  name: string;
  value: number;
  unit: string;
  sharePct: number;
  note: string;
}

interface ReservesMetric {
  value: number;
  unit: string;
  yearsOfSupply: number;
  context: string;
  topHolders: string[];
  series: number[];
}

interface BreakEvenRow {
  region: string;
  min: number;
  max: number;
}

interface NigeriaPulseMetric {
  productionBpd: number;
  upstreamCapacityBpd: number;
  refineryThroughputBpd: number;
  pmsDemandBpd: number;
  context: string;
  bottleneck: string;
  series: number[];
}

interface NuanceItem {
  title: string;
  detail: string;
  severity: 'watch' | 'elevated' | 'critical';
}

interface UpstreamDashboardData {
  dashboardTitle: string;
  generatedAt: string;
  summary: string;
  dominantLens: LensKey;
  metrics: {
    globalProduction: GlobalProductionMetric;
    brentSpotPrice: BrentMetric;
    barrelYields: YieldItem[];
    reserves: ReservesMetric;
    breakEvenByRegion: BreakEvenRow[];
    nigeriaPulse: NigeriaPulseMetric;
  };
  nuances: NuanceItem[];
}

const PROXY_API_URL = '/api/upstream-intelligence';

function buildApiCandidates(): string[] {
  const configured = (process.env.NEXT_PUBLIC_UPSTREAM_INTEL_URL || '').trim();
  const candidates: string[] = [];

  if (configured) {
    const isLocalCandidate = configured.includes('127.0.0.1') || configured.includes('localhost');
    if (isLocalCandidate) {
      candidates.push(PROXY_API_URL, configured);
    } else {
      candidates.push(configured, PROXY_API_URL);
    }
  } else {
    candidates.push(PROXY_API_URL);
  }

  return Array.from(new Set(candidates));
}

const DEFAULT_LENS_WEIGHTS: LensWeights = {
  finance: 28,
  volume: 22,
  economics: 18,
  risk: 14,
  geopolitics: 10,
  operations: 8,
};

const LENS_CONFIG: Array<{ id: LensKey; label: string; color: string }> = [
  { id: 'finance', label: 'Finance', color: '#5A91B5' },
  { id: 'volume', label: 'Volume', color: '#3A8A85' },
  { id: 'economics', label: 'Economics', color: '#6D7FA3' },
  { id: 'risk', label: 'Risk', color: '#B6695A' },
  { id: 'geopolitics', label: 'Geopolitics', color: '#64748B' },
  { id: 'operations', label: 'Operations', color: '#4D8B6A' },
];

const PRESET_LENSES: Array<{ label: string; weights: LensWeights; strength: number }> = [
  { label: 'Balanced', weights: DEFAULT_LENS_WEIGHTS, strength: 55 },
  {
    label: 'Finance Priority',
    weights: { finance: 42, volume: 16, economics: 18, risk: 12, geopolitics: 6, operations: 6 },
    strength: 74,
  },
  {
    label: 'Volume Priority',
    weights: { finance: 16, volume: 40, economics: 14, risk: 10, geopolitics: 8, operations: 12 },
    strength: 70,
  },
  {
    label: 'Economics Priority',
    weights: { finance: 18, volume: 16, economics: 44, risk: 10, geopolitics: 6, operations: 6 },
    strength: 78,
  },
];

const MOCK_DATA: UpstreamDashboardData = {
  dashboardTitle: 'Nigeria Upstream Intelligence Desk',
  generatedAt: new Date().toISOString(),
  summary:
    'Nigeria upstream output is recovering, but realized gains remain constrained by evacuation, processing throughput, and route reliability.',
  dominantLens: 'finance',
  metrics: {
    globalProduction: {
      value: 103.0,
      unit: 'million barrels/day',
      context:
        'Global output remains resilient, but concentration risk remains elevated among top producing countries.',
      trendText: 'Output remains above 100 mbpd',
      topProducers: [
        { name: 'United States', code: 'US', value: 13.6, share: 16.0 },
        { name: 'Saudi Arabia', code: 'SA', value: 10.1, share: 11.0 },
        { name: 'Russia', code: 'RU', value: 9.9, share: 11.5 },
      ],
      series: [98.8, 99.3, 99.8, 100.5, 101.4, 101.8, 102.2, 102.5, 102.9, 103.0],
    },
    brentSpotPrice: {
      value: 97,
      unit: '$/barrel',
      context:
        'Benchmark pricing remains sensitive to route disruptions, shipping constraints, and OPEC+ signaling.',
      trendText: 'Elevated versus long-run comfort band',
      rangeLow: 58.5,
      rangeHigh: 119.5,
      alert: 'Risk premium remains active while route disruptions remain unresolved.',
      series: [73, 76, 81, 84, 90, 88, 93, 96, 98, 97],
    },
    barrelYields: [
      {
        name: 'Gasoline',
        value: 19.4,
        unit: 'gal',
        sharePct: 46,
        note: 'Largest refined share and most visible to households.',
      },
      {
        name: 'Diesel',
        value: 12.1,
        unit: 'gal',
        sharePct: 29,
        note: 'Core input for freight and industrial logistics.',
      },
      {
        name: 'Jet Fuel',
        value: 3.9,
        unit: 'gal',
        sharePct: 9,
        note: 'Sensitive to aviation demand cycles.',
      },
      {
        name: 'LPG / Other',
        value: 6.6,
        unit: 'gal',
        sharePct: 16,
        note: 'By-products and secondary margin streams.',
      },
    ],
    reserves: {
      value: 1.73,
      unit: 'trillion barrels',
      yearsOfSupply: 46,
      context:
        'Reserve depth remains substantial globally, but project economics and policy constraints determine realizable supply.',
      topHolders: ['Venezuela', 'Saudi Arabia', 'Iran'],
      series: [1.95, 1.91, 1.88, 1.84, 1.82, 1.79, 1.77, 1.76, 1.74, 1.73],
    },
    breakEvenByRegion: [
      { region: 'Middle East Onshore', min: 3, max: 10 },
      { region: 'US Shale', min: 40, max: 55 },
      { region: 'Deepwater', min: 35, max: 50 },
      { region: 'Oil Sands', min: 45, max: 65 },
    ],
    nigeriaPulse: {
      productionBpd: 1_400_000,
      upstreamCapacityBpd: 2_200_000,
      refineryThroughputBpd: 380_000,
      pmsDemandBpd: 280_000,
      context:
        'Nigeria is still operating below upstream potential; the gap is mainly infrastructure, evacuation and reliability related.',
      bottleneck: 'Pipeline reliability and terminal turnaround times remain the top system friction points.',
      series: [1.14, 1.18, 1.23, 1.26, 1.29, 1.31, 1.34, 1.36, 1.39, 1.4],
    },
  },
  nuances: [
    {
      title: 'Export corridor concentration remains high',
      detail: 'A limited number of routes still carry disproportionate flow, amplifying disruption impact.',
      severity: 'elevated',
    },
    {
      title: 'Throughput gains require logistics follow-through',
      detail: 'Refinery improvements only translate to stable retail supply if depot and transport execution also improve.',
      severity: 'watch',
    },
    {
      title: 'Realized margins diverge across operators',
      detail: 'Benchmark prices do not map evenly to cashflow due to cost structure, royalties and losses.',
      severity: 'critical',
    },
  ],
};

function normalizeWeights(weights: LensWeights): LensWeights {
  const sum = Object.values(weights).reduce((acc, value) => acc + Math.max(value, 0), 0);
  if (sum <= 0) return { ...DEFAULT_LENS_WEIGHTS };

  const normalized = Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Math.round((Math.max(value, 0) / sum) * 100)])
  ) as LensWeights;

  const normalizedSum = Object.values(normalized).reduce((acc, value) => acc + value, 0);
  if (normalizedSum !== 100) {
    normalized.finance += 100 - normalizedSum;
  }

  return normalized;
}

function dominantLens(weights: LensWeights): LensKey {
  return (Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0] || 'finance') as LensKey;
}

function applyLensToMock(weights: LensWeights, strength: number): UpstreamDashboardData {
  const normalized = normalizeWeights(weights);
  const next = structuredClone(MOCK_DATA);

  const financeBoost = normalized.finance / 100;
  const volumeBoost = normalized.volume / 100;
  const riskBoost = normalized.risk / 100;

  next.generatedAt = new Date().toISOString();
  next.dominantLens = dominantLens(normalized);
  next.metrics.brentSpotPrice.value = Number((94 + financeBoost * 5 + riskBoost * 3 + strength * 0.03).toFixed(1));
  next.metrics.globalProduction.value = Number((101.8 + volumeBoost * 1.4 + (100 - strength) * 0.002).toFixed(1));
  next.metrics.nigeriaPulse.productionBpd = Math.round(1_300_000 + volumeBoost * 140_000 + strength * 450);

  return next;
}

function compactNarrative(text: string, maxChars = 360): string {
  if (!text) return '';

  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  const uniqueSentences: string[] = [];
  for (const segment of cleaned.split('.')) {
    const sentence = segment.trim();
    if (!sentence) continue;
    const lowered = sentence.toLowerCase();
    if (!uniqueSentences.some((existing) => existing.toLowerCase() === lowered)) {
      uniqueSentences.push(sentence);
    }
    if (uniqueSentences.length >= 5) break;
  }

  const merged = `${uniqueSentences.join('. ')}${uniqueSentences.length ? '.' : ''}`;
  if (merged.length <= maxChars) return merged;
  return `${merged.slice(0, maxChars - 1).trimEnd()}...`;
}

function mergeDashboardData(raw: Partial<UpstreamDashboardData>): UpstreamDashboardData {
  const metrics = raw.metrics || ({} as Partial<UpstreamDashboardData['metrics']>);

  return {
    ...MOCK_DATA,
    ...raw,
    dashboardTitle: raw.dashboardTitle || MOCK_DATA.dashboardTitle,
    generatedAt: raw.generatedAt || new Date().toISOString(),
    summary: compactNarrative(raw.summary || MOCK_DATA.summary),
    dominantLens: (raw.dominantLens as LensKey) || MOCK_DATA.dominantLens,
    metrics: {
      globalProduction: {
        ...MOCK_DATA.metrics.globalProduction,
        ...(metrics.globalProduction || {}),
      },
      brentSpotPrice: {
        ...MOCK_DATA.metrics.brentSpotPrice,
        ...(metrics.brentSpotPrice || {}),
      },
      barrelYields: Array.isArray(metrics.barrelYields) && metrics.barrelYields.length
        ? metrics.barrelYields
        : MOCK_DATA.metrics.barrelYields,
      reserves: {
        ...MOCK_DATA.metrics.reserves,
        ...(metrics.reserves || {}),
      },
      breakEvenByRegion: Array.isArray(metrics.breakEvenByRegion) && metrics.breakEvenByRegion.length
        ? metrics.breakEvenByRegion
        : MOCK_DATA.metrics.breakEvenByRegion,
      nigeriaPulse: {
        ...MOCK_DATA.metrics.nigeriaPulse,
        ...(metrics.nigeriaPulse || {}),
      },
    },
    nuances: Array.isArray(raw.nuances) && raw.nuances.length ? raw.nuances : MOCK_DATA.nuances,
  };
}

function buildSparklinePath(series: number[], width: number, height: number): string {
  if (!series.length) return '';

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = Math.max(max - min, 1);

  return series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function formatBpd(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatGeneratedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleString();
}

function Sparkline({ series, color }: { series: number[]; color: string }) {
  const path = useMemo(() => buildSparklinePath(series, 260, 44), [series]);

  return (
    <svg width="100%" height="52" viewBox="0 0 260 52" preserveAspectRatio="none">
      <path
        d={path}
        fill="none"
        stroke={`${color}33`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.45 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </svg>
  );
}

export default function UpstreamIntelligenceView() {
  const [weights, setWeights] = useState<LensWeights>({ ...DEFAULT_LENS_WEIGHTS });
  const [strength, setStrength] = useState(55);
  const [data, setData] = useState<UpstreamDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);

    const payload = {
      scope: 'upstream_nigeria',
      lens_weights: normalizeWeights(weights),
      focus_strength: strength,
      include: ['global', 'nigeria', 'cost_curves', 'yield_breakdown', 'nuances'],
    };

    try {
      const timeoutMs = 45000;
      let lastError = 'All upstream endpoint candidates failed.';

      for (const apiUrl of buildApiCandidates()) {
        const timeoutMs = apiUrl.startsWith('/') ? 190000 : 60000;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errorPayload = await response.json().catch(() => null);
            const detail = errorPayload?.detail ? `: ${String(errorPayload.detail)}` : '';
            lastError = `Upstream intelligence API failed (${response.status}) at ${apiUrl}${detail}`;
            continue;
          }

          const json = await response.json();
          const raw = (json?.dashboard || json?.data || json) as Partial<UpstreamDashboardData>;
          const hasMetrics = !!raw && !!raw.metrics;

          setData(hasMetrics ? mergeDashboardData(raw) : applyLensToMock(weights, strength));
          setError(null);
          return;
        } catch (requestError: any) {
          if (requestError?.name === 'AbortError') {
            lastError = `Upstream intelligence timeout (${timeoutMs}ms) at ${apiUrl}`;
          } else {
            lastError = requestError?.message || `Upstream intelligence request failed at ${apiUrl}`;
          }
        } finally {
          clearTimeout(timer);
        }
      }

      throw new Error(lastError);
    } catch (err: any) {
      setData(applyLensToMock(weights, strength));
      setError(err?.message || 'Failed to load upstream intelligence data.');
    } finally {
      setLoading(false);
    }
  }, [weights, strength]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboard();
    }, 320);
    return () => clearTimeout(timer);
  }, [fetchDashboard, refreshKey]);

  const activeData = data || MOCK_DATA;
  const lensBadge = useMemo(() => {
    return LENS_CONFIG.find((lens) => lens.id === activeData.dominantLens) || LENS_CONFIG[0];
  }, [activeData.dominantLens]);

  const brent = activeData.metrics.brentSpotPrice;
  const globalProduction = activeData.metrics.globalProduction;
  const reserves = activeData.metrics.reserves;
  const nigeriaPulse = activeData.metrics.nigeriaPulse;

  const utilizationPct = useMemo(() => {
    if (!nigeriaPulse.upstreamCapacityBpd) return 0;
    return Math.max(0, Math.min(100, Math.round((nigeriaPulse.productionBpd / nigeriaPulse.upstreamCapacityBpd) * 100)));
  }, [nigeriaPulse.productionBpd, nigeriaPulse.upstreamCapacityBpd]);

  return (
    <div className="w-full h-full overflow-y-auto px-5 pb-8 pt-4">
      <div className="mx-auto max-w-[1240px] space-y-4">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{
            background:
              'linear-gradient(145deg, rgba(8,18,30,0.97) 0%, rgba(10,20,35,0.94) 45%, rgba(8,15,27,0.96) 100%)',
            border: '1px solid rgba(96,128,160,0.24)',
            boxShadow: '0 16px 34px rgba(2,9,17,0.45)',
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Globe2 size={15} className="text-[#6EA5C7]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#88A8C2]">
                  Nigeria Upstream Desk
                </span>
              </div>
              <h2 className="text-[24px] font-semibold leading-tight text-[#E8F0F7]">
                {activeData.dashboardTitle}
              </h2>
              <p className="mt-1 max-w-[780px] text-[12px] leading-relaxed text-[#A6BED3]">
                {compactNarrative(activeData.summary)}
              </p>
            </div>

            <div className="space-y-2 text-right">
              <div className="text-[11px] font-mono text-[#8AA8C4]">
                Generated: {formatGeneratedAt(activeData.generatedAt)}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div
                  className="rounded-lg px-2.5 py-1 text-[11px] font-medium"
                  style={{
                    color: lensBadge.color,
                    border: `1px solid ${lensBadge.color}55`,
                    background: `${lensBadge.color}14`,
                  }}
                >
                  Dominant Lens: {lensBadge.label}
                </div>
                <button
                  onClick={() => setRefreshKey((value) => value + 1)}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-[#D4E1EE]"
                  style={{
                    border: '1px solid rgba(109,140,170,0.35)',
                    background: 'rgba(12,21,35,0.92)',
                  }}
                >
                  <RefreshCcw size={12} /> Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div
              className="rounded-xl p-3"
              style={{ border: '1px solid rgba(98,127,155,0.24)', background: 'rgba(10,18,31,0.72)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Settings2 size={14} className="text-[#6EA5C7]" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#94B3CC]">Lens Weighting</span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                {PRESET_LENSES.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setWeights({ ...preset.weights });
                      setStrength(preset.strength);
                    }}
                    className="rounded-lg px-2 py-1.5 text-left text-[10px] font-medium text-[#B9CEE0] transition-colors hover:text-[#E2EDF7]"
                    style={{
                      border: '1px solid rgba(103,132,159,0.34)',
                      background: 'rgba(15,25,40,0.7)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                {LENS_CONFIG.map((lens) => (
                  <div key={lens.id} className="grid grid-cols-[96px_1fr_36px] items-center gap-2">
                    <span className="text-[10px] font-medium" style={{ color: lens.color }}>
                      {lens.label}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[lens.id]}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setWeights((current) => ({ ...current, [lens.id]: next }));
                      }}
                      style={{ accentColor: lens.color }}
                    />
                    <span className="text-right text-[10px] font-mono text-[#8EAAC3]">{weights[lens.id]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-xl p-3"
              style={{ border: '1px solid rgba(98,127,155,0.24)', background: 'rgba(10,18,31,0.72)' }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Gauge size={14} className="text-[#6EA5C7]" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#94B3CC]">Signal Intensity</span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                value={strength}
                onChange={(event) => setStrength(Number(event.target.value))}
                className="w-full"
                style={{ accentColor: '#6EA5C7' }}
              />
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#88A8C3]">
                <span>Contextual</span>
                <span className="text-[#D5E6F4]">{strength}%</span>
                <span>Aggressive</span>
              </div>

              <div className="mt-3 rounded-lg px-2.5 py-2 text-[11px] text-[#AFC5D9]"
                style={{ border: '1px solid rgba(102,131,159,0.25)', background: 'rgba(14,23,38,0.8)' }}
              >
                Nigeria utilization is currently operating around <span className="font-semibold text-[#DFECF7]">{utilizationPct}%</span> of upstream capacity.
              </div>

              {!!error && (
                <div className="mt-2 rounded-lg px-2.5 py-2 text-[10px] text-[#D8B58E]"
                  style={{ border: '1px solid rgba(180,130,83,0.3)', background: 'rgba(71,45,26,0.28)' }}
                >
                  Fallback mode active: {error}
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl p-3" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8EAEC8]">Global Production</div>
            <div className="mt-1 text-[34px] font-semibold leading-none text-[#E7F0F8]">{globalProduction.value.toFixed(1)}</div>
            <div className="text-[12px] text-[#9BB7D0]">{globalProduction.unit}</div>
            <div className="mt-1 text-[10px] font-mono text-[#8DAAC5]">{globalProduction.trendText}</div>
            <div className="mt-2">
              <Sparkline series={globalProduction.series} color="#6EA5C7" />
            </div>
          </article>

          <article className="rounded-xl p-3" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8EAEC8]">Brent Spot</div>
            <div className="mt-1 text-[34px] font-semibold leading-none text-[#E7F0F8]">${brent.value.toFixed(1)}</div>
            <div className="text-[12px] text-[#9BB7D0]">{brent.unit}</div>
            <div className="mt-1 text-[10px] font-mono text-[#8DAAC5]">{brent.trendText}</div>
            <div className="mt-2">
              <Sparkline series={brent.series} color="#7F9AB8" />
            </div>
          </article>

          <article className="rounded-xl p-3" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8EAEC8]">Proven Reserves</div>
            <div className="mt-1 text-[34px] font-semibold leading-none text-[#E7F0F8]">{reserves.value.toFixed(2)}</div>
            <div className="text-[12px] text-[#9BB7D0]">{reserves.unit}</div>
            <div className="mt-1 text-[10px] font-mono text-[#8DAAC5]">~{reserves.yearsOfSupply} years supply</div>
            <div className="mt-2">
              <Sparkline series={reserves.series} color="#8093A7" />
            </div>
          </article>

          <article className="rounded-xl p-3" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#8EAEC8]">Nigeria Production</div>
            <div className="mt-1 text-[34px] font-semibold leading-none text-[#E7F0F8]">{formatBpd(nigeriaPulse.productionBpd)}</div>
            <div className="text-[12px] text-[#9BB7D0]">barrels/day</div>
            <div className="mt-1 text-[10px] font-mono text-[#8DAAC5]">Capacity: {formatBpd(nigeriaPulse.upstreamCapacityBpd)} bpd</div>
            <div className="mt-2">
              <Sparkline series={nigeriaPulse.series} color="#4D8B6A" />
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[1.25fr_1fr]">
          <article className="rounded-xl p-4" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="mb-2 flex items-center gap-2">
              <Factory size={15} className="text-[#6EA5C7]" />
              <span className="text-[12px] uppercase tracking-[0.15em] text-[#94B3CC]">Nigeria Operational Pulse</span>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <div className="rounded-lg p-2" style={{ border: '1px solid rgba(96,126,155,0.22)', background: 'rgba(14,23,38,0.84)' }}>
                <div className="text-[10px] uppercase tracking-wider text-[#8CAAC4]">Output</div>
                <div className="mt-1 text-[20px] font-semibold text-[#E5EEF7]">{formatBpd(nigeriaPulse.productionBpd)}</div>
                <div className="text-[10px] text-[#7F9CB6]">bpd</div>
              </div>
              <div className="rounded-lg p-2" style={{ border: '1px solid rgba(96,126,155,0.22)', background: 'rgba(14,23,38,0.84)' }}>
                <div className="text-[10px] uppercase tracking-wider text-[#8CAAC4]">Capacity</div>
                <div className="mt-1 text-[20px] font-semibold text-[#E5EEF7]">{formatBpd(nigeriaPulse.upstreamCapacityBpd)}</div>
                <div className="text-[10px] text-[#7F9CB6]">bpd</div>
              </div>
              <div className="rounded-lg p-2" style={{ border: '1px solid rgba(96,126,155,0.22)', background: 'rgba(14,23,38,0.84)' }}>
                <div className="text-[10px] uppercase tracking-wider text-[#8CAAC4]">Refining</div>
                <div className="mt-1 text-[20px] font-semibold text-[#E5EEF7]">{formatBpd(nigeriaPulse.refineryThroughputBpd)}</div>
                <div className="text-[10px] text-[#7F9CB6]">bpd</div>
              </div>
              <div className="rounded-lg p-2" style={{ border: '1px solid rgba(96,126,155,0.22)', background: 'rgba(14,23,38,0.84)' }}>
                <div className="text-[10px] uppercase tracking-wider text-[#8CAAC4]">PMS Demand</div>
                <div className="mt-1 text-[20px] font-semibold text-[#E5EEF7]">{formatBpd(nigeriaPulse.pmsDemandBpd)}</div>
                <div className="text-[10px] text-[#7F9CB6]">bpd</div>
              </div>
            </div>

            <p className="mt-3 text-[13px] leading-relaxed text-[#B0C7DA]">{nigeriaPulse.context}</p>
            <div
              className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-2 text-[11px] text-[#D2B08A]"
              style={{ border: '1px solid rgba(176,128,84,0.26)', background: 'rgba(66,44,27,0.28)' }}
            >
              <AlertTriangle size={13} className="mt-0.5" />
              <span>{nigeriaPulse.bottleneck}</span>
            </div>
          </article>

          <article className="rounded-xl p-4" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 size={15} className="text-[#6EA5C7]" />
              <span className="text-[12px] uppercase tracking-[0.15em] text-[#94B3CC]">Break-even Range</span>
            </div>

            <div className="space-y-2">
              {activeData.metrics.breakEvenByRegion.map((row) => {
                const maxScale = 90;
                const widthPct = Math.min((row.max / maxScale) * 100, 100);
                const marginLow = Math.max(brent.value - row.max, 0);
                const marginHigh = Math.max(brent.value - row.min, 0);

                return (
                  <div key={row.region}>
                    <div className="mb-1 flex items-center justify-between text-[12px] text-[#CBDEEF]">
                      <span>{row.region}</span>
                      <span className="font-mono text-[#8DAAC5]">${row.min}-{row.max}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#1D2A3C]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #6A8EB0 0%, #8EA6BE 100%)' }}
                      />
                    </div>
                    <div className="mt-0.5 text-right text-[10px] font-mono text-[#96B2CB]">
                      Margin: ${marginLow.toFixed(0)}-${marginHigh.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <article className="rounded-xl p-4" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="mb-3 text-[12px] uppercase tracking-[0.15em] text-[#94B3CC]">Refining Yield Composition</div>

            <div className="space-y-2">
              {activeData.metrics.barrelYields.map((item) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-[#D5E5F3]">
                    <span>{item.name}</span>
                    <span className="font-mono text-[#8EAAC4]">{item.value} {item.unit}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#1F2D40]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.sharePct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #6189AB 0%, #4C7D9F 100%)' }}
                    />
                  </div>
                  <div className="mt-0.5 text-[10px] text-[#8EA9C2]">{item.sharePct}% • {item.note}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl p-4" style={{ border: '1px solid rgba(99,126,154,0.24)', background: 'rgba(9,17,29,0.9)' }}>
            <div className="mb-3 text-[12px] uppercase tracking-[0.15em] text-[#94B3CC]">Analyst Nuances</div>

            <div className="space-y-2">
              {activeData.nuances.map((item) => {
                const severityColor = item.severity === 'critical'
                  ? '#B6695A'
                  : item.severity === 'elevated'
                  ? '#8F9CB1'
                  : '#6B8AA7';

                return (
                  <div
                    key={item.title}
                    className="rounded-lg px-2.5 py-2"
                    style={{ border: `1px solid ${severityColor}40`, background: 'rgba(14,23,38,0.84)' }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="text-[12px] font-medium text-[#E5EEF7]">{item.title}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: severityColor }}>
                        {item.severity}
                      </div>
                    </div>
                    <div className="text-[11px] leading-relaxed text-[#AFC5D9]">{item.detail}</div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        {loading && (
          <div
            className="rounded-xl px-3 py-2 text-[11px] text-[#91ADC6]"
            style={{ border: '1px solid rgba(98,126,153,0.22)', background: 'rgba(10,18,31,0.72)' }}
          >
            Refreshing upstream intelligence payload...
          </div>
        )}
      </div>
    </div>
  );
}
