#!/usr/bin/env python3
"""Retry Overpass queries for states marked 'failed' in
`output/reconciliation/retail_stations_summary.json`.

Appends results to `retail_stations_osm.csv` and updates the
summary/by-state JSON files.
"""
import os
import json
import time
import random


def main():
    script_path = os.path.join(os.path.dirname(__file__), 'extract_retail_stations.py')
    ns = {}
    # ensure executed module sees a __file__ so paths inside the exec'd script resolve
    ns['__file__'] = script_path
    with open(script_path, 'r', encoding='utf-8') as fh:
        exec(fh.read(), ns)

    SUMMARY_PATH = ns['SUMMARY_PATH']
    JSON_BY_STATE = ns['JSON_BY_STATE']

    # load existing summary
    if os.path.exists(SUMMARY_PATH):
        with open(SUMMARY_PATH, 'r', encoding='utf-8') as fh:
            try:
                orig_summary = json.load(fh)
            except Exception:
                orig_summary = {}
    else:
        orig_summary = {}

    failed_states = [s for s, v in orig_summary.items() if v.get('status') == 'failed']
    if not failed_states:
        # fallback list (should match earlier run's failed list)
        failed_states = ['Adamawa','Akwa Ibom','Anambra','Bauchi','Delta','Ekiti','Enugu','Jigawa','Kano','Kogi','Oyo','Plateau']

    # rotate between a few public Overpass endpoints to improve success rate
    ENDPOINTS = [
        'https://overpass.kumi.systems/api/interpreter',
        'https://lz4.overpass-api.de/api/interpreter',
        'https://overpass-api.de/api/interpreter'
    ]

    ns['UA'] = 'PMS-visualization-retry/1.0 (contact: you@example.com)'

    new_summary = {}
    new_by_state = {}

    for state in failed_states:
        print(f'Retrying {state}...')
        resp = None
        for attempt in range(8):
            ep = ENDPOINTS[attempt % len(ENDPOINTS)]
            ns['OVERPASS_URL'] = ep
            try:
                resp = ns['overpass_query_for_state'](state, timeout=240)
                break
            except Exception as e:
                backoff = 2 ** attempt
                print(f'  attempt {attempt+1} failed ({e}); sleeping {backoff}s')
                time.sleep(backoff + random.random())

        if not resp:
            print(f'  FAILED to retrieve {state} after retries')
            new_summary[state] = {'status': 'failed', 'count': 0}
            new_by_state[state] = {'count': 0}
            continue

        elements = resp.get('elements', [])
        rows = []
        for el in elements:
            tags = el.get('tags', {}) or {}
            if el.get('type') == 'node':
                lat = el.get('lat')
                lon = el.get('lon')
            else:
                center = el.get('center', {}) or {}
                lat = center.get('lat')
                lon = center.get('lon')

            price_info = ns['extract_price_info'](tags)

            row = {
                'query_state': state,
                'osm_type': el.get('type'),
                'osm_id': el.get('id'),
                'name': tags.get('name', ''),
                'brand': tags.get('brand', ''),
                'operator': tags.get('operator', ''),
                'address': tags.get('addr:full') or tags.get('addr:street') or tags.get('addr:city') or tags.get('addr:state',''),
                'latitude': lat,
                'longitude': lon,
                'tags_json': json.dumps(tags, ensure_ascii=False),
                'price_info': json.dumps(price_info, ensure_ascii=False) if price_info else '',
                'osm_source': 'overpass',
            }
            rows.append(row)

        if rows:
            ns['write_rows'](rows, header=False)

        new_summary[state] = {'status': 'ok', 'count': len(rows)}
        new_by_state[state] = {'count': len(rows)}
        print(f'  -> {len(rows)} stations found for {state}')
        time.sleep(1.5)

    # merge summaries
    merged = orig_summary.copy()
    for k, v in new_summary.items():
        merged[k] = v
    with open(SUMMARY_PATH, 'w', encoding='utf-8') as fh:
        json.dump(merged, fh, indent=2, ensure_ascii=False)

    # merge by_state
    orig_by = {}
    if os.path.exists(JSON_BY_STATE):
        with open(JSON_BY_STATE, 'r', encoding='utf-8') as fh:
            try:
                orig_by = json.load(fh)
            except Exception:
                orig_by = {}
    for k, v in new_by_state.items():
        orig_by[k] = v
    with open(JSON_BY_STATE, 'w', encoding='utf-8') as fh:
        json.dump(orig_by, fh, indent=2, ensure_ascii=False)

    print('Retry script finished; updated summary at', SUMMARY_PATH)


if __name__ == '__main__':
    main()
