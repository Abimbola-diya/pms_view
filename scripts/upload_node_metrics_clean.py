#!/usr/bin/env python3
"""
Upload node_metrics safely to Supabase, removing problematic columns.
Run from project root: python scripts/upload_node_metrics_clean.py
"""
from dotenv import load_dotenv
import os, csv, sys, time

# Load .env explicitly
load_dotenv(dotenv_path='.env')

try:
    from supabase import create_client
except ImportError:
    print('Please install supabase and python-dotenv in the venv')
    sys.exit(1)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    print('Missing SUPABASE_URL or SUPABASE_KEY in .env')
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

INPUT = 'output/node_metrics.csv'
if not os.path.exists(INPUT):
    print('File not found:', INPUT)
    sys.exit(1)

rows = []
skipped = []
with open(INPUT, 'r', encoding='utf-8') as fh:
    reader = csv.DictReader(fh)
    for r in reader:
        r = {k: (v if v and v.strip() else None) for k, v in r.items()}
        short = r.pop('node_short_id', None)
        # Remove problematic column
        r.pop('unit', None)
        # Normalize metric_value: keep numeric, move non-numeric into notes
        mv = r.get('metric_value')
        if mv is not None:
            try:
                # coerce numeric strings to float
                r['metric_value'] = float(mv)
            except Exception:
                # non-numeric metric_value — skip inserting to numeric-only table and save for QA
                skipped.append(r)
                continue
        if short:
            try:
                resp = client.table('nodes').select('id').eq('short_id', short).limit(1).execute()
                if getattr(resp, 'data', None):
                    r['node_id'] = resp.data[0]['id']
                else:
                    print(f'  ⚠ No node found for short_id {short}')
            except Exception as e:
                print('Lookup error for', short, e)
        rows.append(r)

print('Uploading', len(rows), 'node_metrics rows')

batch_size = 100
total = 0
for i in range(0, len(rows), batch_size):
    batch = rows[i:i+batch_size]
    try:
        client.table('node_metrics').insert(batch).execute()
        total += len(batch)
        print(f'  ✓ Inserted batch {i//batch_size+1} ({len(batch)} rows)')
    except Exception as e:
        print('  ❌ Batch insert error:', e)
        for rec in batch:
            try:
                client.table('node_metrics').insert(rec).execute()
                total += 1
            except Exception as e2:
                print('    Failed record:', rec.get('node_id') or '<no node_id>', e2)
    time.sleep(0.2)

print('Done. Total node_metrics uploaded:', total)
# write skipped rows for QA
if skipped:
    outdir = os.path.dirname(INPUT) or '.'
    path = os.path.join('output', 'supabase_ready', 'node_metrics_skipped_non_numeric.csv')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='') as fh:
        writer = csv.DictWriter(fh, fieldnames=skipped[0].keys())
        writer.writeheader()
        for s in skipped:
            writer.writerow(s)
    print(f"Wrote skipped non-numeric metrics to {path} ({len(skipped)} rows)")
