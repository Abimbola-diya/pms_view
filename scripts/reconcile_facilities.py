#!/usr/bin/env python3
"""Reconcile extracted facility lists (refineries, terminals, jetties, pipelines, depots)
with the authoritative_lists.csv and emit match outputs.

Usage: python scripts/reconcile_facilities.py
"""
import os
import glob
from difflib import SequenceMatcher
import pandas as pd


def normalize_name(s: str) -> str:
    import re
    if s is None:
        return ""
    s = str(s).lower()
    s = re.sub(r"[\s\-\._,;/\\|]+", " ", s)
    s = re.sub(r"[^a-z0-9 ]", "", s)
    return s.strip()


def best_match(local: str, auth_names: list):
    local_n = normalize_name(local)
    best = None
    best_score = 0.0
    for a in auth_names:
        a_n = normalize_name(a)
        if a_n == local_n and a_n != "":
            return a, 1.0
        score = SequenceMatcher(None, local_n, a_n).ratio()
        if score > best_score:
            best_score = score
            best = a
    return best, best_score


def find_name_column(df: pd.DataFrame) -> str:
    for c in ['normalized_key', 'name', 'name_variants', 'entity', 'label']:
        if c in df.columns:
            return c
    # fallback to first column
    return df.columns[0]


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    extracted_dir = os.path.join(repo_root, 'output', 'extracted_entities')
    auth_path = os.path.join(repo_root, 'data', 'authoritative_lists.csv')
    out_dir = os.path.join(repo_root, 'output', 'reconciliation')
    os.makedirs(out_dir, exist_ok=True)

    auth_df = pd.read_csv(auth_path, dtype=str, keep_default_na=False)

    entity_files = {
        'refinery': 'extracted_refineries.csv',
        'terminal': 'extracted_terminals.csv',
        'jetty': 'extracted_jetties.csv',
        'pipeline': 'extracted_pipelines.csv',
        'depot': 'extracted_depots.csv',
    }

    rows = []
    canonical = []

    for ent_type, fname in entity_files.items():
        fpath = os.path.join(extracted_dir, fname)
        if not os.path.exists(fpath):
            continue
        # skip empty files
        with open(fpath, 'r', encoding='utf-8') as fh:
            content = fh.read().strip()
        if not content:
            print('Skipping empty file:', fpath)
            continue
        try:
            df = pd.read_csv(fpath, dtype=str, keep_default_na=False)
        except pd.errors.EmptyDataError:
            print('Skipping empty/unreadable CSV:', fpath)
            continue
        name_col = find_name_column(df)
        auth_filtered = auth_df[auth_df['type'] == ent_type]
        auth_names = auth_filtered['name'].tolist()

        for _, r in df.iterrows():
            local_name = r.get(name_col, '')
            source_files = r.get('source_files', '') if 'source_files' in r else fname
            best, score = best_match(local_name, auth_names)
            score = float(score)
            if best:
                matched_row = auth_filtered[auth_filtered['name'] == best].iloc[0]
                matched_url = matched_row.get('source_url', '')
            else:
                matched_url = ''
            if score >= 0.9:
                confidence = 'high'
            elif score >= 0.7:
                confidence = 'medium'
            else:
                confidence = 'low'

            rows.append({
                'extracted_file': fname,
                'local_name': local_name,
                'matched_name': best or '',
                'matched_type': ent_type,
                'matched_source_url': matched_url,
                'score': round(score, 4),
                'confidence': confidence,
            })

            canonical.append({
                'short_id': normalize_name(best or local_name).replace(' ', '_')[:32],
                'name': best or local_name,
                'type': ent_type,
                'primary_source_url': matched_url,
                'confidence_level': confidence,
            })

    matches_df = pd.DataFrame(rows)
    canon_df = pd.DataFrame(canonical).drop_duplicates(subset=['short_id'])
    matches_df.to_csv(os.path.join(out_dir, 'facility_matches.csv'), index=False)
    canon_df.to_csv(os.path.join(out_dir, 'canonical_facilities.csv'), index=False)

    print('Wrote facility_matches.csv and canonical_facilities.csv to', out_dir)


if __name__ == '__main__':
    main()
