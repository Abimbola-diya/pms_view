#!/usr/bin/env python3
"""
Prepare Supabase-ready CSVs from the project's `output/` artifacts.

Outputs (in `output/supabase_ready/`):
- nodes_upload.csv
- node_metrics_upload.csv
- flows_upload.csv
- nodes_missing_coords.csv
- flows_missing_nodes.csv

Run from project root:
  ./scripts/prepare_supabase_upload.py
"""
import os
import re
import json
import math
import pandas as pd


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT = os.path.join(ROOT, 'output')
RECON = os.path.join(OUT, 'reconciliation')
SUP_OUT = os.path.join(OUT, 'supabase_ready')
os.makedirs(SUP_OUT, exist_ok=True)

NODES_IN = os.path.join(OUT, 'nodes.csv')
METRICS_IN = os.path.join(OUT, 'node_metrics.csv')
FLOWS_IN = os.path.join(OUT, 'flows.csv')


ALLOWED_NODE_TYPES = {'upstream','export_terminal','refinery','importer','depot','distributor','retail','international'}
TYPE_MAP = {
    'terminal': 'export_terminal',
    'export_terminal': 'export_terminal',
    'jetty': 'export_terminal',
    'refinery': 'refinery',
    'upstream': 'upstream',
    'depot': 'depot',
    'distributor': 'distributor',
    'retail_station': 'retail',
    'retail': 'retail',
    'international': 'international',
}

ALLOWED_OWNERS = {'NOC','IOC','Indigenous','Private','Government','International','JV'}
CONF_MAP = {'high':'verified','verified':'verified','medium':'estimated','low':'unconfirmed','estimated':'estimated','unconfirmed':'unconfirmed'}


def safe_upper_short(name):
    if not name or str(name).strip()=='' or str(name).lower().startswith('retail'):
        base = 'NODE'
    else:
        base = re.sub(r'[^A-Za-z0-9]+', '_', str(name)).strip('_')[:60]
        if not base:
            base = 'NODE'
    return base.upper()


def ensure_unique_short_ids(df):
    seen = set()
    out = []
    for idx, r in df.iterrows():
        sid = str(r.get('short_id','')).strip()
        if not sid:
            sid = safe_upper_short(r.get('name',''))
        sid = sid.upper()
        base = sid
        i = 1
        while sid in seen or sid == '':
            sid = f"{base}_{i}"
            i += 1
        seen.add(sid)
        out.append(sid)
    return out


def prepare_nodes():
    if not os.path.exists(NODES_IN):
        print('Missing input nodes.csv at', NODES_IN)
        return
    df = pd.read_csv(NODES_IN, dtype=str, keep_default_na=False).fillna('')

    # Required headers for migration
    cols = [
        'short_id','name','type','subtype','latitude','longitude','state',
        'geopolitical_zone','address','google_maps_url','ownership_type','parent_company',
        'is_active','status','commissioned_year','website','logo_url','primary_source_url',
        'secondary_source_url','confidence_level','data_as_of','notes'
    ]

    out = pd.DataFrame(columns=cols)

    # ensure short_id unique
    if 'short_id' not in df.columns:
        df['short_id'] = [''] * len(df)
    df['short_id'] = ensure_unique_short_ids(df)

    for i, r in df.iterrows():
        name = r.get('name','')
        raw_type = str(r.get('type','')).strip().lower()
        ntype = raw_type if raw_type in ALLOWED_NODE_TYPES else TYPE_MAP.get(raw_type, '')
        if not ntype:
            # try to infer from name keywords
            if 'refin' in name.lower():
                ntype = 'refinery'
            elif 'depot' in name.lower() or 'tank' in name.lower():
                ntype = 'depot'
            elif 'terminal' in name.lower() or 'jetty' in name.lower() or 'port' in name.lower():
                ntype = 'export_terminal'
            elif 'station' in name.lower() or 'filling' in name.lower() or 'retail' in name.lower():
                ntype = 'retail'
            else:
                ntype = 'retail'

        conf = str(r.get('confidence_level','')).strip().lower()
        conf_out = CONF_MAP.get(conf, 'estimated')

        own = r.get('ownership_type','')
        if own and own not in ALLOWED_OWNERS:
            # try to normalize common tokens
            o2 = own.upper()
            if 'NNPC' in o2 or 'NOC' in o2:
                own = 'NOC'
            elif 'SHELL' in o2 or 'TOTAL' in o2 or 'EXXON' in o2:
                own = 'IOC'
            else:
                own = ''

        is_active = str(r.get('is_active','true')).strip().lower() in ('true','1','yes')

        out.loc[i] = {
            'short_id': r.get('short_id',''),
            'name': name,
            'type': ntype,
            'subtype': r.get('subtype',''),
            'latitude': r.get('latitude',''),
            'longitude': r.get('longitude',''),
            'state': r.get('state',''),
            'geopolitical_zone': r.get('geopolitical_zone',''),
            'address': r.get('address',''),
            'google_maps_url': r.get('google_maps_url',''),
            'ownership_type': own,
            'parent_company': r.get('parent_company','') or r.get('owner',''),
            'is_active': is_active,
            'status': r.get('status','operational'),
            'commissioned_year': r.get('commissioned_year',''),
            'website': r.get('website','') or r.get('primary_source_url',''),
            'logo_url': r.get('logo_url',''),
            'primary_source_url': r.get('primary_source_url',''),
            'secondary_source_url': r.get('secondary_source_url',''),
            'confidence_level': conf_out,
            'data_as_of': r.get('data_as_of',''),
            'notes': r.get('notes','')
        }

    nodes_out = os.path.join(SUP_OUT, 'nodes_upload.csv')
    out.to_csv(nodes_out, index=False)
    print('Wrote', nodes_out)

    # missing coords report
    miss = out[(out['latitude']=='') | (out['longitude']=='')]
    miss_path = os.path.join(SUP_OUT, 'nodes_missing_coords.csv')
    miss.to_csv(miss_path, index=False)
    print('Wrote', miss_path, '(', len(miss), 'rows )')


def prepare_metrics():
    if not os.path.exists(METRICS_IN):
        print('node_metrics.csv not found; skipping')
        return
    df = pd.read_csv(METRICS_IN, dtype=str, keep_default_na=False).fillna('')
    outp = os.path.join(SUP_OUT, 'node_metrics_upload.csv')
    df.to_csv(outp, index=False)
    print('Wrote', outp)


def prepare_flows():
    if not os.path.exists(FLOWS_IN):
        print('flows.csv not found; skipping')
        return
    df = pd.read_csv(FLOWS_IN, dtype=str, keep_default_na=False).fillna('')

    # ensure required columns
    required = ['from_short_id','to_short_id','flow_type','transport_mode','is_active','is_international','avg_volume_value','avg_volume_unit','confidence_level','notes','geom_wkt']
    for c in required:
        if c not in df.columns:
            df[c] = ''

    # normalize booleans
    df['is_active'] = df['is_active'].apply(lambda v: str(v).strip().lower() in ('true','1','yes'))
    df['is_international'] = df['is_international'].apply(lambda v: str(v).strip().lower() in ('true','1','yes'))

    # validate short_ids against nodes
    nodes = pd.read_csv(os.path.join(SUP_OUT, 'nodes_upload.csv'), dtype=str, keep_default_na=False).fillna('')
    node_set = set(nodes['short_id'].astype(str).tolist())

    missing = []
    for idx, r in df.iterrows():
        f = str(r.get('from_short_id','')).strip()
        t = str(r.get('to_short_id','')).strip()
        if f and f not in node_set:
            missing.append({'row_idx': idx, 'missing_short_id': f, 'role': 'from'})
        if t and t not in node_set:
            missing.append({'row_idx': idx, 'missing_short_id': t, 'role': 'to'})

    missing_path = os.path.join(SUP_OUT, 'flows_missing_nodes.csv')
    pd.DataFrame(missing).to_csv(missing_path, index=False)
    print('Wrote', missing_path, '(', len(missing), 'items )')

    flows_out = os.path.join(SUP_OUT, 'flows_upload.csv')
    df.to_csv(flows_out, index=False)
    print('Wrote', flows_out)


def main():
    prepare_nodes()
    prepare_metrics()
    prepare_flows()
    print('\nPreparation complete. Files are in output/supabase_ready/')


if __name__ == '__main__':
    main()
