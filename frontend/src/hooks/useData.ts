import { useEffect, useState } from 'react';
import {
  fetchAllNodes,
  fetchAllFlows,
  fetchIncidents,
  fetchMacroIndicators,
  subscribeToNodes,
  subscribeToFlows,
  subscribeToIncidents,
} from '@/lib/supabase';
import { generateMockNodes, generateMockFlows } from '@/lib/mockData';
import { Node, Flow, Incident, MacroIndicator } from '@/types';
import { useStore } from '@/stores';

export function useNodes() {
  const { set_nodes, nodes } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const { nodes: initial, error: err } = await fetchAllNodes();
        if (err || !initial || initial.length === 0) {
          console.log('📊 Using mock data for nodes (Supabase unavailable or empty)');
          const mockNodes = generateMockNodes(200);  // Generate 200 nodes for richer supply chain
          set_nodes(mockNodes);
        } else {
          set_nodes(initial);
          unsubscribe = subscribeToNodes((updated) => set_nodes(updated));
        }
        setLoading(false);
      } catch (e: any) {
        console.warn('⚠️ Supabase fetch failed, using mock data:', e.message);
        const mockNodes = generateMockNodes(200);  // Generate 200 nodes for richer supply chain
        set_nodes(mockNodes);
        setLoading(false);
      }
    })();
    return () => { unsubscribe?.(); };
  }, [set_nodes]);

  return { nodes: Array.from(nodes.values()), loading, error };
}

export function useFlows() {
  const { set_flows, flows, nodes } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const { flows: initial, error: err } = await fetchAllFlows();
        if (err || !initial || initial.length === 0) {
          console.log('📊 Using mock data for flows (Supabase unavailable or empty)');
          // Use nodes from store if available, otherwise generate fresh mock data
          const nodesArray = Array.from(nodes.values());
          const nodesToUse = nodesArray.length > 0 ? nodesArray : generateMockNodes(200);
          const mockFlows = generateMockFlows(nodesToUse, 150);  // 150 flows for 200 nodes
          console.log('🔀 Generated', mockFlows.length, 'flows from', nodesToUse.length, 'nodes');
          set_flows(mockFlows);
        } else {
          set_flows(initial);
          unsubscribe = subscribeToFlows((updated) => set_flows(updated));
        }
        setLoading(false);
      } catch (e: any) {
        console.warn('⚠️ Supabase fetch failed, using mock data:', e.message);
        const nodesArray = Array.from(nodes.values());
        const nodesToUse = nodesArray.length > 0 ? nodesArray : generateMockNodes(200);
        const mockFlows = generateMockFlows(nodesToUse, 150);  // 150 flows for 200 nodes
        console.log('🔀 Generated', mockFlows.length, 'flows from', nodesToUse.length, 'nodes');
        set_flows(mockFlows);
        setLoading(false);
      }
    })();
    return () => { unsubscribe?.(); };
  }, [set_flows, nodes]);

  return { flows: Array.from(flows.values()), loading, error };
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const { incidents: initial } = await fetchIncidents({ limit: 100 });
        setIncidents(initial);
        setLoading(false);
        unsubscribe = subscribeToIncidents((updated) => setIncidents(updated));
      } catch {
        setLoading(false);
      }
    })();
    return () => { unsubscribe?.(); };
  }, []);

  return { incidents, loading };
}

export function useMacroIndicators() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { indicators: data } = await fetchMacroIndicators();
        setIndicators(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { indicators, loading };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
