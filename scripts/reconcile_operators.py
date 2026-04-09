#!/usr/bin/env python3
"""Reconcile local extracted operator candidates with authoritative lists.

Usage: python scripts/reconcile_operators.py

Outputs written to `output/reconciliation/operator_matches.csv` and
`output/reconciliation/canonical_operators.csv`.
"""
import os
from difflib import SequenceMatcher
import pandas as pd


def normalize_name(s: str) -> str:
    import re
    if s is None:
        return ""
    s = str(s).lower()
    s = re.sub(r"[\s\-\._,;/\\|]+", " ", s)
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = s.strip()
    return s


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


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    local_path = os.path.join(repo_root, "output", "extracted_entities", "clean_operators.csv")
    auth_path = os.path.join(repo_root, "data", "authoritative_lists.csv")
    out_dir = os.path.join(repo_root, "output", "reconciliation")
    os.makedirs(out_dir, exist_ok=True)

    local_df = pd.read_csv(local_path, dtype=str, keep_default_na=False)
    auth_df = pd.read_csv(auth_path, dtype=str, keep_default_na=False)

    auth_names = auth_df['name'].tolist()

    rows = []
    canonical = []
    for _, r in local_df.iterrows():
        local_name = r.get('normalized_key') or r.get('name_variants') or ''
        source_files = r.get('source_files', '')
        detected_columns = r.get('detected_columns', '')
        best, score = best_match(local_name, auth_names)
        score = float(score)
        if best:
            matched_row = auth_df[auth_df['name'] == best].iloc[0]
            matched_type = matched_row.get('type', '')
            matched_url = matched_row.get('source_url', '')
        else:
            matched_type = ''
            matched_url = ''
        if score >= 0.9:
            confidence = 'high'
        elif score >= 0.7:
            confidence = 'medium'
        else:
            confidence = 'low'

        rows.append({
            'local_name': local_name,
            'source_files': source_files,
            'detected_columns': detected_columns,
            'matched_name': best or '',
            'matched_type': matched_type,
            'matched_source_url': matched_url,
            'score': round(score, 4),
            'confidence': confidence,
        })

        if confidence in ('high', 'medium') and best:
            canonical.append({
                'short_id': normalize_name(best).replace(' ', '_')[:32],
                'name': best,
                'type': matched_type or 'operator',
                'primary_source_url': matched_url,
                'confidence_level': confidence,
            })
        else:
            canonical.append({
                'short_id': normalize_name(local_name).replace(' ', '_')[:32],
                'name': local_name,
                'type': 'operator',
                'primary_source_url': '',
                'confidence_level': confidence,
            })

    matches_df = pd.DataFrame(rows)
    canonical_df = pd.DataFrame(canonical).drop_duplicates(subset=['short_id'])

    matches_out = os.path.join(out_dir, 'operator_matches.csv')
    canon_out = os.path.join(out_dir, 'canonical_operators.csv')
    matches_df.to_csv(matches_out, index=False)
    canonical_df.to_csv(canon_out, index=False)

    print('Wrote:', matches_out)
    print('Wrote:', canon_out)


if __name__ == '__main__':
    main()
