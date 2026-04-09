# PMS Spatial Intelligence Platform - Frontend

**Palantir-level spatial intelligence visualization for Nigeria's petrochemical supply chain**

A hyper-realistic 3D map interface with god's-eye view of the entire supply chain from upstream extraction to retail distribution, powered by real-time data from Supabase and orchestrated by Jarvis AI.

---

## 🎯 Overview

This frontend application visualizes 1,415+ petrochemical facilities and 128+ connecting flows across Nigeria with:

- **Hyper-realistic flat 3D map** with state boundaries and tactical grid overlay
- **Real-time data streaming** from Supabase (live node status, flow volumes, incidents)
- **Interactive node selection** with detailed HUD overlay
- **Three integrated views**: End-to-End Map (geographic), Ecosystem (company network), Sankey (product flows)
- **Jarvis AI orchestration** for guided analysis and scene control
- **Tactical military aesthetic** with WCAG AAA dark mode compliance

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **3D Rendering** | Three.js r128 (WebGL) | Scene, lighting, geometries, particles |
| **UI Framework** | React 18.2 + Next.js 14 | Component orchestration, SSR |
| **State Management** | Zustand | Global app state (view, camera, selections) |
| **Backend Data** | Supabase (Postgres + PostGIS) | 1,731 records, real-time subscriptions |
| **Styling** | Tailwind CSS 3.3 | Design system (15+ colors, animations) |
| **Type Safety** | TypeScript 5.3 (strict) | Full-stack type definitions |
| **Geospatial** | Geolib + GeoJSON | Distance calcs, boundary geometry |

### Directory Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Next.js root layout
│   │   ├── page.tsx                # Entry component
│   │   └── globals.css             # Tailwind base + custom animations
│   ├── components/
│   │   ├── AppLayout.tsx           # Main UI container (viewport + sidebar)
│   │   ├── SelectedNodeHUD.tsx      # (inline) Tactical info overlay
│   │   └── RightSidebar.tsx        # (inline) Filter/layer panel
│   ├── 3d/
│   │   ├── Scene.ts                # VPScene class (Three.js initialization)
│   │   ├── ParticleSystem.ts       # (TBD) GPU-accelerated particles
│   │   └── CameraController.ts     # (TBD) Smooth animations
│   ├── lib/
│   │   └── supabase.ts             # Typed queries + subscriptions
│   ├── stores/
│   │   └── index.ts                # Zustand store (visualization state)
│   ├── hooks/
│   │   └── useData.ts              # Custom hooks (10+ functions)
│   └── types/
│       └── index.ts                # TypeScript definitions (20+ interfaces)
├── public/
│   └── data/                       # GeoJSON state boundaries (to add)
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── postcss.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase project with live data (1,415 nodes confirmed)
- Modern browser with WebGL support (Chrome, Firefox, Safari, Edge)

### Installation

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local with Supabase credentials
cp .env.local.example .env.local
# Edit .env.local and add:
#   NEXT_PUBLIC_SUPABASE_URL=...
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Start development server
npm run dev
# Open http://localhost:3000
```

### Development

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Production server
npm start

# Lint (if configured)
npm run lint
```

---

## 📊 Features

### ✅ Implemented

**Viewport & 3D Rendering**
- Flat 3D map of Nigeria with tactical grid overlay
- 1,415 facility markers with color-coded octahedron geometries
- Directional + ambient + point lighting for tactical aesthetic
- Node glow effects (animated pulse for operational facilities)
- 128+ flow lines with volume-based rendering width

**Real-time Data Integration**
- Supabase subscriptions for live node/flow/incident updates
- Typed queries for all 7 database tables
- Local Zustand cache with Map structure for O(1) lookups
- Error handling + loading states

**Interactivity**
- Click-to-select node with raycasting
- Tactical HUD overlay shows node details
- View mode selector (Map/Ecosystem/Sankey)
- Filter toggles for node types and statuses
- Layer toggles (5 layers: weather, AIS, news, anomalies, prices)

**UI/UX**
- Dark mode WCAG AAA compliant (all contrasts 7:1+)
- Custom animations (pulse-critical, pulse-caution, pulse-healthy)
- Glassmorphism panels with backdrop blur
- Right sidebar with toggle
- Loading indicators + data counters
- Monospace-first typography (IBM Plex Mono, Courier Prime)

**Design System**
- 15+ semantic colors (void-black, accent-cyan, alert-red, etc.)
- Keyframe animations (0.4s critical, 0.8s caution, 2s healthy, 3s normal)
- Responsive layout (desktop: 80/20 split, mobile: fullscreen)
- Custom Tailwind utilities (hud-glow, glass-panel, tactical-border)

### ⏳ Pending Implementation

**Views**
- [ ] Ecosystem View (force-directed company network graph)
- [ ] Sankey View (animated product flow diagram with timeline)

**AI Integration**
- [ ] Jarvis chat interface (messages, streaming responses)
- [ ] Scene guidance execution (camera moves, highlights)
- [ ] LLM-powered anomaly explanation and correlation analysis

**Effects & Polish**
- [ ] Particle system (flowing crude/products with physics)
- [ ] Camera orchestration (smooth transitions, collision detection)
- [ ] Level-of-Detail (LOD) culling for performance
- [ ] Occlusion culling (skip rendering hidden nodes)

**Data Layers**
- [ ] Weather overlay (cloud cover, wind patterns)
- [ ] AIS tracking (maritime vessel positions)
- [ ] News/media layer (supply chain events)
- [ ] Price heatmap (regional product pricing)
- [ ] Anomaly highlights (flagged incidents/disruptions)

**Advanced Features**
- [ ] Timeline scrubber (historical data replay)
- [ ] Export/reporting (PNG, PDF, CSV)
- [ ] Multi-language support
- [ ] Offline mode (cached data)

---

## 📖 Usage Guide

### View Modes

#### 1. End-to-End Map (Default)
Geographic visualization of all facilities and flows. Click any node to see details.

```
Controls:
- Click node → Select and show HUD
- Scroll → Zoom in/out
- Drag → Pan viewport
- ⚙️ CONTROLS → Toggle sidebar
```

#### 2. Ecosystem View (TBD)
Force-directed graph showing company relationships and ownership structure.

```
Features (pending):
- Interactive company nodes
- Edge thickness = deal value
- Color = sector (upstream, pipeline, retail)
- Hover → Show relationships
```

#### 3. Sankey View (TBD)
Animated flow diagram showing volume of products moving through each stage.

```
Features (pending):
- Horizontal bands = stages (upstream, terminal, market)
- Flow width = volume
- Timeline scrubber = temporal playback
- Color = product type (crude, refined, retail)
```

### Filters & Layers

**Node Type Filter**
- REFINERY, UPSTREAM_FIELD, TERMINAL, JETTY, PIPELINE, RETAIL_STATION, etc.
- Toggle in sidebar to show/hide facility types

**Status Filter**
- OPERATIONAL, MAINTENANCE, DOWN, UNKNOWN
- Filter incident areas or focus on active nodes

**Layer Toggles**
1. **AIS Tracking** — Maritime vessel positions (real-time)
2. **Weather** — Cloud cover, wind, storms
3. **News** — Supply chain disruption alerts
4. **Anomalies** — Flagged incidents in red
5. **Price Heatmap** — Regional product pricing gradient

### Node Interaction

Click any facility marker to reveal:
- **Facility Name** (e.g., "Warri Refinery")
- **Type** (e.g., REFINERY)
- **Status** (Operational / Maintenance / Down)
- **State & LGA** (Geographic location)
- **Capacity** (Barrels per day if applicable)
- **Coordinates** (Latitude / Longitude)
- **Connected Flows** (Inbound/outbound routes)

---

## 🔌 API Reference

### Supabase Client (`src/lib/supabase.ts`)

```typescript
// Fetch all nodes
const { nodes, error } = await fetchAllNodes();

// Fetch specific node
const { node, error } = await fetchNodeById('node-123');

// Fetch all flows
const { flows, error } = await fetchAllFlows();

// Get flows connected to a node
const { inbound, outbound } = await fetchFlowsForNode('node-123');

// Real-time subscriptions
const unsubscribe = subscribeToNodes((updatedNodes) => {
  console.log('Nodes updated:', updatedNodes);
});

// Search
const { nodes, error } = await searchNodes('warri');

// Update status
const { success } = await updateNodeStatus('node-123', 'maintenance');
```

### Custom Hooks (`src/hooks/useData.ts`)

```typescript
// Load nodes + subscribe to updates
const { nodes, loading, error } = useNodes();

// Load flows + subscribe
const { flows, loading, error } = useFlows();

// Get incidents with real-time updates
const { incidents, loading } = useIncidents();

// Animate camera smoothly
const { animating, animateToTarget } = useCameraAnimation(1000);
animateToTarget({ x: 5, y: 10, z: 15 });

// Get filtered visible nodes
const visibleNodes = useVisibleNodes(); // Only enabled types/statuses

// Get selected node data
const selectedNode = useSelectedNodeData();

// Get nodes connected to a specific node
const { upstream, downstream } = useConnectedNodes(nodeId);
```

### Zustand Store (`src/stores/index.ts`)

```typescript
import { useStore } from '@/stores';

const {
  // View state
  active_view, set_view,
  
  // Camera
  camera, set_camera, reset_camera,
  
  // Selection
  selected_node, set_selected_node,
  highlighted_nodes, add_highlight_node, clear_highlights,
  
  // Filters
  enabled_node_types, toggle_node_type_filter,
  enabled_flow_types, toggle_flow_type_filter,
  enabled_statuses, toggle_status_filter,
  
  // Layers
  active_layers, toggle_layer,
  
  // UI Panels
  chat_open, toggle_chat,
  controls_panel_open, toggle_controls_panel,
  hud_visible, toggle_hud,
  
  // Data
  nodes, flows, set_nodes, set_flows,
  
  // AI
  ai_thinking, set_ai_thinking
} = useStore();
```

### Three.js Scene (`src/3d/Scene.ts`)

```typescript
import VPScene from '@/3d/Scene';

// Initialize scene
const scene = new VPScene({
  canvas: canvasRef.current,
  initialCameraState: DEFAULT_CAMERA,
  onSceneReady: (scene, camera, renderer) => {
    console.log('Scene ready');
  }
});

// Add visual elements
scene.addNodeMarker('node-123', { x: 5, y: 10, z: 0.5 }, {
  color: new THREE.Color('#FFD700'),
  glow: true,
  scale: 1.5
});

scene.addFlowLine('flow-456', { x: 5, y: 10 }, { x: 8, y: 15 }, {
  color: new THREE.Color('#00D9FF'),
  width: 2
});

// Camera control
scene.setCameraPosition({ x: 0, y: 20, z: 25 }, { x: 9, y: 9.77, z: 0 }, 1000);

// Animation loop
scene.start((scene, camera) => {
  // Per-frame updates here
});

// Cleanup
scene.dispose();
```

---

## 🎨 Design System

### Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Void Black** | `#0A0E27` | Background (primary) |
| **Deep Charcoal** | `#1A1F3A` | Panels, secondary bg |
| **Accent Black** | `#0D0F1F` | Borders, subtle fills |
| **Accent Cyan** | `#00D9FF` | Primary action, highlights |
| **Accent Gold** | `#FFD700` | Crude oil, upstream |
| **Accent Teal** | `#1ABC9C` | Retail, distribution |
| **Accent Purple** | `#9D4EDD` | AI/Jarvis, synthetic |
| **Alert Red** | `#FF1744` | Critical alerts |
| **Caution Orange** | `#FFA500` | Warnings, maintenance |
| **Healthy Green** | `#00E676` | Operational, good |
| **Text Primary** | `#E8E8E8` | Main text |
| **Text Secondary** | `#A0A0A0` | Labels, help text |
| **Text Muted** | `#696969` | Disabled, subtle |

### Animations

```css
/* Critical (0.8s) - urgent alerts */
@keyframes pulse-critical { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* Caution (2s) - warnings */
@keyframes pulse-caution { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

/* Healthy (3s) - operational */
@keyframes pulse-healthy { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }

/* Glow effects (tailored by color) */
.animate-glow-cyan { filter: drop-shadow(0 0 8px rgba(0, 217, 255, 0.8)); }
.animate-glow-red { filter: drop-shadow(0 0 8px rgba(255, 23, 68, 0.8)); }
```

### Typography

| Context | Font | Size | Weight |
|---------|------|------|--------|
| **Headings** | Courier Prime | 24-32px | Bold |
| **Body Text** | IBM Plex Mono | 12-14px | Regular |
| **Chat** | Inter | 13-14px | Regular |
| **Labels** | IBM Plex Mono | 10-11px | Semibold |
| **Code** | Courier Prime | 10-12px | Regular |

---

## ⚡ Performance

### Optimizations Implemented

1. **WebGL Renderer**
   - High-performance mode (powerPreference: 'high-performance')
   - Shadow mapping enabled (PCFShadowShadowMap)
   - Linear color space for accurate rendering

2. **Data Caching**
   - Map structure for O(1) node/flow lookup
   - Zustand for client-side caching
   - Avoid refetching unchanged data

3. **Rendering**
   - Layer-based organization (mapLayer, nodeLayer, flowLayer, etc.)
   - Viewport frustum culling (Three.js default)
   - Ray casting for efficient click detection

### Pending Optimizations

- [ ] **Level-of-Detail (LOD)** — Reduce geometry at distance
- [ ] **Occlusion Culling** — Skip rendering hidden nodes
- [ ] **Virtual Scrolling** (sidebar) — For 1000+ items
- [ ] **Lazy Loading** — Load regions on-demand
- [ ] **Service Worker** — Offline support, caching

---

## 🐛 Troubleshooting

### Canvas Not Rendering
```
❌ Problem: Blank canvas, no 3D scene visible

✅ Solutions:
1. Check browser console (F12) for WebGL errors
2. Verify .env.local has NEXT_PUBLIC_SUPABASE_* keys
3. Ensure browser supports WebGL (latest Chrome/Firefox)
4. Try disabling hardware acceleration toggle
```

### Data Not Loading
```
❌ Problem: No nodes/flows visible, loading spinner

✅ Solutions:
1. Verify Supabase credentials in .env.local
2. Check Supabase Dashboard → Tables for data
3. Open DevTools → Network tab, check API calls
4. Look for CORS errors (check Supabase RLS policies)
```

### Performance Issues
```
❌ Problem: Slow FPS, stuttering, lag

✅ Solutions:
1. Open DevTools → Performance profiler, record 10s
2. Check for expensive operations (re-renders)
3. Reduce particle emission count
4. Disable unnecessary layers
5. Lower resolution on mobile
```

### Memory Leaks
```
❌ Problem: Memory usage growing over time

✅ Solutions:
1. Check for lingering setTimeout/setInterval
2. Unsubscribe from Zustand/Supabase on unmount
3. Dispose Three.js geometries/materials properly
4. Use DevTools → Memory profiler, take heap snapshots
```

---

## 📚 Further Reading

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [React 18 Documentation](https://react.dev)
- [Three.js Manual](https://threejs.org/docs)
- [Supabase Reference](https://supabase.com/docs)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Related Files
- Backend data: `/home/abimbola/Desktop/PMS_visualization/` (CSV, Supabase scripts)
- Design system: `tailwind.config.ts` (colors, animations)
- Type definitions: `src/types/index.ts` (20+ interfaces)
- Environment: `.env.local.example` (template)

---

## 📝 License

Part of the PMS (Pipeline Management System) Spatial Intelligence Platform initiative.

---

## 🤝 Contributing

To add new features:

1. Create a feature branch
2. Follow TypeScript strict mode
3. Add types to `src/types/index.ts`
4. Use Zustand for global state
5. Test with real Supabase data
6. Verify dark mode contrast (WCAG AAA)

---

## 🚀 Next Steps

1. **Run the app**: `npm run dev`
2. **Load initial data**: Check console for success messages
3. **Test interactions**: Click nodes, toggle filters
4. **Implement Ecosystem view**: Use D3-Force for company graph
5. **Add Sankey view**: Implement animated flow diagram
6. **Build Jarvis AI**: Chat interface + LLM integration
7. **Add particle system**: Flowing product visualization
8. **Optimize performance**: LOD, occlusion culling

---

**Built with ❤️ for Nigerian petrochemical visualization**
