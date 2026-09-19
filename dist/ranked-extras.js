// Published fields from the June 2026 TOP500 list that the catalog previously
// discarded. The importer in scripts/import-top50.py reads the ranked table but
// only keeps the system name, processor, accelerator and interconnect, so core
// count, theoretical peak, measured power and operating system were dropped.
//
// Keyed by rank so it survives regenerating top50.js. Values are transcribed
// from the published list; a null means the operator did not report the field
// for this system and it must stay unknown rather than be estimated.
//
// Source: https://top500.org/lists/top500/list/2026/06/
// [manufacturer, cores (ranked partition), Rpeak PFlop/s, power kW, operating system]
export const rankedMetrics = {
  1:  ['Shenzhen Cloud Computing Center Co., Ltd.', 13789440, 2735.82, 42220, 'Kylin OS'],
  2:  ['HPE', 11340000, 2821.10, 29685, 'TOSS'],
  3:  ['HPE', 9066176, 2055.72, 24607, 'HPE Cray OS'],
  4:  ['Intel', 9264128, 1980.01, 38698, null],
  5:  ['Bull', 4801344, 1226.28, 15794, 'RedHat Enterprise Linux'],
  6:  ['HPE', 3461472, 861.13, 8735, 'RHEL 9'],
  7:  ['Microsoft', 2073600, 846.84, null, null],
  8:  ['HPE', 3143520, 606.97, 8461, 'RHEL 8.9'],
  9:  ['Fujitsu', 7630848, 537.21, 29899, null],
  10: ['HPE', 2121600, 574.84, 7124, 'HPE Cray OS'],
  11: ['HPE', 2752704, 531.51, 7107, null],
  12: ['Bull', 1824768, 306.31, 7494, null],
  13: ['HPE', 1028160, 278.58, null, 'HPE Cray OS'],
  14: ['HPE', 1161216, 288.88, 3387, 'TOSS'],
  15: ['Nebius AI', 718848, 338.49, 5300, 'Ubuntu 22.04'],
  16: ['Bull', 663040, 249.44, 4159, null],
  17: ['HPE', 806208, 218.44, null, 'HPE Cray OS'],
  18: ['DELL', 747520, 343.33, null, 'Ubuntu 24.04 LTS'],
  19: ['HPE', 479232, 181.49, 3596, 'Rocky Linux 9'],
  20: ['HPE', 643072, 156.48, null, 'Ubuntu 24.04'],
  21: ['Nvidia', 662256, 151.88, null, 'Ubuntu 24.04.2 LTS'],
  22: ['HPE', 574464, 155.21, 1980, 'HPE Cray OS'],
  23: ['Nvidia', 485888, 188.65, null, null],
  24: ['DELL', 976896, 251.15, null, 'Ubuntu 22.04.3 LTS'],
  25: ['HPE', 349440, 151.10, null, 'RHEL 9.2'],
  26: ['HPE', 481440, 130.44, 1662, null],
  27: ['NRCPC', 10649600, 125.44, 15371, null],
  28: ['Nvidia', 297840, 138.32, null, 'Ubuntu 22.04.4 LTS'],
  29: ['Bull', 548352, 171.26, 1770, 'Linux'],
  30: ['Nvidia', 297840, 138.32, null, 'Ubuntu 22.04.4 LTS'],
  31: ['HPE', 411264, 115.08, 1395, 'Red Hat Enterprise Linux'],
  32: ['DELL', 294336, 102.82, null, 'Ubuntu 22.04'],
  33: ['ASUSTeK / Taiwan AI Cloud / Taiwan Mobile', 256960, 117.92, 2214, 'RHEL'],
  34: ['HPE', 888832, 113.00, 2945, null],
  35: ['HPE', 273280, 106.28, null, 'Ubuntu 22.04'],
  36: ['HPE', 285696, 102.16, null, 'Linux'],
  37: ['Lenovo', 303104, 141.00, 2008, 'RedHat 8.10'],
  38: ['Fujitsu', 315120, 99.35, 1834, 'Rocky Linux 9.4'],
  39: ['Niagara Computers / Supermicro', 36720, 78.65, null, 'Ubuntu 24.04.3 LTS'],
  40: ['HPE', 320280, 77.94, null, 'Ubuntu 24.04'],
  41: ['HPE', 383040, 95.29, 1110, 'TOSS'],
  42: ['HPE', 310080, 84.02, 1088, 'HPE Cray OS'],
  43: ['Nvidia', 223088, 100.63, 1753, 'Red Hat Enterprise Linux'],
  44: ['HPE', 239616, 105.98, 1658, 'RHEL 9.6'],
  45: ['Nvidia', 555520, 79.22, 2646, null],
  46: ['Nvidia', 185712, 87.27, null, 'Ubuntu 20.04.2 LTS'],
  47: ['Supermicro', 483840, 99.12, null, 'Ubuntu 22.04.5 LTS'],
  48: ['Microsoft', 445440, 86.99, null, null],
  49: ['Bull', 227136, 71.42, null, 'Red Hat Enterprise Linux'],
  50: ['HPE', 146304, 67.44, null, 'Ubuntu 22.04.5 LTS']
};
