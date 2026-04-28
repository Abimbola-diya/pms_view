'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Node as NodeType, Flow as FlowType, NODE_TYPE_CONFIG } from '@/types';

type GraphNode = {
  id: string;
  name: string;
  nodeType: string;
  degree: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
};

function shortName(value: string, max = 26): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
}

export default function EcosystemView({ nodes, flows }: { nodes: NodeType[]; flows: FlowType[] }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [size, setSize] = useState({ width: 1100, height: 680 });

  useEffect(() => {
    const target = wrapperRef.current;
    if (!target) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setSize({
        width: Math.max(820, Math.floor(entry.contentRect.width)),
        height: Math.max(520, Math.floor(entry.contentRect.height)),
      });
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const graph = useMemo(() => {
    const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
    const degree = new Map<string, number>();

    for (const flow of flows) {
      degree.set(flow.source_node_id, (degree.get(flow.source_node_id) || 0) + 1);
      degree.set(flow.destination_node_id, (degree.get(flow.destination_node_id) || 0) + 1);
    }

    const rankedNodes = [...nodeLookup.values()]
      .sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0))
      .slice(0, 230);

    const includedIds = new Set(rankedNodes.map((node) => node.id));

    const graphNodes: GraphNode[] = rankedNodes.map((node) => ({
      id: node.id,
      name: node.name,
      nodeType: (node.node_type || 'storage').toLowerCase(),
      degree: degree.get(node.id) || 0,
    }));

    const graphLinks: GraphLink[] = flows
      .filter((flow) => includedIds.has(flow.source_node_id) && includedIds.has(flow.destination_node_id))
      .slice(0, 460)
      .map((flow) => ({
        source: flow.source_node_id,
        target: flow.destination_node_id,
        value: Math.max(1, flow.volume_bpd || flow.avg_volume_value || 1),
      }));

    return { nodes: graphNodes, links: graphLinks };
  }, [nodes, flows]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = size;

    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'ecosystem-bg')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#0C1626');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#091220');

    svg
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'url(#ecosystem-bg)');

    const rootGroup = svg.append('g');

    const maxLinkValue = Math.max(...graph.links.map((link) => link.value), 1);
    const linkWidth = d3.scaleSqrt().domain([1, maxLinkValue]).range([0.6, 3.6]);

    const maxDegree = Math.max(...graph.nodes.map((node) => node.degree), 1);
    const nodeRadius = d3.scaleSqrt().domain([1, maxDegree]).range([4, 12]);

    const simulation = d3
      .forceSimulation(graph.nodes as any[])
      .force(
        'link',
        d3
          .forceLink(graph.links)
          .id((d: any) => d.id)
          .distance((link: any) => 52 + Math.min(35, link.value / 12000))
          .strength(0.18)
      )
      .force('charge', d3.forceManyBody().strength(-68))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => nodeRadius(d.degree) + 4));

    const links = rootGroup
      .append('g')
      .attr('stroke-linecap', 'round')
      .selectAll('line')
      .data(graph.links)
      .join('line')
      .attr('stroke', '#5D7593')
      .attr('stroke-opacity', 0.26)
      .attr('stroke-width', (d: any) => linkWidth(d.value));

    const nodesGroup = rootGroup.append('g').selectAll('g').data(graph.nodes).join('g');

    nodesGroup
      .append('circle')
      .attr('r', (d: any) => nodeRadius(d.degree))
      .attr('fill', (d: any) => (NODE_TYPE_CONFIG[d.nodeType]?.color || '#7B8EA5'))
      .attr('fill-opacity', 0.88)
      .attr('stroke', '#D8E3EE')
      .attr('stroke-opacity', 0.24)
      .attr('stroke-width', 0.8);

    nodesGroup
      .append('title')
      .text((d: any) => `${d.name} (${d.nodeType})\nConnections: ${d.degree}`);

    const topLabeledIds = new Set(
      [...graph.nodes]
        .sort((a, b) => b.degree - a.degree)
        .slice(0, 30)
        .map((node) => node.id)
    );

    const labels = rootGroup
      .append('g')
      .selectAll('text')
      .data(graph.nodes.filter((node) => topLabeledIds.has(node.id)))
      .join('text')
      .attr('font-size', 10)
      .attr('fill', '#B9CBDE')
      .attr('font-family', 'IBM Plex Mono, monospace')
      .text((d: any) => shortName(d.name));

    const drag = d3
      .drag()
      .on('start', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0.25).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event: any, d: any) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event: any, d: any) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodesGroup.call(drag as any);

    const zoom = d3
      .zoom()
      .scaleExtent([0.65, 2.2])
      .on('zoom', (event: any) => {
        rootGroup.attr('transform', event.transform.toString());
      });

    svg.call(zoom as any);

    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => (d.source as GraphNode).x || 0)
        .attr('y1', (d: any) => (d.source as GraphNode).y || 0)
        .attr('x2', (d: any) => (d.target as GraphNode).x || 0)
        .attr('y2', (d: any) => (d.target as GraphNode).y || 0);

      nodesGroup.attr('transform', (d: any) => `translate(${d.x || 0},${d.y || 0})`);

      labels
        .attr('x', (d: any) => (d.x || 0) + nodeRadius(d.degree) + 4)
        .attr('y', (d: any) => (d.y || 0) + 3);
    });

    return () => {
      simulation.stop();
    };
  }, [graph.links, graph.nodes, size]);

  return (
    <div className="h-full w-full p-4">
      <div className="mb-3 rounded-xl border border-[#2A3A50] bg-[#0E1624] px-4 py-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#9EB8D1]">
          Ecosystem Dependency Graph
        </div>
        <div className="mt-1 text-[11px] text-[#7E98B3]">
          Drag nodes to inspect coupling strength and propagation paths across Nigeria supply assets.
        </div>
      </div>

      <div ref={wrapperRef} className="h-[calc(100%-78px)] rounded-xl border border-[#2A3A50] bg-[#091220]">
        <svg ref={svgRef} width={size.width} height={size.height} className="block h-full w-full" />
      </div>
    </div>
  );
}
