#!/usr/bin/env python3
"""
Generate provisional `flows.csv` (and `flows.geojson`) for pipelines using
`output/reconciliation/authoritative_infrastructure_geocoded.csv` and the
merged `output/nodes.csv`. This produces WKT in `geom_wkt` for easy DB import.

Usage: run from project root:
  ./scripts/generate_provisional_flows.py
"""
import os
import re
import json
import shutil
from datetime import date
import pandas as pd


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
RECON_DIR = os.path.join(ROOT, 'output', 'reconciliation')
OUT_DIR = os.path.join(ROOT, 'output')
AUTH_FILE = os.path.join(RECON_DIR, 'authoritative_infrastructure_geocoded.csv')
NODES_FILE = os.path.join(OUT_DIR, 'nodes.csv')
FLOWS_FILE = os.path.join(OUT_DIR, 'flows.csv')

DATE_STR = date.today().isoformat()


def normalize(text):
    if text is None:
        return ''
    s = str(text).lower()
    s = re.sub(r"[^a-z0-9]+", ' ', s)
    s = ' '.join(s.split())
    return s


def parse_endpoints(location_hint, name):
    # Try arrow-style separators first
    sep_patterns = ['->', '→', '–', '—', ' to ', '->', '–', '-']
    s = location_hint or ''
    if '->' in s or '→' in s or '->' in s:
        parts = re.split(r'->|→', s)
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 2:
            return parts

    # fallback: try splitting name on common separators
    s2 = name or ''
    for pat in ['–', '—', ' to ', '-', '/']:
        if pat in s2:
            parts = [p.strip() for p in re.split(re.escape(pat), s2) if p.strip()]
            if len(parts) >= 2:
                return parts

    return []


def find_node_for_token(token, nodes_index):
    t = normalize(token)
    # prefer exact substring matches
    for norm_name, rec in nodes_index.items():
        if t == norm_name:
            return rec
    for norm_name, rec in nodes_index.items():
        if t in norm_name:
            return rec
    # try token contained in node name (looser)
    for norm_name, rec in nodes_index.items():
        if norm_name in t:
            return rec
    return None


def main():
    if not os.path.exists(AUTH_FILE):
        print('Authoritative geocoded file not found:', AUTH_FILE)
        return
    if not os.path.exists(NODES_FILE):
        print('Nodes file not found (run merge first):', NODES_FILE)
        return

    auth = pd.read_csv(AUTH_FILE, dtype=str, keep_default_na=False).fillna('')
    nodes = pd.read_csv(NODES_FILE, dtype=str, keep_default_na=False).fillna('')

    # build nodes index: normalized name -> record dict
    nodes_index = {}
    for _, r in nodes.iterrows():
        n = normalize(r.get('name',''))
        nodes_index[n] = {'short_id': r.get('short_id',''), 'name': r.get('name',''), 'lat': r.get('latitude',''), 'lon': r.get('longitude','')}

    # load existing flows (if any)
    if os.path.exists(FLOWS_FILE):
        flows = pd.read_csv(FLOWS_FILE, dtype=str, keep_default_na=False).fillna('')
    else:
        cols = ['from_short_id','to_short_id','flow_type','transport_mode','is_active','is_international','avg_volume_value','avg_volume_unit','confidence_level','notes','geom_wkt']
        flows = pd.DataFrame(columns=cols)

    created = 0
    skipped = 0

    # Filter for pipeline-type rows
    pipelines = auth[auth['type'].str.contains('pipeline', case=False, na=False)]
    for _, p in pipelines.iterrows():
        name = p.get('name','')
        loc = p.get('location_hint','')
        confidence = p.get('confidence','')
        source = p.get('source_url','')
        notes = p.get('notes','')

        endpoints = parse_endpoints(loc, name)
        if not endpoints:
            # try heuristics: split on whitespace and take first/last
            parts = [w for w in re.split(r'\s+', name) if len(w) > 3]
            if len(parts) >= 2:
                endpoints = [parts[0], parts[-1]]

        # if endpoints found, try to map to nodes
        if endpoints:
            mapped = []
            for tok in endpoints:
                rec = find_node_for_token(tok, nodes_index)
                if rec:
                    mapped.append(rec)
            # if we have two or more mapped nodes, create line(s)
            if len(mapped) >= 2:
                # create consecutive pairs
                for i in range(len(mapped)-1):
                    a = mapped[i]
                    b = mapped[i+1]
                    try:
                        lat1 = float(a['lat'])
                        lon1 = float(a['lon'])
                        lat2 = float(b['lat'])
                        lon2 = float(b['lon'])
                    except Exception:
                        skipped += 1
                        continue

                    geom = f"LINESTRING({lon1} {lat1}, {lon2} {lat2})"
                    new = {
                        'from_short_id': a['short_id'],
                        'to_short_id': b['short_id'],
                        'flow_type': 'pipeline',
                        'transport_mode': 'pipeline',
                        'is_active': 'true',
                        'is_international': 'false',
                        'avg_volume_value': '',
                        'avg_volume_unit': '',
                        'confidence_level': confidence or '',
                        'notes': (notes or '') + (('; source=' + source) if source else ''),
                        'geom_wkt': geom,
                    }
                    flows = pd.concat([flows, pd.DataFrame([new])], ignore_index=True, sort=False)
                    created += 1
            else:
                skipped += 1
        else:
            skipped += 1

    # Backup and write flows.csv
    if os.path.exists(FLOWS_FILE):
        bak = FLOWS_FILE + '.bak.' + DATE_STR
        shutil.copy2(FLOWS_FILE, bak)
        print('Backed up original flows to', bak)

    flows.to_csv(FLOWS_FILE, index=False)
    print(f'Wrote flows to {FLOWS_FILE} (created={created} skipped={skipped})')

    # Emit flows.geojson for frontend
    features = []
    for _, r in flows.iterrows():
        wkt = r.get('geom_wkt','')
        # guard against NaN/float
        if pd.isna(wkt):
            continue
        wkt_s = str(wkt).strip()
        if not wkt_s or not wkt_s.upper().startswith('LINESTRING'):
            continue
        # parse coords inside parentheses
        m = re.match(r'LINESTRING\((.*)\)', wkt_s, flags=re.I)
        if not m:
            continue
        coords = []
        for pair in m.group(1).split(','):
            x_y = pair.strip().split()
            if len(x_y) >= 2:
                lon = float(x_y[0]); lat = float(x_y[1])
                coords.append([lon, lat])
        feat = {'type':'Feature', 'geometry': {'type':'LineString', 'coordinates': coords}, 'properties': r.to_dict()}
        features.append(feat)

    flows_geo = os.path.join(OUT_DIR, 'flows.geojson')
    with open(flows_geo, 'w', encoding='utf-8') as fh:
        json.dump({'type':'FeatureCollection','features':features}, fh, ensure_ascii=False)
    print('Wrote flows GeoJSON to', flows_geo)


if __name__ == '__main__':
    main()
