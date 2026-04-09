#!/usr/bin/env python3
"""
Clean and deduplicate operator-like names extracted earlier.
Writes `output/extracted_entities/clean_operators.csv`.
"""
from pathlib import Path
import pandas as pd
import re

ROOT = Path(__file__).resolve().parents[1]
IN_FILE = ROOT / 'output' / 'extracted_entities' / 'extracted_operators.csv'
OUT_FILE = ROOT / 'output' / 'extracted_entities' / 'clean_operators.csv'

COMMON_EXCLUDE = set(['total','blend total','crude oil','condensate','liquid type','daily average of liquid (bopd)'])

COMPANY_KEYWORDS = re.compile(r"\b(limited|ltd|plc|co\b|company|holdings|holding|energy|petroleum|oil|gas|exploration|production|e&p|e & p|e and p|services|international|shipping|maritime|logistics|marine|nnpc|seplat|aiteo|oando|shell|chevron|exxon|total|eni|conoil|dangote|integra|tepng|first e&p|firste&p)\b", flags=re.I)


def normalize_name(n: str) -> str:
    s = str(n).strip()
    s = re.sub(r"\(|\)|\[|\]|\'|\"", "", s)
    s = re.sub(r"\s+", " ", s)
    s = s.strip()
    return s


def looks_like_company(name: str) -> bool:
    if not name or len(name) < 3:
        return False
    s = name.strip()
    if s.isnumeric():
        return False
    if s.lower() in COMMON_EXCLUDE:
        return False
    # strong signal: contains company keywords
    if COMPANY_KEYWORDS.search(s):
        return True
    # heuristic: contains more than one capitalised word or contains '&' or ','
    if '&' in s or ',' in s:
        return True
    # heuristic: multiple words and at least one is titlecased
    parts = s.split()
    if len(parts) >= 2 and any(p.isalpha() and (p[0].isupper() or p.isupper()) for p in parts):
        # filter out field names like 'BONGA' which are single-word field names
        # require at least one keyword-like token or common company suffix
        for kw in ['limited','ltd','plc','services','group','energy','petroleum','marine','shipping','logistics','resources','international','company']:
            if kw in s.lower():
                return True
    return False


def main():
    if not IN_FILE.exists():
        print("Input file not found:", IN_FILE)
        return
    df = pd.read_csv(IN_FILE)
    df['name_clean'] = df['name'].astype(str).map(normalize_name)
    df['is_company_like'] = df['name_clean'].map(looks_like_company)

    companies = df[df['is_company_like']].copy()
    # normalize duplicates by lowercased stripped
    companies['norm'] = companies['name_clean'].str.lower().str.replace(r'[^a-z0-9 ]+', '', regex=True).str.strip()

    grouped = companies.groupby('norm').agg({
        'name_clean': lambda s: sorted(set(s))[:3],
        'source_files': lambda s: ';'.join(sorted(set(';'.join(s).split(';')))),
        'detected_columns': lambda s: ';'.join(sorted(set(';'.join(s).split(';'))))
    }).reset_index()

    # write
    out_rows = []
    for _, r in grouped.iterrows():
        out_rows.append({
            'name_variants': '|'.join(r['name_clean']),
            'normalized_key': r['norm'],
            'source_files': r['source_files'],
            'detected_columns': r['detected_columns']
        })
    pd.DataFrame(out_rows).to_csv(OUT_FILE, index=False)
    print(f"Wrote {len(out_rows)} candidate companies to {OUT_FILE}")

if __name__ == '__main__':
    main()
