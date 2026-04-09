"use client";

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Node as NodeType, Flow as FlowType } from '@/types';

export default function EcosystemView({ nodes, flows }: { nodes: NodeType[]; flows: FlowType[] }) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const width = ref.current.clientWidth || 900;
    const height = ref.current.clientHeight || 600;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const graphNodes = nodes.slice(0, 120).map((n) => ({ id: n.id, name: n.name, group: n.node_type }));
    const graphLinks = flows
      .filter((f) => nodeMap.has(f.source_node_id) && nodeMap.has(f.destination_node_id))
      .slice(0, 400)
      .map((f) => ({ source: f.source_node_id, target: f.destination_node_id, value: f.volume_bpd || 1 }));

    const simulation = d3
      .forceSimulation(graphNodes as any)
      .force('link', d3.forceLink(graphLinks).id((d: any) => d.id).distance(60).strength(0.1))
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(12));

    const link = svg
      .append('g')
      .attr('stroke', 'rgba(0,217,255,0.12)')
      .selectAll('line')
      .data(graphLinks)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value));

    const node = svg
      .append('g')
      .selectAll('circle')
      .data(graphNodes)
      .join('circle')
      .attr('r', 6)
      .attr('fill', '#00D9FF')
      .call(drag(simulation));

    const label = svg
      .append('g')
      .selectAll('text')
      .data(graphNodes)
      .join('text')
      .attr('font-size', 9)
      .attr('fill', '#E8E8E8')
      .text((d: any) => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => (d.source as any).x)
        .attr('y1', (d: any) => (d.source as any).y)
        .attr('x2', (d: any) => (d.target as any).x)
        .attr('y2', (d: any) => (d.target as any).y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x + 8).attr('y', (d: any) => d.y + 4);
    });

    function drag(sim: any) {
      return d3
        .drag()
        .on('start', (event: any, d: any) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event: any, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event: any, d: any) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
    }

    return () => simulation.stop();
  }, [nodes, flows]);

  return (
    <div className="w-full h-full">
      <svg ref={ref} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

