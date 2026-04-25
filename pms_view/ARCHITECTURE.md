# 🏗️ Frontend Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────╗
│                         BROWSER VIEWPORT                                │
│                                                                          │
│  ┌──────────────────────────────────────┐  ┌────────────────────────┐  │
│  │       NEXT.JS / REACT LAYER          │  │   THREE.JS 3D LAYER   │  │
│  │                                      │  │                        │  │
│  │  ┌─────────────────────────────────┐ │  │ ┌──────────────────┐  │  │
│  │  │  AppLayout.tsx (Main Container) │ │  │ │  VPScene class   │  │  │
│  │  │  ├─ Top HUD Bar                 │ │  │ ├─ Renderer       │  │  │
│  │  │  │  └─ View Selector            │ │  │ ├─ Camera         │  │  │
│  │  │  ├─ Canvas (80% width)          │ │  │ ├─ Lighting       │  │  │
│  │  │  │  └─ Three.js Scene           │ │  │ ├─ Terrain        │  │  │
│  │  │  │     └─ Node Markers          │ │  │ ├─ Grid           │  │  │
│  │  │  │     └─ Flow Lines            │ │  │ ├─ Layers         │  │  │
│  │  │  │     └─ HUD Overlays          │ │  │ ├─ Node Markers   │  │  │
│  │  │  ├─ RightSidebar (20% width)    │ │  │ ├─ Flow Lines     │  │  │
│  │  │  │  ├─ Filters Panel            │ │  │ └─ Ray Casting    │  │  │
│  │  │  │  ├─ Layers Panel             │ │  └──────────────────┘  │  │
│  │  │  │  └─ Legend                   │ │                        │  │
│  │  │  └─ SelectedNodeHUD (overlay)   │ │                        │  │
│  │  └─────────────────────────────────┘ │                        │  │
│  └──────────────────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

                    ↓ ↓ ↓ (Data Flow)

┌─────────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT (ZUSTAND)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  useStore()  (Zustand with subscribeWithSelector)                │  │
│  │                                                                  │  │
│  │  Visualization State:                                           │  │
│  │  ├─ active_view, camera, selected_node, highlighted_nodes      │  │
│  │  ├─ enabled_node_types, enabled_flow_types, enabled_statuses   │  │
│  │  ├─ active_layers, time_range                                  │  │
│  │                                                                  │  │
│  │  UI State:                                                      │  │
│  │  ├─ chat_open, controls_panel_open, hud_visible                │  │
│  │                                                                  │  │
│  │  Real-time Data:                                               │  │
│  │  ├─ nodes (Map<id, Node>), flows (Map<id, Flow>)               │  │
│  │  └─ AI state (thinking, scene_guidance, orchestrating)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

                    ↓ ↓ ↓ (Data Flow)

┌─────────────────────────────────────────────────────────────────────────┐
│                  REACT HOOKS LAYER (useData.ts)                          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  useNodes()     │  │  useFlows()     │  │  useIncidents() │  │
│  │  ├─ Fetch       │  │  ├─ Fetch       │  │  ├─ Fetch       │  │
│  │  ├─ Subscribe   │  │  ├─ Subscribe   │  │  ├─ Subscribe   │  │
│  │  └─ Cache       │  │  └─ Cache       │  │  └─ Cache       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │  useCameraAnimation()  │  │  useVisibleNodes()     │                 │
│  │  ├─ Smooth easing      │  │  ├─ Filter by type     │                 │
│  │  └─ Duration control   │  │  └─ Filter by status   │                 │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
│  + useSelectedNodeData(), useConnectedNodes(), useDebounce(),           │
│    useViewportSize(), useIsMobile()                                     │
└─────────────────────────────────────────────────────────────────────────┘

                    ↓ ↓ ↓ (Data Flow)

┌─────────────────────────────────────────────────────────────────────────┐
│              SUPABASE CLIENT & INTEGRATION (supabase.ts)                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Query Functions:                                                │  │
│  │  ├─ fetchAllNodes()        → 1,415 facilities                    │  │
│  │  ├─ fetchAllFlows()        → 128+ routes                         │  │
│  │  ├─ fetchIncidents()       → Supply chain events                 │  │
│  │  ├─ fetchMacroIndicators() → Industry metrics                    │  │
│  │  ├─ searchNodes()          → Text search                         │  │
│  │  ├─ updateNodeStatus()     → Update facility status              │  │
│  │  └─ loadInitialData()      → Batch load startup data             │  │
│  │                                                                  │  │
│  │  Real-time Subscriptions:                                       │  │
│  │  ├─ subscribeToNodes()     → Node changes                        │  │
│  │  ├─ subscribeToFlows()     → Flow changes                        │  │
│  │  └─ subscribeToIncidents() → New incidents                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

                    ↓ ↓ ↓ (Data Flow)

┌─────────────────────────────────────────────────────────────────────────┐
│                   BACKEND: SUPABASE (Cloud)                              │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Database Tables (Postgres + PostGIS):                           │  │
│  │                                                                  │  │
│  │  ├─ nodes             (1,415 records) ← Geocoded facilities     │  │
│  │  ├─ flows             (128 records)   ← Product routes          │  │
│  │  ├─ node_metrics      (18 records)    ← Time-series data        │  │
│  │  ├─ macro_indicators  (74 records)    ← Industry KPIs           │  │
│  │  ├─ incidents_and_events (40)         ← Supply chain events     │  │
│  │  ├─ international_shipments (40)      ← Export/import          │  │
│  │  └─ rag_documents     (16 records)    ← Regulations/docs       │  │
│  │                                                                  │  │
│  │  Total: 1,731 records live in production                         │  │
│  │  Real-time Updates: WebSocket subscriptions active               │  │
│  │  Authentication: Row-Level Security (RLS) policies enabled       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
<RootLayout>
  ├─ <body>
  │  └─ <Home> (page.tsx)
  │     └─ <AppLayout>
  │        ├─ Top HUD Bar
  │        │  ├─ Title
  │        │  ├─ View Selector (Map/Ecosystem/Sankey)
  │        │  └─ Controls Toggle
  │        ├─ Main Content Area
  │        │  ├─ Viewport (80%)
  │        │  │  ├─ <canvas> (Three.js Scene)
  │        │  │  ├─ Loading Indicator
  │        │  │  ├─ Data Counter
  │        │  │  └─ <SelectedNodeHUD> (overlay)
  │        │  └─ RightSidebar (20%, conditional)
  │        │     └─ <RightSidebar>
  │        │        ├─ Filters Panel
  │        │        │  └─ Node Type Toggles
  │        │        ├─ Layers Panel
  │        │        │  └─ Layer Toggles
  │        │        └─ Legend
```

---

## Data Flow (Key Interactions)

### 1. **Initial Load**
```
App Mounts → useNodes() hook fires
         → fetchAllNodes() from Supabase
         → Store updates (set_nodes)
         → AppLayout rerenders
         → Three.js renders node markers
         → subscribeToNodes() activates
         → Real-time updates active
```

### 2. **User Clicks Node**
```
Canvas Click → handleCanvasClick()
          → screenToRay() (Three.js raycasting)
          → getIntersections() with nodeLayer
          → Found object.userData.nodeId
          → set_selected_node(nodeId)
          → Zustand store updates
          → AppLayout rerenders
          → <SelectedNodeHUD> appears (overlay)
```

### 3. **User Toggles Filter**
```
Click Filter Toggle → toggle_node_type_filter()
                  → Zustand store updates
                  → useVisibleNodes() updates (derived state)
                  → AppLayout rerenders
                  → Three.js flow clears nodes
                  → Re-renders with filtered nodes
```

### 4. **Real-time Data Update**
```
Supabase Data Changes → WebSocket notification received
                     → subscribeToNodes() callback fires
                     → set_nodes() updates store
                     → AppLayout rerenders
                     → Three.js updates scene
                     → Glow effect optional on changed node
```

### 5. **Switch View Mode**
```
Click View Button (Map/Ecosystem/Sankey) → set_view()
                                        → Zustand updates active_view
                                        → AppLayout checks active_view
                                        → Conditionally renders correct view
                                        → (Ecosystem/Sankey views TBD)
```

---

## State Dependencies

```
┌─────────────────────────────────────────────────────────┐
│ STORE (Zustand)                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ selected_node ──→┐                                     │
│ nodes Map       ├──→ useSelectedNodeData()            │
│ flows Map       ┤    (derived hook)                   │
│                 ↓                                       │
│            SelectedNodeHUD rendered                    │
│                                                         │
│ enabled_node_types ──→┐                               │
│ enabled_flow_types   ├──→ useVisibleNodes()           │
│ enabled_statuses      ┤    useVisibleFlows()          │
│                       ↓    (derived hooks)             │
│                  Sidebar Filters UI                    │
│                  Canvas Rendering                      │
│                                                         │
│ active_layers ──────→ RightSidebar Layer Toggles      │
│                                                         │
│ camera ────────────→ Three.js Camera Position         │
│ animation ─┬────→ Camera smoothing                    │
│ active_view ┤      View switching logic                │
│             └─→ Conditional render (Map/Trio/Sankey)  │
│                                                         │
│ hud_visible ────────→ Conditional HUD visibility       │
│ controls_panel_open → Conditional Sidebar visibility   │
│                                                         │
│ nodes Map ────┐                                        │
│ flows Map     ├──→ Three.js Scene rendering           │
│ selected_node ┤    (node/flow markers/lines)          │
│               └──→ Data counter display               │
│                                                         │
│ ai_thinking ────────→ AI UI state (TBD)               │
│ ai_scene_guidance ──→ Scene orchestration (TBD)       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## File Dependency Graph

```
src/app/page.tsx (Entry)
    ↓
src/app/layout.tsx (Root)
    ↓
src/components/AppLayout.tsx
    ├─ imports src/stores/index.ts
    ├─ imports src/hooks/useData.ts
    │   ├─ imports src/lib/supabase.ts
    │   ├─ imports src/types/index.ts
    │   └─ imports src/stores/index.ts
    ├─ imports src/3d/Scene.ts
    │   └─ imports three
    └─ imports src/types/index.ts

src/hooks/useData.ts
    ├─ imports src/lib/supabase.ts
    ├─ imports src/types/index.ts
    └─ imports src/stores/index.ts

src/lib/supabase.ts
    ├─ imports @supabase/supabase-js
    └─ imports src/types/index.ts

src/stores/index.ts
    ├─ imports zustand
    └─ imports src/types/index.ts

src/3d/Scene.ts
    └─ imports three

src/types/index.ts (No imports)

tailwind.config.ts
postcss.config.js
tsconfig.json
next.config.js
```

---

## Threading & Async Operations

```
┌─────────────────────────────────────────────────────────────┐
│              ASYNC OPERATION TIMELINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [0ms]    Page loads                                         │
│          Next.js hydrates                                   │
│          Components mount                                   │
│                                                              │
│ [50ms]   useNodes() hook fires                              │
│          fetchAllNodes() starts (HTTP GET to Supabase)      │
│          Three.js scene initializes                         │
│                                                              │
│ [200ms]  Supabase response arrives (1,415 nodes)           │
│          set_nodes() updates store                          │
│          AppLayout rerenders                                │
│          subscribeToNodes() activates (WebSocket)           │
│                                                              │
│ [250ms]  Canvas rerenders with node markers               │
│          Scene is interactive                               │
│                                                              │
│ [300-∞]  Real-time updates received                         │
│          (Whenever Supabase data changes)                   │
│          Canvas updates smoothly                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
Data Load
    ↓
[Try Block]
    ├─ Success → Store data → Render
    │
    └─ Error → Catch block
        ↓
    Log to console
        ↓
    Set error state
        ↓
    Display error message
        ↓
    Allow user to retry
```

---

## Performance Optimization Layers

### Current (Implemented)
```
✅ Zustand Map structure
   └─ O(1) node/flow lookup by ID

✅ Layer-based Three.js organization
   └─ Efficient culling by layer visibility

✅ Ray casting for click detection
   └─ Only relevant nodes checked

✅ Batch loading (loadInitialData)
   └─ Single parallel request for startup data
```

### Pending (To Implement)
```
⏳ Level-of-Detail (LOD)
   └─ Reduce geometry at distance

⏳ Occlusion Culling
   └─ Skip rendering hidden nodes

⏳ Virtual Scrolling (Sidebar)
   └─ Only render visible items

⏳ Lazy Loading (Regions)
   └─ Load data on-demand as user pans

⏳ Instance Rendering
   └─ GPU batching of 1000+ similar objects

⏳ WebGL 2.0 Features
   └─ Transform feedback, shared textures
```

---

## Browser API Usage

```
DOM
├─ Canvas element (Three.js render target)
├─ Event listeners (click, resize)
└─ DevTools (console, performance profiler)

WebGL
├─ Shader compilation & linking
├─ Texture binding
├─ Buffer management
└─ Render pipeline

Local Storage / Session Storage (TBD)
└─ Cache filters, view mode, camera position

WebSocket (Supabase)
└─ Real-time data subscriptions

IndexedDB (TBD)
└─ Offline data caching
```

---

## Security Considerations

```
Authentication
└─ Supabase service role for backend (backend only)
└─ Anon key for frontend (read-only, RLS enforced)

Authorization
└─ Row-Level Security (RLS) policies in Supabase
└─ User can only see public data

Data Transmission
└─ HTTPS enforced (Supabase)
└─ WSS WebSocket encryption

Secrets Management
└─ Supabase keys in .env.local (NOT committed to git)
└─ .env.local added to .gitignore
```

---

## Deployment Architecture

```
Development
└─ npm run dev
   └─ localhost:3000
   └─ Fast rebuild on changes

Production Build
└─ npm run build
   └─ Tree-shaking
   └─ Code splitting
   └─ Asset optimization

Production Server (Multiple Options)
├─ Vercel (recommended for Next.js)
├─ Docker Container
├─ Traditional Node.js server
└─ All run "npm start"
```

---

## Testing Strategy (TBD)

```
Unit Tests
└─ Hook logic (useData, custom hooks)
└─ Supabase query functions
└─ Zustand store mutations

Integration Tests
└─ Component + store interactions
└─ Supabase data loading
└─ Error handling

E2E Tests
└─ Full user workflow (load → click → filter)
└─ Canvas rendering verification
└─ Real-time updates

Performance Tests
└─ FPS monitoring (60 target)
└─ Memory usage (stable over time)
└─ Bundle size (gzip)
```

---

**Architecture finalized and ready for implementation** 🏗️✨
