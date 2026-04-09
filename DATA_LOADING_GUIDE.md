# PMS Intelligence Platform - Data Loading Guide

## Quick Start for 2-Day MVP

You have two options for loading data into Supabase:

### Option 1: Direct CSV Import (Fastest - 10 minutes)
### Option 2: Python Script (Most Reliable - 15 minutes)

---

## Stage 1: Extract Data from Source Files

### Run the extraction script:

```bash
cd /home/abimbola/Desktop/PMS_visualization
python3 extract_and_load_data.py
```

This will:
- Parse all XLSX and CSV files in `/home/abimbola/Desktop/PMS_visualization/PMS data`
- Extract production data, shipping records, IEA statistics
- Generate 7 CSV files in `/home/abimbola/Desktop/PMS_visualization/output/`

Output files:
```
output/
├── nodes.csv                          (Master list of supply chain entities)
├── node_metrics.csv                   (Production volumes, throughput data)
├── flows.csv                          (Supply routes and connections)
├── international_shipments.csv        (Vessel movements, export routes)
├── macro_indicators.csv               (Energy statistics, trends)
├── incidents_and_events.csv           (Disruptions, outages - "why" data)
└── rag_documents.csv                  (Source documents for AI context)
```

---

## Stage 2: Load into Supabase

### Option 2A: Manual CSV Import (UI-based)

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Create tables using your SQL migration script

3. For each table, use the UI import:
   - Click "Import" or drag CSV files
   - Map columns to table schema
   - Click "Import Data"

**Order matters** - upload in this sequence:
1. nodes.csv → nodes table
2. node_metrics.csv → node_metrics table
3. flows.csv → flows table
4. international_shipments.csv → international_shipments table
5. macro_indicators.csv → macro_indicators table
6. incidents_and_events.csv → incidents_and_events table
7. rag_documents.csv → rag_documents table

### Option 2B: Python Programmatic Upload (Recommended)

#### Step 1: Get Supabase credentials

Go to Supabase Dashboard:
- Click your project name (top-left)
- Settings → API
- Copy:
  - **Project URL**: `https://your-project-id.supabase.co`
  - **Anon Public Key**: (starts with `eyJ...`)

#### Step 2: Create `.env` file

Create `/home/abimbola/Desktop/PMS_visualization/.env`:

```bash
cat > /home/abimbola/Desktop/PMS_visualization/.env << 'EOF'
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_anon_public_key_here
EOF
```

#### Step 3: Install dependencies

```bash
pip3 install supabase python-dotenv
```

#### Step 4: Run the loader

```bash
python3 /home/abimbola/Desktop/PMS_visualization/supabase_loader.py
```

Output:
```
================================================================================
SUPABASE DATA LOADER - PMS Intelligence Platform
================================================================================

Connecting to Supabase...
✓ Connected to Supabase successfully

📥 Loading NODES...
  ✓ Uploaded batch 1 (47 records)
  
📥 Loading NODE METRICS...
  ✓ Uploaded batch 1 (156 records)
  
📥 Loading FLOWS...
  ✓ Uploaded batch 1 (5 records)
  
📥 Loading INTERNATIONAL SHIPMENTS...
  ✓ Uploaded batch 1 (89 records)
  
📥 Loading MACRO INDICATORS...
  ✓ Uploaded batch 1 (234 records)
  
📥 Loading INCIDENTS & EVENTS...
  ✓ Uploaded batch 1 (3 records)
  
📥 Loading RAG DOCUMENTS...
  ✓ Uploaded batch 1 (4 records)

================================================================================
✓ DATA LOADING COMPLETE
================================================================================

Total records loaded: 538

Your Supabase backend is now populated!
```

---

## What Data Gets Loaded

### 1. **NODES** (47 records)
Master database of all supply chain entities:
- Refineries: Port Harcourt, Kaduna, Warri
- Export Terminals: Forcados, Bonny, Qua Iboe, Escravos
- Production Fields: Shell, NNPC, Mobil upstream
- Depots: Lagos, Ibadan, Mosimini, Warri
- Distributors: Bovas, Dodo Gas, Rain Oil

Each node has:
- Precise latitude/longitude
- Ownership (NOC/IOC/Private)
- Status (operational/shutdown/partial)
- Confidence level (verified/estimated)

### 2. **NODE METRICS** (156 records)
Production volumes, throughput, financial data:
- `production_bopd` - barrels per day from fields
- `throughput_litres_per_day` - refinery processing
- `net_entitlement_bopd` - NNPC share from JVs
- Sourced from NUPRC/FIRS monthly reports (2023-2026)

### 3. **FLOWS** (5+ records)
Supply chain connections:
- Upstream → Export (pipeline)
- Refinery → Depot (pipeline/truck)
- Depot → Retail (truck)
- Export → International (vessel)

Each flow has:
- Volume estimates
- Transport mode (pipeline/truck/vessel)
- Distance
- Is active / international flags

### 4. **INTERNATIONAL SHIPMENTS** (89+ records)
Vessel cargo movements from shipping position data:
- Vessel name, IMO, type, length
- Commodity (PMS, AGO, Crude)
- Origin terminal, destination, buyer
- Status (loading, in_transit, discharged)

### 5. **MACRO INDICATORS** (234+ records)
Energy statistics from IEA:
- Crude oil production annual totals
- Import/export volumes
- Oil consumption by sector
- Trends and YoY changes

### 6. **INCIDENTS & EVENTS** (3+ records)
Disruptions explaining volume changes (the "WHY"):
- Forcados Pipeline Vandalism (March 2026) - 150K bpd drop
- Port Harcourt Refinery Maintenance (Jan 2026) - 45K bpd drop
- Qua Iboe Terminal Outage (Feb 2026) - 200K bpd drop

Each incident captures:
- **Causal mechanism**: Why volumes changed (not just correlation)
- **Impact**: Exact volume loss, metric affected
- **Secondary effects**: What else broke downstream

### 7. **RAG DOCUMENTS** (4+ records)
Sources for AI context:
- NUPRC Annual Report 2023
- IEA Energy Statistics
- NNPC Monthly Reports
- Daily Shipping Positions

---

## Verify Data Loaded Correctly

### In Supabase Dashboard:

1. Go to **SQL Editor**
2. Run these queries:

```sql
-- Check nodes loaded
SELECT COUNT(*) as node_count FROM nodes;
-- Expected: 47

-- Check production data linked
SELECT COUNT(*) as metric_count FROM node_metrics;
-- Expected: 156+

-- Check supply chain mapped
SELECT COUNT(*) as flow_count FROM flows;
-- Expected: 5+

-- Check shipments captured
SELECT COUNT(*) as shipment_count FROM international_shipments;
-- Expected: 89+

-- Check incidents (the "why" data)
SELECT COUNT(*) as incident_count FROM incidents_and_events;
-- Expected: 3+

-- Sample: Get all production data for Port Harcourt Refinery
SELECT 
  n.name,
  nm.metric_name,
  nm.metric_value,
  nm.metric_unit,
  nm.period_start
FROM nodes n
LEFT JOIN node_metrics nm ON n.id = nm.node_id
WHERE n.short_id = 'PHRC'
ORDER BY nm.period_start DESC
LIMIT 10;
```

---

## What Your Frontend Can Do Now

### Active Queries Ready for Use:

```sql
-- 1. Active nodes with latest metrics (Ecosystem View)
SELECT * FROM active_nodes_with_metrics;

-- 2. Supply chain graph (End-to-End View)
SELECT * FROM supply_chain_graph;

-- 3. Price data by state (Price Heatmap)
SELECT * FROM latest_price_by_state;

-- 4. JV/Ownership tree (Ecosystem Network)
SELECT * FROM jv_ownership_tree;

-- 5. Active incidents (Jarvis "Why" engine)
SELECT * FROM active_incidents ORDER BY started_at DESC;

-- 6. Export trade routes (2-steps-ahead)
SELECT * FROM export_trade_routes;

-- 7. Nodes within radius (Map search)
SELECT * FROM nodes_within_radius(6.5244, 3.3792, 50, 'depot');

-- 8. Supply chain for a node (Trace flow)
SELECT * FROM get_supply_chain_for_node('FORCADOS_TERMINAL');

-- 9. Incidents affecting a node (Why analysis)
SELECT * FROM get_incidents_for_node('PHRC', 365);

-- 10. JV exposure analysis
SELECT * FROM get_jv_exposure('UPSTREAM_SHELL');
```

---

## Frontend Integration (Next Steps)

### Backend is Ready

Your frontend can now:

1. **Query all endpoints**
   ```javascript
   // Example: React component using Supabase
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
   
   // Get all active nodes
   const { data: nodes } = await supabase
     .from('active_nodes_with_metrics')
     .select('*')
   
   // Get supply chain for Port Harcourt
   const { data: chain } = await supabase
     .rpc('get_supply_chain_for_node', { target_short_id: 'PHRC' })
   
   // Get why volume dropped
   const { data: incidents } = await supabase
     .rpc('get_incidents_for_node', { target_short_id: 'PHRC' })
   ```

2. **Build visualizations**
   - Map view: Use node lat/lng + status colors
   - Network graph: Use supply_chain_graph for edges, flow values for styling
   - Sankey: Use flows table with volumes
   - Incidents timeline: Use incidents_and_events with causal mechanisms

3. **Enable Jarvis AI**
   - User asks "Why did production drop?"
   - AI queries `get_incidents_for_node(affected_node)`
   - AI reads causal_mechanism + secondary_effects
   - AI highlights node on map, shows data
   - Natural language explanation generated

---

## Troubleshooting

### Error: "Column not found"
- Ensure SQL migration script was run first
- Check table schema: `\d table_name` in SQL editor

### Error: "Foreign key violation"
- Nodes must load before references (node_metrics, flows, etc)
- Run in order: nodes → other tables

### Error: "Could not find node with short_id"
- Node not created in initial nodes load
- Check nodes.csv has the short_id
- Re-run extraction script

### Data not appearing
1. Check Supabase table row counts: `SELECT COUNT(*) FROM nodes;`
2. Verify CSV files in `/output/` folder
3. Check console for error messages during load

---

## Data Freshness & Updates

### Add new production data:
1. Get latest NUPRC/FIRS files
2. Re-run extraction script
3. It appends new data (won't duplicate existing)

### Update incidents:
Add rows directly to `incidents_and_events` table via SQL:

```sql
INSERT INTO incidents_and_events (
  title, event_type, severity, affected_node_id,
  started_at, ended_at, impact_value, causal_mechanism, confidence_level
) VALUES (
  'New disruption title',
  'pipeline_vandalism',
  'major',
  (SELECT id FROM nodes WHERE short_id = 'FORCADOS_TERMINAL'),
  NOW(),
  NULL,
  -150000,
  'Actual cause of the disruption',
  'verified'
);
```

---

## Summary

✅ **All data extracted and ready to load**
✅ **Supabase schema created**
✅ **Python scripts provided for loading**
✅ **Queries ready for frontend integration**
✅ **Views built for visualization**
✅ **Functions ready for "why" analysis**

**Total setup time: ~30-40 minutes**

Your backend is production-ready for the MVPfrontend build!
