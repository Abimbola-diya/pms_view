#!/usr/bin/env python3
"""Extract retail fuel stations (amenity=fuel) for all Nigerian states via Overpass API.

Writes incremental CSV to `output/reconciliation/retail_stations_osm.csv` and
summary JSON to `output/reconciliation/retail_stations_summary.json`.

Notes:
- Uses polite User-Agent and small delay between requests.
- Retries on temporary errors with exponential backoff.
"""
import os
import time
import json
import csv
import sys

try:
    import requests
except Exception:
    requests = None
    import urllib.request
    import urllib.parse


STATES = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
    'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara','Federal Capital Territory'
]

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'output', 'reconciliation')
os.makedirs(OUT_DIR, exist_ok=True)

CSV_PATH = os.path.join(OUT_DIR, 'retail_stations_osm.csv')
SUMMARY_PATH = os.path.join(OUT_DIR, 'retail_stations_summary.json')
JSON_BY_STATE = os.path.join(OUT_DIR, 'retail_stations_by_state.json')

OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
UA = 'PMS-visualization-retail-extractor/1.0 (contact: none)'


def overpass_query_for_state(state_name: str, timeout: int = 180):
    q = f'''[out:json][timeout:{timeout}];
area["name"="{state_name}"]["admin_level"="4"]->.searchArea;
(
  node["amenity"="fuel"](area.searchArea);
  way["amenity"="fuel"](area.searchArea);
  relation["amenity"="fuel"](area.searchArea);
);
out center tags;'''
    if requests:
        resp = requests.post(OVERPASS_URL, data={'data': q}, headers={'User-Agent': UA}, timeout=timeout+30)
        resp.raise_for_status()
        return resp.json()
    else:
        data = urllib.parse.urlencode({'data': q}).encode('utf-8')
        req = urllib.request.Request(OVERPASS_URL, data=data, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=timeout+30) as fh:
            return json.load(fh)


def extract_price_info(tags: dict):
    price = {}
    for k, v in tags.items():
        lk = k.lower()
        if 'fuel' in lk or 'price' in lk or 'pms' in lk or 'diesel' in lk or 'petrol' in lk or 'octane' in lk:
            price[k] = v
    return price


def write_rows(rows, header=False):
    write_header = header and not os.path.exists(CSV_PATH)
    with open(CSV_PATH, 'a', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        if write_header:
            writer.writeheader()
        for r in rows:
            writer.writerow(r)


def run_all_states():
    summary = {}
    by_state = {}

    for state in STATES:
        print('Querying Overpass for state:', state)
        retries = 0
        backoff = 1
        while retries < 6:
            try:
                resp = overpass_query_for_state(state)
                break
            except Exception as e:
                print('  Overpass error:', e)
                retries += 1
                time.sleep(backoff)
                backoff *= 2
        else:
            print('  FAILED to get data for', state)
            summary[state] = {'status': 'failed', 'count': 0}
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

            price_info = extract_price_info(tags)

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
            write_rows(rows, header=True)

        summary[state] = {'status': 'ok', 'count': len(rows)}
        by_state[state] = {'count': len(rows)}
        print(f'  → {len(rows)} stations found for {state}')

        # polite pause
        time.sleep(1.5)

    with open(SUMMARY_PATH, 'w', encoding='utf-8') as fh:
        json.dump(summary, fh, indent=2, ensure_ascii=False)

    with open(JSON_BY_STATE, 'w', encoding='utf-8') as fh:
        json.dump(by_state, fh, indent=2, ensure_ascii=False)

    print('Extraction complete. CSV:', CSV_PATH)
    print('Summary:', SUMMARY_PATH)


def main():
    # remove existing CSV to ensure fresh run (but keep if you want to resume, change behavior here)
    if os.path.exists(CSV_PATH):
        print('Appending to existing CSV:', CSV_PATH)
    else:
        print('Creating new CSV:', CSV_PATH)

    run_all_states()


if __name__ == '__main__':
    main()
