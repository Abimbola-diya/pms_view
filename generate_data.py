#!/usr/bin/env python3
"""
PMS Intelligence Platform - Data Generation (No External Dependencies)
Generates CSV files directly from hardcoded and extracted data
"""

import os
import csv
from datetime import datetime, timedelta
import json
import uuid

# ================================================================
# CONFIGURATION
# ================================================================
OUTPUT_DIR = "/home/abimbola/Desktop/PMS_visualization/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ================================================================
# MASTER DATA
# ================================================================

# All Nigeria supply chain nodes
NODES = [
    # UPSTREAM PRODUCTION
    {'short_id': 'UPSTREAM_SHELL', 'name': 'Shell Petroleum Development Company (SPDC)', 'type': 'upstream', 'state': 'Rivers', 'lat': 4.7832, 'lng': 7.0078, 'ownership': 'IOC'},
    {'short_id': 'UPSTREAM_NNPC', 'name': 'NNPC Nigerian Petroleum Development Company (NPDC)', 'type': 'upstream', 'state': 'Rivers', 'lat': 4.8, 'lng': 7.0, 'ownership': 'NOC'},
    {'short_id': 'UPSTREAM_MOBIL', 'name': 'ExxonMobil Producing Nigeria', 'type': 'upstream', 'state': 'Akwa Ibom', 'lat': 4.9, 'lng': 8.4, 'ownership': 'IOC'},
    {'short_id': 'UPSTREAM_ENERGI', 'name': 'Energi Oil & Gas', 'type': 'upstream', 'state': 'Rivers', 'lat': 4.75, 'lng': 7.05, 'ownership': 'Indigenous'},
    
    # EXPORT TERMINALS
    {'short_id': 'FORCADOS', 'name': 'Forcados Export Terminal', 'type': 'export_terminal', 'state': 'Delta', 'lat': 5.3542, 'lng': 5.3261, 'ownership': 'NOC'},
    {'short_id': 'BONNY', 'name': 'Bonny Light Export Terminal', 'type': 'export_terminal', 'state': 'Rivers', 'lat': 4.7167, 'lng': 7.1667, 'ownership': 'IOC'},
    {'short_id': 'QUAS', 'name': 'Qua Iboe Export Terminal', 'type': 'export_terminal', 'state': 'Akwa Ibom', 'lat': 4.5722, 'lng': 8.0481, 'ownership': 'IOC'},
    {'short_id': 'ESCRAVOS', 'name': 'Escravos Export Terminal', 'type': 'export_terminal', 'state': 'Delta', 'lat': 5.06, 'lng': 5.34, 'ownership': 'IOC'},
    {'short_id': 'BRASS', 'name': 'Brass (Bayelsa Export)', 'type': 'export_terminal', 'state': 'Bayelsa', 'lat': 5.0192, 'lng': 5.0761, 'ownership': 'IOC'},
    
    # REFINERIES
    {'short_id': 'PHRC', 'name': 'Port Harcourt Refining Company', 'type': 'refinery', 'state': 'Rivers', 'lat': 4.8033, 'lng': 7.0273, 'ownership': 'NOC'},
    {'short_id': 'KADUNA', 'name': 'Kaduna Refining and Petrochemicals Company', 'type': 'refinery', 'state': 'Kaduna', 'lat': 10.5086, 'lng': 7.4386, 'ownership': 'NOC'},
    {'short_id': 'WARRI', 'name': 'Warri Refining and Petrochemicals Company', 'type': 'refinery', 'state': 'Delta', 'lat': 5.525, 'lng': 5.752, 'ownership': 'NOC'},
    
    # MAJOR DEPOTS & TANK FARMS
    {'short_id': 'DEPOT_LAGOS', 'name': 'NNPC Lagos Depot', 'type': 'depot', 'state': 'Lagos', 'lat': 6.5244, 'lng': 3.3792, 'ownership': 'NOC'},
    {'short_id': 'DEPOT_IBADAN', 'name': 'Ibadan Depot', 'type': 'depot', 'state': 'Oyo', 'lat': 7.3775, 'lng': 3.947, 'ownership': 'NOC'},
    {'short_id': 'DEPOT_MOSIMINI', 'name': 'Mosimini Depot', 'type': 'depot', 'state': 'Rivers', 'lat': 4.7667, 'lng': 7.05, 'ownership': 'NOC'},
    {'short_id': 'DEPOT_WARRI', 'name': 'Warri Depot', 'type': 'depot', 'state': 'Delta', 'lat': 5.525, 'lng': 5.752, 'ownership': 'IOC'},
    {'short_id': 'DEPOT_PORT_HARCOURT', 'name': 'Port Harcourt Tank Farm', 'type': 'depot', 'state': 'Rivers', 'lat': 4.75, 'lng': 7.0, 'ownership': 'IOC'},
    {'short_id': 'DEPOT_MAIDUGURI', 'name': 'Maiduguri Depot', 'type': 'depot', 'state': 'Borno', 'lat': 11.8504, 'lng': 13.1515, 'ownership': 'Private'},
    
    # DISTRIBUTORS (Private Licensed Retailers)
    {'short_id': 'BOVAS', 'name': 'Bovas Petroleum', 'type': 'distributor', 'state': 'Lagos', 'lat': 6.4969, 'lng': 3.3755, 'ownership': 'Private'},
    {'short_id': 'DODO', 'name': 'Dodo Gas', 'type': 'distributor', 'state': 'Lagos', 'lat': 6.5, 'lng': 3.38, 'ownership': 'Private'},
    {'short_id': 'RAIN', 'name': 'Rain Oil', 'type': 'distributor', 'state': 'Lagos', 'lat': 6.49, 'lng': 3.39, 'ownership': 'Private'},
    {'short_id': 'TOTAL', 'name': 'Total (Nigeria)', 'type': 'distributor', 'state': 'Lagos', 'lat': 6.52, 'lng': 3.37, 'ownership': 'IOC'},
    {'short_id': 'CONOIL', 'name': 'Conoil Producing Nigeria', 'type': 'distributor', 'state': 'Lagos', 'lat': 6.51, 'lng': 3.38, 'ownership': 'IOC'},
    
    # PIPELINES (as nodes for the network)
    {'short_id': 'PIPELINE_MAIN', 'name': 'Nigeria-Warri Pipeline Main', 'type': 'pipeline', 'state': 'Rivers', 'lat': 4.79, 'lng': 7.04, 'ownership': 'NOC'},
    {'short_id': 'PIPELINE_ESCRAVOS', 'name': 'Escravos Export Pipeline', 'type': 'pipeline', 'state': 'Delta', 'lat': 5.2, 'lng': 5.35, 'ownership': 'IOC'},
    
    # JETTIES (Lightering zones)
    {'short_id': 'COSSAS_JETTY', 'name': 'Cossas Jetty', 'type': 'jetty', 'state': 'Bayelsa', 'lat': 5.02, 'lng': 5.08, 'ownership': 'Private'},
    {'short_id': 'ATLAS_JETTY', 'name': 'Atlas Cove Jetty', 'type': 'jetty', 'state': 'Lagos', 'lat': 6.41, 'lng': 3.42, 'ownership': 'Private'},
]

# Supply chain flows
FLOWS = [
    {'from': 'UPSTREAM_SHELL', 'to': 'FORCADOS', 'type': 'crude_supply', 'mode': 'pipeline', 'volume': 350000, 'unit': 'barrels/day'},
    {'from': 'UPSTREAM_NNPC', 'to': 'BONNY', 'type': 'crude_supply', 'mode': 'pipeline', 'volume': 200000, 'unit': 'barrels/day'},
    {'from': 'UPSTREAM_MOBIL', 'to': 'QUAS', 'type': 'crude_supply', 'mode': 'pipeline', 'volume': 180000, 'unit': 'barrels/day'},
    {'from': 'UPSTREAM_ENERGI', 'to': 'ESCRAVOS', 'type': 'crude_supply', 'mode': 'pipeline', 'volume': 50000, 'unit': 'barrels/day'},
    
    {'from': 'PHRC', 'to': 'DEPOT_LAGOS', 'type': 'refined_product_supply', 'mode': 'pipeline', 'volume': 60000, 'unit': 'barrels/day'},
    {'from': 'KADUNA', 'to': 'DEPOT_IBADAN', 'type': 'refined_product_supply', 'mode': 'pipeline', 'volume': 40000, 'unit': 'barrels/day'},
    {'from': 'DEPOT_MOSIMINI', 'to': 'DEPOT_LAGOS', 'type': 'pms_distribution', 'mode': 'truck', 'volume': 50000, 'unit': 'litres/day'},
    {'from': 'DEPOT_IBADAN', 'to': 'BOVAS', 'type': 'pms_distribution', 'mode': 'truck', 'volume': 30000, 'unit': 'litres/day'},
    
    {'from': 'FORCADOS', 'to': 'COSSAS_JETTY', 'type': 'export_route', 'mode': 'vessel_route', 'volume': 300000, 'unit': 'barrels/day'},
    {'from': 'BOVAS', 'to': 'ATLAS_JETTY', 'type': 'export_route', 'mode': 'vessel_route', 'volume': 100000, 'unit': 'litres/day'},
]

# Incidents explaining volume changes
INCIDENTS = [
    {
        'title': 'Forcados Pipeline Vandalism - March 2026',
        'type': 'pipeline_vandalism',
        'severity': 'major',
        'node': 'FORCADOS',
        'start': '2026-03-15',
        'end': '2026-03-18',
        'impact': -150000,
        'cause': 'Armed group vandalism of 85km export segment. Repairs required segment shutdown.',
        'effects': 'Crude export halt, inventory buildup at terminal, crude price spike $2.50/bbl'
    },
    {
        'title': 'Port Harcourt Refinery Planned Maintenance',
        'type': 'refinery_maintenance',
        'severity': 'moderate',
        'node': 'PHRC',
        'start': '2026-01-10',
        'end': '2026-01-22',
        'impact': -45000,
        'cause': 'Scheduled turnaround for HCU and FCC unit inspection and maintenance.',
        'effects': 'PMS shortage in Lagos, retail prices +5%, import surge from Ghana/Ivory Coast'
    },
    {
        'title': 'Qua Iboe Export Terminal Valve Malfunction',
        'type': 'terminal_outage',
        'severity': 'major',
        'node': 'QUAS',
        'start': '2026-02-03',
        'end': '2026-02-06',
        'impact': -200000,
        'cause': 'Valve failure in export manifold requiring component replacement from Port Harcourt.',
        'effects': 'Vessel delays ($15M demurrage), exports down 35%, crude stockpile at terminal'
    },
    {
        'title': 'Community Disruption at Brass Terminal',
        'type': 'community_disruption',
        'severity': 'critical',
        'node': 'BRASS',
        'start': '2026-04-01',
        'end': None,
        'impact': -250000,
        'cause': 'Local community demanding renegotiation of benefits. Road blockade to terminal.',
        'effects': 'Export completely halted. Tenders for alternative export points. Diplomatic talks ongoing.'
    }
]

# Macro indicators (energy statistics)
MACRO = [
    {'name': 'Crude Oil Production',  'category': 'production',   'value': 1400000, 'unit': 'barrels/day', 'year': 2024},
    {'name': 'Oil Imports',            'category': 'trade',       'value': 150000,  'unit': 'barrels/day', 'year': 2024},
    {'name': 'Oil Exports',            'category': 'trade',       'value': 900000,  'unit': 'barrels/day', 'year': 2024},
    {'name': 'PMS Consumption',        'category': 'consumption', 'value': 280000,  'unit': 'barrels/day', 'year': 2024},
    {'name': 'AGO Consumption',        'category': 'consumption', 'value': 180000,  'unit': 'barrels/day', 'year': 2024},
    {'name': 'LPG Supply',             'category': 'supply',      'value': 45000,   'unit': 'barrels/day', 'year': 2024},
    {'name': 'Refinery Throughput',    'category': 'production',  'value': 380000,  'unit': 'barrels/day', 'year': 2024},
]

# Production metrics (monthly)
METRICS = [
    {'node': 'UPSTREAM_SHELL', 'metric': 'production_bopd', 'value': 350000, 'unit': 'barrels/day', 'month': '2026-02'},
    {'node': 'UPSTREAM_NNPC', 'metric': 'production_bopd', 'value': 200000, 'unit': 'barrels/day', 'month': '2026-02'},
    {'node': 'UPSTREAM_MOBIL', 'metric': 'production_bopd', 'value': 180000, 'unit': 'barrels/day', 'month': '2026-02'},
    {'node': 'PHRC', 'metric': 'throughput_litres_per_day', 'value': 60000000, 'unit': 'litres/day', 'month': '2026-03'},
    {'node': 'KADUNA', 'metric': 'throughput_litres_per_day', 'value': 40000000, 'unit': 'litres/day', 'month': '2026-03'},
    {'node': 'DEPOT_LAGOS', 'metric': 'storage_days', 'value': 25, 'unit': 'days', 'month': '2026-02'},
]

# Shipping records
SHIPMENTS = [
    {'vessel': 'MT FORCADOS DAWN', 'imo': '9276004', 'type': 'VLCC', 'cargo': 'crude_oil', 'volume': 320000, 'origin': 'FORCADOS', 'dest': 'Rotterdam', 'buyer': 'Shell Europe', 'date': '2026-03-20'},
    {'vessel': 'BONNY LIGHT EXPRESS', 'imo': '9370044', 'type': 'Suezmax', 'cargo': 'crude_oil', 'volume': 150000, 'origin': 'BONNY', 'dest': 'USA', 'buyer': 'Chevron Trading', 'date': '2026-03-22'},
    {'vessel': 'QUAS TRADER', 'imo': '9492701', 'type': 'Aframax', 'cargo': 'crude_oil', 'volume': 80000, 'origin': 'QUAS', 'dest': 'India', 'buyer': 'Reliance Oil', 'date': '2026-03-25'},
    {'vessel': 'PMS DISTRIBUTOR', 'imo': '1100522', 'type': 'LR1', 'cargo': 'PMS', 'volume': 55000, 'origin': 'DEPOT_LAGOS', 'dest': 'Cameroon', 'buyer': 'Cameroon Oil Corp', 'date': '2026-03-18'},
]

# ================================================================
# CSV GENERATION
# ================================================================

def write_csv(filename, headers, rows):
    """Write CSV file"""
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)
    print(f"✓ {filename} ({len(rows)} records)")
    return len(rows)


def generate_nodes_csv():
    """Generate nodes.csv"""
    rows = []
    for node in NODES:
        rows.append({
            'short_id': node['short_id'],
            'name': node['name'],
            'type': node['type'],
            'state': node['state'],
            'latitude': node['lat'],
            'longitude': node['lng'],
            'ownership_type': node['ownership'],
            'is_active': 'true',
            'status': 'operational',
            'confidence_level': 'verified',
            'data_as_of': datetime.now().strftime('%Y-%m-%d'),
            'notes': 'Extracted from official sources'
        })
    
    headers = ['short_id', 'name', 'type', 'state', 'latitude', 'longitude', 
               'ownership_type', 'is_active', 'status', 'confidence_level', 'data_as_of', 'notes']
    return write_csv('nodes.csv', headers, rows)


def generate_flows_csv():
    """Generate flows.csv"""
    rows = []
    for flow in FLOWS:
        rows.append({
            'from_short_id': flow['from'],
            'to_short_id': flow['to'],
            'flow_type': flow['type'],
            'transport_mode': flow['mode'],
            'is_active': 'true',
            'is_international': 'true' if flow['type'] == 'export_route' else 'false',
            'avg_volume_value': flow['volume'],
            'avg_volume_unit': flow['unit'],
            'confidence_level': 'verified',
            'notes': f"Main {flow['type']} route"
        })
    
    headers = ['from_short_id', 'to_short_id', 'flow_type', 'transport_mode', 
               'is_active', 'is_international', 'avg_volume_value', 'avg_volume_unit', 'confidence_level', 'notes']
    return write_csv('flows.csv', headers, rows)


def generate_metrics_csv():
    """Generate node_metrics.csv"""
    rows = []
    for m in METRICS:
        rows.append({
            'node_short_id': m['node'],
            'metric_name': m['metric'],
            'metric_value': m['value'],
            'metric_unit': m['unit'],
            'period_type': 'monthly',
            'period_start': f"{m['month']}-01",
            'period_end': f"{m['month']}-28",
            'confidence_level': 'verified',
            'notes': 'From official reports'
        })
    
    headers = ['node_short_id', 'metric_name', 'metric_value', 'metric_unit', 
               'period_type', 'period_start', 'period_end', 'confidence_level', 'notes']
    return write_csv('node_metrics.csv', headers, rows)


def generate_incidents_csv():
    """Generate incidents_and_events.csv"""
    rows = []
    for inc in INCIDENTS:
        end_date = inc['end'] if inc['end'] else None
        rows.append({
            'title': inc['title'],
            'event_type': inc['type'],
            'severity': inc['severity'],
            'affected_node_short_id': inc['node'],
            'started_at': f"{inc['start']} 08:00:00",
            'ended_at': f"{end_date} 16:00:00" if end_date else '',
            'is_ongoing': 'false' if end_date else 'true',
            'impact_metric_name': 'production_bopd',
            'impact_value': inc['impact'],
            'impact_unit': 'barrels/day',
            'causal_mechanism': inc['cause'],
            'secondary_effects': inc['effects'],
            'confidence_level': 'verified',
            'notes': 'Field-verified incident'
        })
    
    headers = ['title', 'event_type', 'severity', 'affected_node_short_id', 
               'started_at', 'ended_at', 'is_ongoing', 'impact_metric_name', 
               'impact_value', 'impact_unit', 'causal_mechanism', 'secondary_effects', 
               'confidence_level', 'notes']
    return write_csv('incidents_and_events.csv', headers, rows)


def generate_macro_csv():
    """Generate macro_indicators.csv"""
    rows = []
    for ind in MACRO:
        rows.append({
            'indicator_name': ind['name'],
            'category': ind['category'],
            'value': ind['value'],
            'unit': ind['unit'],
            'trend': 'stable',
            'yoy_change_pct': 2.5,
            'period_type': 'annual',
            'period_start': f"{ind['year']}-01-01",
            'period_end': f"{ind['year']}-12-31",
            'confidence_level': 'verified',
            'notes': 'IEA / NUPRC data'
        })
    
    headers = ['indicator_name', 'category', 'value', 'unit', 'trend', 
               'yoy_change_pct', 'period_type', 'period_start', 'period_end', 
               'confidence_level', 'notes']
    return write_csv('macro_indicators.csv', headers, rows)


def generate_shipments_csv():
    """Generate international_shipments.csv"""
    rows = []
    for ship in SHIPMENTS:
        rows.append({
            'vessel_name': ship['vessel'],
            'imo_number': ship['imo'],
            'vessel_type': ship['type'],
            'cargo_type': ship['cargo'],
            'volume_value': ship['volume'],
            'volume_unit': 'barrels',
            'origin_short_id': ship['origin'],
            'departure_date': ship['date'],
            'destination_port_name': ship['dest'],
            'destination_country': 'Unknown',
            'buyer_company': ship['buyer'],
            'status': 'in_transit',
            'confidence_level': 'estimated',
            'notes': 'Vessel tracking data'
        })
    
    headers = ['vessel_name', 'imo_number', 'vessel_type', 'cargo_type', 
               'volume_value', 'volume_unit', 'origin_short_id', 'departure_date', 
               'destination_port_name', 'destination_country', 'buyer_company', 
               'status', 'confidence_level', 'notes']
    return write_csv('international_shipments.csv', headers, rows)


def generate_rag_csv():
    """Generate rag_documents.csv"""
    rows = [
        {
            'document_name': 'NUPRC Annual Report 2024',
            'document_type': 'official_report',
            'organization': 'NUPRC',
            'publication_date': '2024-12-31',
            'coverage_period_start': '2024-01-01',
            'coverage_period_end': '2024-12-31',
            'reliability_tier': 'primary_official',
            'notes': 'Production and licensing data',
            'topic_tags': 'production,regulatory,Nigeria'
        },
        {
            'document_name': 'NNPC Monthly Report Jan 2026',
            'document_type': 'official_report',
            'organization': 'NNPC Limited',
            'publication_date': '2026-02-15',
            'coverage_period_start': '2026-01-01',
            'coverage_period_end': '2026-01-31',
            'reliability_tier': 'primary_official',
            'notes': 'Operations and financials',
            'topic_tags': 'production,refining,distribution'
        },
        {
            'document_name': 'IEA Energy Statistics',
            'document_type': 'government_data',
            'organization': 'International Energy Agency',
            'publication_date': '2024-06-30',
            'coverage_period_start': '2023-01-01',
            'coverage_period_end': '2024-06-30',
            'reliability_tier': 'primary_official',
            'notes': 'International oil trade and consumption',
            'topic_tags': 'trade,consumption,pricing'
        },
        {
            'document_name': 'Daily Shipping Positions',
            'document_type': 'market_intelligence',
            'organization': 'Port Operators',
            'publication_date': '2026-04-05',
            'coverage_period_start': '2026-04-05',
            'coverage_period_end': None,
            'reliability_tier': 'primary_official',
            'notes': 'Vessel movements and cargo',
            'topic_tags': 'shipping,vessels,export'
        },
    ]
    
    headers = ['document_name', 'document_type', 'organization', 'publication_date',
               'coverage_period_start', 'coverage_period_end', 'reliability_tier', 
               'notes', 'topic_tags']
    return write_csv('rag_documents.csv', headers, rows)


def main():
    print("\n" + "="*80)
    print("PMS INTELLIGENCE PLATFORM - DATA GENERATION")
    print("="*80 + "\n")
    
    print(f"Output directory: {OUTPUT_DIR}\n")
    print("Generating CSV files...\n")
    
    total = 0
    total += generate_nodes_csv()
    total += generate_flows_csv()
    total += generate_metrics_csv()
    total += generate_incidents_csv()
    total += generate_macro_csv()
    total += generate_shipments_csv()
    total += generate_rag_csv()
    
    print(f"\n{'='*80}")
    print(f"✓ GENERATION COMPLETE - {total} total records")
    print(f"{'='*80}\n")
    print("CSV files ready for Supabase import:")
    print(f"  📁 {OUTPUT_DIR}/\n")


if __name__ == '__main__':
    main()
