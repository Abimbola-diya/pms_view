#!/usr/bin/env python3
"""Ingest OSM retail fuel stations into a Supabase-ready nodes CSV and node_metrics CSV.

Reads `output/reconciliation/retail_stations_osm.csv` and `output/nodes.csv`.
Writes `output/nodes_with_retail.csv` and `output/node_metrics_with_retail.csv`.
"""
import os
import csv
import json
import re
from datetime import datetime


def normalize_short(name: str) -> str:
    s = (name or '').strip().lower()
    s = re.sub(r"[^a-z0-9]+", '_', s)
    s = re.sub(r"_+", '_', s).strip('_')
    return s[:40]


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'output')
RECON = os.path.join(OUT, 'reconciliation')

NODES_IN = os.path.join(OUT, 'nodes.csv')
RETAIL_CSV = os.path.join(RECON, 'retail_stations_osm.csv')
NODES_OUT = os.path.join(OUT, 'nodes_with_retail.csv')
METRICS_OUT = os.path.join(OUT, 'node_metrics_with_retail.csv')


def parse_price_info(price_json_str: str):
    try:
        data = json.loads(price_json_str) if price_json_str else {}
    except Exception:
        return {}
    prices = {}
    for k, v in data.items():
        # try to find numeric substrings
        m = re.search(r"([0-9]+(?:\.[0-9]+)?)", str(v))
        if m:
            prices[k] = m.group(1)
        else:
            prices[k] = v
    return prices


def read_nodes():
    nodes = []
    coords = set()
    if not os.path.exists(NODES_IN):
        return nodes, coords
    with open(NODES_IN, 'r', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for r in reader:
            nodes.append(r)
            lat = r.get('latitude')
            lon = r.get('longitude')
            if lat and lon:
                coords.add((round(float(lat), 5), round(float(lon), 5)))
    return nodes, coords


def main():
    nodes, coords = read_nodes()
    new_nodes = []
    new_metrics = []

    if not os.path.exists(RETAIL_CSV):
        print('Retail CSV not found:', RETAIL_CSV)
        return

    with open(RETAIL_CSV, 'r', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        idx = 0
        for r in reader:
            idx += 1
            try:
                lat = float(r.get('latitude') or 0)
                lon = float(r.get('longitude') or 0)
            except Exception:
                continue
            key = (round(lat, 5), round(lon, 5))
            if key in coords:
                # skip duplicates by coordinate
                continue

            state = r.get('query_state') or ''
            name = r.get('name') or ''
            brand = r.get('brand') or ''
            if not name:
                name = f"{brand} Retail Station" if brand else f"Retail Station {state} #{idx}"

            short = f"RETAIL_{normalize_short(state)}_{normalize_short(name)}"
            short = short.upper()[:32]

            ownership = 'Private'
            if brand and brand.lower() in ['nnpc', 'nnpcl', 'npdc']:
                ownership = 'NOC'

            notes_obj = {
                'source': 'overpass',
                'brand': brand,
                'address': r.get('address', ''),
                'tags': None,
                'price_info': parse_price_info(r.get('price_info', ''))
            }
            try:
                tags_json = r.get('tags_json', '')
                if tags_json:
                    notes_obj['tags'] = json.loads(tags_json)
            except Exception:
                notes_obj['tags'] = None

            node = {
                'short_id': short,
                'name': name,
                'type': 'retail_station',
                'state': state,
                'latitude': lat,
                'longitude': lon,
                'ownership_type': ownership,
                'is_active': 'true',
                'status': 'operational',
                'confidence_level': 'low',
                'data_as_of': datetime.now().strftime('%Y-%m-%d'),
                'notes': json.dumps(notes_obj, ensure_ascii=False)
            }
            new_nodes.append(node)
            coords.add(key)

            # handle price info
            price_info = parse_price_info(r.get('price_info', ''))
            for k, v in price_info.items():
                metric = {
                    'node_short_id': short,
                    'metric_name': k,
                    'metric_value': v,
                    'unit': '',
                    'source_url': 'overpass',
                    'confidence_level': 'low'
                }
                new_metrics.append(metric)

    # combine existing nodes with new_nodes
    combined_nodes = nodes + new_nodes

    # write outputs
    if combined_nodes:
        with open(NODES_OUT, 'w', newline='', encoding='utf-8') as fh:
            fieldnames = ['short_id','name','type','state','latitude','longitude','ownership_type','is_active','status','confidence_level','data_as_of','notes']
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            for r in combined_nodes:
                # ensure fields exist
                out = {k: r.get(k, '') for k in fieldnames}
                writer.writerow(out)
        print('Wrote nodes with retail to', NODES_OUT)

    if new_metrics:
        with open(METRICS_OUT, 'w', newline='', encoding='utf-8') as fh:
            fieldnames = ['node_short_id','metric_name','metric_value','unit','source_url','confidence_level']
            writer = csv.DictWriter(fh, fieldnames=fieldnames)
            writer.writeheader()
            for r in new_metrics:
                writer.writerow(r)
        print('Wrote node metrics for retail to', METRICS_OUT)


if __name__ == '__main__':
    main()
