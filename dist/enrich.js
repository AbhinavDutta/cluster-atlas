// Fills in publicly documented cluster and node facts that the catalog was
// dropping. Two distinct kinds of addition are made, and they are kept visibly
// separate in the interface:
//
//   documented   — stated by an operator or ranking source for this system
//   platform     — stated by a vendor for the platform this node type is built on
//
// Nothing here is inferred from a system name. A fact is only attached when the
// cited source states it, and an operator value always wins over a platform one.
import {rankedMetrics} from './ranked-extras.js';
import {platforms} from './platforms.js';
import {source} from './sources.js';

const isSet = v => v != null && v !== '' && !/^not verified$/i.test(String(v));

// Ranked-system fields published by TOP500 that the importer did not keep.
export function attachRankedMetrics(c) {
  if (c.rank == null || !rankedMetrics[c.rank]) return;
  const [manufacturer, cores, rpeak, powerKw, os] = rankedMetrics[c.rank];
  Object.assign(c, {
    manufacturer: c.manufacturer ?? manufacturer,
    cores: c.cores ?? cores,
    rpeak: c.rpeak ?? rpeak,
    powerKw: c.powerKw ?? powerKw,
    os: c.os ?? os,
    benchmark: c.benchmark ?? {
      list: 'TOP500 · June 2026',
      rank: c.rank,
      rmax: c.rmax,
      rpeak,
      cores,
      powerKw,
      efficiencyGFlopsPerWatt: powerKw ? (c.rmax * 1000) / powerKw : null,
      source: source('TOP500 · June 2026 list', 'https://top500.org/lists/top500/list/2026/06/')
    }
  });
  if (c.benchmark.powerKw == null) c.benchmark.efficiencyGFlopsPerWatt = null;
  c.efficiency = c.benchmark.efficiencyGFlopsPerWatt;
}

// Vendor platform facts for node types built on a named platform. The platform
// is identified from the node label or the published system description, never
// from a guessed similarity between system names.
function platformFor(part, cluster) {
  const haystack = [part.name, part.specificationLabel, cluster.hardwareDescription, part.systemModel].filter(Boolean).join(' ');
  if (/PowerEdge XE9680/i.test(haystack)) return platforms.xe9680;
  if (/Cray XD670/i.test(haystack)) return platforms.crayXd670;
  if (/ProLiant (?:Compute )?XD685/i.test(haystack)) return platforms.proliantXd685;
  if (/SYS-A22GA-NBRT/i.test(haystack)) return platforms.a22gaNbrt;
  if (/\bDGX B200\b/i.test(haystack)) return platforms.dgxB200;
  if (/\bDGX H100\b|\bDGX H200\b/i.test(haystack)) return platforms.dgxH100;
  if (/\bDGX A100\b/i.test(haystack)) return platforms.dgxA100;
  // GH200 is matched on the superchip name only. A bare "Grace" would also match
  // Grace-Blackwell (GB200/GB300) systems, whose per-node layout differs, so it
  // is not used as a trigger.
  if (/\bGH200\b|Grace Hopper/i.test(haystack)) return platforms.gh200;
  return null;
}

export function attachPlatform(c) {
  c.parts.forEach((p, i) => {
    const platform = platformFor(p, c);
    if (!platform) return;
    // One platform record per cluster is enough for the header; the facts below
    // are applied per node type because a cluster can mix platforms.
    c.platform = c.platform || {name: platform.name, formFactor: platform.formFactor, source: platform.sources[0]};
    for (const src of platform.sources) if (!c.sources.some(s => s.url === src.url)) c.sources.push(src);
    for (const [key, value] of Object.entries(platform.spec)) if (!isSet(p[key])) p[key] = value;
    p.platformFacts = Object.keys(platform.spec);
    if (i === 0) c.notes += ` Node specifications follow the documented ${platform.name} platform (${platform.formFactor}); operator-specific deviations are not published.`;
  });
}

// Accelerator scale-out: how each accelerator reaches the cluster fabric.
// Only asserted where a source states a dedicated per-accelerator path.
export function attachScaleOut(c) {
  for (const p of c.parts) {
    // "per GPU node" is a statement about the node, not about each accelerator.
    // Matching it as per-accelerator scale-out drew a dedicated adapter per GPU
    // on systems whose operator says the adapters attach to the CPU.
    if (p.gpus > 1 && isSet(p.nic) && /per (?:GPU|accelerator)(?!\s+node)\b|one adapter per (?:GPU|accelerator)|dedicated/i.test(p.nicTopology || '')) {
      p.scaleOut = {perAccelerator: true, adapters: p.nic, model: p.nicModel || null, speed: p.nicSpeed || null};
    } else if (p.nic != null && p.gpus > 0) {
      p.scaleOut = {perAccelerator: false, adapters: p.nic, model: p.nicModel || null, speed: p.nicSpeed || null};
    } else {
      p.scaleOut = null;
    }
  }
}

// Facts this catalog already records in one field while reporting them missing
// in another. Reading our own recorded strings is not new research and asserts
// nothing the record did not already state — "CPU model: AMD EPYC 7763 · 64
// cores" and "Cores per socket: not published" cannot both be true on one page.
//
// Every rule is conservative: a value already present is never overwritten, an
// ambiguous string yields nothing, and each node type records which of its
// fields were read off a sibling so the provenance stays visible.
//
// Per-socket core counts confirmed against the chip vendor's own specification.
// The raw TOP500 "48C" token is not filled blindly: Azure's Xeon Platinum 8480C
// is submitted to TOP500 as 48C while Intel publishes 56 cores for that part, so
// only strings verified against the vendor appear here.
const VERIFIED_SOCKET_CORES = {
  // Intel, confirmed against the SKU's own ARK specification page.
  'Intel Xeon 6960P 72C 2.7GHz': 72,
  'Intel Xeon Platinum 8558 48C 2.1GHz': 48,
  'Xeon Platinum 8558 48C 2.1GHz': 48,
  'Intel Xeon Platinum 8570 56C 4GHz': 56,   // 4 GHz is this part's max turbo, not its base clock
  'Xeon Platinum 8570 56C 2.1GHz': 56,
  'Xeon Platinum 8462Y+ 32C 2.8GHz': 32,
  'Xeon Platinum 8468 48C 2.1GHz': 48,
  'Xeon Platinum 8480+ 56C 2GHz': 56,
  'Xeon Platinum 8480C 56C 2GHz': 56,
  'Xeon Platinum 8480C 56C 3.8GHz': 56,
  'Xeon Gold 6430 32C 2.1GHz': 32,
  // AMD, confirmed against AMD's published product specifications.
  'AMD EPYC 7742 64C 2.25GHz': 64,
  'AMD EPYC 9334 32C 2.7GHz': 32,
  'AMD EPYC 9354 32C 3.25GHz': 32,
  'AMD EPYC 9365 36C 3.4GHz': 36,
  'AMD EPYC 9655 96C 2.6GHz': 96,
  // NVIDIA Grace, confirmed by NVIDIA and by two operators (JSC, CSCS).
  'NVIDIA Grace 72C 3.1GHz': 72,
  'GH Superchip 72C 3GHz': 72,
  // Sunway SW26010: no vendor page exists; the figure is from the canonical
  // Dongarra system report, which states "1 Node = 260 cores".
  'Sunway SW26010 260C 1.45GHz': 260
  // Deliberately absent, and they must stay absent:
  //   'Intel Xeon Platinum 8480C'       Eagle. TOP500 submits 48C, Intel publishes 56
  //                                     for the part, Azure states only 96 physical
  //                                     cores per VM. Nothing resolves it.
  //   'Xeon Platinum 8480L 56C 2GHz'    No Intel ARK page for an "8480L".
  //   'AMD EPYC 7V12 48C 2.45GHz'       Azure-custom; absent from AMD's database.
  //   'AMD 4th Gen EPYC 24C 1.8GHz'     A family name, not a SKU — and no published
  //                                     4th-gen EPYC has a 1.8 GHz base clock.
};

function attachDerived(c) {
  for (const p of c.parts) {
    const from = [];
    if (p.coresPerSocket == null && !p.apu) {
      const m = /·\s*(\d+)\s*cores/i.exec(p.cpu || '');
      const v = m ? Number(m[1]) : VERIFIED_SOCKET_CORES[p.cpu];
      if (v > 0) { p.coresPerSocket = v; from.push('coresPerSocket'); }
    }
    // Cores per node is sockets x cores per socket by definition.
    if (p.physicalCores == null && !p.apu && p.cpus > 0 && p.coresPerSocket > 0) {
      p.physicalCores = p.cpus * p.coresPerSocket;
      from.push('physicalCores');
    }
    // Per-device accelerator memory, where the model designation carries it.
    // Skipped for mixed-device nodes, where one figure cannot describe the node.
    if (!isSet(p.vram) && p.gpus !== 0 && !p.mixed && !p.apu) {
      const m = /(\d+(?:\.\d+)?)\s*GB\b/i.exec(p.gpu || '');
      if (m) { p.vram = m[1] + ' GB per accelerator'; from.push('vram'); }
    }
    // A TOP500 submission string leads with the vendor's model designation.
    if (!p.systemModel && c.hardwareDescription) {
      const first = c.hardwareDescription.split(',')[0].trim();
      if (first && !/^\d/.test(first)) { p.systemModel = first; from.push('systemModel'); }
    }
    if (from.length) p.derivedFields = from;
  }
}

export function enrichCluster(c) {
  attachRankedMetrics(c);
  attachPlatform(c);
  attachScaleOut(c);
  attachDerived(c);
  attachCompleteness(c);
  return c;
}

// The specification sheets render exclusively from this registry, so a valued
// field with no entry would become invisible. These sets let the coverage audit
// assert that cannot happen.
export const CLUSTER_FIELD_KEYS = new Set(['manufacturer', 'cores', 'rpeak', 'powerKw', 'efficiency', 'os', 'topology']);
export const PART_FIELD_KEYS = new Set(['systemModel', 'count', 'cpu', 'cpus', 'coresPerSocket', 'physicalCores',
  'cpuNote', 'gpu', 'gpus', 'ram', 'vram', 'link', 'onNodeFabric', 'hostLink', 'nic', 'nicModel', 'nicSpeed',
  'nicTopology', 'aggregateScaleOut', 'gpuDirect', 'managementNic', 'disk', 'nvme', 'remoteDisks',
  'diskIops', 'diskThroughputMBps', 'formFactor']);

// Which published facts this profile has, and which are missing.
//
// Derived from the record itself so it stays correct as data is added. The
// interface uses this as the single source of truth for gaps: the specification
// sheets show only fields that have a value, and this list carries the rest.
//
// A third state exists besides present and absent. Some fields cannot exist for
// a given system — benchmark results for a cluster TOP500 never ranked, or
// accelerator links on a CPU-only node. Those are marked not applicable and are
// excluded from the total, so a machine is not scored as if it were withholding
// information it cannot have.
const isAcceleratorNode = p => p.gpus !== 0;
const hasAcceleratorFabric = p => p.gpus > 1;
const isRanked = c => c.rank != null;
// "Max remote data disks" and "uncached disk IOPS/throughput" are cloud-VM
// instance metrics, and aggregate scale-out is quoted per VM. A bare-metal blade
// cannot have them, so scoring them against one reports a gap that can never be
// closed. Marked by an explicit vmSku flag on the node type rather than inferred
// from the model string.
const isCloudVm = p => p.vmSku === true;

// The fifth element groups a field by what a reader is looking for, and names
// the catalog metric it can be compared against. Grouping used to be implicit
// and by record origin — cluster facts in one sheet, node facts in another —
// which put core count and accelerator count in different places.
const CLUSTER_CHECKS = [
  ['Manufacturer', c => c.manufacturer, undefined, undefined, {group: 'Provenance'}],
  ['Ranked core count', c => c.cores, isRanked, undefined, {group: 'Compute', metric: 'cores'}],
  ['Theoretical peak', c => c.rpeak, isRanked, 'PFlop/s', {group: 'Performance & power', metric: 'rpeak'}],
  ['Measured power', c => c.powerKw, isRanked, 'kW', {group: 'Performance & power', metric: 'powerKw'}],
  ['Energy efficiency', c => c.efficiency, isRanked, 'GFlop/s per watt', {group: 'Performance & power', metric: 'efficiency'}],
  ['Operating system', c => c.os, undefined, undefined, {group: 'Provenance'}],
  ['Network topology', c => c.topology && c.topology !== 'Not verified' ? c.topology : null, undefined, undefined, {group: 'Interconnect'}]
];
const PART_CHECKS = [
  ['System / node model', p => p.systemModel, undefined, undefined, {group: 'Provenance'}],
  ['Compute nodes of this type', p => p.count, undefined, undefined, {group: 'Compute', metric: 'count'}],
  ['CPU model', p => p.cpu, undefined, undefined, {group: 'Compute'}],
  ['CPU sockets per node', p => p.apu ? p.cpus : p.cpus ?? p.physicalCores, p => !p.apu, undefined, {group: 'Compute', metric: 'cpus'}],
  ['Cores per socket', p => p.coresPerSocket, p => !p.apu, undefined, {group: 'Compute', metric: 'coresPerSocket'}],
  ['Physical CPU cores', p => p.physicalCores, p => !p.apu, undefined, {group: 'Compute', metric: 'physicalCores'}],
  ['CPU note', p => p.cpuNote, undefined, undefined, {group: 'Compute'}],
  ['Accelerator model', p => p.gpu, isAcceleratorNode, undefined, {group: 'Compute'}],
  ['Physical accelerators per node', p => p.gpus, isAcceleratorNode, undefined, {group: 'Compute', metric: 'gpus'}],
  ['Host / unified memory', p => p.ram, undefined, undefined, {group: 'Memory', metric: 'ramGB'}],
  ['Accelerator memory', p => p.vram, isAcceleratorNode, undefined, {group: 'Memory', metric: 'vramGB'}],
  ['Accelerator ↔ accelerator link', p => p.link, hasAcceleratorFabric, undefined, {group: 'Interconnect'}],
  ['On-node fabric', p => p.onNodeFabric, hasAcceleratorFabric, undefined, {group: 'Interconnect'}],
  ['CPU ↔ accelerator link', p => p.hostLink, isAcceleratorNode, undefined, {group: 'Interconnect'}],
  ['Network interfaces per node', p => p.nic, undefined, undefined, {group: 'Interconnect', metric: 'nic'}],
  ['Interface model', p => p.nicModel, undefined, undefined, {group: 'Interconnect'}],
  ['Interface speed', p => p.nicSpeed, undefined, undefined, {group: 'Interconnect'}],
  ['Interface-to-accelerator topology', p => p.nicTopology, undefined, undefined, {group: 'Interconnect'}],
  ['Aggregate scale-out per node', p => p.aggregateScaleOut, isCloudVm, undefined, {group: 'Interconnect'}],
  ['GPUDirect RDMA', p => p.gpuDirect, isAcceleratorNode, undefined, {group: 'Interconnect'}],
  ['Management / storage networking', p => p.managementNic, undefined, undefined, {group: 'Interconnect'}],
  ['Local storage', p => p.disk, undefined, undefined, {group: 'Storage'}],
  ['NVMe data disks', p => p.nvme, isCloudVm, undefined, {group: 'Storage'}],
  ['Max remote data disks', p => p.remoteDisks, isCloudVm, undefined, {group: 'Storage'}],
  ['Uncached disk IOPS', p => p.diskIops, isCloudVm, undefined, {group: 'Storage'}],
  ['Uncached disk throughput', p => p.diskThroughputMBps, isCloudVm, 'MBps', {group: 'Storage'}],
  ['Form factor', p => p.formFactor, undefined, undefined, {group: 'Provenance'}]
];

function attachCompleteness(c) {
  // Each entry keeps its value so the specification sheets and the gap list can
  // never disagree about whether a field is documented.
  const mark = (label, read, applies, subject, unit, opt = {}) => {
    const applicable = !applies || applies(subject);
    const base = {label, unit, group: opt.group || 'Provenance', metric: opt.metric || null};
    return applicable ? {...base, applicable: true, present: isSet(read(subject)), value: read(subject)} : {...base, applicable: false, present: false, value: null};
  };

  const clusterFields = CLUSTER_CHECKS.map(([label, read, applies, unit, opt]) => mark(label, read, applies, c, unit, opt));
  const nodeFields = {};
  for (const p of c.parts) nodeFields[p.name] = PART_CHECKS.map(([label, read, applies, unit, opt]) => mark(label, read, applies, p, unit, opt));

  const missing = clusterFields.filter(f => f.applicable && !f.present).map(f => f.label);
  const nodeMissing = Object.fromEntries(Object.entries(nodeFields).map(([name, fields]) => [name, fields.filter(f => f.applicable && !f.present).map(f => f.label)]));
  const total = clusterFields.filter(f => f.applicable).length + Object.values(nodeFields).reduce((n, fields) => n + fields.filter(f => f.applicable).length, 0);
  const absent = missing.length + Object.values(nodeMissing).reduce((n, list) => n + list.length, 0);
  c.completeness = {missing, nodeMissing, clusterFields, nodeFields, documented: total - absent, total, percent: total ? Math.round(((total - absent) / total) * 100) : 100};
}
