#!/usr/bin/env python3
"""
Upload flows and remaining tables to Supabase.
Run from project root: python scripts/upload_remaining.py
"""
from dotenv import load_dotenv
import os, csv, sys, time

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
DATA_DIR = 'output'


def load_csv_file(filepath: str):
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append({k: (v if v and v.strip() else None) for k, v in row.items()})
    return data


def get_node_id(short_id: str):
    if not short_id:
        return None
    try:
        resp = client.table('nodes').select('id').eq('short_id', short_id).limit(1).execute()
        if getattr(resp, 'data', None):
            return resp.data[0]['id']
    except Exception:
        pass
    return None


def upload_to_table(table_name: str, data: list, batch_size: int = 100):
    if not data:
        print(f"  ⊘ No data for {table_name}")
        return 0

    total = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        try:
            client.table(table_name).insert(batch).execute()
            total += len(batch)
            print(f"  ✓ Uploaded batch {i//batch_size + 1} ({len(batch)} records) to {table_name}")
        except Exception as e:
            print(f"  ❌ Batch insert error for {table_name}: {e}")
            for rec in batch:
                try:
                    client.table(table_name).insert(rec).execute()
                    total += 1
                except Exception as e2:
                    print(f"    Failed record for {table_name}: {rec.get('short_id','<no id>')} - {e2}")
    return total


def load_flows():
    print('\n📥 Loading FLOWS...')
    filepath = os.path.join(DATA_DIR, 'flows.csv')
    if not os.path.exists(filepath):
        print('  ❌ flows.csv not found')
        return 0
    rows = load_csv_file(filepath)
    prepared = []
    missing_nodes = []
    for r in rows:
        rec = {}
        # booleans
        rec['is_active'] = str(r.get('is_active', 'true')).lower() in ('1','true','t','yes')
        rec['is_international'] = str(r.get('is_international', 'false')).lower() in ('1','true','t','yes')
        # copy simple fields
        for k in ('flow_type','transport_mode','avg_volume_value','avg_volume_unit','confidence_level','notes','geom_wkt'):
            if r.get(k) is not None:
                rec[k] = r.get(k)
        # numeric coercion
        if rec.get('avg_volume_value'):
            try:
                rec['avg_volume_value'] = float(rec['avg_volume_value'])
            except Exception:
                rec['avg_volume_value'] = None
        # link nodes
        from_sid = r.get('from_short_id')
        to_sid = r.get('to_short_id')
        if from_sid:
            nid = get_node_id(from_sid)
            if nid:
                rec['from_node_id'] = nid
            else:
                missing_nodes.append(from_sid)
        if to_sid:
            nid = get_node_id(to_sid)
            if nid:
                rec['to_node_id'] = nid
            else:
                missing_nodes.append(to_sid)
        # normalize transport_mode to allowed values (map verbose values)
        tm = rec.get('transport_mode', '').lower()
        if 'vessel' in tm or 'ship' in tm:
            rec['transport_mode'] = 'vessel'
        elif 'truck' in tm or 'lorry' in tm or 'road' in tm:
            rec['transport_mode'] = 'truck'
        elif 'pipeline' in tm:
            rec['transport_mode'] = 'pipeline'
        else:
            rec['transport_mode'] = None  # Set to None if no match

        # preserve geom_wkt for manual PostGIS update but don't include if DB doesn't have column
        geom = rec.pop('geom_wkt', None)
        if geom:
            # store for later geometry population
            geom_store = os.path.join(DATA_DIR, 'supabase_ready', 'flows_geom_wkt_for_sql.csv')
            os.makedirs(os.path.dirname(geom_store), exist_ok=True)
            write_header = not os.path.exists(geom_store)
            with open(geom_store, 'a', encoding='utf-8', newline='') as gh:
                gw = csv.writer(gh)
                if write_header:
                    gw.writerow(['from_short_id','to_short_id','geom_wkt'])
                gw.writerow([r.get('from_short_id'), r.get('to_short_id'), geom])

        prepared.append(rec)

    # write missing nodes report if any
    if missing_nodes:
        missing_path = os.path.join(DATA_DIR, 'supabase_ready', 'flows_missing_nodes.csv')
        os.makedirs(os.path.dirname(missing_path), exist_ok=True)
        with open(missing_path, 'w', encoding='utf-8', newline='') as fh:
            writer = csv.writer(fh)
            writer.writerow(['missing_short_id'])
            for m in sorted(set(missing_nodes)):
                writer.writerow([m])
        print(f"  ⚠ {len(set(missing_nodes))} missing node short_ids written to {missing_path}")

    return upload_to_table('flows', prepared)


def load_table_with_node_links(csv_name, table_name, short_field_map=None):
    """Generic loader that maps short_id(s) to node_id(s).
    short_field_map: dict mapping csv short_id field -> target node_id field
    """
    print(f"\n📥 Loading {table_name.upper()}...")
    filepath = os.path.join(DATA_DIR, csv_name)
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    rows = load_csv_file(filepath)
    prepared = []
    for r in rows:
        rec = {k: v for k, v in r.items() if v is not None}
        if short_field_map:
            for short_field, node_field in short_field_map.items():
                short = rec.pop(short_field, None)
                if short:
                    nid = get_node_id(short)
                    if nid:
                        rec[node_field] = nid
        # table-specific normalizations
        if table_name == 'rag_documents':
            tags_str = rec.get('topic_tags', '')
            if tags_str:
                rec['topic_tags'] = '{' + ','.join([t.strip().replace(' ', '_') for t in tags_str.split(',') if t.strip()]) + '}'
        elif table_name == 'macro_indicators':
            cat = rec.get('category', '').lower()
            if cat == 'supply':
                rec['category'] = 'production'
            elif cat == 'demand':
                rec['category'] = 'consumption'
            else:
                rec['category'] = None  # Set to None if no match
        prepared.append(rec)
    return upload_to_table(table_name, prepared)


def main():
    total = 0
    total += load_flows()
    total += load_table_with_node_links('international_shipments.csv', 'international_shipments', {'origin_short_id':'origin_node_id','destination_short_id':'destination_node_id'})
    total += load_table_with_node_links('macro_indicators.csv', 'macro_indicators')
    total += load_table_with_node_links('incidents_and_events.csv', 'incidents_and_events', {'affected_node_short_id':'affected_node_id'})
    total += load_table_with_node_links('rag_documents.csv', 'rag_documents')
    print('\nFinished uploads. Total records processed (attempted inserts):', total)

if __name__ == '__main__':
    main()
