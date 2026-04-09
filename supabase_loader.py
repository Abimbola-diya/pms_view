#!/usr/bin/env python3
"""
Direct Supabase Data Loader
Uploads extracted CSV data directly to Supabase using the Supabase Python client

Installation:
  pip install supabase python-dotenv
  
Setup:
  1. Create .env file in project root with:
     SUPABASE_URL=your_project_url
     SUPABASE_KEY=your_anon_key
  
  2. Run this script to load data
"""

import os
import csv
import sys
from datetime import datetime
from dotenv import load_dotenv
from typing import List, Dict
import json

# Load environment variables
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase package not installed")
    print("Install with: pip install supabase python-dotenv")
    sys.exit(1)

# ================================================================
# CONFIGURATION
# ================================================================
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
DATA_DIR = '/home/abimbola/Desktop/PMS_visualization/output'

if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ ERROR: Missing Supabase credentials in .env file")
    print("\nCreate a .env file with:")
    print("  SUPABASE_URL=https://your-project.supabase.co")
    print("  SUPABASE_KEY=your_anon_key")
    print("\nGet these from Supabase Project Settings > API")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ================================================================
# CSV LOADING FUNCTIONS
# ================================================================

def load_csv_file(filepath: str) -> List[Dict]:
    """Load CSV file into list of dicts"""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Clean up None/empty strings
            row = {k: (v if v and v.strip() else None) for k, v in row.items()}
            data.append(row)
    return data


def upload_to_table(table_name: str, data: List[Dict], batch_size: int = 100):
    """Upload data to Supabase table in batches"""
    if not data:
        print(f"  ⊘ No data to upload to {table_name}")
        return 0
    # Attempt to fetch actual table columns from information_schema to avoid insert errors
    def get_table_columns(tbl: str):
        try:
            resp = supabase.table('information_schema.columns').select('column_name').eq('table_schema', 'public').eq('table_name', tbl).execute()
            if resp and getattr(resp, 'data', None):
                return [r.get('column_name') for r in resp.data]
        except Exception:
            pass
        return None

    table_cols = get_table_columns(table_name)
    colset = set(table_cols) if table_cols else None

    total_uploaded = 0
    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]

        # filter out any fields not present in the target table
        if colset is not None:
            filtered_batch = []
            for r in batch:
                filtered_batch.append({k: v for k, v in r.items() if k in colset})
        else:
            filtered_batch = batch

        try:
            response = supabase.table(table_name).insert(filtered_batch, count="exact").execute()
            total_uploaded += len(filtered_batch)
            print(f"  ✓ Uploaded batch {i//batch_size + 1} ({len(filtered_batch)} records)")
        except Exception as e:
            print(f"  ❌ Error uploading batch to {table_name}: {e}")
            # Try individual records to isolate issue
            for record in filtered_batch:
                try:
                    supabase.table(table_name).insert(record, count="exact").execute()
                    total_uploaded += 1
                except Exception as e2:
                    print(f"    Failed record: {record.get('short_id','<no id>')} - {e2}")

    return total_uploaded


def load_nodes():
    """Load nodes data and link to short_id"""
    print("\n📥 Loading NODES...")
    filepath = os.path.join(DATA_DIR, 'nodes.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    
    # Convert boolean strings
    for record in data:
        record['is_active'] = record.get('is_active', 'true').lower() == 'true'
    
    return upload_to_table('nodes', data)


def load_node_metrics():
    """Load node metrics and link to node_id by short_id lookup"""
    print("\n📥 Loading NODE METRICS...")
    filepath = os.path.join(DATA_DIR, 'node_metrics.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    
    # Link node_short_id to node_id dynamically
    for record in data:
        short_id = record.get('node_short_id')
        if short_id:
            try:
                node_response = supabase.table('nodes').select('id').eq('short_id', short_id).execute()
                if node_response.data:
                    record['node_id'] = node_response.data[0]['id']
                # Remove temporary short_id field
                record.pop('node_short_id', None)
            except:
                print(f"    ⚠ Could not find node with short_id: {short_id}")
                record.pop('node_short_id', None)
    
    return upload_to_table('node_metrics', data)


def load_flows():
    """Load flows and link from/to node_id by short_id"""
    print("\n📥 Loading FLOWS...")
    filepath = os.path.join(DATA_DIR, 'flows.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    
    # Convert booleans and link node IDs
    for record in data:
        record['is_active'] = record.get('is_active', 'true').lower() == 'true'
        record['is_international'] = record.get('is_international', 'false').lower() == 'true'
        
        # Link from_node_id
        from_short_id = record.get('from_short_id')
        if from_short_id:
            try:
                node_response = supabase.table('nodes').select('id').eq('short_id', from_short_id).execute()
                if node_response.data:
                    record['from_node_id'] = node_response.data[0]['id']
                record.pop('from_short_id', None)
            except:
                record.pop('from_short_id', None)
        
        # Link to_node_id
        to_short_id = record.get('to_short_id')
        if to_short_id:
            try:
                node_response = supabase.table('nodes').select('id').eq('short_id', to_short_id).execute()
                if node_response.data:
                    record['to_node_id'] = node_response.data[0]['id']
                record.pop('to_short_id', None)
            except:
                record.pop('to_short_id', None)
    
    return upload_to_table('flows', data)


def load_international_shipments():
    """Load international shipments"""
    print("\n📥 Loading INTERNATIONAL SHIPMENTS...")
    filepath = os.path.join(DATA_DIR, 'international_shipments.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    
    # Link node IDs
    for record in data:
        origin_short_id = record.pop('origin_short_id', None)
        if origin_short_id:
            try:
                node_response = supabase.table('nodes').select('id').eq('short_id', origin_short_id).execute()
                if node_response.data:
                    record['origin_node_id'] = node_response.data[0]['id']
            except:
                pass
        
        dest_short_id = record.pop('destination_short_id', None)
        if dest_short_id:
            try:
                node_response = supabase.table('nodes').select('id').eq('short_id', dest_short_id).execute()
                if node_response.data:
                    record['destination_node_id'] = node_response.data[0]['id']
            except:
                pass
    
    return upload_to_table('international_shipments', data)


def load_macro_indicators():
    """Load macro indicators"""
    print("\n📥 Loading MACRO INDICATORS...")
    filepath = os.path.join(DATA_DIR, 'macro_indicators.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    return upload_to_table('macro_indicators', data)


def load_incidents():
    """Load incidents and events"""
    print("\n📥 Loading INCIDENTS & EVENTS...")
    filepath = os.path.join(DATA_DIR, 'incidents_and_events.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    
    # Link node IDs
    for record in data:
        node_short_id = record.pop('affected_node_short_id', None)
        if node_short_id:
            try:
                node_response = supabase.table('nodes').select('id').eq('short_id', node_short_id).execute()
                if node_response.data:
                    record['affected_node_id'] = node_response.data[0]['id']
            except:
                pass
        
        record['is_ongoing'] = record.get('is_ongoing', 'false').lower() == 'true'
    
    return upload_to_table('incidents_and_events', data)


def load_rag_documents():
    """Load RAG documents"""
    print("\n📥 Loading RAG DOCUMENTS...")
    filepath = os.path.join(DATA_DIR, 'rag_documents.csv')
    
    if not os.path.exists(filepath):
        print(f"  ❌ File not found: {filepath}")
        return 0
    
    data = load_csv_file(filepath)
    
    # Process topic tags
    for record in data:
        tags_str = record.get('topic_tags', '')
        if tags_str:
            record['topic_tags'] = [t.strip() for t in tags_str.split(',')]
    
    return upload_to_table('rag_documents', data)


# ================================================================
# MAIN EXECUTION
# ================================================================

def main():
    print("\n" + "="*80)
    print("SUPABASE DATA LOADER - PMS Intelligence Platform")
    print("="*80)
    print(f"\nConnecting to Supabase... {SUPABASE_URL}")
    
    try:
        # Test connection
        health = supabase.table('nodes').select('id').limit(1).execute()
        print("✓ Connected to Supabase successfully\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("Ensure SUPABASE_URL and SUPABASE_KEY are correct in .env file")
        sys.exit(1)
    
    # Load data in order
    total_loaded = 0
    total_loaded += load_nodes()
    total_loaded += load_node_metrics()
    total_loaded += load_flows()
    total_loaded += load_international_shipments()
    total_loaded += load_macro_indicators()
    total_loaded += load_incidents()
    total_loaded += load_rag_documents()
    
    print(f"\n{'='*80}")
    print(f"✓ DATA LOADING COMPLETE")
    print(f"{'='*80}")
    print(f"\nTotal records loaded: {total_loaded}")
    print("\nYour Supabase backend is now populated!")
    print("Frontend can now start querying the data via Supabase API.")


if __name__ == '__main__':
    main()
