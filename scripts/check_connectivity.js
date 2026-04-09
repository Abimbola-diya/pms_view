#!/usr/bin/env node
/* Connectivity check for the demo JS data (ND, STATIONS, ROUTES)
   - Reports: missing endpoints, isolated nodes, connected components, duplicate ids/routes
   - Non-destructive: only analyzes and prints findings
*/

const ND = [
  {id:'NNPC_EP', t:'upstream'},
  {id:'SPDC', t:'upstream'},
  {id:'MPNU', t:'upstream'},
  {id:'CNL', t:'upstream'},
  {id:'SNEPCO', t:'upstream'},
  {id:'TEPNG', t:'upstream'},
  {id:'AGBAMI', t:'upstream'},
  {id:'ERHA', t:'upstream'},
  {id:'EGINA', t:'upstream'},
  {id:'AKPO', t:'upstream'},
  {id:'AITEO', t:'upstream'},
  {id:'HEIRS', t:'upstream'},
  {id:'SEEPCO', t:'upstream'},
  {id:'SEP_L', t:'upstream'},
  {id:'FIRST_EP', t:'upstream'},
  {id:'OANDO', t:'upstream'},
  {id:'USAN', t:'upstream'},
  {id:'NEWCROSS', t:'upstream'},
  {id:'NDWEST', t:'upstream'},
  {id:'NEOL', t:'upstream'},
  {id:'SHORELINE', t:'upstream'},
  {id:'STER_G', t:'upstream'},
  {id:'NECONDE', t:'upstream'},
  {id:'NAE_ABO', t:'upstream'},
  {id:'ARADEL', t:'upstream'},
  {id:'CONTINENTAL', t:'upstream'},
  {id:'ORIENTAL', t:'upstream'},
  {id:'GREEN_EN', t:'upstream'},
  {id:'MWEST', t:'upstream'},
  {id:'EROTON', t:'upstream'},
  {id:'ELCREST', t:'upstream'},
  {id:'ANTAN', t:'upstream'},
  {id:'YFOLAWIYO', t:'upstream'},
  {id:'AMNI', t:'upstream'},
  {id:'BELEMAOIL', t:'upstream'},
  {id:'EMERALD', t:'upstream'},
  {id:'SOUTHATL', t:'upstream'},
  {id:'ENAGEED', t:'upstream'},
  {id:'ALLGRACE', t:'upstream'},
  {id:'PILLAR', t:'upstream'},
  {id:'MONI_PULO', t:'upstream'},
  {id:'ENERGIA', t:'upstream'},
  {id:'PAN_OCEAN', t:'upstream'},
  {id:'UNIVERSAL', t:'upstream'},
  {id:'WSMITH_UP', t:'upstream'},
  {id:'GHL', t:'upstream'},
  {id:'EXCEL_EP', t:'upstream'},
  {id:'NEWCROSS_P', t:'upstream'},
  {id:'FRONTIER', t:'upstream'},
  {id:'PLATFORM', t:'upstream'},
  {id:'BRITTANIA', t:'upstream'},
  {id:'NETWORK', t:'upstream'},
  {id:'CHORUS', t:'upstream'},
  {id:'CONOIL_P', t:'upstream'},
  {id:'MILLENIUM', t:'upstream'},
  {id:'DUBRI', t:'upstream'},

  {id:'DANGOTE', t:'refinery'},
  {id:'PHRC', t:'refinery'},
  {id:'WRPC', t:'refinery'},
  {id:'KRPC', t:'refinery'},
  {id:'WSMITH', t:'refinery'},
  {id:'EDO_REF', t:'refinery'},
  {id:'ARADEL_R', t:'refinery'},
  {id:'OPAC', t:'refinery'},
  {id:'DUPORT', t:'refinery'},

  {id:'BONNY_T', t:'terminal'},
  {id:'FORCADOS_T', t:'terminal'},
  {id:'ESCRAVOS_T', t:'terminal'},
  {id:'QUAIBOE_T', t:'terminal'},
  {id:'BRASS_T', t:'terminal'},
  {id:'BONGA_T', t:'terminal'},
  {id:'AGBAMI_T', t:'terminal'},
  {id:'ERHA_T', t:'terminal'},
  {id:'USAN_T', t:'terminal'},
  {id:'EGINA_T', t:'terminal'},
  {id:'AKPO_T', t:'terminal'},
  {id:'TULJA_T', t:'terminal'},
  {id:'AILSA_T', t:'terminal'},
  {id:'ABO_T', t:'terminal'},

  {id:'NNPC_IMP', t:'importer'},
  {id:'DAPPMA', t:'importer'},
  {id:'MOMAN', t:'importer'},

  {id:'ATLAS', t:'depot'},
  {id:'SAT_DEP', t:'depot'},
  {id:'BOVAS', t:'depot'},
  {id:'SHEMA', t:'depot'},
  {id:'PH_DEP', t:'depot'},
  {id:'WARRI_DEP', t:'depot'},
  {id:'CALABAR_D', t:'depot'},
  {id:'KADUNA_D', t:'depot'},
  {id:'ABA_DEP', t:'depot'},
  {id:'ORE_DEP', t:'depot'},
  {id:'IBADAN_D', t:'depot'},
  {id:'ENUGU_D', t:'depot'},
  {id:'JOS_DEP', t:'depot'},
  {id:'MINNA_D', t:'depot'},

  {id:'RET_SW', t:'retail'},
  {id:'RET_SS', t:'retail'},
  {id:'RET_SE', t:'retail'},
  {id:'RET_NC', t:'retail'},
  {id:'RET_NW', t:'retail'},
  {id:'RET_NE', t:'retail'},

  {id:'ROTTERDAM', t:'intl'},
  {id:'HOUSTON', t:'intl'},
  {id:'JEDDAH', t:'intl'},
  {id:'INDIA', t:'intl'},
];

const STATIONS = [
  // south west (RET_SW)
  {id:'S_LG01', zone:'RET_SW'}, {id:'S_LG02', zone:'RET_SW'}, {id:'S_LG03', zone:'RET_SW'}, {id:'S_LG04', zone:'RET_SW'}, {id:'S_LG05', zone:'RET_SW'},
  {id:'S_LG06', zone:'RET_SW'}, {id:'S_LG07', zone:'RET_SW'}, {id:'S_LG08', zone:'RET_SW'}, {id:'S_LG09', zone:'RET_SW'}, {id:'S_LG10', zone:'RET_SW'},
  {id:'S_LG11', zone:'RET_SW'}, {id:'S_LG12', zone:'RET_SW'}, {id:'S_IB01', zone:'RET_SW'}, {id:'S_IB02', zone:'RET_SW'}, {id:'S_IB03', zone:'RET_SW'},
  {id:'S_AB01', zone:'RET_SW'}, {id:'S_AB02', zone:'RET_SW'}, {id:'S_SG01', zone:'RET_SW'}, {id:'S_AK01', zone:'RET_SW'}, {id:'S_OD01', zone:'RET_SW'},
  {id:'S_OS01', zone:'RET_SW'}, {id:'S_IF01', zone:'RET_SW'}, {id:'S_EK01', zone:'RET_SW'}, {id:'S_OR01', zone:'RET_SW'}, {id:'S_KW01', zone:'RET_SW'},

  // south south (RET_SS)
  {id:'S_PH01', zone:'RET_SS'}, {id:'S_PH02', zone:'RET_SS'}, {id:'S_PH03', zone:'RET_SS'}, {id:'S_PH04', zone:'RET_SS'},
  {id:'S_WR01', zone:'RET_SS'}, {id:'S_WR02', zone:'RET_SS'}, {id:'S_WR03', zone:'RET_SS'}, {id:'S_BN01', zone:'RET_SS'}, {id:'S_BN02', zone:'RET_SS'}, {id:'S_BN03', zone:'RET_SS'},
  {id:'S_CB01', zone:'RET_SS'}, {id:'S_CB02', zone:'RET_SS'}, {id:'S_UY01', zone:'RET_SS'}, {id:'S_AS01', zone:'RET_SS'}, {id:'S_SP01', zone:'RET_SS'}, {id:'S_YN01', zone:'RET_SS'}, {id:'S_EK02', zone:'RET_SS'}, {id:'S_OP01', zone:'RET_SS'},

  // south east (RET_SE)
  {id:'S_EN01', zone:'RET_SE'}, {id:'S_EN02', zone:'RET_SE'}, {id:'S_ON01', zone:'RET_SE'}, {id:'S_ON02', zone:'RET_SE'}, {id:'S_AB10', zone:'RET_SE'},
  {id:'S_AB11', zone:'RET_SE'}, {id:'S_OW01', zone:'RET_SE'}, {id:'S_OW02', zone:'RET_SE'}, {id:'S_AK10', zone:'RET_SE'}, {id:'S_UM01', zone:'RET_SE'}, {id:'S_AW01', zone:'RET_SE'}, {id:'S_NN01', zone:'RET_SE'}, {id:'S_NS01', zone:'RET_SE'},

  // north central (RET_NC)
  {id:'S_FC01', zone:'RET_NC'}, {id:'S_FC02', zone:'RET_NC'}, {id:'S_FC03', zone:'RET_NC'}, {id:'S_FC04', zone:'RET_NC'}, {id:'S_FC05', zone:'RET_NC'},
  {id:'S_JO01', zone:'RET_NC'}, {id:'S_JO02', zone:'RET_NC'}, {id:'S_LK01', zone:'RET_NC'}, {id:'S_IL01', zone:'RET_NC'}, {id:'S_MK01', zone:'RET_NC'}, {id:'S_MN01', zone:'RET_NC'}, {id:'S_LF01', zone:'RET_NC'},

  // north west (RET_NW)
  {id:'S_KN01', zone:'RET_NW'}, {id:'S_KN02', zone:'RET_NW'}, {id:'S_KN03', zone:'RET_NW'}, {id:'S_KD01', zone:'RET_NW'}, {id:'S_KD02', zone:'RET_NW'},
  {id:'S_KD03', zone:'RET_NW'}, {id:'S_SK01', zone:'RET_NW'}, {id:'S_GS01', zone:'RET_NW'}, {id:'S_BK01', zone:'RET_NW'}, {id:'S_KT01', zone:'RET_NW'}, {id:'S_DU01', zone:'RET_NW'},

  // north east (RET_NE)
  {id:'S_MB01', zone:'RET_NE'}, {id:'S_MB02', zone:'RET_NE'}, {id:'S_GB01', zone:'RET_NE'}, {id:'S_YL01', zone:'RET_NE'}, {id:'S_BC01', zone:'RET_NE'},
  {id:'S_JL01', zone:'RET_NE'}, {id:'S_PT01', zone:'RET_NE'}, {id:'S_DM01', zone:'RET_NE'},
];

const BASE_ROUTES = [
  {f:'NNPC_EP', t:'BONNY_T', m:'Pipeline'},
  {f:'NNPC_EP', t:'FORCADOS_T', m:'Pipeline'},
  {f:'SPDC', t:'BONNY_T', m:'Pipeline'},
  {f:'SPDC', t:'FORCADOS_T', m:'Pipeline'},
  {f:'MPNU', t:'QUAIBOE_T', m:'Pipeline'},
  {f:'CNL', t:'ESCRAVOS_T', m:'Pipeline'},
  {f:'SNEPCO', t:'BONGA_T', m:'FPSO Offload'},
  {f:'TEPNG', t:'BONNY_T', m:'Pipeline'},
  {f:'AGBAMI', t:'AGBAMI_T', m:'FPSO Offload'},
  {f:'ERHA', t:'ERHA_T', m:'FPSO Offload'},
  {f:'EGINA', t:'EGINA_T', m:'FPSO Offload'},
  {f:'AKPO', t:'AKPO_T', m:'FPSO Offload'},
  {f:'AITEO', t:'BONNY_T', m:'Nembe Pipeline'},
  {f:'HEIRS', t:'BONNY_T', m:'Pipeline'},
  {f:'SEEPCO', t:'TULJA_T', m:'FSO'},
  {f:'SEP_L', t:'FORCADOS_T', m:'Pipeline'},
  {f:'FIRST_EP', t:'BONNY_T', m:'Pipeline'},
  {f:'OANDO', t:'BRASS_T', m:'Pipeline'},
  {f:'USAN', t:'USAN_T', m:'FPSO Offload'},
  {f:'NEWCROSS', t:'FORCADOS_T', m:'Pipeline'},
  {f:'NDWEST', t:'FORCADOS_T', m:'Pipeline'},
  {f:'NEOL', t:'BONNY_T', m:'Pipeline'},
  {f:'SHORELINE', t:'FORCADOS_T', m:'Pipeline'},
  {f:'STER_G', t:'TULJA_T', m:'FSO'},
  {f:'NECONDE', t:'FORCADOS_T', m:'Pipeline'},
  {f:'NAE_ABO', t:'ABO_T', m:'FPSO Offload'},
  {f:'ARADEL', t:'BONNY_T', m:'Pipeline'},
  {f:'CONTINENTAL', t:'ESCRAVOS_T', m:'Pipeline'},
  {f:'ORIENTAL', t:'QUAIBOE_T', m:'Pipeline'},
  {f:'GREEN_EN', t:'BONNY_T', m:'Pipeline'},
  {f:'MWEST', t:'FORCADOS_T', m:'Pipeline'},
  {f:'EROTON', t:'BONNY_T', m:'Pipeline'},
  {f:'ELCREST', t:'BONNY_T', m:'Pipeline'},
  {f:'ANTAN', t:'BONNY_T', m:'FPSO/Pipeline'},
  {f:'YFOLAWIYO', t:'BONNY_T', m:'Pipeline'},
  {f:'AMNI', t:'AILSA_T', m:'FSO'},
  {f:'BELEMAOIL', t:'BONNY_T', m:'Pipeline'},
  {f:'EMERALD', t:'BONNY_T', m:'Pipeline'},
  {f:'SOUTHATL', t:'BONNY_T', m:'Pipeline'},
  {f:'ENAGEED', t:'FORCADOS_T', m:'Pipeline'},
  {f:'ALLGRACE', t:'BONNY_T', m:'Pipeline'},
  {f:'PILLAR', t:'FORCADOS_T', m:'Pipeline'},
  {f:'MONI_PULO', t:'BONNY_T', m:'FPSO/Pipeline'},
  {f:'ENERGIA', t:'FORCADOS_T', m:'Pipeline'},
  {f:'PAN_OCEAN', t:'FORCADOS_T', m:'Pipeline'},
  {f:'UNIVERSAL', t:'QUAIBOE_T', m:'Pipeline'},
  {f:'WSMITH_UP', t:'BONNY_T', m:'Pipeline'},
  {f:'GHL', t:'BONNY_T', m:'FPSO/Pipeline'},
  {f:'EXCEL_EP', t:'FORCADOS_T', m:'Pipeline'},
  {f:'NEWCROSS_P', t:'FORCADOS_T', m:'Pipeline'},
  {f:'FRONTIER', t:'QUAIBOE_T', m:'Pipeline'},
  {f:'PLATFORM', t:'FORCADOS_T', m:'Pipeline'},
  {f:'BRITTANIA', t:'BONNY_T', m:'FPSO/Pipeline'},
  {f:'NETWORK', t:'QUAIBOE_T', m:'Pipeline'},
  {f:'CHORUS', t:'FORCADOS_T', m:'Pipeline'},
  {f:'CONOIL_P', t:'ESCRAVOS_T', m:'Pipeline'},
  {f:'MILLENIUM', t:'BONNY_T', m:'Pipeline'},
  {f:'DUBRI', t:'ESCRAVOS_T', m:'Pipeline'},

  // Onshore Terminals → International & Dangote
  {f:'BONNY_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'BONNY_T', t:'INDIA', m:'Tanker Export'},
  {f:'BONNY_T', t:'DANGOTE', m:'Coastal Vessel'},
  {f:'FORCADOS_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'ESCRAVOS_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'ESCRAVOS_T', t:'DANGOTE', m:'Coastal Vessel'},
  {f:'QUAIBOE_T', t:'INDIA', m:'Tanker Export'},
  {f:'QUAIBOE_T', t:'DANGOTE', m:'Coastal Vessel'},
  {f:'BRASS_T', t:'ROTTERDAM', m:'Tanker Export'},

  // FPSO Terminals → International & Dangote
  {f:'BONGA_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'BONGA_T', t:'DANGOTE', m:'Crude Feedstock'},
  {f:'AGBAMI_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'AGBAMI_T', t:'INDIA', m:'Tanker Export'},
  {f:'ERHA_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'USAN_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'EGINA_T', t:'INDIA', m:'Tanker Export'},
  {f:'EGINA_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'AKPO_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'TULJA_T', t:'ROTTERDAM', m:'Tanker Export'},
  {f:'ABO_T', t:'ROTTERDAM', m:'Tanker Export'},

  // International → Importers
  {f:'ROTTERDAM', t:'NNPC_IMP', m:'Vessel Import'},
  {f:'ROTTERDAM', t:'DAPPMA', m:'Vessel Import'},
  {f:'ROTTERDAM', t:'MOMAN', m:'Vessel Import'},
  {f:'HOUSTON', t:'DANGOTE', m:'Crude Feedstock'},
  {f:'JEDDAH', t:'NNPC_IMP', m:'Vessel Import'},

  // Dangote + Importers → Depots
  {f:'DANGOTE', t:'ATLAS', m:'Coastal Vessel'},
  {f:'DANGOTE', t:'SAT_DEP', m:'Coastal Vessel'},
  {f:'DANGOTE', t:'WARRI_DEP', m:'Pipeline/Vessel'},
  {f:'NNPC_IMP', t:'ATLAS', m:'Vessel Import'},
  {f:'DAPPMA', t:'ATLAS', m:'Vessel Import'},
  {f:'MOMAN', t:'ATLAS', m:'Vessel Import'},
  {f:'NNPC_IMP', t:'PH_DEP', m:'Vessel Import'},
  {f:'DAPPMA', t:'WARRI_DEP', m:'Vessel Import'},
  {f:'DAPPMA', t:'CALABAR_D', m:'Vessel Import'},

  // Depot → Depot distribution
  {f:'ATLAS', t:'SAT_DEP', m:'Pipeline'},
  {f:'ATLAS', t:'BOVAS', m:'Coastal Vessel'},
  {f:'ATLAS', t:'SHEMA', m:'Coastal Vessel'},
  {f:'ATLAS', t:'ORE_DEP', m:'Truck'},
  {f:'ATLAS', t:'IBADAN_D', m:'Truck'},
  {f:'SAT_DEP', t:'KADUNA_D', m:'Truck/Bridged'},
  {f:'SAT_DEP', t:'MINNA_D', m:'Truck'},
  {f:'PH_DEP', t:'CALABAR_D', m:'Truck'},
  {f:'PH_DEP', t:'ABA_DEP', m:'Truck'},
  {f:'PH_DEP', t:'ENUGU_D', m:'Truck'},
  {f:'KADUNA_D', t:'JOS_DEP', m:'Truck'},

  // Depots → Retail Zones
  {f:'ATLAS', t:'RET_SW', m:'Truck Fleet'},
  {f:'BOVAS', t:'RET_SW', m:'Truck'},
  {f:'SHEMA', t:'RET_SW', m:'Truck'},
  {f:'SAT_DEP', t:'RET_SW', m:'Truck Fleet'},
  {f:'ORE_DEP', t:'RET_SW', m:'Truck'},
  {f:'IBADAN_D', t:'RET_SW', m:'Truck'},
  {f:'PH_DEP', t:'RET_SS', m:'Truck Fleet'},
  {f:'WARRI_DEP', t:'RET_SS', m:'Truck'},
  {f:'ABA_DEP', t:'RET_SE', m:'Truck'},
  {f:'ENUGU_D', t:'RET_SE', m:'Truck'},
  {f:'CALABAR_D', t:'RET_SE', m:'Truck'},
  {f:'KADUNA_D', t:'RET_NW', m:'Truck'},
  {f:'JOS_DEP', t:'RET_NC', m:'Truck'},
  {f:'MINNA_D', t:'RET_NC', m:'Truck'},
  {f:'KADUNA_D', t:'RET_NE', m:'Truck (Bridged)'},
];

const STATION_ROUTES = STATIONS.map(s=>({f:s.id, t:s.zone, m:'Station Link'}));
const ROUTES = [...BASE_ROUTES, ...STATION_ROUTES];

// Build node map including stations (stations are separate nodes)
const nodeMap = new Map();
ND.forEach(n=>{ nodeMap.set(n.id, {...n}); });
STATIONS.forEach(s=>{ nodeMap.set(s.id, {...s, t:'station'}); });

// Helpers
function findMissingEndpoints(routes, nodeMap){
  const missing = new Set();
  for(const r of routes){
    if(!nodeMap.has(r.f)) missing.add(r.f);
    if(!nodeMap.has(r.t)) missing.add(r.t);
  }
  return Array.from(missing).sort();
}

function duplicateIds(list){
  const seen = new Map();
  const dupes = new Map();
  list.forEach(item=>{
    const id = item.id;
    seen.set(id, (seen.get(id)||0)+1);
    if(seen.get(id)>1) dupes.set(id, seen.get(id));
  });
  return Array.from(dupes.keys());
}

function duplicateRoutes(routes){
  const map = new Map();
  const dupes = [];
  routes.forEach(r=>{
    const k = `${r.f}::${r.t}`;
    map.set(k, (map.get(k)||0)+1);
  });
  for(const [k,v] of map.entries()) if(v>1) dupes.push({pair:k,count:v});
  return dupes;
}

function buildAdj(routes){
  const adj = new Map();
  function add(a,b){ if(!adj.has(a)) adj.set(a,new Set()); adj.get(a).add(b); }
  routes.forEach(r=>{ add(r.f,r.t); add(r.t,r.f); });
  return adj;
}

function componentsFromAdj(adj, nodeIds){
  const visited = new Set();
  const comps = [];
  for(const id of nodeIds){
    if(visited.has(id)) continue;
    const stack = [id];
    const comp = [];
    visited.add(id);
    while(stack.length){
      const u = stack.pop(); comp.push(u);
      const neigh = adj.get(u) || new Set();
      for(const v of neigh){ if(!visited.has(v)){ visited.add(v); stack.push(v); } }
    }
    comps.push(comp);
  }
  return comps;
}

// Run checks
const missingEndpoints = findMissingEndpoints(ROUTES, nodeMap);
const duplicateNodeIds = duplicateIds(ND);
const duplicateRoutePairs = duplicateRoutes(ROUTES);
const adj = buildAdj(ROUTES);
const allNodeIds = Array.from(nodeMap.keys()).sort();
const isolatedNodes = allNodeIds.filter(id=>{ const s = adj.get(id); return !s || s.size===0; });
const comps = componentsFromAdj(adj, allNodeIds);
comps.sort((a,b)=>b.length-a.length);
const largestComp = comps[0] || [];
const notInLargest = allNodeIds.filter(id=>!largestComp.includes(id));

// Degree statistics
const deg = {}; allNodeIds.forEach(id=>{ deg[id] = (adj.get(id)?adj.get(id).size:0); });
const topDegrees = allNodeIds.map(id=>({id,deg:deg[id]})).sort((a,b)=>b.deg-a.deg).slice(0,20);

// Print report
console.log('\n=== Connectivity check report ===\n');
console.log(`Total ND nodes: ${ND.length}`);
console.log(`Total station pins: ${STATIONS.length}`);
console.log(`Total routes (base + station links): ${ROUTES.length}`);
console.log('');
if(duplicateNodeIds.length) console.log('Duplicate ND ids found:', duplicateNodeIds);
else console.log('No duplicate ND ids found.');

if(duplicateRoutePairs.length) console.log('Duplicate route pairs (f::t) and counts:', duplicateRoutePairs);
else console.log('No duplicate explicit routes found.');

console.log('');
if(missingEndpoints.length){
  console.log('Nodes referenced in routes but NOT defined in ND/STATIONS (missing endpoints):');
  missingEndpoints.forEach(m=>console.log(' -', m));
} else console.log('All route endpoints are defined in ND/STATIONS.');

console.log('');
if(isolatedNodes.length){
  console.log('Nodes with zero connections (isolated):');
  isolatedNodes.forEach(n=>console.log(' -', n));
} else console.log('No fully isolated ND/STATION nodes (every node has ≥1 connection).');

console.log('');
console.log(`Connected components found: ${comps.length}`);
console.log('Top component sizes:', comps.slice(0,6).map(c=>c.length));
console.log(`Largest component size: ${largestComp.length}`);
if(notInLargest.length){
  console.log('\nNodes NOT in largest component (may be disconnected subgraphs):');
  notInLargest.forEach(n=>console.log(' -', n));
} else console.log('All nodes are part of a single large component.');

console.log('\nTop nodes by undirected degree (neighbors count):');
topDegrees.forEach(x=>console.log(` - ${x.id}: ${x.deg}`));

console.log('\n=== End of report ===\n');

// Exit code 0
process.exit(0);
