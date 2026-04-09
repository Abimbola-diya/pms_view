#!/usr/bin/env python3
"""
Extract entity names (operators, refineries, terminals, jetties, pipelines, depots, vessels)
from all CSV/XLSX files under `PMS data` and write summary CSVs to `output/extracted_entities/`.
"""
import sys
from pathlib import Path
import pandas as pd
import re
import json

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "PMS data"
OUT_DIR = ROOT / "output" / "extracted_entities"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Entity keyword maps (column name heuristics)
ENTITY_KEYWORDS = {
    "operators": [
        "operator", "operator_name", "company", "company_name", "owner",
        "owners", "ownership", "lessee", "licensee", "licencee", "licence",
        "licensee", "contractor", "eandp", "concession_owner", "joint venture",
        "joint_venture", "partner", "partners", "buyer", "seller", "consignee",
    ],
    "refineries": ["refinery", "refineries", "refinery_name", "plant", "refining"],
    "terminals": ["terminal", "terminals", "terminal_name", "port", "export_terminal"],
    "jetties": ["jetty", "jetty_name", "berth", "berths"],
    "depots": ["depot", "depots", "storage", "terminal_storage", "tankfarm", "tank farm"],
    "pipelines": ["pipeline", "line", "flowline", "trunkline", "productline", "mainline"],
    "wells": ["well", "well_name", "well_no", "wellbore"],
    "vessels": ["vessel", "ship", "vessel_name", "vessel_id", "imo"]
}

SKIP_TOKENS = set(["nan", "n/a", "na", "-", "", "none"])

# Storage: entity_type -> name -> {sources:set, columns:set, examples:set}
entities = {k: {} for k in ENTITY_KEYWORDS.keys()}

def normalize_val(v):
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    s2 = re.sub(r"\s+", " ", s)
    s2 = s2.replace('\u00a0', ' ').strip()
    if s2.lower() in SKIP_TOKENS:
        return None
    return s2


def add_entity(entity_type, name, source_file, column):
    if name is None:
        return
    d = entities[entity_type].setdefault(name, {"sources": set(), "columns": set(), "examples": set()})
    d["sources"].add(str(source_file))
    d["columns"].add(column)
    if len(d["examples"]) < 3:
        d["examples"].add(name)


def inspect_df(df, source_file, sheet_name=None):
    cols = list(df.columns)
    cols_str = [str(c).strip() for c in cols]
    for col in cols_str:
        col_low = col.lower()
        # read values safely
        try:
            ser = df[col]
        except Exception:
            # sometimes columns are duplicated or problematic
            continue
        # candidate values
        try:
            vals = ser.dropna().astype(str).map(lambda x: x.strip()).unique().tolist()
        except Exception:
            vals = []
        # limit checks: skip columns with thousands of unique values for entities like free-text descriptions
        unique_count = len(vals)
        for ent_type, keywords in ENTITY_KEYWORDS.items():
            if any(k in col_low for k in keywords):
                # iterate values and add
                for v in vals[:500]:
                    n = normalize_val(v)
                    if n:
                        add_entity(ent_type, n, source_file.name, col)
            else:
                # Additional heuristic: if column contains 'company' anywhere in header or sample values
                if ent_type == 'operators':
                    # check sample values for uppercase words (company names) or keywords
                    sample = ", ".join(vals[:20])
                    if re.search(r"\b(ltd|limited|plc|company|co\.|co\b|oil|services|engineering)\b", sample, flags=re.I):
                        for v in vals[:300]:
                            n = normalize_val(v)
                            if n:
                                add_entity('operators', n, source_file.name, col)


def process_file(p: Path):
    suffix = p.suffix.lower()
    try:
        if suffix in ['.xlsx', '.xls']:
            # read all sheets
            try:
                sheets = pd.read_excel(p, sheet_name=None, engine='openpyxl')
            except Exception:
                try:
                    sheets = pd.read_excel(p, sheet_name=None)
                except Exception as e:
                    print(f"[WARN] Could not read {p}: {e}")
                    return
            for sheet_name, df in sheets.items():
                if not isinstance(df, pd.DataFrame):
                    continue
                if df.empty:
                    continue
                inspect_df(df, p, sheet_name)
        elif suffix == '.csv':
            try:
                df = pd.read_csv(p, encoding='utf-8', low_memory=False)
            except Exception:
                try:
                    df = pd.read_csv(p, encoding='latin-1', low_memory=False)
                except Exception as e:
                    print(f"[WARN] Could not read CSV {p}: {e}")
                    return
            if df.empty:
                return
            inspect_df(df, p, None)
        else:
            # skip other types (pdfs etc.)
            return
    except Exception as e:
        print(f"[ERROR] Exception processing {p}: {e}")


def main():
    files = list(DATA_DIR.iterdir()) if DATA_DIR.exists() else []
    print(f"Scanning {len(files)} files in {DATA_DIR}")
    for f in files:
        if f.is_file() and f.suffix.lower() in ['.csv', '.xlsx', '.xls']:
            print(f"Processing: {f.name}")
            process_file(f)

    # write outputs
    summary = {}
    for ent_type, d in entities.items():
        rows = []
        for name, meta in sorted(d.items(), key=lambda x: (-len(x[1]['sources']), x[0])):
            rows.append({
                'name': name,
                'detected_type': ent_type,
                'source_files': ';'.join(sorted(meta['sources'])),
                'detected_columns': ';'.join(sorted(meta['columns'])),
                'example_values': ';'.join(sorted(list(meta['examples'])[:3]))
            })
        out_csv = OUT_DIR / f"extracted_{ent_type}.csv"
        pd.DataFrame(rows).to_csv(out_csv, index=False)
        summary[ent_type] = len(rows)

    with open(OUT_DIR / 'extraction_summary.json', 'w') as fh:
        json.dump(summary, fh, indent=2)

    print("Extraction complete. Summary:")
    print(json.dumps(summary, indent=2))
    print(f"CSV outputs written to {OUT_DIR}")

if __name__ == '__main__':
    main()
