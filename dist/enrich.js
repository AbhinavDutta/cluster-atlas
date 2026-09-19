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
    if (p.gpus > 1 && isSet(p.nic) && /per GPU|one adapter per GPU|dedicated/i.test(p.nicTopology || '')) {
      p.scaleOut = {perAccelerator: true, adapters: p.nic, model: p.nicModel || null, speed: p.nicSpeed || null};
    } else if (p.nic != null && p.gpus > 0) {
      p.scaleOut = {perAccelerator: false, adapters: p.nic, model: p.nicModel || null, speed: p.nicSpeed || null};
    } else {
      p.scaleOut = null;
    }
  }
}

export function enrichCluster(c) {
  attachRankedMetrics(c);
  attachPlatform(c);
  attachScaleOut(c);
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

const CLUSTER_CHECKS = [
  ['Manufacturer', c => c.manufacturer],
  ['Ranked core count', c => c.cores, isRanked],
  ['Theoretical peak', c => c.rpeak, isRanked, 'PFlop/s'],
  ['Measured power', c => c.powerKw, isRanked, 'kW'],
  ['Energy efficiency', c => c.efficiency, isRanked, 'GFlop/s per watt'],
  ['Operating system', c => c.os],
  ['Network topology', c => c.topology && c.topology !== 'Not verified' ? c.topology : null]
];
const PART_CHECKS = [
  ['System / node model', p => p.systemModel],
  ['Compute nodes of this type', p => p.count],
  ['CPU model', p => p.cpu],
  ['CPU sockets per node', p => p.apu ? p.cpus : p.cpus ?? p.physicalCores, p => !p.apu],
  ['Cores per socket', p => p.coresPerSocket, p => !p.apu],
  ['Physical CPU cores', p => p.physicalCores, p => !p.apu],
  ['CPU note', p => p.cpuNote],
  ['Accelerator model', p => p.gpu, isAcceleratorNode],
  ['Physical accelerators per node', p => p.gpus, isAcceleratorNode],
  ['Host / unified memory', p => p.ram],
  ['Accelerator memory', p => p.vram, isAcceleratorNode],
  ['Accelerator ↔ accelerator link', p => p.link, hasAcceleratorFabric],
  ['On-node fabric', p => p.onNodeFabric, hasAcceleratorFabric],
  ['CPU ↔ accelerator link', p => p.hostLink, isAcceleratorNode],
  ['Network interfaces per node', p => p.nic],
  ['Interface model', p => p.nicModel],
  ['Interface speed', p => p.nicSpeed],
  ['Interface-to-accelerator topology', p => p.nicTopology],
  ['Aggregate scale-out per node', p => p.aggregateScaleOut],
  ['GPUDirect RDMA', p => p.gpuDirect, isAcceleratorNode],
  ['Management / storage networking', p => p.managementNic],
  ['Local storage', p => p.disk],
  ['NVMe data disks', p => p.nvme],
  ['Max remote data disks', p => p.remoteDisks],
  ['Uncached disk IOPS', p => p.diskIops],
  ['Uncached disk throughput', p => p.diskThroughputMBps, undefined, 'MBps'],
  ['Form factor', p => p.formFactor]
];

function attachCompleteness(c) {
  // Each entry keeps its value so the specification sheets and the gap list can
  // never disagree about whether a field is documented.
  const mark = (label, read, applies, subject, unit) => {
    const applicable = !applies || applies(subject);
    return applicable ? {label, unit, applicable: true, present: isSet(read(subject)), value: read(subject)} : {label, unit, applicable: false, present: false, value: null};
  };

  const clusterFields = CLUSTER_CHECKS.map(([label, read, applies, unit]) => mark(label, read, applies, c, unit));
  const nodeFields = {};
  for (const p of c.parts) nodeFields[p.name] = PART_CHECKS.map(([label, read, applies, unit]) => mark(label, read, applies, p, unit));

  const missing = clusterFields.filter(f => f.applicable && !f.present).map(f => f.label);
  const nodeMissing = Object.fromEntries(Object.entries(nodeFields).map(([name, fields]) => [name, fields.filter(f => f.applicable && !f.present).map(f => f.label)]));
  const total = clusterFields.filter(f => f.applicable).length + Object.values(nodeFields).reduce((n, fields) => n + fields.filter(f => f.applicable).length, 0);
  const absent = missing.length + Object.values(nodeMissing).reduce((n, list) => n + list.length, 0);
  c.completeness = {missing, nodeMissing, clusterFields, nodeFields, documented: total - absent, total, percent: total ? Math.round(((total - absent) / total) * 100) : 100};
}
