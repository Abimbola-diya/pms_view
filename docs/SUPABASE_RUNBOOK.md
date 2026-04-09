# Supabase Runbook — PMS Intelligence Platform (MVP)

This runbook lists the steps to create the database schema, prepare CSVs, upload data, and populate PostGIS geometry columns.

1) Open **Supabase SQL Editor** and run the migration SQL (creates extensions and tables). Use the file you prepared (migration SQL in project).

2) Prepare CSVs locally (already created by project):

From project root run:

```bash
./scripts/prepare_supabase_upload.py
```

This writes files to `output/supabase_ready/`:
- `nodes_upload.csv` — nodes normalized to schema
- `nodes_missing_coords.csv` — nodes with missing lat/lon (QA)
- `node_metrics_upload.csv` — metrics (raw)
- `flows_upload.csv` — flows, includes `geom_wkt` where available
- `flows_missing_nodes.csv` — flows referencing missing node short_ids

3) Upload order (ensures foreign key linking):

- `nodes_upload.csv` → table `nodes`
- `node_metrics_upload.csv` → table `node_metrics` (requires nodes to exist)
- `flows_upload.csv` → table `flows`
- other tables: `macro_indicators`, `incidents_and_events`, `rag_documents` as needed

Use the provided Python loader (project root):

```bash
pip install supabase python-dotenv
# create .env with SUPABASE_URL and SUPABASE_KEY (service role key recommended)
python supabase_loader.py
```

4) PostGIS geometry population (run in Supabase SQL Editor after CSV upload):

```sql
-- populate node geom from lat/lon
UPDATE public.nodes
SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision),4326)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- populate flow geometries from WKT
UPDATE public.flows
SET line_geometry = ST_SetSRID(ST_GeomFromText(geom_wkt),4326)::geography
WHERE geom_wkt IS NOT NULL AND geom_wkt <> '';

-- create spatial indexes (if not present)
CREATE INDEX IF NOT EXISTS idx_nodes_geom ON public.nodes USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_flows_geom ON public.flows USING GIST(line_geometry);
```

5) Sanity checks (example queries):

```sql
-- count nodes
SELECT COUNT(*) FROM public.nodes;

-- nodes missing geom
SELECT short_id, name FROM public.nodes WHERE geom IS NULL LIMIT 50;

-- flows without geometry
SELECT id FROM public.flows WHERE line_geometry IS NULL LIMIT 50;
```

6) QA and manual fixes:

- Review `output/supabase_ready/nodes_missing_coords.csv` and fill coordinates manually or via geocoding.
- Review `output/supabase_ready/flows_missing_nodes.csv` to add missing node short_ids or correct typos.

7) Optional enhancements:

- Import high-fidelity OSM geometries later using `osmium`/`pyrosm` and update `flows.line_geometry`.
- Create views and materialized tables for fast frontend queries.

If you want, I can run the loader for you once you provide the `.env` with credentials.
