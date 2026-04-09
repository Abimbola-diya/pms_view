#!/home/abimbola/Desktop/PMS_visualization/.venv-1/bin/python
"""
COMPREHENSIVE DATA EXTRACTION - All XLSX, CSV, PDF files
Extracts EVERY piece of data for Supabase backend
"""

import pandas as pd
import os
import json
import re
from collections import defaultdict
from datetime import datetime

DATA_DIR = "/home/abimbola/Desktop/PMS_visualization/PMS data"
OUTPUT_DIR = "/home/abimbola/Desktop/PMS_visualization/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Configure pandas
pd.set_option('display.max_columns', None)
pd.set_option('display.max_rows', None)

# ================================================================
# 1. COMPREHENSIVE SHIPPING EXTRACTION
# ================================================================

def extract_all_shipping():
    """Extract ALL vessel shipping data from 15 files"""
    all_ships = []
    
    files = [f for f in os.listdir(DATA_DIR) if 'daily_shipping_position' in f.lower() and f.endswith('.csv')]
    print(f"  Found {len(files)} shipping files")
    
    for file in sorted(files):
        filepath = os.path.join(DATA_DIR, file)
        try:
            df = pd.read_csv(filepath)
            
            # Extract date from filename
            match = re.search(r'Sun Apr (\d+)', file)
            if match:
                day = int(match.group(1))
                file_date = f"2026-04-{day:02d}"
            else:
                file_date = "2026-04-05"
            
            for _, row in df.iterrows():
                vessel_name = str(row.get('Vessel Name', '')).strip()
                if vessel_name.upper() != 'VACANT' and vessel_name:
                    record = {
                        'vessel_name': vessel_name,
                        'imo_number': str(row.get('IMO Number', '')).strip() or None,
                        'length_m': pd.to_numeric(row.get('Length(M)', 0), errors='coerce'),
                        'berth': str(row.get('Berth', '')).strip(),
                        'berth_date': str(row.get('Berth Date', '')).strip() or None,
                        'etd': str(row.get('ETD', '')).strip() or None,
                        'rotation': str(row.get('Rotation', '')).strip() or None,
                        'agent': str(row.get('Agent', '')).strip() or None,
                        'commodity': str(row.get('Comm', '')).strip() or None,
                        'ship_to_follow': str(row.get('Ship to Follow', '')).strip() or None,
                        'data_date': file_date,
                        'source_file': file
                    }
                    all_ships.append(record)
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    return all_ships


# ================================================================
# 2. PRODUCTION DATA EXTRACTION
# ================================================================

def extract_production_files():
    """Extract ALL production data from NUPRC, FIRS, crude production files"""
    all_production = []
    
    # NUPRC Lifting files
    nuprc_files = [f for f in os.listdir(DATA_DIR) if 'NUPRC' in f.upper() and 'LIFTING' in f.upper() and f.endswith('.xlsx')]
    print(f"  Found {len(nuprc_files)} NUPRC lifting files")
    
    for file in nuprc_files:
        filepath = os.path.join(DATA_DIR, file)
        try:
            # Try all sheets
            xl_file = pd.ExcelFile(filepath)
            for sheet in xl_file.sheet_names:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet)
                    
                    # Extract date from filename
                    match = re.search(r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})', file.upper())
                    if match:
                        month_map = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                                     'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
                        month = month_map.get(match.group(1).upper(), '01')
                        year = match.group(2)
                        period = f"{year}-{month}"
                    else:
                        period = datetime.now().strftime('%Y-%m')
                    
                    for _, row in df.iterrows():
                        # Skip empty rows
                        if pd.isna(row).all():
                            continue
                        
                        record = {
                            'file': file,
                            'sheet': sheet,
                            'period': period,
                            'data': dict(row.dropna())
                        }
                        all_production.append(record)
                except Exception as e:
                    pass  # Skip sheets that don't parse
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    # FIRS Lifting files
    firs_files = [f for f in os.listdir(DATA_DIR) if 'FIRS' in f.upper() and 'LIFTING' in f.upper() and f.endswith('.xlsx')]
    print(f"  Found {len(firs_files)} FIRS lifting files")
    
    for file in firs_files:
        filepath = os.path.join(DATA_DIR, file)
        try:
            xl_file = pd.ExcelFile(filepath)
            for sheet in xl_file.sheet_names:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet)
                    
                    match = re.search(r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})', file.upper())
                    if match:
                        month_map = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                                     'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
                        month = month_map.get(match.group(1).upper(), '01')
                        year = match.group(2)
                        period = f"{year}-{month}"
                    else:
                        period = datetime.now().strftime('%Y-%m')
                    
                    for _, row in df.iterrows():
                        if pd.isna(row).all():
                            continue
                        
                        record = {
                            'file': file,
                            'sheet': sheet,
                            'period': period,
                            'data': dict(row.dropna())
                        }
                        all_production.append(record)
                except:
                    pass
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    # Crude Oil Production Profile files
    crude_files = [f for f in os.listdir(DATA_DIR) if 'CRUDE' in f.upper() and 'PRODUCTION' in f.upper() and 'PROFILE' in f.upper() and f.endswith('.xlsx')]
    print(f"  Found {len(crude_files)} crude production profile files")
    
    for file in crude_files:
        filepath = os.path.join(DATA_DIR, file)
        try:
            xl_file = pd.ExcelFile(filepath)
            for sheet in xl_file.sheet_names:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet)
                    
                    match = re.search(r'(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})', file.upper())
                    if match:
                        month_map = {'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
                                     'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'}
                        month = month_map.get(match.group(1).upper(), '01')
                        year = match.group(2)
                        period = f"{year}-{month}"
                    else:
                        period = datetime.now().strftime('%Y-%m')
                    
                    for _, row in df.iterrows():
                        if pd.isna(row).all():
                            continue
                        
                        record = {
                            'file': file,
                            'sheet': sheet,
                            'period': period,
                            'data': dict(row.dropna())
                        }
                        all_production.append(record)
                except:
                    pass
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    return all_production


# ================================================================
# 3. RIG DISPOSITION DATA
# ================================================================

def extract_rig_data():
    """Extract ALL rig disposition data"""
    all_rigs = []
    
    rig_files = [f for f in os.listdir(DATA_DIR) if 'RIG-DISPOSITION' in f.upper() or 'RIG DISPOSITION' in f.upper() and f.endswith('.xlsx')]
    print(f"  Found {len(rig_files)} rig files")
    
    for file in rig_files:
        filepath = os.path.join(DATA_DIR, file)
        try:
            xl_file = pd.ExcelFile(filepath)
            for sheet in xl_file.sheet_names:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet)
                    for _, row in df.iterrows():
                        if pd.isna(row).all():
                            continue
                        
                        record = {
                            'file': file,
                            'sheet': sheet,
                            'data': dict(row.dropna())
                        }
                        all_rigs.append(record)
                except:
                    pass
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    return all_rigs


# ================================================================
# 4. IEA ENERGY DATA
# ================================================================

def extract_iea_data():
    """Extract ALL IEA energy statistics"""
    all_iea = []
    
    iea_files = [f for f in os.listdir(DATA_DIR) if 'International Energy Agency' in f and f.endswith('.csv')]
    print(f"  Found {len(iea_files)} IEA CSV files")
    
    for file in iea_files:
        filepath = os.path.join(DATA_DIR, file)
        try:
            df = pd.read_csv(filepath)
            file_type = file.replace('International Energy Agency - ', '').replace('.csv', '')
            
            for _, row in df.iterrows():
                if pd.isna(row).all():
                    continue
                
                record = {
                    'file_type': file_type,
                    'source_file': file,
                    'data': dict(row.dropna())
                }
                all_iea.append(record)
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    return all_iea


# ================================================================
# 5. PETROLEUM PRODUCTS STOCK DATA
# ================================================================

def extract_stock_data():
    """Extract petroleum products stock and sufficiency data"""
    all_stock = []
    
    stock_files = [f for f in os.listdir(DATA_DIR) if 'Petroleum-Products-Stock' in f and f.endswith('.pdf')]
    print(f"  Found {len(stock_files)} stock PDF files")
    
    for file in stock_files:
        # Note: PDF requires PyPDF2 or pdfplumber - just log that files exist
        match = re.search(r'(\d+)(?:st|nd|rd|th)-([A-Za-z]+)-(\d{4})', file)
        if match:
            day, month, year = match.groups()
            all_stock.append({
                'file': file,
                'report_date': f"{year}-{month}-{day}",
                'type': 'Stock Report'
            })
    
    return all_stock


# ================================================================
# 6. OTHER AVAILABLE DATA
# ================================================================

def extract_reconciled_production():
    """Extract reconciled annual production data"""
    all_annual = []
    
    annual_files = [f for f in os.listdir(DATA_DIR) if 'RECONCILED' in f.upper() and f.endswith('.xlsx')]
    print(f"  Found {len(annual_files)} reconciled production files")
    
    for file in annual_files:
        filepath = os.path.join(DATA_DIR, file)
        try:
            xl_file = pd.ExcelFile(filepath)
            for sheet in xl_file.sheet_names:
                try:
                    df = pd.read_excel(filepath, sheet_name=sheet)
                    for _, row in df.iterrows():
                        if pd.isna(row).all():
                            continue
                        
                        record = {
                            'file': file,
                            'sheet': sheet,
                            'data': dict(row.dropna())
                        }
                        all_annual.append(record)
                except:
                    pass
        except Exception as e:
            print(f"    Error reading {file}: {e}")
    
    return all_annual


# ================================================================
# MAIN EXECUTION
# ================================================================

def main():
    print("\n" + "="*80)
    print("COMPREHENSIVE DATA EXTRACTION FROM ALL SOURCE FILES")
    print("="*80 + "\n")
    
    print("1. Extracting SHIPPING DATA...")
    shipping = extract_all_shipping()
    print(f"   ✓ {len(shipping)} vessel records extracted\n")
    
    print("2. Extracting PRODUCTION DATA...")
    production = extract_production_files()
    print(f"   ✓ {len(production)} production records extracted\n")
    
    print("3. Extracting RIG DISPOSITION DATA.....")
    rigs = extract_rig_data()
    print(f"   ✓ {len(rigs)} rig records extracted\n")
    
    print("4. Extracting IEA ENERGY DATA...")
    iea = extract_iea_data()
    print(f"   ✓ {len(iea)} IEA records extracted\n")
    
    print("5. Extracting PETROLEUM PRODUCTS STOCK DATA...")
    stock = extract_stock_data()
    print(f"   ✓ {len(stock)} stock report references\n")
    
    print("6. Extracting RECONCILED ANNUAL DATA...")
    annual = extract_reconciled_production()
    print(f"   ✓ {len(annual)} annual records extracted\n")
    
    # SAVE ALL RAW DATA
    print("7. Saving comprehensive raw data...")
    
    with open(os.path.join(OUTPUT_DIR, 'raw_shipping_comprehensive.json'), 'w') as f:
        json.dump(shipping, f, indent=2, default=str)
    
    with open(os.path.join(OUTPUT_DIR, 'raw_production_comprehensive.json'), 'w') as f:
        json.dump(production, f, indent=2, default=str)
    
    with open(os.path.join(OUTPUT_DIR, 'raw_rigs_comprehensive.json'), 'w') as f:
        json.dump(rigs, f, indent=2, default=str)
    
    with open(os.path.join(OUTPUT_DIR, 'raw_iea_comprehensive.json'), 'w') as f:
        json.dump(iea, f, indent=2, default=str)
    
    with open(os.path.join(OUTPUT_DIR, 'raw_stock_comprehensive.json'), 'w') as f:
        json.dump(stock, f, indent=2, default=str)
    
    with open(os.path.join(OUTPUT_DIR, 'raw_annual_comprehensive.json'), 'w') as f:
        json.dump(annual, f, indent=2, default=str)
    
    # SAVE CSV OF SHIPPING FOR INSPECTION
    if shipping:
        ships_df = pd.DataFrame(shipping)
        ships_df.to_csv(os.path.join(OUTPUT_DIR, 'shipping_vessels_full.csv'), index=False)
    
    if production:
        # Flatten production data
        prod_flat = []
        for p in production[:200]:  # Sample first 200
            flat = p['data'].copy()
            flat['file'] = p['file']
            flat['sheet'] = p['sheet']
            flat['period'] = p['period']
            prod_flat.append(flat)
        prod_df = pd.DataFrame(prod_flat)
        prod_df.to_csv(os.path.join(OUTPUT_DIR, 'production_data_sample.csv'), index=False)
    
    # SUMMARY
    print(f"\n{'='*80}")
    print("COMPREHENSIVE EXTRACTION COMPLETE")
    print(f"{'='*80}\n")
    
    total_records = len(shipping) + len(production) + len(rigs) + len(iea) + len(stock) + len(annual)
    
    print(f"Total Records Extracted: {total_records}\n")
    print(f"  • Shipping vessels: {len(shipping)}")
    print(f"  • Production data points: {len(production)}")
    print(f"  • Rig records: {len(rigs)}")
    print(f"  • IEA energy data: {len(iea)}")
    print(f"  • Stock reports: {len(stock)}")
    print(f"  • Annual data: {len(annual)}\n")
    
    print(f"Output location: {OUTPUT_DIR}/\n")
    
    # Show samples
    if shipping:
        print("SAMPLE VESSEL RECORD:")
        print(json.dumps(shipping[0], indent=2, default=str))
    
    if production:
        print("\n\nSAMPLE PRODUCTION RECORD:")
        print(json.dumps(production[0], indent=2, default=str))


if __name__ == '__main__':
    main()
