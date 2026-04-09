#!/usr/bin/env python3
"""
Read output/reconciliation/authoritative_infrastructure.csv, geocode missing lat/lon via Nominatim,
and write output/reconciliation/authoritative_infrastructure_geocoded.csv
Rate-limited (1s between requests) and safe retries.
"""
import csv
import time
import json
import urllib.parse
import urllib.request
import sys

INPUT = 'output/reconciliation/authoritative_infrastructure.csv'
OUTPUT = 'output/reconciliation/authoritative_infrastructure_geocoded.csv'
USER_AGENT = 'PMS-visualization-geocoder/1.0 (+https://github.com)'


def nominatim_search(q, limit=1, retries=3):
    base = 'https://nominatim.openstreetmap.org/search'
    params = {'q': q, 'format': 'json', 'limit': str(limit)}
    url = base + '?' + urllib.parse.urlencode(params)
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as resp:
                if resp.status == 200:
                    data = resp.read().decode('utf-8')
                    return json.loads(data)
                elif resp.status == 429:
                    time.sleep(2 ** attempt)
                else:
                    time.sleep(1)
        except Exception as e:
            if attempt == retries:
                raise
            time.sleep(1 + attempt)
    return []


def main():
    rows = []
    with open(INPUT, newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        fieldnames = reader.fieldnames[:] if reader.fieldnames else []
        # sanitize rows: keep only defined fieldnames and skip empty/name-less rows
        for r in reader:
            if not r:
                continue
            name = (r.get('name') or '').strip()
            if not name:
                continue
            cleaned = {k: (r.get(k) or '') for k in fieldnames}
            rows.append(cleaned)

    extra_fields = ['geocode_lat','geocode_lon','geocode_display','geocode_source']
    out_fields = fieldnames + [f for f in extra_fields if f not in fieldnames]

    for i, r in enumerate(rows):
        lat = (r.get('latitude') or '').strip()
        lon = (r.get('longitude') or '').strip()
        if lat and lon:
            r['geocode_lat'] = lat
            r['geocode_lon'] = lon
            r['geocode_display'] = 'from-file'
            r['geocode_source'] = r.get('source_url','')
            continue
        name = r.get('name','').strip()
        hint = r.get('location_hint','').strip()
        query = name + ((', ' + hint) if hint else '') + ', Nigeria'
        try:
            results = nominatim_search(query)
        except Exception as e:
            print(f'Failed to geocode {name}: {e}', file=sys.stderr)
            r['geocode_lat'] = ''
            r['geocode_lon'] = ''
            r['geocode_display'] = ''
            r['geocode_source'] = ''
            continue
        if results:
            best = results[0]
            r['geocode_lat'] = best.get('lat','')
            r['geocode_lon'] = best.get('lon','')
            r['geocode_display'] = best.get('display_name','')
            r['geocode_source'] = 'nominatim'
            print(f"Geocoded {name} -> {r['geocode_lat']},{r['geocode_lon']} ({r['geocode_display']})")
        else:
            r['geocode_lat'] = ''
            r['geocode_lon'] = ''
            r['geocode_display'] = ''
            r['geocode_source'] = ''
            print(f"No geocode for {name}")
        time.sleep(1.1)

    with open(OUTPUT, 'w', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=out_fields)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    print('Wrote', OUTPUT)


if __name__ == '__main__':
    main()
