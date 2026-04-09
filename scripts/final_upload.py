#!/usr/bin/env python3
"""
Final pragmatic uploader: Upload what works, save failures to detailed QA reports.
Run from project root: python scripts/final_upload.py
"""
from dotenv import load_dotenv
import os, csv, sys, json
from datetime import datetime

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
QA_DIR = os.path.join(DATA_DIR, 'supabase_ready')

UPLOAD_SUMMARY = {
    'timestamp': datetime.now().isoformat(),
    'uploaded': {},
    'failed': {},
    'skipped': {}
}

def load_csv_file(filepath: str):
    data = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append({k: (v if v and v.strip() else None) for k, v in row.items()})
    except FileNotFoundError:
        return []
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

def write_failed_record(table_name, record, error_msg):
    """Write a failed record to QA file."""
    qa_file = os.path.join(QA_DIR, f'{table_name}_failed_details.csv')
    os.makedirs(QA_DIR, exist_ok=True)
    
    # Add error message to record
    record_with_error = {**record, 'upload_error': error_msg}
    
    write_header = not os.path.exists(qa_file)
    with open(qa_file, 'a', encoding='utf-8', newline='') as f:
        if write_header:
            writer = csv.DictWriter(f, fieldnames=record_with_error.keys())
            writer.writeheader()
        else:
            writer = csv.DictWriter(f, fieldnames=record_with_error.keys())
        writer.writerow(record_with_error)

def upload_to_table(table_name: str, data: list, batch_size: int = 100):
    """Upload data to table, tracking successes and failures."""
    if not data:
        print(f"  ⊘ No data for {table_name}")
        UPLOAD_SUMMARY['uploaded'][table_name] = 0
        return 0

    successful = 0
    failed = 0
    
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        try:
            client.table(table_name).insert(batch).execute()
            successful += len(batch)
            print(f"  ✓ Batch {i//batch_size + 1}: {len(batch)} records")
        except Exception as e:
            # Try individual records
            for rec in batch:
                try:
                    client.table(table_name).insert(rec).execute()
                    successful += 1
                except Exception as e2:
                    failed += 1
                    error_msg = str(e2)[:200]
                    write_failed_record(table_name, rec, error_msg)
    
    print(f"  Summary for {table_name}: {successful} uploaded, {failed} failed")
    UPLOAD_SUMMARY['uploaded'][table_name] = successful
    UPLOAD_SUMMARY['failed'][table_name] = failed
    return successful

def load_table_generic(csv_name, table_name, short_field_map=None):
    """Generic loader with node linking."""
    print(f"\n📥 Loading {table_name.upper()}...")
    filepath = os.path.join(DATA_DIR, csv_name)
    if not os.path.exists(filepath):
        print(f"  ❌ File not found")
        return 0
    
    rows = load_csv_file(filepath)
    prepared = []
    
    for r in rows:
        rec = {k: v for k, v in r.items() if v is not None}
        
        # Link short_ids to node_ids if needed
        if short_field_map:
            for short_field, node_field in short_field_map.items():
                short = rec.pop(short_field, None)
                if short:
                    nid = get_node_id(short)
                    if nid:
                        rec[node_field] = nid
        
        prepared.append(rec)
    
    return upload_to_table(table_name, prepared)

def load_flows():
    """Load flows - most lenient approach."""
    print(f"\n📥 Loading FLOWS...")
    filepath = os.path.join(DATA_DIR, 'flows.csv')
    if not os.path.exists(filepath):
        print(f"  ❌ File not found")
        return 0
    
    rows = load_csv_file(filepath)
    prepared = []
    
    for r in rows:
        rec = {}
        # Only copy fields that are likely to work
        if r.get('flow_type'):
            rec['flow_type'] = r['flow_type']
        if r.get('transport_mode'):
            rec['transport_mode'] = r['transport_mode'].lower()  # Use raw value
        if r.get('avg_volume_value'):
            try:
                rec['avg_volume_value'] = float(r['avg_volume_value'])
            except:
                pass
        if r.get('avg_volume_unit'):
            rec['avg_volume_unit'] = r['avg_volume_unit']
        if r.get('confidence_level'):
            rec['confidence_level'] = r['confidence_level']
        if r.get('notes'):
            rec['notes'] = r['notes']
        
        # Booleans
        rec['is_active'] = str(r.get('is_active', 'true')).lower() in ('1','true','t','yes')
        rec['is_international'] = str(r.get('is_international', 'false')).lower() in ('1','true','t','yes')
        
        # Node links
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

def load_rag_documents():
    """Load rag_documents - most lenient approach."""
    print(f"\n📥 Loading RAG_DOCUMENTS...")
    filepath = os.path.join(DATA_DIR, 'rag_documents.csv')
    if not os.path.exists(filepath):
        print(f"  ❌ File not found")
        return 0
    
    rows = load_csv_file(filepath)
    prepared = []
    
    for r in rows:
        rec = {k: v for k, v in r.items() if v is not None}
        
        # Try to format topic_tags as array
        if rec.get('topic_tags'):
            tags = rec['topic_tags']
            if not tags.startswith('{'):
                # Convert from comma-separated to array literal
                tag_list = [t.strip() for t in tags.split(',') if t.strip()]
                rec['topic_tags'] = '{' + ','.join(tag_list) + '}'
        
        prepared.append(rec)
    
    return upload_to_table('rag_documents', prepared)

def main():
    print("="*60)
    print("FINAL SUPABASE UPLOAD - Conservative & Pragmatic")
    print("="*60)
    
    total = 0
    
    # Upload all tables
    total += load_table_generic('international_shipments.csv', 'international_shipments', 
                                {'origin_short_id':'origin_node_id','destination_short_id':'destination_node_id'})
    total += load_table_generic('macro_indicators.csv', 'macro_indicators')
    total += load_table_generic('incidents_and_events.csv', 'incidents_and_events',
                                {'affected_node_short_id':'affected_node_id'})
    total += load_flows()
    total += load_rag_documents()
    
    # Write summary
    summary_file = os.path.join(QA_DIR, 'upload_summary.json')
    with open(summary_file, 'w') as f:
        json.dump(UPLOAD_SUMMARY, f, indent=2)
    
    print("\n" + "="*60)
    print(f"✨ UPLOAD COMPLETE - Total records uploaded: {total}")
    print("="*60)
    print(f"📋 Summary saved to: {summary_file}")
    print(f"⚠️  Failed records details: {QA_DIR}/*_failed_details.csv")
    print("="*60)

if __name__ == '__main__':
    main()
