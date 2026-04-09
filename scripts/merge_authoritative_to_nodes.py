#!/usr/bin/env python3
"""
Merge `output/reconciliation/authoritative_infrastructure_geocoded.csv`
into `output/nodes.csv`. Creates backups, writes updated `nodes.csv`,
and emits `output/nodes.geojson` for frontend use.

Usage: run from project root:
  ./scripts/merge_authoritative_to_nodes.py
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

DATE_STR = date.today().isoformat()


def normalize(text):
    if text is None:
        return ''
    s = str(text).lower()
    s = re.sub(r"[^a-z0-9]+", ' ', s)
    s = ' '.join(s.split())
    return s


def make_short_id(name, existing):
    base = re.sub(r"[^A-Za-z0-9]+", '_', name).strip('_')
    if not base:
        base = 'NODE'
    short = base.upper()
    candidate = short
    i = 1
    while candidate in existing:
        candidate = f"{short}_{i}"
        i += 1
    return candidate


def main():
    if not os.path.exists(AUTH_FILE):
        print('Authoritative geocoded file not found:', AUTH_FILE)
        return

    auth = pd.read_csv(AUTH_FILE, dtype=str, keep_default_na=False).fillna('')

    # Load existing nodes (if present)
    if os.path.exists(NODES_FILE):
        nodes = pd.read_csv(NODES_FILE, dtype=str, keep_default_na=False).fillna('')
    else:
        cols = ['short_id','name','type','state','latitude','longitude','ownership_type','is_active','status','confidence_level','data_as_of','notes']
        nodes = pd.DataFrame(columns=cols)

    # Build normalized name -> index mapping (first occurrence)
    name_map = {}
    for idx, r in nodes.iterrows():
        n = normalize(r.get('name',''))
        if n and n not in name_map:
            name_map[n] = idx

    existing_short_ids = set(nodes['short_id'].astype(str).tolist())
    added = 0
    updated = 0

    for _, row in auth.iterrows():
        name = row.get('name','')
        if not name:
            continue
        norm = normalize(name)

        # pick best available geocode (prefer geocode_lat/geocode_lon)
        geolat = row.get('geocode_lat') or row.get('latitude') or ''
        geolon = row.get('geocode_lon') or row.get('longitude') or ''

        owner = row.get('owner','')
        rtype = row.get('type','')
        confidence = row.get('confidence','')
        source = row.get('source_url','')

        if norm in name_map:
            idx = name_map[norm]
            # update coordinates if missing and we have geocode
            if geolat and geolon and (not nodes.at[idx,'latitude'] or not nodes.at[idx,'longitude']):
                nodes.at[idx,'latitude'] = geolat
                nodes.at[idx,'longitude'] = geolon
                updated += 1
            # fill ownership if missing
            if owner and not nodes.at[idx,'ownership_type']:
                nodes.at[idx,'ownership_type'] = owner
            # prefer higher confidence if present
            if confidence and (not nodes.at[idx,'confidence_level'] or nodes.at[idx,'confidence_level'] == ''):
                nodes.at[idx,'confidence_level'] = confidence
            # add source note
            note = nodes.at[idx,'notes'] or ''
            addnote = f"authoritative_source={source}" if source else ''
            if addnote and addnote not in note:
                nodes.at[idx,'notes'] = (note + ('; ' if note else '') + addnote)
        else:
            short = make_short_id(name, existing_short_ids)
            existing_short_ids.add(short)
            new_row = {
                'short_id': short,
                'name': name,
                'type': 'export_terminal' if rtype.lower() == 'terminal' else rtype or 'unknown',
                'state': '',
                'latitude': geolat,
                'longitude': geolon,
                'ownership_type': owner,
                'is_active': 'true',
                'status': 'operational',
                'confidence_level': confidence or 'medium',
                'data_as_of': DATE_STR,
                'notes': f'Imported from authoritative_infrastructure_geocoded.csv; source={source}' if source else 'Imported from authoritative_infrastructure_geocoded.csv'
            }
            nodes = pd.concat([nodes, pd.DataFrame([new_row])], ignore_index=True, sort=False)
            name_map[norm] = nodes.index[-1]
            added += 1

    # Backup original nodes file and write merged
    if os.path.exists(NODES_FILE):
        bak = NODES_FILE + '.bak.' + DATE_STR
        shutil.copy2(NODES_FILE, bak)
        print('Backed up original nodes to', bak)

    nodes.to_csv(NODES_FILE, index=False)
    print(f'Wrote merged nodes to {NODES_FILE} (added={added} updated={updated})')

    # Write GeoJSON
    geo = {'type': 'FeatureCollection', 'features': []}
    for _, r in nodes.iterrows():
        lat = r.get('latitude','')
        lon = r.get('longitude','')
        try:
            if lat != '' and lon != '':
                latf = float(lat)
                lonf = float(lon)
            else:
                continue
        except Exception:
            continue
        props = r.to_dict()
        # keep lat/lon in props as strings
        feat = {'type':'Feature', 'geometry': {'type':'Point', 'coordinates': [lonf, latf]}, 'properties': props}
        geo['features'].append(feat)

    nodes_geo = os.path.join(OUT_DIR, 'nodes.geojson')
    with open(nodes_geo, 'w', encoding='utf-8') as fh:
        json.dump(geo, fh, ensure_ascii=False)
    print('Wrote nodes GeoJSON to', nodes_geo)


if __name__ == '__main__':
    main()
