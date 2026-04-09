#!/usr/bin/env python3
"""
Conservative uploader: Upload only tables that don't have constraint conflicts.
Macro indicators and rag_documents need category/type mapping - do that first.
Run from project root: python scripts/conservative_upload.py
"""
from dotenv import load_dotenv
import os, csv, sys

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
            print(f"  ❌ Batch error for {table_name}: {str(e)[:100]}")
            for rec in batch:
                try:
                    client.table(table_name).insert(rec).execute()
                    total += 1
                except Exception as e2:
                    # Write failed record to QA file
                    qa_path = os.path.join(DATA_DIR, 'supabase_ready', f'{table_name}_failed.csv')
                    os.makedirs(os.path.dirname(qa_path), exist_ok=True)
                    write_header = not os.path.exists(qa_path)
                    with open(qa_path, 'a', encoding='utf-8', newline='') as fh:
                        writer = csv.DictWriter(fh, fieldnames=rec.keys())
                        if write_header:
                            writer.writeheader()
                        writer.writerow(rec)
    return total

def load_macro_indicators():
    print('\n📥 Loading MACRO_INDICATORS...')
    filepath = os.path.join(DATA_DIR, 'macro_indicators.csv')
    if not os.path.exists(filepath):
        print('  ❌ File not found')
        return 0
    
    rows = load_csv_file(filepath)
    prepared = []
    skipped = []
    
    # Map allowed categories
    category_map = {
        'supply': 'production',
        'production': 'production',
        'demand': 'consumption',
        'consumption': 'consumption',
        'storage': 'storage',
        'trade': 'trade'
    }
    
    for r in rows:
        rec = {k: v for k, v in r.items() if v is not None}
        cat = rec.get('category', '').lower().strip()
        
        if cat in category_map:
            rec['category'] = category_map[cat]
            prepared.append(rec)
        else:
            skipped.append({**r, 'reason': f'Unknown category: {cat}'})
    
    if skipped:
        qa_path = os.path.join(DATA_DIR, 'supabase_ready', 'macro_indicators_skipped.csv')
        os.makedirs(os.path.dirname(qa_path), exist_ok=True)
        with open(qa_path, 'w', encoding='utf-8', newline='') as fh:
            writer = csv.DictWriter(fh, fieldnames=skipped[0].keys())
            writer.writeheader()
            writer.writerows(skipped)
        print(f"  ⚠ {len(skipped)} skipped → {qa_path}")
    
    return upload_to_table('macro_indicators', prepared)

def load_rag_documents():
    print('\n📥 Loading RAG_DOCUMENTS...')
    filepath = os.path.join(DATA_DIR, 'rag_documents.csv')
    if not os.path.exists(filepath):
        print('  ❌ File not found')
        return 0
    
    rows = load_csv_file(filepath)
    prepared = []
    skipped = []
    
    # Map allowed types - infer from error messages seen earlier
    type_map = {
        'official': 'official',
        'government_data': 'official',
        'report': 'report',
        'industry_report': 'report',
        'research': 'research',
        'regulatory': 'regulatory',
        'technical': 'technical',
    }
    
    for r in rows:
        rec = {k: v for k, v in r.items() if v is not None}
        doc_type = rec.get('document_type', '').lower().strip()
        
        if doc_type in type_map:
            rec['document_type'] = type_map[doc_type]
            # Normalize topic_tags to array format
            tags_str = rec.get('topic_tags', '')
            if tags_str:
                rec['topic_tags'] = '{' + ','.join([t.strip().replace(' ', '_') for t in tags_str.split(',') if t.strip()]) + '}'
            prepared.append(rec)
        else:
            skipped.append({**r, 'reason': f'Unknown document_type: {doc_type}'})
    
    if skipped:
        qa_path = os.path.join(DATA_DIR, 'supabase_ready', 'rag_documents_skipped.csv')
        os.makedirs(os.path.dirname(qa_path), exist_ok=True)
        with open(qa_path, 'w', encoding='utf-8', newline='') as fh:
            writer = csv.DictWriter(fh, fieldnames=skipped[0].keys())
            writer.writeheader()
            writer.writerows(skipped)
        print(f"  ⚠ {len(skipped)} skipped → {qa_path}")
    
    return upload_to_table('rag_documents', prepared)

def load_flows_conservative():
    print('\n📥 Loading FLOWS (conservative - skipping if constraint issues)...')
    filepath = os.path.join(DATA_DIR, 'flows.csv')
    if not os.path.exists(filepath):
        print('  ❌ File not found')
        return 0
    
    rows = load_csv_file(filepath)
    prepared = []
    
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
        
        prepared.append(rec)
    
    return upload_to_table('flows', prepared)

def main():
    total = 0
    total += load_macro_indicators()
    total += load_rag_documents()
    total += load_flows_conservative()
    print(f'\n✨ Conservative uploads completed. Total: {total}')

if __name__ == '__main__':
    main()
