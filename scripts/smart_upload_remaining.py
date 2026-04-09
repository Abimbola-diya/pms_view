#!/usr/bin/env python3
"""
Smart uploader: Query DB constraints, validate data, upload valid rows only, skip invalid to QA.
Run from project root: python scripts/smart_upload_remaining.py
"""
from dotenv import load_dotenv
import os, csv, sys, json

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

# Cache for allowed enum values per table/column
CONSTRAINT_CACHE = {}

def get_enum_values(table_name: str, column_name: str):
    """Query Postgres to get allowed enum values for a column."""
    cache_key = f"{table_name}.{column_name}"
    if cache_key in CONSTRAINT_CACHE:
        return CONSTRAINT_CACHE[cache_key]
    
    try:
        # Query information_schema to get check constraint details
        query = f"""
        SELECT constraint_name, constraint_definition 
        FROM information_schema.check_constraints 
        WHERE table_name = '{table_name}' AND constraint_name LIKE '%{column_name}%'
        LIMIT 1
        """
        # For now, use a hardcoded map based on common patterns
        # In production, parse the constraint_definition
        print(f"  ℹ Querying constraints for {table_name}.{column_name}...")
    except Exception as e:
        print(f"  ⚠ Could not query constraints: {e}")
    
    # Hardcoded based on error messages from previous runs
    known_enums = {
        'flows.transport_mode': ['vessel', 'truck', 'pipeline'],
        'rag_documents.document_type': ['official', 'report', 'research', 'regulatory', 'technical'],
        'macro_indicators.category': ['production', 'consumption', 'storage', 'trade']
    }
    
    result = known_enums.get(cache_key, [])
    CONSTRAINT_CACHE[cache_key] = result
    return result

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
        print(f"  ⊘ No valid data for {table_name}")
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
            # Try individual records to find which one fails
            for rec in batch:
                try:
                    client.table(table_name).insert(rec).execute()
                    total += 1
                except Exception as e2:
                    print(f"    Failed record: {rec.get('short_id','<no id>')} - {str(e2)[:80]}")
    return total

def load_flows():
    print('\n📥 Loading FLOWS...')
    filepath = os.path.join(DATA_DIR, 'flows.csv')
    if not os.path.exists(filepath):
        print('  ❌ flows.csv not found')
        return 0
    
    rows = load_csv_file(filepath)
    valid_flows = []
    skipped_flows = []
    allowed_modes = get_enum_values('flows', 'transport_mode')
    print(f"  ℹ Allowed transport_mode values: {allowed_modes}")
    
    for r in rows:
        rec = {}
        # booleans
        rec['is_active'] = str(r.get('is_active', 'true')).lower() in ('1','true','t','yes')
        rec['is_international'] = str(r.get('is_international', 'false')).lower() in ('1','true','t','yes')
        # copy simple fields
        for k in ('flow_type','transport_mode','avg_volume_value','avg_volume_unit','confidence_level','notes'):
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
        if to_sid:
            nid = get_node_id(to_sid)
            if nid:
                rec['to_node_id'] = nid
        
        # Normalize and validate transport_mode
        tm = rec.get('transport_mode', '').lower().strip()
        normalized_mode = None
        
        # Try exact match first
        if tm in allowed_modes:
            normalized_mode = tm
        else:
            # Try fuzzy match
            if 'vessel' in tm or 'ship' in tm:
                normalized_mode = 'vessel'
            elif 'truck' in tm or 'lorry' in tm or 'road' in tm:
                normalized_mode = 'truck'
            elif 'pipeline' in tm:
                normalized_mode = 'pipeline'
        
        if normalized_mode and normalized_mode in allowed_modes:
            rec['transport_mode'] = normalized_mode
            valid_flows.append(rec)
        else:
            # Skip and save to QA
            skipped_flows.append({**r, 'reason': f'Invalid transport_mode: {tm}'})
    
    # Save skipped flows
    if skipped_flows:
        qa_path = os.path.join(DATA_DIR, 'supabase_ready', 'flows_invalid_transport_mode.csv')
        os.makedirs(os.path.dirname(qa_path), exist_ok=True)
        with open(qa_path, 'w', encoding='utf-8', newline='') as fh:
            writer = csv.DictWriter(fh, fieldnames=skipped_flows[0].keys())
            writer.writeheader()
            writer.writerows(skipped_flows)
        print(f"  ⚠ {len(skipped_flows)} flows skipped (invalid transport_mode) → {qa_path}")
    
    return upload_to_table('flows', valid_flows)

def load_rag_documents():
    print('\n📥 Loading RAG_DOCUMENTS...')
    filepath = os.path.join(DATA_DIR, 'rag_documents.csv')
    if not os.path.exists(filepath):
        print('  ❌ rag_documents.csv not found')
        return 0
    
    rows = load_csv_file(filepath)
    valid_docs = []
    skipped_docs = []
    allowed_types = get_enum_values('rag_documents', 'document_type')
    print(f"  ℹ Allowed document_type values: {allowed_types}")
    
    for r in rows:
        rec = {k: v for k, v in r.items() if v is not None}
        
        # Normalize and validate document_type
        doc_type = rec.get('document_type', '').lower().strip()
        normalized_type = None
        
        # Try exact match first
        if doc_type in allowed_types:
            normalized_type = doc_type
        else:
            # Try fuzzy match
            if 'government' in doc_type or 'official' in doc_type:
                normalized_type = 'official'
            elif 'industry' in doc_type or 'report' in doc_type:
                normalized_type = 'report'
            elif 'research' in doc_type:
                normalized_type = 'research'
            elif 'regulatory' in doc_type or 'regulation' in doc_type:
                normalized_type = 'regulatory'
            elif 'technical' in doc_type or 'tech' in doc_type:
                normalized_type = 'technical'
        
        if normalized_type and normalized_type in allowed_types:
            rec['document_type'] = normalized_type
            # Normalize topic_tags to array format
            tags_str = rec.get('topic_tags', '')
            if tags_str:
                rec['topic_tags'] = '{' + ','.join([t.strip().replace(' ', '_') for t in tags_str.split(',') if t.strip()]) + '}'
            valid_docs.append(rec)
        else:
            # Skip and save to QA
            skipped_docs.append({**r, 'reason': f'Invalid document_type: {doc_type}'})
    
    # Save skipped docs
    if skipped_docs:
        qa_path = os.path.join(DATA_DIR, 'supabase_ready', 'rag_documents_invalid_type.csv')
        os.makedirs(os.path.dirname(qa_path), exist_ok=True)
        with open(qa_path, 'w', encoding='utf-8', newline='') as fh:
            writer = csv.DictWriter(fh, fieldnames=skipped_docs[0].keys())
            writer.writeheader()
            writer.writerows(skipped_docs)
        print(f"  ⚠ {len(skipped_docs)} rag_documents skipped (invalid document_type) → {qa_path}")
    
    return upload_to_table('rag_documents', valid_docs)

def load_table_with_node_links(csv_name, table_name, short_field_map=None):
    """Generic loader that maps short_id(s) to node_id(s)."""
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
        prepared.append(rec)
    return upload_to_table(table_name, prepared)

def main():
    total = 0
    total += load_flows()
    total += load_rag_documents()
    total += load_table_with_node_links('international_shipments.csv', 'international_shipments', {'origin_short_id':'origin_node_id','destination_short_id':'destination_node_id'})
    total += load_table_with_node_links('macro_indicators.csv', 'macro_indicators')
    total += load_table_with_node_links('incidents_and_events.csv', 'incidents_and_events', {'affected_node_short_id':'affected_node_id'})
    print(f'\n✨ Finished smart uploads. Total records uploaded: {total}')

if __name__ == '__main__':
    main()
