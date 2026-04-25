"use client";

import React, { useMemo } from "react";
import { sankey as d3Sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { Node as NodeType, Flow } from "@/types";

interface SankeyViewProps {
  nodes: NodeType[];
  flows: Flow[];
}

export default function SankeyView({ nodes, flows }: SankeyViewProps) {
  const width = 1000;
  const height = 520;

  const data = useMemo(() => {
    const nodeMap = new Map<string, { id: string; name: string }>();
    flows.forEach((f) => {
      nodeMap.set(f.source_node_id, { id: f.source_node_id, name: f.source_node_id });
      nodeMap.set(f.destination_node_id, { id: f.destination_node_id, name: f.destination_node_id });
    });

    const nodesArr = Array.from(nodeMap.values());
    const idx = new Map<string, number>();
    nodesArr.forEach((n, i) => idx.set(n.id, i));

    const linkMap = new Map<string, number>();
    flows.forEach((f) => {
      if (!idx.has(f.source_node_id) || !idx.has(f.destination_node_id)) return;
      const key = `${f.source_node_id}::${f.destination_node_id}`;
      linkMap.set(key, (linkMap.get(key) || 0) + (f.volume_bpd || 1));
    });

    const links = Array.from(linkMap.entries()).map(([k, v]) => {
      const [s, t] = k.split("::");
      return { source: idx.get(s)!, target: idx.get(t)!, value: v };
    });

    return { nodes: nodesArr.map((n) => ({ id: n.id, name: n.name })), links };
  }, [flows]);

  const sankeyLayout = useMemo(() => {
    try {
      return d3Sankey()
        .nodeId((d: any) => d.id)
        .nodeWidth(18)
        .nodePadding(10)
        .extent([[0, 0], [width, height]])(data as any);
    } catch (e) {
      return { nodes: [], links: [] } as any;
    }
  }, [data]);

  return (
    <div className="w-full h-full p-4">
      <div className="hud-panel p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] font-mono text-[#00D9FF]">Sankey Flow</div>
            <div className="text-[10px] text-[#A0A0A0]">Aggregated product flows</div>
          </div>
        </div>
      </div>

      <div className="hud-panel p-3">
        <svg width={width} height={height}>
          <g>
            {sankeyLayout.links.map((link: any, i: number) => (
              <path
                key={i}
                d={sankeyLinkHorizontal()(link) as string}
                style={{ fill: "none", stroke: `rgba(0,217,255,0.18)`, strokeWidth: Math.max(1, link.width) }}
                opacity={0.95}
              />
            ))}

            {sankeyLayout.nodes.map((node: any, i: number) => (
              <g key={i} transform={`translate(${node.x0},${node.y0})`}>
                <rect width={node.x1 - node.x0} height={Math.max(6, node.y1 - node.y0)} rx={3} ry={3} fill="#0B2A3A" stroke="rgba(0,217,255,0.08)" />
                <text x={-6} y={(node.y1 - node.y0) / 2} dy="0.35em" textAnchor="end" fontSize={10} fill="#A0A0A0" fontFamily="monospace">
                  {node.id}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
