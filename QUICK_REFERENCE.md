# ⚡ Quick Reference Card - PMS Spatial Intelligence Frontend

## 🚀 Quick Start (Copy & Paste)

```bash
# 1. Install
cd frontend
npm install

# 2. Configure (get keys from Supabase dashboard)
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

# 3. Run
npm run dev
# Open http://localhost:3000
```

---

## 📁 Core Files Map

| What You Want | File | Function |
|---------------|------|----------|
| Global state | `src/stores/index.ts` | `useStore()` |
| Data from Supabase | `src/lib/supabase.ts` | `fetchAllNodes()`, `subscribeToNodes()` |
| React hooks for data | `src/hooks/useData.ts` | `useNodes()`, `useFlows()`, etc |
| 3D scene | `src/3d/Scene.ts` | `VPScene` class |
| Main UI | `src/components/AppLayout.tsx` | AppLayout component |
| Type definitions | `src/types/index.ts` | All domain interfaces |
| Styling | `tailwind.config.ts` | Colors, animations |
| Entry point | `src/app/page.tsx` | Home page |

---

## 🎯 Common Tasks

### **Add a New Node Marker**
```typescript
// In AppLayout.tsx, inside the render Three.js effect:
sceneRef.current?.addNodeMarker(
  'unique-id',
  { x: 5, y: 10, z: 0.5 },
  {
    color: new THREE.Color('#FFD700'),
    glow: true,
    scale: 1.5
  }
);
```

### **Fetch Data from Supabase**
```typescript
import { fetchAllNodes, subscribeToNodes } from '@/lib/supabase';

// Single fetch
const { nodes, error } = await fetchAllNodes();

// Real-time subscription
const unsubscribe = subscribeToNodes((updatedNodes) => {
  console.log('Nodes updated:', updatedNodes);
});
```

### **Update Global State**
```typescript
import { useStore } from '@/stores';

const { selected_node, set_selected_node, active_view, set_view } = useStore();

// Update
set_selected_node('node-123');
set_view('ecosystem');
```

### **Add Camera Animation**
```typescript
import { useCameraAnimation } from '@/hooks/useData';

const { animateToTarget } = useCameraAnimation(1000); // 1s duration
animateToTarget({ x: 5, y: 10, z: 15 });
```

### **Add a Custom Hook**
```typescript
// In src/hooks/useData.ts:
export function useMyCustomData() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Your logic here
  }, []);
  
  return { data };
}

// Use it in components:
const { data } = useMyCustomData();
```

### **Styled Component with Tailwind**
```typescript
<div className="px-4 py-2 bg-deep-charcoal text-accent-cyan rounded border border-accent-cyan">
  Tactical Panel
</div>
```

### **Add Animation**
```typescript
// In globals.css, add to @keyframes
@keyframes my-animation {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// In tailwind.config.ts, add to animations
myAnimation: 'my-animation 2s ease-in-out infinite',

// Use
<div className="animate-myAnimation">Animated text</div>
```

---

## 🎨 Color Reference

```typescript
// Use Tailwind color classes
bg-void-black          // Primary background
bg-deep-charcoal       // Secondary panels
text-accent-cyan       // Primary highlight
text-accent-gold       // Crude oil
text-accent-teal       // Retail
text-alert-red         // Alerts
text-accent-green      // Operational
text-alert-orange      // Caution
```

---

## 🔌 API Reference (Most Used)

### **Supabase**
```typescript
fetchAllNodes()                    // Node[]
fetchAllFlows()                    // Flow[]
fetchIncidents({ limit: 100 })    // Incident[]
subscribeToNodes(callback)         // unsubscribe()
updateNodeStatus(nodeId, status)  // { success }
```

### **Custom Hooks**
```typescript
useNodes()                         // { nodes, loading, error }
useFlows()                         // { flows, loading, error }
useIncidents()                     // { incidents, loading, error }
useVisibleNodes()                  // Node[] (filtered)
useSelectedNodeData()              // Node | null
useCameraAnimation(1000)           // { animating, animateToTarget }
```

### **Zustand Store**
```typescript
useStore()  // returns entire state + setters
// setters: set_selected_node(), set_view(), toggle_layer(), etc.
```

### **Three.js Scene**
```typescript
scene.addNodeMarker(id, pos, options)
scene.addFlowLine(id, startPos, endPos, options)
scene.setCameraPosition(pos, target, duration)
scene.start(renderCallback)
scene.dispose()
```

---

## 🐛 Debug

```bash
# Type check
npm run type-check

# Build (catches errors)
npm run build

# Dev with verbose logging
DEBUG=* npm run dev

# Check DevTools
F12 → Console (errors)
F12 → Network (API calls)
F12 → Performance (FPS, memory)
```

---

## 📊 File Sizes (Approximate)

| File | Size |
|------|------|
| `src/stores/index.ts` | ~10 KB |
| `src/lib/supabase.ts` | ~8 KB |
| `src/hooks/useData.ts` | ~7 KB |
| `src/3d/Scene.ts` | ~12 KB |
| `src/components/AppLayout.tsx` | ~15 KB |
| `src/types/index.ts` | ~5 KB |
| **Total raw**: | **~57 KB** |
| **After minify**: | ~15 KB |
| **After gzip**: | ~5 KB |

---

## 🚀 Performance Tips

1. **Reduce node rendering**: Use LOD
2. **Cache Data**: Zustand Map structure = O(1) lookup
3. **Optimize shaders**: Use GLSL, avoid branching
4. **Lazy load**: Only load regions as needed
5. **Profile**: Use DevTools Performance tab

---

## 🎯 Keyboard Shortcuts (Ready to Add)

```
(Not yet implemented - suggested)
ESC    → Deselect node
Space  → Reset camera
R      → Reset all filters
E      → Toggle ecosystem view
S      → Toggle sankey view
H      → Toggle HUD visibility
Ctrl+C → Open chat (Jarvis)
```

---

## 💾 Data Model (Types)

```typescript
// From src/types/index.ts
Node {
  id: string
  name: string
  node_type: NodeType  // "REFINERY" | "TERMINAL" | etc
  latitude: number
  longitude: number
  status: NodeStatus   // "operational" | "maintenance" | etc
  capacity_bpd?: number
}

Flow {
  id: string
  source_node_id: string
  destination_node_id: string
  transport_mode: "PIPELINE" | "VESSEL" | "TRUCK" | "RAIL"
  product_type: ProductType  // "CRUDE_OIL" | "REFINED_PRODUCT" | etc
  volume_bpd: number
  status: string
}

Node Types: 9 total
- REFINERY, UPSTREAM_FIELD, TERMINAL, JETTY, PIPELINE,
  RETAIL_STATION, DISTRIBUTION_CENTER, IMPORT_POINT, EXPORT_POINT
```

---

## 🔑 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Optional (for Jarvis)
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# Feature flags (optional)
NEXT_PUBLIC_ENABLE_3D_PARTICLES=true
NEXT_PUBLIC_ENABLE_JARVIS=true
```

---

## 📞 Quick Help

| Problem | Solution |
|---------|----------|
| "Cannot find Supabase" | Check .env.local has keys |
| "Canvas not rendering" | Check browser console for WebGL errors |
| "No data showing" | Verify Supabase has data (1,415 nodes) |
| "Slow performance" | Reduce node count with LOD |
| "Types error" | Run `npm run type-check` |
| "Build fails" | Run `npm install` again, delete node_modules |

---

## 🎬 Common Import Patterns

```typescript
// State
import { useStore } from '@/stores';

// Data hooks
import { useNodes, useFlows, useIncidents } from '@/hooks/useData';

// Supabase
import { fetchAllNodes, subscribeToNodes } from '@/lib/supabase';

// Types
import { Node, Flow, ViewMode, NodeType } from '@/types';

// Three.js
import * as THREE from 'three';

// Components
import AppLayout from '@/components/AppLayout';
```

---

## 📈 Scaling Guide

Current MVP: 1,415 nodes, 128 flows

| Scale | LOD Strategy | Expected FPS |
|-------|--------------|--------------|
| 1K nodes | None | 60 |
| 5K nodes | Basic LOD | 45 |
| 10K nodes | Aggressive LOD + occlusion | 30 |
| 100K nodes | Instancing + tiling | 24 |

Use LOD by reducing render quality at distance, occlusion culling for hidden geometry.

---

## 🎓 Resources

- **Three.js**: https://threejs.org/docs (official reference)
- **React**: https://react.dev (official docs)
- **Next.js**: https://nextjs.org/docs (official docs)
- **Supabase**: https://supabase.com/docs (official docs)
- **Zustand**: https://github.com/pmndrs/zustand (GitHub)
- **Tailwind**: https://tailwindcss.com/docs (official docs)

---

## ✨ Quick Wins (Easy To Implement)

```
☐ Add more color themes (e.g., light mode)
☐ Export viewport as PNG
☐ Add keyboard shortcuts
☐ Toggle button labels in sidebar
☐ Add timestamp to incidents
☐ Show node capacity in percentage bar
☐ Add mini-map in corner
☐ Search functionality for node finder
```

---

**Last Updated:** Session {date}
**Status:** Production Ready for Testing

🚀 **Ready to launch?** `npm run dev`
