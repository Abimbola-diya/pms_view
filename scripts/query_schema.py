#!/usr/bin/env python3
"""
Query Supabase schema to get actual allowed values for check constraints.
"""
from dotenv import load_dotenv
import os, sys

load_dotenv(dotenv_path='.env')

try:
    from supabase import create_client
    import psycopg2
except ImportError:
    print('Please install supabase and psycopg2')
    sys.exit(1)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('Missing SUPABASE_URL or SUPABASE_KEY in .env')
    sys.exit(1)

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Query the schema for check constraints
def get_check_constraint_definition(table_name, constraint_name):
    """Query check constraint definition."""
    try:
        # Use RPC or direct SQL query via supabase-py
        result = client.rpc('exec_sql', {
            'query': f"SELECT constraint_definition FROM information_schema.check_constraints WHERE table_name='{table_name}' AND constraint_name='{constraint_name}'"
        }).execute()
        return result
    except Exception as e:
        print(f"RPC failed: {e}")
        return None

# Try to get flows check constraint
print("Attempting to query flows table schema...")
try:
    result = client.table('flows').select('*').limit(1).execute()
    print("✓ flows table exists")
except Exception as e:
    print(f"✗ Error querying flows: {e}")

# Try to get rag_documents schema
print("\nAttempting to query rag_documents table schema...")
try:
    result = client.table('rag_documents').select('*').limit(1).execute()
    print("✓ rag_documents table exists")
except Exception as e:
    print(f"✗ Error querying rag_documents: {e}")

# Try to query enum type values directly
print("\nAttempting to list available enums...")
try:
    result = client.rpc('exec_sql', {
        'query': "SELECT typname, enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname IN ('transport_mode', 'document_type', 'category') ORDER BY typname, enumlabel"
    }).execute()
    print(f"Enums: {result}")
except Exception as e:
    print(f"Query failed (likely RPC not available): {e}")
    print("\nNote: We need to check the actual DB constraints. This requires:")
    print("1. Access to Supabase SQL Editor to run: SELECT * FROM information_schema.check_constraints WHERE table_name IN ('flows', 'rag_documents')")
    print("2. Or query: SELECT * FROM pg_type WHERE typname IN ('transport_mode', 'document_type')")
