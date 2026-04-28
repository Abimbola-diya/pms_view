'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { Node as NodeType, Flow } from '@/types';
import { NODE_TYPE_CONFIG } from '@/types';

interface SankeyViewProps {
  nodes: NodeType[];
  flows: Flow[];
}

type SankeyNode = {
  id: string;
  name: string;
  nodeType: string;
};

type SankeyLink = {
  source: string;
  target: string;
  value: number;
  flowType: string;
};

const FLOW_COLORS: Record<string, string> = {
  crude_supply: '#6E8FAF',
  product_transfer: '#4A7E9F',
  retail_distribution: '#4C8A74',
  export_route: '#6A7795',
  import_route: '#678EAE',
};

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M bpd`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K bpd`;
  return `${Math.round(value)} bpd`;
}

function shortLabel(value: string, max = 24): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

export default function SankeyView({ nodes, flows }: SankeyViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 1000, height: 560 });

  useEffect(() => {
    const target = wrapperRef.current;
    if (!target) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const width = Math.max(760, Math.floor(entry.contentRect.width) - 24);
      const height = Math.max(440, Math.floor(entry.contentRect.height) - 24);
      setSize({ width, height });
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const sankeyInput = useMemo(() => {
    const nodeLookup = new Map(nodes.map((node) => [node.id, node]));

    const aggregated = new Map<string, SankeyLink>();
    for (const flow of flows) {
      if (!nodeLookup.has(flow.source_node_id) || !nodeLookup.has(flow.destination_node_id)) {
        continue;
      }

      const key = `${flow.source_node_id}::${flow.destination_node_id}::${flow.flow_type || 'product_transfer'}`;
      const current = aggregated.get(key);

      if (current) {
        current.value += Math.max(1, flow.volume_bpd || flow.avg_volume_value || 1);
      } else {
        aggregated.set(key, {
          source: flow.source_node_id,
          target: flow.destination_node_id,
          value: Math.max(1, flow.volume_bpd || flow.avg_volume_value || 1),
          flowType: flow.flow_type || 'product_transfer',
        });
      }
    }

    const links = Array.from(aggregated.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 180);

    const nodeIds = new Set<string>();
    links.forEach((link) => {
      nodeIds.add(link.source);
      nodeIds.add(link.target);
    });

    const sankeyNodes: SankeyNode[] = Array.from(nodeIds)
      .map((id) => {
        const source = nodeLookup.get(id);
        return {
          id,
          name: source?.name || id,
          nodeType: (source?.node_type || 'storage').toLowerCase(),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      nodes: sankeyNodes,
      links,
    };
  }, [nodes, flows]);

  const sankeyLayout = useMemo(() => {
    try {
      const layout = (d3Sankey() as any)
        .nodeId((d: any) => d.id)
        .nodeWidth(14)
        .nodePadding(10)
        .extent([
          [10, 12],
          [Math.max(80, size.width - 10), Math.max(60, size.height - 12)],
        ]);

      return layout({
        nodes: sankeyInput.nodes.map((node) => ({ ...node })),
        links: sankeyInput.links.map((link) => ({ ...link })),
      });
    } catch {
      return { nodes: [], links: [] } as unknown as ReturnType<typeof d3Sankey>;
    }
  }, [sankeyInput, size.height, size.width]);

  return (
    <div className="h-full w-full p-4">
      <div className="mb-3 rounded-xl border border-[#2A3A50] bg-[#0E1624] px-4 py-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9EB8D1]">
          Throughput Flow Sankey
        </div>
        <div className="mt-1 text-[11px] text-[#7E98B3]">
          Top transfer pathways across upstream, terminal, refining, and retail layers.
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="h-[calc(100%-78px)] rounded-xl border border-[#2A3A50] bg-[#0B1320] p-2"
      >
        <svg width={size.width} height={size.height}>
          <defs>
            <linearGradient id="sankey-node-fill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#2A3F57" />
              <stop offset="100%" stopColor="#1E3148" />
            </linearGradient>
          </defs>

          <g>
            {(sankeyLayout.links || []).map((link: any, index: number) => {
              const color = FLOW_COLORS[link.flowType] || '#5D7EA0';
              return (
                <path
                  key={`${link.source}-${link.target}-${index}`}
                  d={sankeyLinkHorizontal()(link as any) || ''}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.34}
                  strokeWidth={Math.max(1.5, link.width || 0)}
                >
                  <title>
                    {`${(link.source as any).name || (link.source as any).id} -> ${(link.target as any).name || (link.target as any).id} (${formatVolume(link.value)})`}
                  </title>
                </path>
              );
            })}

            {(sankeyLayout.nodes || []).map((node: any, index: number) => {
              const nodeConfig = NODE_TYPE_CONFIG[node.nodeType] || NODE_TYPE_CONFIG.storage;
              const nodeHeight = Math.max(6, (node.y1 || 0) - (node.y0 || 0));
              const labelOnRight = (node.x0 || 0) < size.width / 2;

              return (
                <g key={`${node.id}-${index}`} transform={`translate(${node.x0},${node.y0})`}>
                  <rect
                    width={Math.max(10, (node.x1 || 0) - (node.x0 || 0))}
                    height={nodeHeight}
                    rx={3}
                    ry={3}
                    fill="url(#sankey-node-fill)"
                    stroke={nodeConfig.color}
                    strokeOpacity={0.55}
                    strokeWidth={1}
                  >
                    <title>{`${node.name} (${node.nodeType})`}</title>
                  </rect>

                  {nodeHeight > 12 ? (
                    <text
                      x={labelOnRight ? 18 : -8}
                      y={nodeHeight / 2}
                      dy="0.34em"
                      textAnchor={labelOnRight ? 'start' : 'end'}
                      fontSize={10}
                      fill="#AFC5DB"
                    >
                      {shortLabel(node.name)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
