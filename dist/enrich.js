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
  if (/\bDGX H100\b|\bDGX H200\b|\bDGX SuperPOD\b/i.test(haystack)) return platforms.dgxH100;
  if (/\bDGX A100\b/i.test(haystack)) return platforms.dgxA100;
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
    if (i === 0) c.notes += ` Node specifications follow the documented ${platform.name} platform (${platform.formFactor}); operator-specific deviations are not verified.`;
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

// Which published facts this profile does not have yet. Derived from the record
// itself so it stays correct as data is added, and surfaced in the interface so
// a missing value reads as "we have not published this yet" rather than as an
// absence of hardware.
const CLUSTER_CHECKS = [
  ['Manufacturer', c => c.manufacturer],
  ['System model', c => c.parts[0]?.systemModel],
  ['Ranked core count', c => c.cores],
  ['Theoretical peak', c => c.rpeak],
  ['Measured power', c => c.powerKw],
  ['Operating system', c => c.os],
  ['Network topology', c => c.topology && c.topology !== 'Not verified' ? c.topology : null]
];
const PART_CHECKS = [
  ['Node count', p => p.count],
  ['CPU model', p => p.cpu],
  ['CPU sockets', p => p.cpus ?? p.physicalCores],
  ['CPU cores per socket', p => p.coresPerSocket],
  ['Accelerator model', p => p.gpu],
  ['Accelerators per node', p => p.gpus != null ? p.gpus : null],
  ['Host memory', p => p.ram],
  ['Accelerator memory', p => p.vram],
  ['Accelerator link', p => p.link],
  ['CPU–accelerator link', p => p.hostLink],
  ['Network interfaces', p => p.nic],
  ['Interface model', p => p.nicModel],
  ['Interface speed', p => p.nicSpeed],
  ['Local storage', p => p.disk]
];

function attachCompleteness(c) {
  const missing = CLUSTER_CHECKS.filter(([, read]) => !isSet(read(c))).map(([label]) => label);
  const nodeMissing = {};
  for (const p of c.parts) nodeMissing[p.name] = PART_CHECKS.filter(([, read]) => !isSet(read(p))).map(([label]) => label);
  const total = CLUSTER_CHECKS.length + c.parts.length * PART_CHECKS.length;
  const absent = missing.length + Object.values(nodeMissing).reduce((n, list) => n + list.length, 0);
  c.completeness = {missing, nodeMissing, documented: total - absent, total, percent: Math.round(((total - absent) / total) * 100)};
}
