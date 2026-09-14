// City-level representative coordinates, not building or rack locations.
// Sources establish the host location; coordinates intentionally approximate it.
export const locations = {
  perlmutter: {city:'Berkeley, California',lat:37.87,lon:-122.27,source:'https://www.nersc.gov/about/visitor-info'},
  lineshine: {city:'Shenzhen',lat:22.54,lon:114.06,source:'https://www.top500.org/news/lineshine-debuts-no-1-top500-enters-new-global-exascale-era/'},
  'el-capitan': {city:'Livermore, California',lat:37.68,lon:-121.77,source:'https://hpc.llnl.gov/documentation/user-guides/using-el-capitan-systems/hardware-overview'},
  frontier: {city:'Oak Ridge, Tennessee',lat:36.01,lon:-84.27,source:'https://www.olcf.ornl.gov/frontier/'},
  aurora: {city:'Lemont, Illinois',lat:41.67,lon:-87.99,source:'https://students.cels.anl.gov/orientation/arriving/arriving/'},
  jupiter: {city:'Jülich',lat:50.92,lon:6.36,source:'https://www.fz-juelich.de/en/jupiter'},
  hpc7: {city:'Ferrera Erbognone',lat:45.11,lon:8.86,source:'https://www.eni.com/it-IT/azioni/tecnologie-transizione-energetica/supercalcolo-intelligenza-artificiale/supercomputer.html'},
  hpc6: {city:'Ferrera Erbognone',lat:45.11,lon:8.86,source:'https://www.eni.com/visual-design/infographics/hpc6-longform/en/green-data-center/'},
  fugaku: {city:'Kobe',lat:34.69,lon:135.20,source:'https://www.r-ccs.riken.jp/en/'},
  alps: {city:'Lugano · primary CSCS site',lat:46.00,lon:8.95,source:'https://www.cscs.ch/computers/alps'},
  delta: {city:'Urbana–Champaign, Illinois',lat:40.11,lon:-88.23,source:'https://delta.ncsa.illinois.edu/'},
  deltaai: {city:'Urbana–Champaign, Illinois',lat:40.11,lon:-88.23,source:'https://delta.ncsa.illinois.edu/'},
};

// Additional city-level locations with public operator/ranking references.
Object.assign(locations, {
 lumi:{city:'Kajaani',lat:64.23,lon:27.73,source:'https://www.eurohpc-ju.europa.eu/supercomputers/our-supercomputers_en'},
 leonardo:{city:'Bologna',lat:44.49,lon:11.34,source:'https://www.eurohpc-ju.europa.eu/supercomputers/our-supercomputers_en'},
 'isambard-ai-phase-2':{city:'Bristol area',lat:51.45,lon:-2.59,source:'https://bristol.ac.uk/news/2025/july/isambard-launch.html'},
 tuolumne:{...locations['el-capitan']},
 'abci-3-0':{city:'Kashiwa',lat:35.87,lon:139.98,source:'https://abci.ai/en/about_abci/'},
 'sunway-taihulight':{city:'Wuxi',lat:31.49,lon:120.31,source:'https://top500.org/system/178764/'},
 'stargate-abilene':{city:'Abilene, Texas',lat:32.45,lon:-99.73,source:'https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/'},
 colossus:{city:'Memphis, Tennessee',lat:35.15,lon:-90.05,source:'https://nvidianews.nvidia.com/news/spectrum-x-ethernet-networking-xai-colossus'},
 polaris:{...locations.aurora,source:'https://docs.alcf.anl.gov/polaris/'},
 sophia:{...locations.aurora,source:'https://docs.alcf.anl.gov/sophia/'},
 frontera:{city:'Austin, Texas',lat:30.27,lon:-97.74,source:'https://frontera-portal.tacc.utexas.edu/'},
 'juwels-booster':{...locations.jupiter,source:'https://apps.fz-juelich.de/jsc/hps/juwels/booster-overview.html'},
 expanse:{city:'San Diego, California',lat:32.88,lon:-117.24,source:'https://www.sdsc.edu/systems/expanse/index.html'}
});
