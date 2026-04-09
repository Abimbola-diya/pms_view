#!/usr/bin/env python3
"""Geocode canonical operators and facilities (high/medium confidence) using Nominatim.

Outputs: output/reconciliation/geocoded_entities.csv

Note: Respects a 1s delay between requests to avoid Nominatim rate limits.
"""
import os
import time
import json
import urllib.parse
import urllib.request

try:
    import requests
except Exception:
    requests = None

import pandas as pd


def geocode_nominatim(q):
    base = 'https://nominatim.openstreetmap.org/search'
    params = {'format': 'json', 'q': q, 'limit': 1, 'countrycodes': 'ng'}
    url = base + '?' + urllib.parse.urlencode(params)
    headers = {'User-Agent': 'PMS-visualization-reconciler/1.0'}
    if requests:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    else:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as fh:
            data = json.load(fh)
    if not data:
        return None
    return data[0]


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    out_dir = os.path.join(repo_root, 'output', 'reconciliation')
    os.makedirs(out_dir, exist_ok=True)

    ops_path = os.path.join(out_dir, 'canonical_operators.csv')
    fac_path = os.path.join(out_dir, 'canonical_facilities.csv')

    frames = []
    if os.path.exists(ops_path):
        frames.append(pd.read_csv(ops_path, dtype=str, keep_default_na=False))
    if os.path.exists(fac_path):
        frames.append(pd.read_csv(fac_path, dtype=str, keep_default_na=False))
    if not frames:
        print('No canonical files found to geocode.')
        return

    df = pd.concat(frames, sort=False, ignore_index=True)
    df = df[df['confidence_level'].isin(['high', 'medium'])]
    if df.empty:
        print('No high/medium confidence rows to geocode.')
        return

    results = []
    for _, r in df.iterrows():
        name = r.get('name', '')
        ent_type = r.get('type', '')
        short_id = r.get('short_id', '')
        query = f"{name}, Nigeria"
        try:
            res = geocode_nominatim(query)
        except Exception as e:
            print('Geocode error for', name, e)
            res = None
        if res:
            lat = res.get('lat')
            lon = res.get('lon')
            display_name = res.get('display_name')
            importance = res.get('importance')
        else:
            lat = lon = display_name = importance = ''
        results.append({
            'short_id': short_id,
            'name': name,
            'type': ent_type,
            'primary_source_url': r.get('primary_source_url', ''),
            'confidence_level': r.get('confidence_level', ''),
            'latitude': lat,
            'longitude': lon,
            'display_name': display_name,
            'importance': importance,
            'geocode_source': 'nominatim',
        })
        time.sleep(1.1)

    out_path = os.path.join(out_dir, 'geocoded_entities.csv')
    pd.DataFrame(results).to_csv(out_path, index=False)
    print('Wrote geocoded entities to', out_path)


if __name__ == '__main__':
    main()
