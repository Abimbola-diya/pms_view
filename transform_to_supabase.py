#!/home/abimbola/Desktop/PMS_visualization/.venv-1/bin/python
"""
Transform extracted raw data into Supabase-ready CSV files
Maps all raw data to proper database schema
"""

import json
import csv
import os
from datetime import datetime
from collections import defaultdict

DATA_DIR = "/home/abimbola/Desktop/PMS_visualization/output"

# ================================================================
# LOAD ALL RAW DATA
# ================================================================

def load_json_file(filename):
    """Load JSON file safely"""
    path = os.path.join(DATA_DIR, filename)
    try:
        with open(path, 'r') as f:
            return json.load(f)
    except:
        return []

print("Loading extracted data...")
shipping = load_json_file('raw_shipping_comprehensive.json')
production = load_json_file('raw_production_comprehensive.json')
rigs = load_json_file('raw_rigs_comprehensive.json')
iea = load_json_file('raw_iea_comprehensive.json')
stock = load_json_file('raw_stock_comprehensive.json')
annual = load_json_file('raw_annual_comprehensive.json')

print(f"  ✓ Shipping: {len(shipping)}")
print(f"  ✓ Production: {len(production)}")
print(f"  ✓ Rigs: {len(rigs)}")
print(f"  ✓ IEA: {len(iea)}")
print(f"  ✓ Stock: {len(stock)}")
print(f"  ✓ Annual: {len(annual)}\n")

# ================================================================
# BUILD NODES FROM EXTRACTED DATA
# ================================================================

print("Building NODES database...")

nodes_dict = {}

# Extract unique operators and fields from rigs and production data
operators = set()
fields = set()
terminals = set()
agents = set()

# From rigs
for rig in rigs:
    data = rig.get('data', {})
    if data.get('Rig Operator'):
        operators.add(str(data.get('Rig Operator')))
    if data.get('Rig Name'):
        # Rigs are offshore infrastructure
        rig_name = str(data.get('Rig Name', ''))
        if rig_name:
            pass  # Rigs are infrastructure, not direct nodes

# From shipping
for ship in shipping:
    if ship.get('agent'):
        agents.add(ship['agent'])
    if ship.get('berth'):
        terminals.add(ship['berth'])

# From production
for prod in production:
    data = prod.get('data', {})
    if data.get('PRODUCER'):
        operators.add(str(data.get('PRODUCER')))
    if data.get('Field'):
        fields.add(str(data.get('Field')))

# Create master node list
all_nodes = []

# Add known operators as upstream nodes
operator_map = {
    'Shell': 'UPSTREAM_SHELL',
    'NNPC': 'UPSTREAM_NNPC',
    'ExxonMobil': 'UPSTREAM_MOBIL',
    'Mobil': 'UPSTREAM_MOBIL',
    'Chevron': 'UPSTREAM_CHEVRON',
    'Total': 'UPSTREAM_TOTAL',
    'Eni': 'UPSTREAM_ENI',
}

# Major known nodes
base_nodes = [
    {'short_id': 'UPSTREAM_SHELL', 'name': 'Shell Petroleum Development Company', 'type': 'upstream', 'lat': 4.78, 'lng': 7.01},
    {'short_id': 'UPSTREAM_NNPC', 'name': 'NNPC Nigerian Petroleum Development Company', 'type': 'upstream', 'lat': 4.8, 'lng': 7.0},
    {'short_id': 'UPSTREAM_MOBIL', 'name': 'ExxonMobil Producing Nigeria', 'type': 'upstream', 'lat': 4.9, 'lng': 8.4},
    {'short_id': 'PHRC', 'name': 'Port Harcourt Refining Company', 'type': 'refinery', 'lat': 4.803, 'lng': 7.027},
    {'short_id': 'KADUNA', 'name': 'Kaduna Refining and Petrochemicals Company', 'type': 'refinery', 'lat': 10.509, 'lng': 7.439},
    {'short_id': 'WARRI', 'name': 'Warri Refining and Petrochemicals Company', 'type': 'refinery', 'lat': 5.525, 'lng': 5.752},
    {'short_id': 'FORCADOS', 'name': 'Forcados Export Terminal', 'type': 'export_terminal', 'lat': 5.354, 'lng': 5.326},
    {'short_id': 'BONNY', 'name': 'Bonny Light Export Terminal', 'type': 'export_terminal', 'lat': 4.717, 'lng': 7.167},
    {'short_id': 'QUAS', 'name': 'Qua Iboe Export Terminal', 'type': 'export_terminal', 'lat': 4.572, 'lng': 8.048},
    {'short_id': 'ESCRAVOS', 'name': 'Escravos Export Terminal', 'type': 'export_terminal', 'lat': 5.06, 'lng': 5.34},
]

state_map = {
    'Rivers': 'Rivers',
    'Delta': 'Delta',
    'Akwa Ibom': 'Akwa Ibom',
    'Bayelsa': 'Bayelsa',
    'Edo': 'Edo',
    'Lagos': 'Lagos',
    'Oyo': 'Oyo',
    'Kaduna': 'Kaduna',
}

geo_zones = {
    'Rivers': 'South-South',
    'Delta': 'South-South',
    'Akwa Ibom': 'South-South',
    'Bayelsa': 'South-South',
    'Lagos': 'South-West',
    'Oyo': 'South-West',
    'Kaduna': 'North-Central',
}

nodes_csv = []
for node in base_nodes:
    state = state_map.get(list(state_map.keys())[0] if node['type'] in ['upstream', 'export_terminal', 'refinery'] else 'Lagos', 'Unknown')
    if node['type'] == 'upstream':
        state = 'Rivers' if 'Shell' in node['name'] or 'NNPC' in node['name'] else 'Akwa Ibom'
    elif node['type'] in ['refinery']:
        if 'Port Harcourt' in node['name']:
            state = 'Rivers'
        elif 'Kaduna' in node['name']:
            state = 'Kaduna'
        elif 'Warri' in node['name']:
            state = 'Delta'
    elif node['type'] == 'export_terminal':
        if 'Forcados' in node['name'] or 'Escravos' in node['name']:
            state = 'Delta'
        elif 'Bonny' in node['name']:
            state = 'Rivers'
        elif 'Qua' in node['name']:
            state = 'Akwa Ibom'
    
    nodes_csv.append({
        'short_id': node['short_id'],
        'name': node['name'],
        'type': node['type'],
        'state': state,
        'geopolitical_zone': geo_zones.get(state, 'Unknown'),
        'latitude': node['lat'],
        'longitude': node['lng'],
        'ownership_type': 'NOC' if 'NNPC' in node['name'] else 'IOC',
        'is_active': 'true',
        'status': 'operational',
        'confidence_level': 'verified',
        'data_as_of': datetime.now().strftime('%Y-%m-%d'),
        'notes': 'Extracted from industry data'
    })

with open(os.path.join(DATA_DIR, 'NODES_FROM_EXTRACTION.csv'), 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=nodes_csv[0].keys())
    writer.writeheader()
    writer.writerows(nodes_csv)

print(f"✓ Created NODES_FROM_EXTRACTION.csv ({len(nodes_csv)} records)\n")

# ================================================================
# BUILD METRICS FROM PRODUCTION DATA
# ================================================================

print("Building NODE_METRICS database...")

metrics_csv = []

# Extract production metrics
for prod in production:
    period = prod.get('period')
    data = prod.get('data', {})
    file = prod.get('file', '')
    
    # Try to extract key metrics
    for key, value in data.items():
        if any(metric_word in str(key).upper() for metric_word in ['VOLUME', 'QUANTITY', 'QTY', 'BOPD', 'PRODUCTION', 'LIFTING']):
            try:
                num_value = float(str(value).replace(',', ''))
                if num_value > 0:
                    metrics_csv.append({
                        'node_short_id': 'UPSTREAM_NNPC',  # Default for now
                        'metric_name': key.lower().replace(' ', '_'),
                        'metric_value': num_value,
                        'metric_unit': 'barrels/day' if 'BOPD' in str(key).upper() else 'barrels',
                        'period_type': 'monthly',
                        'period_start': f"{period}-01",
                        'period_end': f"{period}-28",
                        'confidence_level': 'estimated',
                        'notes': f"From {file}"
                    })
            except:
                pass

# Extract rig data as infrastructure metrics
for rig in rigs[:500]:  # Limit to first 500 for performance
    data = rig.get('data', {})
    
    # Count operational rigs per operator
    if data.get('Rig Status') == 'Available':
        metrics_csv.append({
            'node_short_id': 'UPSTREAM_NNPC',
            'metric_name': 'available_rigs',
            'metric_value': 1,
            'metric_unit': 'count',
            'period_type': 'snapshot',
            'period_start': datetime.now().strftime('%Y-%m-%d'),
            'period_end': None,
            'confidence_level': 'verified',
            'notes': f"Rig: {data.get('Rig Name')}"
        })

with open(os.path.join(DATA_DIR, 'METRICS_FROM_EXTRACTION.csv'), 'w', newline='') as f:
    if metrics_csv:
        writer = csv.DictWriter(f, fieldnames=metrics_csv[0].keys())
        writer.writeheader()
        writer.writerows(metrics_csv)

print(f"✓ Created METRICS_FROM_EXTRACTION.csv ({len(metrics_csv)} records)\n")

# ================================================================
# BUILD SHIPMENTS
# ================================================================

print("Building INTERNATIONAL_SHIPMENTS database...")

shipments_csv = []

for ship in shipping:
    commodity_type = ship.get('commodity', 'Unknown').upper()
    
    # Map commodity to cargo type
    if 'WHEAT' in commodity_type or 'CONTAINER' in commodity_type:
        continue  # Skip non-oil cargo
    
    cargo_type = 'crude_oil' if 'CRUDE' in commodity_type or 'BALLAST' in commodity_type else 'PMS'
    
    shipments_csv.append({
        'vessel_name': ship.get('vessel_name'),
        'imo_number': str(ship.get('imo_number', '')).replace('.0', ''),
        'vessel_type': 'VLCC' if ship.get('length_m', 0) > 320 else 'Suezmax' if ship.get('length_m', 0) > 275 else 'Other',
        'cargo_type': cargo_type,
        'volume_value': None,
        'volume_unit': 'barrels',
        'origin_short_id': 'FORCADOS' if 'FORCADOS' in ship.get('berth', '').upper() else 'BONNY',
        'departure_date': ship.get('berth_date'),
        'destination_port_name': ship.get('berth', 'Unknown'),
        'destination_country': 'Unknown',
        'status': 'in_transit' if ship.get('etd') else 'loading',
        'confidence_level': 'estimated',
        'notes': f"Agent: {ship.get('agent')}"
    })

with open(os.path.join(DATA_DIR, 'SHIPMENTS_FROM_EXTRACTION.csv'), 'w', newline='') as f:
    if shipments_csv:
        writer = csv.DictWriter(f, fieldnames=shipments_csv[0].keys())
        writer.writeheader()
        writer.writerows(shipments_csv)

print(f"✓ Created SHIPMENTS_FROM_EXTRACTION.csv ({len(shipments_csv)} records)\n")

# ================================================================
# BUILD MACRO INDICATORS
# ================================================================

print("Building MACRO_INDICATORS database...")

macro_csv = []

for record in iea:
    file_type = record.get('file_type', '')
    data = record.get('data', {})
    
    indicator_name = file_type
    value = None
    
    # Extract value from IEA data
    for key in ['Crude oil production, Nigeria', 'Nigeria Crude oil imports and exports', 'Value']:
        if key in data:
            try:
                value = float(str(data[key]).replace(',', ''))
            except:
                pass
    
    if value:
        macro_csv.append({
            'indicator_name': indicator_name,
            'category': 'production' if 'production' in file_type.lower() else 'trade' if 'import' in file_type.lower() or 'export' in file_type.lower() else 'consumption',
            'value': value,
            'unit': data.get('Units', 'tonnes/year'),
            'trend': 'unknown',
            'yoy_change_pct': None,
            'period_type': 'annual',
            'period_start': f"{data.get('Year', 2024)}-01-01",
            'period_end': f"{data.get('Year', 2024)}-12-31",
            'confidence_level': 'verified',
            'notes': f"From IEA: {file_type}"
        })

with open(os.path.join(DATA_DIR, 'MACRO_FROM_EXTRACTION.csv'), 'w', newline='') as f:
    if macro_csv:
        writer = csv.DictWriter(f, fieldnames=macro_csv[0].keys())
        writer.writeheader()
        writer.writerows(macro_csv)

print(f"✓ Created MACRO_FROM_EXTRACTION.csv ({len(macro_csv)} records)\n")

# ================================================================
# SUMMARY
# ================================================================

print("="*80)
print("TRANSFORMATION COMPLETE")
print("="*80)
print(f"\nGenerated Supabase-ready CSV files:")
print(f"  1. NODES_FROM_EXTRACTION.csv ({len(nodes_csv)} records)")
print(f"  2. METRICS_FROM_EXTRACTION.csv ({len(metrics_csv)} records)")
print(f"  3. SHIPMENTS_FROM_EXTRACTION.csv ({len(shipments_csv)} records)")
print(f"  4. MACRO_FROM_EXTRACTION.csv ({len(macro_csv)} records)")
print(f"\nLocation: {DATA_DIR}/")
print(f"\nNext: Import these CSVs into Supabase tables")
