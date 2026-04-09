#!/usr/bin/env python3
"""
Query successful records to understand schema constraints.
"""
from dotenv import load_dotenv
import os, sys

load_dotenv(dotenv_path='.env')

try:
    from supabase import create_client
except ImportError:
    print('Please install supabase')
    sys.exit(1)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("="*60)
print("QUERYING EXISTING RECORDS TO UNDERSTAND SCHEMA")
print("="*60)

# Get a successful flows record
print("\n📊 Sample FLOWS records (should be successful):")
try:
    resp = client.table('flows').select('*').limit(3).execute()
    if resp.data:
        for i, rec in enumerate(resp.data, 1):
            print(f"\n  Record {i}:")
            for k, v in rec.items():
                if k not in ['id', 'created_at', 'updated_at']:
                    print(f"    {k}: {v}")
    else:
        print("  ⊘ No flows found in DB")
except Exception as e:
    print(f"  ❌ Error querying flows: {e}")

# Get a successful rag_documents record
print("\n📊 Sample RAG_DOCUMENTS records (should be successful):")
try:
    resp = client.table('rag_documents').select('*').limit(3).execute()
    if resp.data:
        for i, rec in enumerate(resp.data, 1):
            print(f"\n  Record {i}:")
            for k, v in rec.items():
                if k not in ['id', 'created_at', 'updated_at']:
                    print(f"    {k}: {v}")
    else:
        print("  ⊘ No rag_documents found in DB")
except Exception as e:
    print(f"  ❌ Error querying rag_documents: {e}")

# Get a successful macro_indicators record
print("\n📊 Sample MACRO_INDICATORS records (should be successful):")
try:
    resp = client.table('macro_indicators').select('*').limit(3).execute()
    if resp.data:
        for i, rec in enumerate(resp.data, 1):
            print(f"\n  Record {i}:")
            for k, v in rec.items():
                if k not in ['id', 'created_at', 'updated_at']:
                    print(f"    {k}: {v}")
    else:
        print("  ⊘ No macro_indicators found in DB")
except Exception as e:
    print(f"  ❌ Error querying macro_indicators: {e}")

print("\n" + "="*60)
