import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  ViewMode,
  Node,
  Flow,
  CameraState,
  LayerKey,
  ChatMessage,
} from '@/types';

const DEFAULT_CAMERA: CameraState = {
  longitude: 8.6753,
  latitude: 9.0820,
  zoom: 5.5,
  pitch: 30,
  bearing: 0,
};

interface StoreState {
  // View
  active_view: ViewMode;
  set_view: (v: ViewMode) => void;

  // Camera
  camera: CameraState;
  set_camera: (c: Partial<CameraState>) => void;
  reset_camera: () => void;

  // Selection
  selected_node: string | null;
  set_selected_node: (id: string | null) => void;
  hovered_node: string | null;
  set_hovered_node: (id: string | null) => void;
  highlighted_nodes: Set<string>;
  set_highlighted_nodes: (ids: string[]) => void;
  clear_highlights: () => void;

  // Filters
  enabled_node_types: Set<string>;
  toggle_node_type: (type: string) => void;
  enabled_statuses: Set<string>;
  toggle_status: (status: string) => void;
  // Operator / Basin filters (for crude-oil specific views)
  enabled_operators: Set<string>;
  toggle_operator: (op: string) => void;
  enabled_basins: Set<string>;
  toggle_basin: (basin: string) => void;

  // Layers
  active_layers: Set<LayerKey>;
  toggle_layer: (layer: LayerKey) => void;

  // UI panels
  sidebar_open: boolean;
  toggle_sidebar: () => void;
  detail_panel_open: boolean;
  set_detail_panel_open: (open: boolean) => void;
  chat_open: boolean;
  toggle_chat: () => void;

  // Data
  nodes: Map<string, Node>;
  set_nodes: (nodes: Node[]) => void;
  flows: Map<string, Flow>;
  set_flows: (flows: Flow[]) => void;

  // AI / Jarvis
  ai_thinking: boolean;
  set_ai_thinking: (v: boolean) => void;
  chat_messages: ChatMessage[];
  add_chat_message: (msg: ChatMessage) => void;
  ai_focus_nodes: string[];
  set_ai_focus_nodes: (ids: string[]) => void;
}

export const useStore = create<StoreState>()(
  subscribeWithSelector((set) => ({
    active_view: 'map',
    set_view: (v) => set({ active_view: v }),

    camera: DEFAULT_CAMERA,
    set_camera: (c) => set((s) => ({ camera: { ...s.camera, ...c } })),
    reset_camera: () => set({ camera: DEFAULT_CAMERA }),

    selected_node: null,
    set_selected_node: (id) => set({ selected_node: id, detail_panel_open: id !== null }),
    hovered_node: null,
    set_hovered_node: (id) => set({ hovered_node: id }),
    highlighted_nodes: new Set(),
    set_highlighted_nodes: (ids) => set({ highlighted_nodes: new Set(ids) }),
    clear_highlights: () => set({ highlighted_nodes: new Set(), ai_focus_nodes: [] }),

    enabled_node_types: new Set([
      'refinery', 'upstream_field', 'terminal', 'jetty', 'pipeline',
      'retail_station', 'distribution_center', 'import_point', 'export_point', 'storage',
    ]),
    toggle_node_type: (type) =>
      set((s) => {
        const next = new Set(s.enabled_node_types);
        next.has(type) ? next.delete(type) : next.add(type);
        return { enabled_node_types: next };
      }),

    enabled_statuses: new Set(['operational', 'maintenance', 'shutdown', 'degraded', 'unknown']),
    toggle_status: (status) =>
      set((s) => {
        const next = new Set(s.enabled_statuses);
        next.has(status) ? next.delete(status) : next.add(status);
        return { enabled_statuses: next };
      }),

    enabled_operators: new Set<string>(),
    toggle_operator: (op) =>
      set((s) => {
        const next = new Set(s.enabled_operators);
        next.has(op) ? next.delete(op) : next.add(op);
        return { enabled_operators: next };
      }),

    enabled_basins: new Set<string>(),
    toggle_basin: (basin) =>
      set((s) => {
        const next = new Set(s.enabled_basins);
        next.has(basin) ? next.delete(basin) : next.add(basin);
        return { enabled_basins: next };
      }),

    active_layers: new Set<LayerKey>(['flows', 'anomalies']),
    toggle_layer: (layer) =>
      set((s) => {
        const next = new Set(s.active_layers);
        next.has(layer) ? next.delete(layer) : next.add(layer);
        return { active_layers: next };
      }),

    sidebar_open: true,
    toggle_sidebar: () => set((s) => ({ sidebar_open: !s.sidebar_open })),
    detail_panel_open: false,
    set_detail_panel_open: (open) => set({ detail_panel_open: open }),
    chat_open: false,
    toggle_chat: () => set((s) => ({ chat_open: !s.chat_open })),

    nodes: new Map(),
    set_nodes: (nodes) => set({ nodes: new Map(nodes.map((n) => [n.id, n])) }),
    flows: new Map(),
    set_flows: (flows) => set({ flows: new Map(flows.map((f) => [f.id, f])) }),

    ai_thinking: false,
    set_ai_thinking: (v) => set({ ai_thinking: v }),
    chat_messages: [],
    add_chat_message: (msg) => set((s) => ({ chat_messages: [...s.chat_messages, msg] })),
    ai_focus_nodes: [],
    set_ai_focus_nodes: (ids) => set({ ai_focus_nodes: ids }),
  }))
);
