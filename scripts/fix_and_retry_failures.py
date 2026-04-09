#!/usr/bin/env python3
"""
Quick fix for the 4 failed records: Normalize constraint values and retry.
Run from project root: python scripts/fix_and_retry_failures.py
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

def fix_flows_failures():
    """Fix 2 flows with vessel_route -> vessel."""
    print("\n📥 Fixing FLOWS failures...")
    filepath = os.path.join(DATA_DIR, 'flows_failed_details.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    fixed = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Remove the upload_error column
            row.pop('upload_error', None)
            # Fix transport_mode
            if row.get('transport_mode') == 'vessel_route':
                row['transport_mode'] = 'vessel'
            fixed.append(row)
    
    if not fixed:
        print("  ⊘ No flows to fix")
        return 0
    
    # Convert to proper types
    prepared = []
    for rec in fixed:
        prep = {}
        prep['flow_type'] = rec.get('flow_type')
        prep['transport_mode'] = rec['transport_mode']  # Fixed value
        if rec.get('avg_volume_value'):
            try:
                prep['avg_volume_value'] = float(rec['avg_volume_value'])
            except:
                pass
        prep['avg_volume_unit'] = rec.get('avg_volume_unit')
        prep['confidence_level'] = rec.get('confidence_level')
        prep['notes'] = rec.get('notes')
        
        # Booleans
        prep['is_active'] = rec.get('is_active', 'True').lower() in ('true', 't', '1', 'yes', 'true')
        prep['is_international'] = rec.get('is_international', 'False').lower() in ('true', 't', '1', 'yes', 'true')
        
        # Node IDs
        if rec.get('from_node_id'):
            prep['from_node_id'] = rec['from_node_id']
        if rec.get('to_node_id'):
            prep['to_node_id'] = rec['to_node_id']
        
        prepared.append({k: v for k, v in prep.items() if v is not None})
    
    # Upload
    try:
        client.table('flows').insert(prepared).execute()
        print(f"  ✓ Fixed and uploaded {len(prepared)} flows")
        return len(prepared)
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0

def fix_macro_indicators_failures():
    """Fix 1 macro indicator with supply -> production."""
    print("\n📥 Fixing MACRO_INDICATORS failures...")
    filepath = os.path.join(DATA_DIR, 'macro_indicators_failed_details.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    fixed = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Remove the upload_error column
            row.pop('upload_error', None)
            # Fix category
            if row.get('category') == 'supply':
                row['category'] = 'production'
            fixed.append(row)
    
    if not fixed:
        print("  ⊘ No indicators to fix")
        return 0
    
    # Prepare records
    prepared = []
    for rec in fixed:
        prep = {k: v for k, v in rec.items() if v}
        if prep.get('value'):
            try:
                prep['value'] = float(prep['value'])
            except:
                pass
        prepared.append(prep)
    
    # Upload
    try:
        client.table('macro_indicators').insert(prepared).execute()
        print(f"  ✓ Fixed and uploaded {len(prepared)} macro indicators")
        return len(prepared)
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0

def fix_rag_documents_failures():
    """Fix 1 rag document with government_data -> official."""
    print("\n📥 Fixing RAG_DOCUMENTS failures...")
    filepath = os.path.join(DATA_DIR, 'rag_documents_failed_details.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    fixed = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Remove the upload_error column
            row.pop('upload_error', None)
            # Fix document_type
            if row.get('document_type') == 'government_data':
                row['document_type'] = 'official'
            fixed.append(row)
    
    if not fixed:
        print("  ⊘ No documents to fix")
        return 0
    
    # Prepare records
    prepared = []
    for rec in fixed:
        prep = {k: v for k, v in rec.items() if v}
        # Format topic_tags if present
        if prep.get('topic_tags'):
            tags = prep['topic_tags']
            if not tags.startswith('{'):
                tag_list = [t.strip() for t in tags.split(',') if t.strip()]
                prep['topic_tags'] = '{' + ','.join(tag_list) + '}'
        prepared.append(prep)
    
    # Upload
    try:
        client.table('rag_documents').insert(prepared).execute()
        print(f"  ✓ Fixed and uploaded {len(prepared)} rag documents")
        return len(prepared)
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return 0

def main():
    print("="*60)
    print("FIXING & RETRYING 4 FAILED RECORDS")
    print("="*60)
    
    total = 0
    total += fix_flows_failures()
    total += fix_macro_indicators_failures()
    total += fix_rag_documents_failures()
    
    print("\n" + "="*60)
    print(f"✨ Fixed and uploaded: {total} records")
    print("="*60)

if __name__ == '__main__':
    main()
