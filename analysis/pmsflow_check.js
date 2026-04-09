'use strict';

/* Connectivity check for the pasted PMSFLOW JS data arrays
   - copies ND, STATIONS, BASE_ROUTES, WELLS from the provided HTML
   - reports missing references, isolated nodes, counts
*/

const ND=[
  {id:'NNPC_EP',   lb:'NNPC E&P',           t:'upstream',lat:5.50,lng:6.80, bopd:313437,api:33,field:'OML 11,13,20,26,28-56',    rg:'south-south',own:'NOC',        term:'Bonny/Forcados/Okono', wc:42,gc:8, est:false},
  {id:'SPDC',      lb:'SPDC / Renaissance',  t:'upstream',lat:4.90,lng:6.85, bopd:226421,api:34,field:'Multiple SPDC Fields',     rg:'south-south',own:'IOC→Indig.', term:'Bonny Light/Forcados', wc:36,gc:5, est:false},
  {id:'MPNU',      lb:'MPNU / Seplat',       t:'upstream',lat:4.62,lng:7.75, bopd:216462,api:39,field:'OML 67, 68, 70, 104',      rg:'south-south',own:'Indig./JV',  term:'Qua Iboe / Yoho',      wc:30,gc:6, est:false},
  {id:'CNL',       lb:'Chevron Nigeria',     t:'upstream',lat:5.30,lng:5.05, bopd:190169,api:33,field:'OML 49, 79, 90',           rg:'south-south',own:'IOC',        term:'Escravos Light',        wc:34,gc:7, est:false},
  {id:'SNEPCO',    lb:'Shell SNEPCO',        t:'upstream',lat:3.60,lng:5.90, bopd:136876,api:27,field:'Bonga Deepwater',          rg:'offshore',   own:'IOC',        term:'Bonga FPSO',            wc:22,gc:3, est:false},
  {id:'TEPNG',     lb:'TotalEnergies EP',    t:'upstream',lat:4.30,lng:6.50, bopd:101779,api:38,field:'Akpo, Egina, Odudu',       rg:'south-south',own:'IOC',        term:'Odudu / Amenam Blend',  wc:26,gc:5, est:false},
  {id:'AGBAMI',    lb:'Star Deep / Agbami',  t:'upstream',lat:3.70,lng:4.90, bopd:92834, api:49,field:'Agbami Field',             rg:'offshore',   own:'IOC',        term:'Agbami FPSO',           wc:18,gc:2, est:false},
  {id:'ERHA',      lb:'Esso ERHA',           t:'upstream',lat:3.30,lng:5.50, bopd:76510, api:35,field:'Erha / Erha North',        rg:'offshore',   own:'IOC',        term:'Erha FPSO',             wc:16,gc:2, est:false},
  {id:'EGINA',     lb:'Total Egina',         t:'upstream',lat:3.70,lng:6.20, bopd:72424, api:27,field:'Egina Field',              rg:'offshore',   own:'IOC',        term:'Egina FPSO',            wc:18,gc:3, est:false},
  {id:'AKPO',      lb:'Total AKPO',          t:'upstream',lat:3.50,lng:6.75, bopd:67071, api:46,field:'Akpo Condensate',          rg:'offshore',   own:'IOC',        term:'Akpo Condensate FPSO',  wc:14,gc:8, est:false},
  {id:'AITEO',     lb:'Aiteo Eastern',       t:'upstream',lat:4.90,lng:6.35, bopd:63250, api:35,field:'OML 29 (Nembe Creek)',     rg:'south-south',own:'Indigenous', term:'Galilean 7 / Bonny',    wc:20,gc:3, est:false},
  {id:'HEIRS',     lb:'Heirs Energies',      t:'upstream',lat:5.15,lng:6.70, bopd:55762, api:37,field:'OML 17',                   rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:18,gc:2, est:false},
  {id:'SEEPCO',    lb:'Sterling / SEEPCO',   t:'upstream',lat:4.70,lng:6.05, bopd:55081, api:46,field:'All SEEPCO Fields',        rg:'south-south',own:'Indigenous', term:'Tulja FSO',             wc:16,gc:2, est:false},
  {id:'SEP_L',     lb:'Seplat Energy',       t:'upstream',lat:5.60,lng:6.25, bopd:55000, api:38,field:'Seplat Eastern & Western', rg:'south-south',own:'Indigenous', term:'Forcados / Brass',      wc:22,gc:6, est:false},
  {id:'FIRST_EP',  lb:'First E&P',           t:'upstream',lat:4.10,lng:7.30, bopd:51298, api:33,field:'Anyala Field',             rg:'south-south',own:'Indigenous', term:'CJ Blend FPSO',         wc:10,gc:1, est:false},
  {id:'OANDO',     lb:'Oando / NAOC JV',     t:'upstream',lat:4.45,lng:6.15, bopd:35334, api:35,field:'All NAOC Fields',          rg:'south-south',own:'Indigenous', term:'Brass Blend',           wc:14,gc:3, est:false},
  {id:'USAN',      lb:'Esso USAN',           t:'upstream',lat:3.20,lng:6.00, bopd:32855, api:29,field:'USAN Field',               rg:'offshore',   own:'IOC',        term:'USAN FPSO',             wc:12,gc:1, est:false},
  {id:'NEWCROSS',  lb:'Newcross E&P',        t:'upstream',lat:5.40,lng:5.80, bopd:29937, api:47,field:'All Newcross Fields',       rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:10,gc:1, est:false},
  {id:'NDWEST',    lb:'ND Western',          t:'upstream',lat:5.45,lng:6.40, bopd:28000, api:33,field:'OML 34',                   rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:12,gc:2, est:true},
  {id:'NEOL',      lb:'NNPC NEOL',           t:'upstream',lat:5.20,lng:7.20, bopd:27750, api:33,field:'All NEOL Fields',           rg:'south-south',own:'NOC',        term:'Bonny Light',           wc:8, gc:1, est:false},
  {id:'SHORELINE', lb:'Shoreline N.R.',      t:'upstream',lat:5.30,lng:6.60, bopd:25000, api:32,field:'OML 30',                   rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:10,gc:2, est:true},
  {id:'STER_G',    lb:'Sterling Global',     t:'upstream',lat:4.65,lng:6.00, bopd:21185, api:42,field:'AGU / Oguali Fields',      rg:'south-south',own:'Indigenous', term:'Tulja FSO',             wc:8, gc:1, est:false},
  {id:'NECONDE',   lb:'Neconde Energy',      t:'upstream',lat:5.18,lng:6.42, bopd:18000, api:33,field:'OML 42 / 46',              rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:8, gc:1, est:true},
  {id:'NAE_ABO',   lb:'Nig. Agip Explor.', t:'upstream', lat:3.78,lng:6.45, bopd:13995, api:39,field:'Abo Field (deepwater)',     rg:'offshore',   own:'IOC',        term:'Abo FPSO',              wc:6, gc:1, est:false},
  {id:'ARADEL',    lb:'Aradel Holdings',     t:'upstream',lat:4.78,lng:6.85, bopd:14825, api:41,field:'Ogbele Field',             rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:6, gc:1, est:false},
  {id:'CONTINENTAL',lb:'Continental O&G',   t:'upstream',lat:5.18,lng:5.25, bopd:11637, api:37,field:'All Continental Fields',    rg:'south-south',own:'Indigenous', term:'Pennington / Escravos', wc:8, gc:0, est:false},
  {id:'ORIENTAL',  lb:'Oriental Energy',     t:'upstream',lat:4.52,lng:7.82, bopd:11317, api:17,field:'Ebok Field (OML 115)',      rg:'south-south',own:'Indigenous', term:'Ebok Blend',            wc:6, gc:0, est:false},
  {id:'GREEN_EN',  lb:'Green Energy Intl',   t:'upstream',lat:4.68,lng:7.58, bopd:8315,  api:43,field:'Otakikpo Field',           rg:'south-south',own:'Indigenous', term:'IMA / Otakikpo Blend',  wc:5, gc:0, est:false},
  {id:'MWEST',     lb:'Midwestern O&G',      t:'upstream',lat:5.35,lng:6.10, bopd:10625, api:39,field:'Umusadege Field',          rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:5, gc:0, est:false},
  {id:'EROTON',    lb:'Eroton E&P',          t:'upstream',lat:4.88,lng:6.75, bopd:10000, api:33,field:'OML 18',                   rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:5, gc:0, est:true},
  {id:'ELCREST',   lb:'Elcrest E&P',         t:'upstream',lat:5.08,lng:7.05, bopd:9000,  api:33,field:'OML 40',                   rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:4, gc:0, est:true},
  {id:'ANTAN',     lb:'Antan Producing',     t:'upstream',lat:3.92,lng:7.82, bopd:4870,  api:29,field:'OML 123, 124, 126',        rg:'offshore',   own:'Indigenous', term:'Antan Blend',           wc:4, gc:0, est:false},
  {id:'YFOLAWIYO', lb:'Yinka Folawiyo',      t:'upstream',lat:3.90,lng:7.60, bopd:8000,  api:33,field:'OML 113',                  rg:'south-south',own:'Indigenous', term:'Odudu / Bonny',         wc:4, gc:0, est:true},
  {id:'AMNI',      lb:'AMNI International',  t:'upstream',lat:5.25,lng:7.50, bopd:5262,  api:32,field:'Okoro / Asaro Fields',     rg:'south-south',own:'Indigenous', term:'Ailsa Craig FSO',       wc:4, gc:0, est:false},
  {id:'BELEMAOIL', lb:'Belemaoil Prod.',     t:'upstream',lat:4.80,lng:6.90, bopd:7470,  api:30,field:'All Belema Fields',        rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:5, gc:1, est:false},
  {id:'EMERALD',   lb:'Emerald Energy',      t:'upstream',lat:4.62,lng:7.10, bopd:6000,  api:33,field:'OML 36',                   rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:3, gc:0, est:true},
  {id:'SOUTHATL',  lb:'South Atlantic Pet.', t:'upstream',lat:3.80,lng:6.85, bopd:5500,  api:33,field:'OML 115 Offshore',         rg:'offshore',   own:'Indigenous', term:'Odudu Blend',           wc:3, gc:0, est:true},
  {id:'ENAGEED',   lb:'Enageed Resources',   t:'upstream',lat:5.42,lng:6.18, bopd:4223,  api:46,field:'Oki-Oziengbe Field',       rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:3, gc:0, est:false},
  {id:'ALLGRACE',  lb:'All Grace Energy',    t:'upstream',lat:5.12,lng:6.95, bopd:4000,  api:43,field:'Ubima Field',              rg:'south-south',own:'Indigenous', term:'IMA / Otakikpo Blend',  wc:3, gc:0, est:false},
  {id:'PILLAR',    lb:'Pillar Oil',          t:'upstream',lat:5.58,lng:6.45, bopd:3853,  api:36,field:'Umuseti / Igbuku',         rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:3, gc:0, est:false},
  {id:'MONI_PULO', lb:'Moni Pulo Petroleum', t:'upstream',lat:4.02,lng:7.88, bopd:2135,  api:27,field:'Abana (OML 123/126)',      rg:'offshore',   own:'Indigenous', term:'Antan Blend',           wc:3, gc:0, est:false},
  {id:'ENERGIA',   lb:'Energia Limited',     t:'upstream',lat:5.38,lng:6.22, bopd:3455,  api:49,field:'Ebendo / Obodeti',         rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:3, gc:0, est:false},
  {id:'PAN_OCEAN', lb:'Pan Ocean Oil',       t:'upstream',lat:5.72,lng:6.55, bopd:2756,  api:58,field:'OML 147',                  rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:3, gc:0, est:false},
  {id:'UNIVERSAL', lb:'Universal Energy',    t:'upstream',lat:4.88,lng:7.78, bopd:2830,  api:41,field:'Stubb Creek Field',        rg:'south-south',own:'Indigenous', term:'Qua Iboe Light',        wc:2, gc:0, est:false},
  {id:'WSMITH_UP', lb:'Waltersmith Petro.',  t:'upstream',lat:5.28,lng:7.15, bopd:2495,  api:26,field:'Ibigwe / Assa',            rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:2, gc:0, est:false},
  {id:'GHL',       lb:'Gen. Hydrocarbons',   t:'upstream',lat:3.82,lng:7.12, bopd:1219,  api:40,field:'Oyo Deepwater Field',      rg:'offshore',   own:'Indigenous', term:'Tamara Tokoni',         wc:2, gc:0, est:false},
  {id:'EXCEL_EP',  lb:'Excel E&P',           t:'upstream',lat:5.32,lng:5.95, bopd:1752,  api:23,field:'Eremor Field',             rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:2, gc:0, est:false},
  {id:'NEWCROSS_P',lb:'Newcross Petroleum',  t:'upstream',lat:5.45,lng:5.82, bopd:1412,  api:47,field:'Efe Field (OML 26)',       rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:2, gc:0, est:false},
  {id:'FRONTIER',  lb:'Frontier Oil',        t:'upstream',lat:5.02,lng:7.85, bopd:1117,  api:46,field:'Uquo Field',               rg:'south-south',own:'Indigenous', term:'Qua Iboe Light',        wc:2, gc:0, est:false},
  {id:'PLATFORM',  lb:'Platform Petroleum',  t:'upstream',lat:5.68,lng:6.62, bopd:3646,  api:32,field:'Egbaoma Field',            rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:3, gc:0, est:false},
  {id:'BRITTANIA', lb:'Brittania-U',         t:'upstream',lat:5.28,lng:7.38, bopd:3531,  api:45,field:'Ajapa Field',              rg:'south-south',own:'Indigenous', term:'Ajapa Blend',           wc:3, gc:0, est:false},
  {id:'NETWORK',   lb:'Network E&P',         t:'upstream',lat:4.52,lng:8.02, bopd:1138,  api:42,field:'Qua Iboe Blocks',          rg:'south-south',own:'Indigenous', term:'Qua Iboe Light',        wc:1, gc:0, est:false},
  {id:'CHORUS',    lb:'Chorus Energy',       t:'upstream',lat:5.65,lng:6.82, bopd:757,   api:62,field:'Matsogo Field',            rg:'south-south',own:'Indigenous', term:'Forcados Blend',        wc:1, gc:0, est:false},
  {id:'CONOIL_P',  lb:'Conoil Producing',    t:'upstream',lat:5.40,lng:5.20, bopd:673,   api:29,field:'All Conoil Fields',        rg:'south-south',own:'Indigenous', term:'Escravos Blend',        wc:1, gc:0, est:false},
  {id:'MILLENIUM', lb:'Millenium Oil & Gas', t:'upstream',lat:4.82,lng:7.22, bopd:323,   api:22,field:'Oza Field',                rg:'south-south',own:'Indigenous', term:'Bonny Light',           wc:1, gc:0, est:false},
  {id:'DUBRI',     lb:'Dubri Oil Co.',        t:'upstream',lat:5.50,lng:5.98, bopd:151,   api:35,field:'Gilli-Gilli / Ovia',      rg:'south-south',own:'Indigenous', term:'Escravos Light',        wc:1, gc:0, est:false},
  {id:'DANGOTE',   lb:'Dangote Refinery',    t:'refinery',lat:6.43,lng:3.54, cap:650000,util:61.27,pms:40.1,ago:10.9, loc:'Lekki, Lagos',   st:'OPERATIONAL',rg:'south-west'},
  {id:'PHRC',      lb:'Port Harcourt RC',    t:'refinery',lat:4.86,lng:6.96, cap:60000, util:0,    pms:0,   ago:0,    loc:'Rivers State',   st:'SHUTDOWN',   rg:'south-south'},
  {id:'WRPC',      lb:'Warri Refinery',      t:'refinery',lat:5.54,lng:5.75, cap:125000,util:0,    pms:0,   ago:0,    loc:'Delta State',    st:'SHUTDOWN',   rg:'south-south'},
  {id:'KRPC',      lb:'Kaduna Refinery',     t:'refinery',lat:10.5,lng:7.43, cap:110000,util:0,    pms:0,   ago:0,    loc:'Kaduna State',   st:'SHUTDOWN',   rg:'north'},
  {id:'WSMITH',    lb:'Waltersmith Ref.',    t:'refinery',lat:5.22,lng:7.10, cap:5000,  util:61.66,pms:0,   ago:0.124,loc:'Imo State',      st:'OPERATIONAL',rg:'south-south'},
  {id:'EDO_REF',   lb:'Edo Refinery',        t:'refinery',lat:6.35,lng:5.63, cap:1000,  util:63.23,pms:0,   ago:0.055,loc:'Edo State',      st:'OPERATIONAL',rg:'south-south'},
  {id:'ARADEL_R',  lb:'Aradel Refinery',     t:'refinery',lat:4.72,lng:6.82, cap:10000, util:29.09,pms:0,   ago:0.118,loc:'Rivers State',   st:'OPERATIONAL',rg:'south-south'},
  {id:'OPAC',      lb:'OPAC Refineries',     t:'refinery',lat:5.72,lng:6.38, cap:10000, util:0,    pms:0,   ago:0,    loc:'Delta State',    st:'SHUTDOWN',   rg:'south-south'},
  {id:'DUPORT',    lb:'Duport Midstream',    t:'refinery',lat:5.68,lng:5.95, cap:2500,  util:0,    pms:0,   ago:0,    loc:'Edo State',      st:'SHUTDOWN',   rg:'south-south'},
  {id:'BONNY_T',   lb:'Bonny Terminal',          t:'terminal',lat:4.45,lng:7.15, op:'Shell/NNPC',             blend:'Bonny Light 36.5° API',     fpso:false,rg:'south-south'},
  {id:'FORCADOS_T',lb:'Forcados Terminal',        t:'terminal',lat:5.38,lng:5.40, op:'Shell/NNPC',             blend:'Forcados Blend 32° API',    fpso:false,rg:'south-south'},
  {id:'ESCRAVOS_T',lb:'Escravos Terminal',        t:'terminal',lat:5.60,lng:5.18, op:'Chevron/NNPC',           blend:'Escravos Light 33.4° API',  fpso:false,rg:'south-south'},
  {id:'QUAIBOE_T', lb:'Qua Iboe Terminal',        t:'terminal',lat:4.62,lng:7.92, op:'ExxonMobil/NNPC',        blend:'Qua Iboe Light 39.1° API',  fpso:false,rg:'south-south'},
  {id:'BRASS_T',   lb:'Brass Terminal',           t:'terminal',lat:4.32,lng:6.25, op:'NAOC/Oando',             blend:'Brass Blend 35° API',       fpso:false,rg:'south-south'},
  {id:'BONGA_T',   lb:'Bonga FPSO',               t:'terminal',lat:3.45,lng:5.72, op:'Shell SNEPCO',           blend:'Bonga Crude 27.5° API',     fpso:true, rg:'offshore'},
  {id:'AGBAMI_T',  lb:'Agbami FPSO',              t:'terminal',lat:3.52,lng:4.82, op:'Star Deep / Chevron',    blend:'Agbami Condensate 49° API', fpso:true, rg:'offshore'},
  {id:'ERHA_T',    lb:'Erha FPSO',                t:'terminal',lat:3.18,lng:5.42, op:'Esso E&P Nigeria',       blend:'Erha Crude 35.3° API',      fpso:true, rg:'offshore'},
  {id:'USAN_T',    lb:'USAN FPSO',                t:'terminal',lat:3.08,lng:5.92, op:'Esso E&P Offshore East', blend:'USAN Crude 29.5° API',      fpso:true, rg:'offshore'},
  {id:'EGINA_T',   lb:'Egina FPSO',               t:'terminal',lat:3.52,lng:6.12, op:'TotalEnergies',          blend:'Egina Crude 27.4° API',     fpso:true, rg:'offshore'},
  {id:'AKPO_T',    lb:'Akpo FPSO',                t:'terminal',lat:3.32,lng:6.62, op:'TotalEnergies',          blend:'Akpo Condensate 46° API',   fpso:true, rg:'offshore'},
  {id:'TULJA_T',   lb:'Tulja / Okwuibome FSO',    t:'terminal',lat:4.58,lng:6.08, op:'Sterling Oil / SEEPCO',  blend:'Tulja Crude 42-49° API',    fpso:true, rg:'south-south'},
  {id:'AILSA_T',   lb:'Ailsa Craig FSO',           t:'terminal',lat:4.92,lng:7.52, op:'AMNI International',     blend:'AMNI Crude 32.4° API',      fpso:true, rg:'south-south'},
  {id:'ABO_T',     lb:'Abo FPSO',                 t:'terminal',lat:3.68,lng:6.48, op:'Nigerian Agip Explor.',  blend:'Abo Crude 39° API',         fpso:true, rg:'offshore'},
  {id:'NNPC_IMP',  lb:'NNPC Import Div.',  t:'importer',lat:6.38,lng:3.42, sh:26.93,ports:'Apapa Lagos',           rg:'south-west'},
  {id:'DAPPMA',    lb:'DAPPMA Members',    t:'importer',lat:6.42,lng:3.46, sh:69.30,ports:'Apapa / Warri / PH',    rg:'south-west'},
  {id:'MOMAN',     lb:'MOMAN OMCs',        t:'importer',lat:6.44,lng:3.50, sh:3.77, ports:'Apapa Lagos',           rg:'south-west'},
  {id:'ATLAS',     lb:'Atlas Cove',        t:'depot',lat:6.40,lng:3.33, cap:900,sd:7.10,op:'NNPC/Private',    rg:'south-west'},
  {id:'SAT_DEP',   lb:'Satellite Depot',   t:'depot',lat:6.44,lng:3.36, cap:500,sd:5.30,op:'NNPC',            rg:'south-west'},
  {id:'BOVAS',     lb:'Bovas Ibafon',      t:'depot',lat:6.43,lng:3.38, cap:73, sd:null,op:'Bovas Petroleum', rg:'south-west'},
  {id:'SHEMA',     lb:'Shema Depot',       t:'depot',lat:6.46,lng:3.40, cap:50, sd:null,op:'Shema Pet.',      rg:'south-west'},
  {id:'PH_DEP',    lb:'PH Depot',          t:'depot',lat:4.84,lng:7.04, cap:200,sd:1.72,op:'NNPC',            rg:'south-south'},
  {id:'WARRI_DEP', lb:'Warri Depot',       t:'depot',lat:5.53,lng:5.74, cap:180,sd:3.35,op:'NNPC',            rg:'south-south'},
  {id:'CALABAR_D', lb:'Calabar Depot',     t:'depot',lat:4.96,lng:8.33, cap:150,sd:3.34,op:'NNPC/DAPPMA',     rg:'south-south'},
  {id:'KADUNA_D',  lb:'Kaduna Depot',      t:'depot',lat:10.51,lng:7.44,cap:120,sd:0.46,op:'NNPC (Bridged)',  rg:'north'},
  {id:'ABA_DEP',   lb:'Aba Depot',         t:'depot',lat:5.10,lng:7.36, cap:100,sd:2.1, op:'NNPC/Private',   rg:'south-south'},
  {id:'ORE_DEP',   lb:'Ore Depot',         t:'depot',lat:6.73,lng:4.86, cap:80, sd:null,op:'NNPC/Private',   rg:'south-west'},
  {id:'IBADAN_D',  lb:'Ibadan Depot',      t:'depot',lat:7.38,lng:3.90, cap:150,sd:3.0, op:'NNPC',           rg:'south-west'},
  {id:'ENUGU_D',   lb:'Enugu Depot',       t:'depot',lat:6.44,lng:7.50, cap:100,sd:2.5, op:'NNPC',           rg:'south-south'},
  {id:'JOS_DEP',   lb:'Jos Depot',         t:'depot',lat:9.92,lng:8.89, cap:80, sd:1.8, op:'NNPC',           rg:'north'},
  {id:'MINNA_D',   lb:'Minna Depot',       t:'depot',lat:9.61,lng:6.56, cap:80, sd:2.0, op:'NNPC',           rg:'north'},
  {id:'RET_SW',lb:'South West Zone',   t:'retail',lat:7.00,lng:3.70, stations:6120,brands:'Ardova, TotalEnergies, Conoil, MRS',rg:'south-west'},
  {id:'RET_SS',lb:'South South Zone',  t:'retail',lat:5.20,lng:6.20, stations:3580,brands:'NNPC Retail, Conoil, Ardova',      rg:'south-south'},
  {id:'RET_SE',lb:'South East Zone',   t:'retail',lat:5.90,lng:7.80, stations:2510,brands:'NNPC Retail, Ardova, Conoil',      rg:'south-south'},
  {id:'RET_NC',lb:'North Central Zone',t:'retail',lat:8.90,lng:7.20, stations:3050,brands:'NNPC Retail, MRS, TotalEnergies',  rg:'north'},
  {id:'RET_NW',lb:'North West Zone',   t:'retail',lat:12.0,lng:8.50, stations:4550,brands:'NNPC Retail, Ardova',              rg:'north'},
  {id:'RET_NE',lb:'North East Zone',   t:'retail',lat:11.2,lng:12.0, stations:2420,brands:'NNPC Retail',                      rg:'north'},
  {id:'ROTTERDAM',lb:'Rotterdam / ARA',  t:'intl',lat:18.50,lng:-5.50,  note:'Refined PMS Source · ↓ Declining post-Dangote', rg:'all'},
  {id:'HOUSTON',  lb:'Houston / US Gulf',t:'intl',lat:14.00,lng:-17.50, note:'WTI Crude Feedstock → Dangote · ~43K bpd',      rg:'all'},
  {id:'JEDDAH',   lb:'Saudi Arabia / ME',t:'intl',lat:12.50,lng:28.00,  note:'Crude & Refined Products Source',               rg:'all'},
  {id:'INDIA',    lb:'India / Asia Pac.',t:'intl',lat:7.00, lng:22.00,  note:'↑ Growing buyer of Bonny Light crude',          rg:'all'},
];

const STATIONS = [
  {id:'S_LG01',lat:6.428,lng:3.421,zone:'RET_SW',city:'Lagos Island',price:1300},
  {id:'S_LG02',lat:6.600,lng:3.347,zone:'RET_SW',city:'Ikeja',price:1300},
  {id:'S_LG03',lat:6.499,lng:3.355,zone:'RET_SW',city:'Surulere',price:1300},
  {id:'S_LG04',lat:6.450,lng:3.360,zone:'RET_SW',city:'Apapa',price:1300},
  {id:'S_LG05',lat:6.505,lng:3.378,zone:'RET_SW',city:'Yaba',price:1300},
  {id:'S_LG06',lat:6.531,lng:3.358,zone:'RET_SW',city:'Mushin',price:1310},
  {id:'S_LG07',lat:6.440,lng:3.535,zone:'RET_SW',city:'Lekki',price:1300},
  {id:'S_LG08',lat:6.468,lng:3.596,zone:'RET_SW',city:'Ajah',price:1310},
  {id:'S_LG09',lat:6.466,lng:3.277,zone:'RET_SW',city:'Festac',price:1300},
  {id:'S_LG10',lat:6.618,lng:3.509,zone:'RET_SW',city:'Ikorodu',price:1320},
  {id:'S_LG11',lat:6.558,lng:3.268,zone:'RET_SW',city:'Alimosho',price:1310},
  {id:'S_LG12',lat:6.476,lng:3.600,zone:'RET_SW',city:'Sangotedo',price:1310},
  {id:'S_IB01',lat:7.388,lng:3.905,zone:'RET_SW',city:'Ibadan Central',price:1270},
  {id:'S_IB02',lat:7.402,lng:3.920,zone:'RET_SW',city:'Ibadan Bodija',price:1270},
  {id:'S_IB03',lat:7.375,lng:3.888,zone:'RET_SW',city:'Ibadan Agodi',price:1270},
  {id:'S_AB01',lat:7.150,lng:3.345,zone:'RET_SW',city:'Abeokuta',price:1290},
  {id:'S_AB02',lat:7.172,lng:3.362,zone:'RET_SW',city:'Abeokuta Sapon',price:1295},
  {id:'S_SG01',lat:6.840,lng:3.648,zone:'RET_SW',city:'Sagamu',price:1300},
  {id:'S_AK01',lat:7.258,lng:5.205,zone:'RET_SW',city:'Akure',price:1320},
  {id:'S_OD01',lat:7.100,lng:4.840,zone:'RET_SW',city:'Ondo Town',price:1320},
  {id:'S_OS01',lat:7.775,lng:4.560,zone:'RET_SW',city:'Oshogbo',price:1310},
  {id:'S_IF01',lat:7.468,lng:4.558,zone:'RET_SW',city:'Ile-Ife',price:1310},
  {id:'S_EK01',lat:7.620,lng:5.222,zone:'RET_SW',city:'Ado Ekiti',price:1340},
  {id:'S_OR01',lat:6.732,lng:4.860,zone:'RET_SW',city:'Ore',price:1310},
  {id:'S_KW01',lat:8.498,lng:4.552,zone:'RET_SW',city:'Ilorin',price:1340},
  {id:'S_PH01',lat:4.848,lng:7.018,zone:'RET_SS',city:'PH Trans Amadi',price:1360},
  {id:'S_PH02',lat:4.778,lng:7.002,zone:'RET_SS',city:'PH Old GRA',price:1350},
  {id:'S_PH03',lat:4.820,lng:7.038,zone:'RET_SS',city:'PH Rumuola',price:1360},
  {id:'S_PH04',lat:4.862,lng:7.062,zone:'RET_SS',city:'PH Woji',price:1365},
  {id:'S_WR01',lat:5.534,lng:5.748,zone:'RET_SS',city:'Warri Effurun',price:1370},
  {id:'S_WR02',lat:5.520,lng:5.730,zone:'RET_SS',city:'Warri Ugborikoko',price:1370},
  {id:'S_WR03',lat:5.558,lng:5.778,zone:'RET_SS',city:'Warri Sapele Rd',price:1375},
  {id:'S_BN01',lat:6.328,lng:5.628,zone:'RET_SS',city:'Benin City Ring Rd',price:1360},
  {id:'S_BN02',lat:6.342,lng:5.618,zone:'RET_SS',city:'Benin City Central',price:1355},
  {id:'S_BN03',lat:6.318,lng:5.598,zone:'RET_SS',city:'Benin Airport Rd',price:1360},
  {id:'S_CB01',lat:4.958,lng:8.322,zone:'RET_SS',city:'Calabar',price:1380},
  {id:'S_CB02',lat:4.978,lng:8.348,zone:'RET_SS',city:'Calabar South',price:1385},
  {id:'S_UY01',lat:5.052,lng:7.912,zone:'RET_SS',city:'Uyo',price:1370},
  {id:'S_AS01',lat:6.198,lng:6.738,zone:'RET_SS',city:'Asaba',price:1360},
  {id:'S_SP01',lat:5.898,lng:5.688,zone:'RET_SS',city:'Sapele',price:1370},
  {id:'S_YN01',lat:4.918,lng:6.268,zone:'RET_SS',city:'Yenagoa',price:1390},
  {id:'S_EK02',lat:4.648,lng:7.928,zone:'RET_SS',city:'Eket',price:1380},
  {id:'S_OP01',lat:4.518,lng:7.568,zone:'RET_SS',city:'Opobo Town',price:1400},
  {id:'S_EN01',lat:6.452,lng:7.502,zone:'RET_SE',city:'Enugu Independence',price:1400},
  {id:'S_EN02',lat:6.462,lng:7.488,zone:'RET_SE',city:'Enugu Ogui Rd',price:1400},
  {id:'S_ON01',lat:6.148,lng:6.782,zone:'RET_SE',city:'Onitsha Head Bridge',price:1390},
  {id:'S_ON02',lat:6.162,lng:6.798,zone:'RET_SE',city:'Onitsha New Mkt',price:1385},
  {id:'S_AB10',lat:5.108,lng:7.368,zone:'RET_SE',city:'Aba',price:1395},
  {id:'S_AB11',lat:5.122,lng:7.352,zone:'RET_SE',city:'Aba PH Road',price:1395},
  {id:'S_OW01',lat:5.488,lng:7.028,zone:'RET_SE',city:'Owerri',price:1400},
  {id:'S_OW02',lat:5.502,lng:7.042,zone:'RET_SE',city:'Owerri Wetheral',price:1400},
  {id:'S_AK10',lat:6.328,lng:8.118,zone:'RET_SE',city:'Abakaliki',price:1420},
  {id:'S_UM01',lat:5.528,lng:7.488,zone:'RET_SE',city:'Umuahia',price:1400},
  {id:'S_AW01',lat:6.208,lng:7.068,zone:'RET_SE',city:'Awka',price:1390},
  {id:'S_NN01',lat:6.018,lng:6.918,zone:'RET_SE',city:'Nnewi',price:1385},
  {id:'S_NS01',lat:6.858,lng:7.398,zone:'RET_SE',city:'Nsukka',price:1410},
  {id:'S_FC01',lat:9.068,lng:7.478,zone:'RET_NC',city:'Abuja Wuse',price:1340},
  {id:'S_FC02',lat:9.042,lng:7.488,zone:'RET_NC',city:'Abuja Garki',price:1340},
  {id:'S_FC03',lat:9.098,lng:7.438,zone:'RET_NC',city:'Abuja Gwarimpa',price:1345},
  {id:'S_FC04',lat:9.010,lng:7.528,zone:'RET_NC',city:'Abuja Airport Rd',price:1345},
  {id:'S_FC05',lat:9.148,lng:7.328,zone:'RET_NC',city:'Abuja Kubwa',price:1360},
  {id:'S_JO01',lat:9.918,lng:8.888,zone:'RET_NC',city:'Jos Terminus',price:1380},
  {id:'S_JO02',lat:9.878,lng:8.868,zone:'RET_NC',city:'Jos Rayfield',price:1380},
  {id:'S_LK01',lat:7.802,lng:6.738,zone:'RET_NC',city:'Lokoja',price:1370},
  {id:'S_IL01',lat:8.498,lng:4.552,zone:'RET_NC',city:'Ilorin Central',price:1340},
  {id:'S_MK01',lat:7.738,lng:8.518,zone:'RET_NC',city:'Makurdi',price:1380},
  {id:'S_MN01',lat:9.612,lng:6.558,zone:'RET_NC',city:'Minna',price:1370},
  {id:'S_LF01',lat:8.498,lng:8.518,zone:'RET_NC',city:'Lafia',price:1380},
  {id:'S_KN01',lat:12.018,lng:8.518,zone:'RET_NW',city:'Kano Bompai',price:1480},
  {id:'S_KN02',lat:11.988,lng:8.538,zone:'RET_NW',city:'Kano Zoo Rd',price:1475},
  {id:'S_KN03',lat:12.008,lng:8.548,zone:'RET_NW',city:'Kano Sabon Gari',price:1480},
  {id:'S_KD01',lat:10.558,lng:7.428,zone:'RET_NW',city:'Kaduna Kawo',price:1390},
  {id:'S_KD02',lat:10.488,lng:7.418,zone:'RET_NW',city:'Kaduna Barnawa',price:1390},
  {id:'S_KD03',lat:10.538,lng:7.388,zone:'RET_NW',city:'Kaduna Mando',price:1395},
  {id:'S_SK01',lat:13.058,lng:5.238,zone:'RET_NW',city:'Sokoto',price:1380},
  {id:'S_GS01',lat:12.168,lng:6.658,zone:'RET_NW',city:'Gusau',price:1430},
  {id:'S_BK01',lat:12.458,lng:4.198,zone:'RET_NW',city:'Birnin Kebbi',price:1420},
  {id:'S_KT01',lat:12.988,lng:7.608,zone:'RET_NW',city:'Katsina',price:1450},
  {id:'S_DU01',lat:11.758,lng:9.338,zone:'RET_NW',city:'Dutse',price:1460},
  {id:'S_MB01',lat:11.838,lng:13.158,zone:'RET_NE',city:'Maiduguri Central',price:1430},
  {id:'S_MB02',lat:11.858,lng:13.148,zone:'RET_NE',city:'Maiduguri Lamisula',price:1440},
  {id:'S_GB01',lat:10.288,lng:11.178,zone:'RET_NE',city:'Gombe',price:1440},
  {id:'S_YL01',lat:9.228,lng:12.468,zone:'RET_NE',city:'Yola',price:1460},
  {id:'S_BC01',lat:10.318,lng:9.848,zone:'RET_NE',city:'Bauchi',price:1440},
  {id:'S_JL01',lat:8.888,lng:11.368,zone:'RET_NE',city:'Jalingo',price:1480},
  {id:'S_PT01',lat:11.708,lng:11.078,zone:'RET_NE',city:'Potiskum',price:1470},
  {id:'S_DM01',lat:11.748,lng:11.968,zone:'RET_NE',city:'Damaturu',price:1490},
];

const BASE_ROUTES=[
  {f:'NNPC_EP',    t:'BONNY_T',    m:'Pipeline',       v:200000,c:'upstream'},
  {f:'NNPC_EP',    t:'FORCADOS_T', m:'Pipeline',       v:113437,c:'upstream'},
  {f:'SPDC',       t:'BONNY_T',    m:'Pipeline',       v:150000,c:'upstream'},
  {f:'SPDC',       t:'FORCADOS_T', m:'Pipeline',       v:76421, c:'upstream'},
  {f:'MPNU',       t:'QUAIBOE_T',  m:'Pipeline',       v:216462,c:'upstream'},
  {f:'CNL',        t:'ESCRAVOS_T', m:'Pipeline',       v:190169,c:'upstream'},
  {f:'SNEPCO',     t:'BONGA_T',    m:'FPSO Offload',   v:136876,c:'upstream'},
  {f:'TEPNG',      t:'BONNY_T',    m:'Pipeline',       v:101779,c:'upstream'},
  {f:'AGBAMI',     t:'AGBAMI_T',   m:'FPSO Offload',   v:92834, c:'upstream'},
  {f:'ERHA',       t:'ERHA_T',     m:'FPSO Offload',   v:76510, c:'upstream'},
  {f:'EGINA',      t:'EGINA_T',    m:'FPSO Offload',   v:72424, c:'upstream'},
  {f:'AKPO',       t:'AKPO_T',     m:'FPSO Offload',   v:67071, c:'upstream'},
  {f:'AITEO',      t:'BONNY_T',    m:'Nembe Pipeline', v:63250, c:'upstream'},
  {f:'HEIRS',      t:'BONNY_T',    m:'Pipeline',       v:55762, c:'upstream'},
  {f:'SEEPCO',     t:'TULJA_T',    m:'FSO',            v:55081, c:'upstream'},
  {f:'SEP_L',      t:'FORCADOS_T', m:'Pipeline',       v:55000, c:'upstream'},
  {f:'FIRST_EP',   t:'BONNY_T',    m:'Pipeline',       v:51298, c:'upstream'},
  {f:'OANDO',      t:'BRASS_T',    m:'Pipeline',       v:35334, c:'upstream'},
  {f:'USAN',       t:'USAN_T',     m:'FPSO Offload',   v:32855, c:'upstream'},
  {f:'NEWCROSS',   t:'FORCADOS_T', m:'Pipeline',       v:29937, c:'upstream'},
  {f:'NDWEST',     t:'FORCADOS_T', m:'Pipeline',       v:28000, c:'upstream'},
  {f:'NEOL',       t:'BONNY_T',    m:'Pipeline',       v:27750, c:'upstream'},
  {f:'SHORELINE',  t:'FORCADOS_T', m:'Pipeline',       v:25000, c:'upstream'},
  {f:'STER_G',     t:'TULJA_T',    m:'FSO',            v:21185, c:'upstream'},
  {f:'NECONDE',    t:'FORCADOS_T', m:'Pipeline',       v:18000, c:'upstream'},
  {f:'NAE_ABO',    t:'ABO_T',      m:'FPSO Offload',   v:13995, c:'upstream'},
  {f:'ARADEL',     t:'BONNY_T',    m:'Pipeline',       v:14825, c:'upstream'},
  {f:'CONTINENTAL',t:'ESCRAVOS_T', m:'Pipeline',       v:11637, c:'upstream'},
  {f:'ORIENTAL',   t:'QUAIBOE_T',  m:'Pipeline',       v:11317, c:'upstream'},
  {f:'GREEN_EN',   t:'BONNY_T',    m:'Pipeline',       v:8315,  c:'upstream'},
  {f:'MWEST',      t:'FORCADOS_T', m:'Pipeline',       v:10625, c:'upstream'},
  {f:'EROTON',     t:'BONNY_T',    m:'Pipeline',       v:10000, c:'upstream'},
  {f:'ELCREST',    t:'BONNY_T',    m:'Pipeline',       v:9000,  c:'upstream'},
  {f:'ANTAN',      t:'BONNY_T',    m:'FPSO/Pipeline',  v:4870,  c:'upstream'},
  {f:'YFOLAWIYO',  t:'BONNY_T',    m:'Pipeline',       v:8000,  c:'upstream'},
  {f:'AMNI',       t:'AILSA_T',    m:'FSO',            v:5262,  c:'upstream'},
  {f:'BELEMAOIL',  t:'BONNY_T',    m:'Pipeline',       v:7470,  c:'upstream'},
  {f:'EMERALD',    t:'BONNY_T',    m:'Pipeline',       v:6000,  c:'upstream'},
  {f:'SOUTHATL',   t:'BONNY_T',    m:'Pipeline',       v:5500,  c:'upstream'},
  {f:'ENAGEED',    t:'FORCADOS_T', m:'Pipeline',       v:4223,  c:'upstream'},
  {f:'ALLGRACE',   t:'BONNY_T',    m:'Pipeline',       v:4000,  c:'upstream'},
  {f:'PILLAR',     t:'FORCADOS_T', m:'Pipeline',       v:3853,  c:'upstream'},
  {f:'MONI_PULO',  t:'BONNY_T',    m:'FPSO/Pipeline',  v:2135,  c:'upstream'},
  {f:'ENERGIA',    t:'FORCADOS_T', m:'Pipeline',       v:3455,  c:'upstream'},
  {f:'PAN_OCEAN',  t:'FORCADOS_T', m:'Pipeline',       v:2756,  c:'upstream'},
  {f:'UNIVERSAL',  t:'QUAIBOE_T',  m:'Pipeline',       v:2830,  c:'upstream'},
  {f:'WSMITH_UP',  t:'BONNY_T',    m:'Pipeline',       v:2495,  c:'upstream'},
  {f:'GHL',        t:'BONNY_T',    m:'FPSO/Pipeline',  v:1219,  c:'upstream'},
  {f:'EXCEL_EP',   t:'FORCADOS_T', m:'Pipeline',       v:1752,  c:'upstream'},
  {f:'NEWCROSS_P', t:'FORCADOS_T', m:'Pipeline',       v:1412,  c:'upstream'},
  {f:'FRONTIER',   t:'QUAIBOE_T',  m:'Pipeline',       v:1117,  c:'upstream'},
  {f:'PLATFORM',   t:'FORCADOS_T', m:'Pipeline',       v:3646,  c:'upstream'},
  {f:'BRITTANIA',  t:'BONNY_T',    m:'FPSO/Pipeline',  v:3531,  c:'upstream'},
  {f:'NETWORK',    t:'QUAIBOE_T',  m:'Pipeline',       v:1138,  c:'upstream'},
  {f:'CHORUS',     t:'FORCADOS_T', m:'Pipeline',       v:757,   c:'upstream'},
  {f:'CONOIL_P',   t:'ESCRAVOS_T', m:'Pipeline',       v:673,   c:'upstream'},
  {f:'MILLENIUM',  t:'BONNY_T',    m:'Pipeline',       v:323,   c:'upstream'},
  {f:'DUBRI',      t:'ESCRAVOS_T', m:'Pipeline',       v:151,   c:'upstream'},
  {f:'BONNY_T',    t:'ROTTERDAM',  m:'Tanker Export',  v:500000,c:'terminal'},
  {f:'BONNY_T',    t:'INDIA',      m:'Tanker Export',  v:200000,c:'terminal'},
  {f:'BONNY_T',    t:'DANGOTE',    m:'Coastal Vessel', v:300000,c:'terminal'},
  {f:'FORCADOS_T', t:'ROTTERDAM',  m:'Tanker Export',  v:200000,c:'terminal'},
  {f:'ESCRAVOS_T', t:'ROTTERDAM',  m:'Tanker Export',  v:100000,c:'terminal'},
  {f:'ESCRAVOS_T', t:'DANGOTE',    m:'Coastal Vessel', v:100000,c:'terminal'},
  {f:'QUAIBOE_T',  t:'INDIA',      m:'Tanker Export',  v:100000,c:'terminal'},
  {f:'QUAIBOE_T',  t:'DANGOTE',    m:'Coastal Vessel', v:80000, c:'terminal'},
  {f:'BRASS_T',    t:'ROTTERDAM',  m:'Tanker Export',  v:70000, c:'terminal'},
  {f:'BONGA_T',    t:'ROTTERDAM',  m:'Tanker Export',  v:120000,c:'terminal'},
  {f:'BONGA_T',    t:'DANGOTE',    m:'Crude Feedstock',v:60000, c:'terminal'},
  {f:'AGBAMI_T',   t:'ROTTERDAM',  m:'Tanker Export',  v:90000, c:'terminal'},
  {f:'AGBAMI_T',   t:'INDIA',      m:'Tanker Export',  v:30000, c:'terminal'},
  {f:'ERHA_T',     t:'ROTTERDAM',  m:'Tanker Export',  v:75000, c:'terminal'},
  {f:'USAN_T',     t:'ROTTERDAM',  m:'Tanker Export',  v:32000, c:'terminal'},
  {f:'EGINA_T',    t:'INDIA',      m:'Tanker Export',  v:50000, c:'terminal'},
  {f:'EGINA_T',    t:'ROTTERDAM',  m:'Tanker Export',  v:25000, c:'terminal'},
  {f:'AKPO_T',     t:'ROTTERDAM',  m:'Tanker Export',  v:65000, c:'terminal'},
  {f:'TULJA_T',    t:'ROTTERDAM',  m:'Tanker Export',  v:65000, c:'terminal'},
  {f:'ABO_T',      t:'ROTTERDAM',  m:'Tanker Export',  v:14000, c:'terminal'},
  {f:'ROTTERDAM',  t:'NNPC_IMP',   m:'Vessel Import',  v:80000, c:'importer'},
  {f:'ROTTERDAM',  t:'DAPPMA',     m:'Vessel Import',  v:180000,c:'importer'},
  {f:'ROTTERDAM',  t:'MOMAN',      m:'Vessel Import',  v:12000, c:'importer'},
  {f:'HOUSTON',    t:'DANGOTE',    m:'Crude Feedstock',v:43000, c:'importer'},
  {f:'JEDDAH',     t:'NNPC_IMP',   m:'Vessel Import',  v:40000, c:'importer'},
  {f:'DANGOTE',    t:'ATLAS',      m:'Coastal Vessel', v:40100, c:'refinery'},
  {f:'DANGOTE',    t:'SAT_DEP',    m:'Coastal Vessel', v:15000, c:'refinery'},
  {f:'DANGOTE',    t:'WARRI_DEP',  m:'Pipeline/Vessel',v:10000, c:'refinery'},
  {f:'NNPC_IMP',   t:'ATLAS',      m:'Vessel Import',  v:12000, c:'importer'},
  {f:'DAPPMA',     t:'ATLAS',      m:'Vessel Import',  v:18000, c:'importer'},
  {f:'MOMAN',      t:'ATLAS',      m:'Vessel Import',  v:2000,  c:'importer'},
  {f:'NNPC_IMP',   t:'PH_DEP',    m:'Vessel Import',  v:8000,  c:'importer'},
  {f:'DAPPMA',     t:'WARRI_DEP',  m:'Vessel Import',  v:5000,  c:'importer'},
  {f:'DAPPMA',     t:'CALABAR_D',  m:'Vessel Import',  v:3000,  c:'importer'},
  {f:'ATLAS',      t:'SAT_DEP',    m:'Pipeline',       v:30000, c:'depot'},
  {f:'ATLAS',      t:'BOVAS',      m:'Coastal Vessel', v:5000,  c:'depot'},
  {f:'ATLAS',      t:'SHEMA',      m:'Coastal Vessel', v:4000,  c:'depot'},
  {f:'ATLAS',      t:'ORE_DEP',    m:'Truck',          v:5000,  c:'depot'},
  {f:'ATLAS',      t:'IBADAN_D',   m:'Truck',          v:8000,  c:'depot'},
  {f:'SAT_DEP',    t:'KADUNA_D',   m:'Truck/Bridged',  v:5000,  c:'depot'},
  {f:'SAT_DEP',    t:'MINNA_D',    m:'Truck',          v:4000,  c:'depot'},
  {f:'PH_DEP',     t:'CALABAR_D',  m:'Truck',          v:3000,  c:'depot'},
  {f:'PH_DEP',     t:'ABA_DEP',    m:'Truck',          v:4000,  c:'depot'},
  {f:'PH_DEP',     t:'ENUGU_D',    m:'Truck',          v:3500,  c:'depot'},
  {f:'KADUNA_D',   t:'JOS_DEP',    m:'Truck',          v:2500,  c:'depot'},
  {f:'ATLAS',      t:'RET_SW',     m:'Truck Fleet',    v:28000, c:'retail'},
  {f:'BOVAS',      t:'RET_SW',     m:'Truck',          v:5000,  c:'retail'},
  {f:'SHEMA',      t:'RET_SW',     m:'Truck',          v:4000,  c:'retail'},
  {f:'SAT_DEP',    t:'RET_SW',     m:'Truck Fleet',    v:15000, c:'retail'},
  {f:'ORE_DEP',    t:'RET_SW',     m:'Truck',          v:4000,  c:'retail'},
  {f:'IBADAN_D',   t:'RET_SW',     m:'Truck',          v:7000,  c:'retail'},
  {f:'PH_DEP',     t:'RET_SS',     m:'Truck Fleet',    v:12000, c:'retail'},
  {f:'WARRI_DEP',  t:'RET_SS',     m:'Truck',          v:8000,  c:'retail'},
  {f:'ABA_DEP',    t:'RET_SE',     m:'Truck',          v:6000,  c:'retail'},
  {f:'ENUGU_D',    t:'RET_SE',     m:'Truck',          v:5500,  c:'retail'},
  {f:'CALABAR_D',  t:'RET_SE',     m:'Truck',          v:3000,  c:'retail'},
  {f:'KADUNA_D',   t:'RET_NW',     m:'Truck',          v:4000,  c:'retail'},
  {f:'JOS_DEP',    t:'RET_NC',     m:'Truck',          v:5500,  c:'retail'},
  {f:'MINNA_D',    t:'RET_NC',     m:'Truck',          v:4000,  c:'retail'},
  {f:'KADUNA_D',   t:'RET_NE',     m:'Truck (Bridged)',v:2500,  c:'retail'},
];

const STATION_ROUTES = STATIONS.map(s=>({f:s.id, t:s.zone, m:'Station Link', v:150, c:'retail'}));
const ROUTES = [...BASE_ROUTES, ...STATION_ROUTES];

const WELLS={
  NNPC_EP:[
    {n:'OML 30 Warri',  t:'crude',lat:5.50,lng:5.80,p:180000,a:true},
    {n:'OML 42 Ologbo', t:'crude',lat:5.68,lng:6.08,p:120000,a:true},
    {n:'OML 26 Soku',   t:'crude',lat:4.72,lng:6.62,p:95000, a:true},
    {n:'Agadam Gas',    t:'gas',  lat:12.82,lng:13.12,p:0,   a:true},
    {n:'OML 58 Imo',    t:'crude',lat:5.22,lng:7.02,p:60000, a:true},
    {n:'OML 65',        t:'crude',lat:3.80,lng:5.50,p:0,     a:false},
    {n:'OML 11',        t:'crude',lat:6.08,lng:5.18,p:0,     a:false}
  ],
  SPDC:[
    {n:'SPDC Forcados', t:'crude',lat:5.32,lng:5.42,p:200000,a:true},
    {n:'Bonga DW',      t:'crude',lat:3.50,lng:4.88,p:145000,a:true},
    {n:'Afam Gas',      t:'gas',  lat:4.90,lng:7.12,p:130000,a:true},
    {n:'Nun River',     t:'crude',lat:5.02,lng:6.22,p:0,     a:false},
    {n:'ES Nembe',      t:'crude',lat:4.72,lng:6.52,p:80000, a:true}
  ],
  CNL:[
    {n:'OML 49 Abiteye',    t:'crude',lat:5.25,lng:5.20,p:90000, a:true},
    {n:'OML 90 Meren',      t:'crude',lat:5.58,lng:5.10,p:75000, a:true},
    {n:'Escravos Gas Plant',t:'gas',  lat:5.60,lng:5.18,p:200000,a:true},
    {n:'OML 49 Makaraba',   t:'crude',lat:5.38,lng:5.02,p:0,     a:false}
  ],
  SNEPCO:[
    {n:'Bonga Main',    t:'crude',lat:3.62,lng:5.88,p:136876,a:true},
    {n:'Bonga NW',      t:'crude',lat:3.50,lng:5.72,p:0,     a:false},
    {n:'Bonga SW/Aparo',t:'crude',lat:3.38,lng:5.65,p:0,     a:false}
  ],
  AGBAMI:[
    {n:'Agbami Main',  t:'crude',lat:3.72,lng:4.90,p:92834,a:true},
    {n:'Agbami Sat B', t:'crude',lat:3.68,lng:4.96,p:0,    a:false}
  ],
  TEPNG:[
    {n:'Akpo Main',  t:'crude',lat:3.50,lng:6.75,p:67071,a:true},
    {n:'Egina Main', t:'crude',lat:3.70,lng:6.20,p:72424,a:true},
    {n:'Odudu Field',t:'crude',lat:4.30,lng:6.50,p:30000,a:true},
    {n:'Elgin Gas',  t:'gas',  lat:4.35,lng:6.55,p:0,    a:true}
  ],
  AITEO:[
    {n:'Nembe Creek',    t:'crude',lat:4.85,lng:6.38,p:50000,a:true},
    {n:'Kolo Creek',     t:'crude',lat:5.00,lng:6.42,p:13250,a:true},
    {n:'Cawthorne Inlet',t:'crude',lat:4.80,lng:6.32,p:0,    a:false}
  ],
};

function runChecks(){
  const ndIds = new Set(ND.map(n=>n.id));
  const stationIds = new Set(STATIONS.map(s=>s.id));
  const allIds = new Set([...ndIds,...stationIds]);

  const missingRefs = new Set();
  ROUTES.forEach(r=>{
    if(!allIds.has(r.f)) missingRefs.add(r.f);
    if(!allIds.has(r.t)) missingRefs.add(r.t);
  });

  // Build connectivity
  const conn = {};
  ND.forEach(n=>conn[n.id]={id:n.id,node:n,in:[],out:[]});
  STATIONS.forEach(s=>conn[s.id]={id:s.id,node:s,in:[],out:[]});

  ROUTES.forEach((r,idx)=>{
    if(!conn[r.f]) conn[r.f]={id:r.f,in:[],out:[]};
    if(!conn[r.t]) conn[r.t]={id:r.t,in:[],out:[]};
    conn[r.f].out.push({...r,idx});
    conn[r.t].in.push({...r,idx});
  });

  const isolatedND = ND.filter(n=>{
    const c = conn[n.id]||{in:[],out:[]};
    return c.in.length===0 && c.out.length===0;
  }).map(n=>n.id);

  const noIn = ND.filter(n=>((conn[n.id]||{in:[]}).in.length===0)).map(n=>n.id);
  const noOut = ND.filter(n=>((conn[n.id]||{out:[]}).out.length===0)).map(n=>n.id);

  const missingStationZones = STATIONS.filter(s=>!ndIds.has(s.zone)).map(s=>({station:s.id,zone:s.zone}));

  const wellsKeys = Object.keys(WELLS);
  const missingWellsKeys = wellsKeys.filter(k=>!ndIds.has(k));

  // duplicates
  const dupND = ND.length !== ndIds.size;

  console.log('SUMMARY');
  console.log('-------');
  console.log('ND count:', ND.length);
  console.log('STATIONS count:', STATIONS.length);
  console.log('BASE_ROUTES count:', BASE_ROUTES.length);
  console.log('STATION_ROUTES count:', STATION_ROUTES.length);
  console.log('TOTAL ROUTES:', ROUTES.length);
  console.log('ND duplicate ids present?', dupND);
  console.log('');

  console.log('MISSING ROUTE REFERENCES (f or t not found in ND or STATIONS):');
  console.log([...missingRefs]);
  console.log('');

  console.log('ND nodes with NO connections (in/out = 0):');
  console.log(isolatedND);
  console.log('');

  console.log('ND nodes with NO INCOMING routes:');
  console.log(noIn);
  console.log('ND nodes with NO OUTGOING routes:');
  console.log(noOut);
  console.log('');

  console.log('STATIONS whose zone node is MISSING in ND:');
  console.log(missingStationZones);
  console.log('');

  console.log('WELLS keys NOT FOUND among ND upstream IDs:');
  console.log(missingWellsKeys);
  console.log('WELLS keys count:', wellsKeys.length);
  console.log('');

  // List ND nodes that are refineries but have no outgoing routes (likely missing mapping to depots)
  const refineries = ND.filter(n=>n.t==='refinery').map(r=>({id:r.id, util:r.util||0, st:r.st}));
  const refNoOut = refineries.filter(r=>((conn[r.id]||{out:[]}).out.length===0)).map(r=>r.id);
  console.log('Refineries with NO outgoing routes (no depots/retail targets):', refNoOut);

  // Return exit code 0
}

runChecks();
