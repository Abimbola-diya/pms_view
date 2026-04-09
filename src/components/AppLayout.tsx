'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/stores';
import { useNodes, useFlows, useIncidents } from '@/hooks/useData';
import TopNav from './TopNav';
import LeftSidebar from './LeftSidebar';
import LayerControl from './LayerControl';
import JarvisChat from './JarvisChat';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./MapView'), { ssr: false });
const SankeyView = dynamic(() => import('./SankeyView'), { ssr: false });
const EcosystemView = dynamic(() => import('./EcosystemView'), { ssr: false });

export default function AppLayout() {
  const { nodes: storeNodes, flows: storeFlows, selected_node, active_view } = useStore();
  const [systemStatus, setSystemStatus] = useState('online');
  const [dataQuality, setDataQuality] = useState(98);

  const { nodes, loading: nodesLoading } = useNodes();
  const { flows, loading: flowsLoading } = useFlows();
  const { incidents } = useIncidents();

  const nodesArray = Array.from(storeNodes.values());
  const flowsArray = Array.from(storeFlows.values());

  const isLoading = nodesLoading || flowsLoading;

  const activeNodeCount = nodesArray.filter(n => n.status === 'operational').length;
  const totalCapacity = nodesArray.reduce((sum, n) => sum + (n.capacity_bpd || 0), 0);

  return (
    <div className="w-full h-screen overflow-hidden relative" style={{ background: '#0A0E27' }}>
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0,217,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Top navigation */}
      <TopNav />

      {/* Left sidebar (filters, summary) */}
      <LeftSidebar nodes={nodes} />

      {/* Main viewport — full screen, nav sits on top */}
      <div className="absolute inset-0 pt-12 flex">
        {/* Map view */}
        {active_view === 'map' && (
          <div className="w-full h-full">
            <MapView nodes={nodes} flows={flows} />
          </div>
        )}

        {/* Sankey view */}
        {active_view === 'sankey' && (
          <div className="w-full h-full">
            <SankeyView nodes={nodes} flows={flows} />
          </div>
        )}

        {/* Ecosystem (force-directed) view */}
        {active_view === 'ecosystem' && (
          <div className="w-full h-full">
            <EcosystemView nodes={nodes} flows={flows} />
          </div>
        )}

        {/* Default HUD when no active view selected */}
        {active_view === 'hud' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="hud-panel">
              <div className="text-center">
                <div className="text-[#00D9FF] text-[14px] font-mono font-bold mb-2">~ PALANTIR INTELLIGENCE PLATFORM</div>
                <div className="text-[#A0A0A0] text-[12px] font-mono mb-4">Nigeria Petrochemical Supply Chain Visualization</div>
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-[18px] font-bold text-refine-cyan">{nodesArray.length}</div>
                    <div className="text-[10px] text-text-muted mt-1">Nodes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[18px] font-bold text-crude-gold">{flowsArray.length}</div>
                    <div className="text-[10px] text-text-muted mt-1">Flows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[18px] font-bold text-healthy-green">{activeNodeCount}</div>
                    <div className="text-[10px] text-text-muted mt-1">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[18px] font-bold text-ai-purple">{incidents.length}</div>
                    <div className="text-[10px] text-text-muted mt-1">Incidents</div>
                  </div>
                </div>
                <div className="mt-6 text-[11px] text-text-muted">
                  Initializing spatial intelligence core...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top-right: System Status HUD */}
      <div className="absolute top-16 right-4 z-40 space-y-2">
        {/* System Status */}
        <div className="hud-panel w-64">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-text-secondary">SYSTEM STATUS</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-healthy-green animate-pulse" />
              <span className="text-[10px] text-text-secondary uppercase">{systemStatus}</span>
            </div>
          </div>
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex justify-between text-text-muted">
              <span>Network Health</span>
              <span className="text-healthy-green">{dataQuality}%</span>
            </div>
            <div className="h-1 bg-palantir-dark rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-healthy-green to-refine-cyan"
                style={{ width: `${dataQuality}%` }}
              />
            </div>
            <div className="flex justify-between text-text-muted pt-2">
              <span>Active Nodes</span>
              <span className="text-refine-cyan">{activeNodeCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="hud-panel w-64">
          <div className="text-[11px] font-mono text-text-secondary mb-3">NETWORK METRICS</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 rounded" style={{ background: 'rgba(0,217,255,0.05)' }}>
              <div className="text-text-muted">Capacity</div>
              <div className="text-refine-cyan font-mono">{(totalCapacity / 1000).toFixed(1)}K bpd</div>
            </div>
            <div className="p-2 rounded" style={{ background: 'rgba(255,215,0,0.05)' }}>
              <div className="text-text-muted">Flows</div>
              <div className="text-crude-gold font-mono">{flowsArray.length}</div>
            </div>
            <div className="p-2 rounded" style={{ background: 'rgba(255,23,68,0.05)' }}>
              <div className="text-text-muted">Incidents</div>
              <div className="text-alert-red font-mono">{incidents.length}</div>
            </div>
            <div className="p-2 rounded" style={{ background: 'rgba(157,78,221,0.05)' }}>
              <div className="text-text-muted">Nodes</div>
              <div className="text-ai-purple font-mono">{nodesArray.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-right: Layer control and Chat */}
      <div className="absolute bottom-4 right-4 z-40 space-y-3">
        {/* Layer control — floating panel */}
        <div className="pointer-events-auto">
          <LayerControl />
        </div>

        {/* Jarvis chat */}
        <div className="pointer-events-auto">
          <JarvisChat />
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur">
          <div className="hud-panel">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-refine-cyan rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
                <div className="w-1 h-4 bg-refine-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-4 bg-refine-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
              <div>
                <div className="text-[11px] font-mono text-text-primary">INITIALIZING SYSTEM</div>
                <div className="text-[9px] font-mono text-text-muted mt-1">Loading supply chain data...</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
