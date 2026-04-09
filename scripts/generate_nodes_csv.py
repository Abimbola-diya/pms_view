#!/usr/bin/env python3
"""Generate Supabase-ready nodes and node_metrics CSVs from reconciled canonical and geocoded data.

Outputs:
- output/nodes_reconciled.csv
- output/node_metrics_reconciled.csv
"""
import os
import pandas as pd


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    recon_dir = os.path.join(repo_root, 'output', 'reconciliation')
    out_dir = os.path.join(repo_root, 'output')
    os.makedirs(recon_dir, exist_ok=True)

    ops_path = os.path.join(recon_dir, 'canonical_operators.csv')
    fac_path = os.path.join(recon_dir, 'canonical_facilities.csv')
    geo_path = os.path.join(recon_dir, 'geocoded_entities.csv')

    frames = []
    if os.path.exists(ops_path):
        frames.append(pd.read_csv(ops_path, dtype=str, keep_default_na=False))
    if os.path.exists(fac_path):
        frames.append(pd.read_csv(fac_path, dtype=str, keep_default_na=False))
    if not frames:
        print('No canonical inputs found; aborting.')
        return

    canon_df = pd.concat(frames, sort=False, ignore_index=True)
    geo_df = pd.read_csv(geo_path, dtype=str, keep_default_na=False) if os.path.exists(geo_path) else pd.DataFrame()

    geo_map = {r['short_id']: r for _, r in geo_df.iterrows()} if not geo_df.empty else {}

    nodes = []
    metrics = []
    for _, r in canon_df.iterrows():
        short_id = (r.get('short_id') or r.get('name') or '').strip()
        name = r.get('name', '')
        typ = r.get('type', 'operator')
        primary_source = r.get('primary_source_url', '')
        confidence = r.get('confidence_level', '')

        geo = geo_map.get(short_id, {})
        lat = geo.get('latitude', '') if isinstance(geo, dict) else ''
        lon = geo.get('longitude', '') if isinstance(geo, dict) else ''

        node = {
            'short_id': short_id,
            'name': name,
            'type': typ,
            'latitude': lat,
            'longitude': lon,
            'state': '',
            'ownership_type': '',
            'website': primary_source,
            'primary_source_url': primary_source,
            'confidence_level': confidence,
            'notes': '',
        }
        nodes.append(node)

        # placeholder metric row for QA and later population
        metrics.append({
            'node_short_id': short_id,
            'metric_name': 'capacity',
            'metric_value': '',
            'unit': '',
            'source_url': primary_source,
            'confidence_level': confidence,
        })

    nodes_df = pd.DataFrame(nodes)
    metrics_df = pd.DataFrame(metrics)

    nodes_out = os.path.join(out_dir, 'nodes_reconciled.csv')
    metrics_out = os.path.join(out_dir, 'node_metrics_reconciled.csv')
    nodes_df.to_csv(nodes_out, index=False)
    metrics_df.to_csv(metrics_out, index=False)

    print('Wrote:', nodes_out)
    print('Wrote:', metrics_out)


if __name__ == '__main__':
    main()
