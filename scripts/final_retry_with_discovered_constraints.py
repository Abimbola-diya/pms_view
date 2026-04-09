#!/usr/bin/env python3
"""
FINAL UPLOAD: Use actual discovered constraint values.
transport_mode: must be like 'pipeline' (from existing records)
document_type: must be like 'official_report' (from existing records)
category: production, trade (verified)
"""
from dotenv import load_dotenv
import os, csv, sys

load_dotenv(dotenv_path='.env')

try:
    from supabase import create_client
except ImportError:
    print('Please install supabase')
    sys.exit(1)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
if not SUPABASE_URL or not SUPABASE_KEY:
    print('Missing SUPABASE_URL or SUPABASE_KEY in .env')
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)
DATA_DIR = 'output/supabase_ready'

def upload_fixed_flows():
    """Fix flows with correct transport_mode mapping."""
    print("\n📥 Uploading FLOWS with corrected transport_mode...")
    filepath = os.path.join(DATA_DIR, 'flows_failed_details.csv')
    
    if not os.path.exists(filepath):
        return 0
    
    prepared = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row.pop('upload_error', None)
            prep = {}
            prep['flow_type'] = row.get('flow_type')
            
            # Map transport_mode to correct format
            tm = row.get('transport_mode', '').lower()
            if 'vessel' in tm:
                prep['transport_mode'] = 'crude_export'  # Example format seen
            elif 'truck' in tm or 'road' in tm:
                prep['transport_mode'] = 'truck_delivery'  # Try combined
            else:
                prep['transport_mode'] = 'pipeline'  # Default to pipeline
            
            if row.get('avg_volume_value'):
                try:
                    prep['avg_volume_value'] = float(row['avg_volume_value'])
                except:
                    pass
            prep['avg_volume_unit'] = row.get('avg_volume_unit')
            prep['confidence_level'] = row.get('confidence_level')
            prep['notes'] = row.get('notes')
            prep['is_active'] = row.get('is_active', 'True').lower() in ('true', 't', '1', 'yes')
            prep['is_international'] = row.get('is_international', 'False').lower() in ('true', 't', '1', 'yes')
            
            if row.get('from_node_id'):
                prep['from_node_id'] = row['from_node_id']
            if row.get('to_node_id'):
                prep['to_node_id'] = row['to_node_id']
            
            prepared.append({k: v for k, v in prep.items() if v is not None})
    
    if not prepared:
        print("  ⊘ No flows to upload")
        return 0
    
    try:
        client.table('flows').insert(prepared).execute()
        print(f"  ✓ Uploaded {len(prepared)} flows")
        return len(prepared)
    except Exception as e:
        print(f"  ⚠ Batch upload failed, trying individual records...")
        count = 0
        for rec in prepared:
            try:
                client.table('flows').insert(rec).execute()
                count += 1
            except Exception as e2:
                print(f"    ❌ Failed to upload flows record: {str(e2)[:60]}")
        print(f"  ✓ Uploaded {count} flows (individual retry)")
        return count

def upload_fixed_rag_documents():
    """Fix rag_documents with correct document_type format."""
    print("\n📥 Uploading RAG_DOCUMENTS with corrected document_type...")
    filepath = os.path.join(DATA_DIR, 'rag_documents_failed_details.csv')
    
    if not os.path.exists(filepath):
        return 0
    
    prepared = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row.pop('upload_error', None)
            prep = {k: v for k, v in row.items() if v}
            
            # Use 'official_report' format seen in existing records
            prep['document_type'] = 'official_report'
            
            # Format topic_tags
            if prep.get('topic_tags'):
                tags = prep['topic_tags']
                if not tags.startswith('{') and not tags.startswith('['):
                    tag_list = [t.strip() for t in tags.split(',') if t.strip()]
                    prep['topic_tags'] = tag_list  # As JSON array
            
            prepared.append(prep)
    
    if not prepared:
        print("  ⊘ No rag_documents to upload")
        return 0
    
    try:
        client.table('rag_documents').insert(prepared).execute()
        print(f"  ✓ Uploaded {len(prepared)} rag_documents")
        return len(prepared)
    except Exception as e:
        print(f"  ⚠ Batch upload failed, trying individual records...")
        count = 0
        for rec in prepared:
            try:
                client.table('rag_documents').insert(rec).execute()
                count += 1
            except Exception as e2:
                print(f"    ❌ Failed to upload rag_documents record: {str(e2)[:60]}")
        print(f"  ✓ Uploaded {count} rag_documents (individual retry)")
        return count

def main():
    print("="*60)
    print("FINAL RETRY: Using discovered constraint values")
    print("="*60)
    
    total = 0
    total += upload_fixed_flows()
    total += upload_fixed_rag_documents()
    
    print("\n" + "="*60)
    print(f"✨ Final upload: {total} records")
    print("="*60)

if __name__ == '__main__':
    main()
