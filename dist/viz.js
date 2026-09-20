// Shared visual primitives for the cluster views.
//
// The network, node and specification views all need the same few things: a way
// to place one machine's number against the rest of the catalog, a way to turn a
// documented link rate into a visual weight, a way to size a memory block by its
// capacity, and one consistent way to draw a fact nobody has published. Keeping
// them here is what stops the three views drifting into three different visual
// languages for the same idea.
//
// Every function here is conservative in the same direction as the rest of the
// catalog: when a source does not state something, the answer is null and the
// caller draws a gap, rather than a plausible-looking number.
import {clusters} from './data.js';
import {gpuMemoryGB} from './discovery.js';

// ---------------------------------------------------------------------- text
// Two kinds of absence, and they mean different things. "Not verified" is the
// internal sentinel for a fact this catalog has not recorded, shown as "Not
// publicly available". "Not applicable" is a real value meaning the field cannot
// exist for this system. Nothing else should reach a reader.
export const UNKNOWN = 'Not publicly available';
export const isUnknown = v => v == null || /^not verified$/i.test(String(v));
export const norm = v => (typeof v === 'string' && /^not verified$/i.test(v)) ? UNKNOWN : v;
export const fmt = n => isUnknown(n) ? UNKNOWN : typeof n === 'number' ? n.toLocaleString('en-US') : String(n);
export const esc = s => String(s == null ? UNKNOWN : norm(s)).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// ------------------------------------------------------------------ capacity
const UNIT_GB = {mb: 1 / 1000, gb: 1, gib: 2 ** 30 / 1e9, tb: 1000, tib: 2 ** 40 / 1e9, pb: 1e6};
// A capacity this catalog can draw to scale. A string that offers a choice
// ("256 / 512 GB DDR (variant unspecified)") is not one: the operator published
// an ambiguity, and picking either number would invent a fact. Those return null
// and the caller falls back to showing the string.
export function capacityGB(s) {
  if (typeof s !== 'string' || isUnknown(s)) return null;
  if (/\d\s*\/\s*\d/.test(s)) return null;
  const m = /(\d[\d,]*(?:\.\d+)?)\s*(MB|GB|GiB|TB|TiB|PB)\b/i.exec(s);
  return m ? Number(m[1].replace(/,/g, '')) * UNIT_GB[m[2].toLowerCase()] : null;
}
export {gpuMemoryGB};

// ----------------------------------------------------------------- bandwidth
// Only an explicitly published rate produces a weight. "NVLink 3" and "PCIe 4.0"
// name standards whose headline rates are well known, but the operator did not
// state a figure for this machine, so the diagram does not draw one. Those links
// get the neutral default weight instead of a borrowed number.
export function bandwidthGbps(s) {
  if (typeof s !== 'string' || isUnknown(s)) return null;
  // Case is load-bearing here: "GB/s" is bytes and "Gb/s" is bits, and this
  // catalog uses both — NVLink figures are quoted in GB/s, network adapters in
  // Gb/s. Matching case-insensitively would misscale one of them by eight.
  const m = /(\d[\d,]*(?:\.\d+)?)\s*([GTM])(b|B)(?:\/s|ps)\b/.exec(s);
  if (!m) return null;
  const mag = m[2] === 'T' ? 1000 : m[2] === 'M' ? 1 / 1000 : 1;
  return Number(m[1].replace(/,/g, '')) * mag * (m[3] === 'B' ? 8 : 1);
}
// Logarithmic, because published rates here span a 200 Gb/s adapter to a
// 14.4 TB/s on-node fabric — three orders of magnitude, which a linear scale
// would flatten to one thick line and a field of hairlines. Unstated rates sit
// below the whole range: visibly thinner than any documented link, still drawn.
export const DEFAULT_WEIGHT = 1.4;
export function linkWeight(gbps) {
  if (gbps == null) return DEFAULT_WEIGHT;
  const lo = Math.log(100), hi = Math.log(120000);
  const t = Math.max(0, Math.min(1, (Math.log(Math.max(gbps, 100)) - lo) / (hi - lo)));
  return 2 + t * 4.6;
}
// The rate as a reader-facing caption, in the units the figure was published in
// where that is unambiguous, so a legend entry can be checked against a source.
export const rateLabel = s => {
  if (typeof s !== 'string') return null;
  const m = /(\d[\d,]*(?:\.\d+)?)\s*([GTM])(b|B)(?:\/s|ps)\b/.exec(s);
  return m ? m[0] : null;
};

// ------------------------------------------------------------- catalog ranges
export const totalNodes = c => c.parts.some(p => p.count == null) ? null : c.parts.reduce((s, p) => s + p.count, 0);
export const totalAccelerators = c => c.parts.some(p => p.gpus == null || (p.count == null && p.gpus > 0)) ? null : c.parts.reduce((s, p) => s + (p.count || 0) * p.gpus, 0);

// Metrics the catalog can compare across machines. Cluster-level metrics read one
// value per cluster; node-level metrics read one per node type, so a percentile
// compares like with like.
const CLUSTER_METRICS = {
  rmax: c => c.rmax, rpeak: c => c.rpeak, cores: c => c.cores, powerKw: c => c.powerKw,
  efficiency: c => c.efficiency, nodes: totalNodes, accelerators: totalAccelerators
};
const PART_METRICS = {
  count: p => p.count, cpus: p => p.cpus, gpus: p => p.gpus, nic: p => p.nic,
  coresPerSocket: p => p.coresPerSocket, physicalCores: p => p.physicalCores,
  ramGB: p => capacityGB(p.ram), vramGB: p => gpuMemoryGB(p)
};
const ranges = new Map();
// The distribution of one metric across every cluster that publishes it. The
// denominator is deliberately the number that published, not the catalog size:
// "higher than 60% of 25 clusters that publish this" is a claim the data
// supports, "higher than 60% of the catalog" is not.
export function catalogRange(key) {
  if (ranges.has(key)) return ranges.get(key);
  const ok = v => typeof v === 'number' && isFinite(v) && v > 0;
  const values = (CLUSTER_METRICS[key] ? clusters.map(CLUSTER_METRICS[key])
    : PART_METRICS[key] ? clusters.flatMap(c => c.parts.map(PART_METRICS[key])) : []).filter(ok).sort((a, b) => a - b);
  // A percentile needs a distribution to be a percentile of. Sockets per node
  // takes three values across the whole catalog and accelerators per node five,
  // so "4 accelerators, higher than 0%" is arithmetically true and tells a
  // reader nothing — those fields get no bar and stand as plain values.
  const distinct = new Set(values).size;
  const range = values.length > 2 && distinct >= 8 ? {values, min: values[0], max: values[values.length - 1], n: values.length} : null;
  ranges.set(key, range);
  return range;
}
export function percentileOf(key, value) {
  const r = catalogRange(key);
  if (!r || !(value > 0)) return null;
  let below = 0;
  for (const v of r.values) if (v < value) below++;
  return Math.round(below / r.n * 100);
}
// A value on its own does not tell a reader whether it is large. This puts it
// inside the catalog's own distribution, on a log scale because these quantities
// span several orders of magnitude, and states the comparison in words for
// anyone who cannot see the bar.
export function peerBar(key, value, label) {
  const r = catalogRange(key);
  if (!r || !(value > 0)) return '';
  const lo = Math.log(r.min), hi = Math.log(r.max);
  const t = hi > lo ? (Math.log(Math.min(Math.max(value, r.min), r.max)) - lo) / (hi - lo) : 1;
  const pc = percentileOf(key, value);
  const words = 'higher than ' + pc + '% of the ' + r.n + ' clusters that publish ' + label;
  return '<div class="peer"><div class="peertrack"><div class="peerfill" style="width:' + Math.max(2.5, t * 100).toFixed(1) + '%"></div></div>'
    + '<span class="peerlabel" role="img" aria-label="' + esc(words) + '">higher than ' + pc + '%<span class="peerunit"> of ' + r.n + '</span></span></div>';
}

// ------------------------------------------------------------- unknown as art
// One drawing for every unpublished fact, used by all three views. A gap gets the
// footprint the real thing would have occupied, so a reader sees the shape of
// what is missing instead of a paragraph explaining that it is missing. This is
// the single change that lets a 4%-documented cluster still render a diagram.
export function unknownSlot(x, y, w, h, label, attr = '') {
  const room = h >= 34 && w >= 60;
  return '<g class="slotUnknown"' + (attr ? ' ' + attr : '') + '>'
    + '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>'
    + '<text x="' + (x + w / 2) + '" y="' + (y + (room ? h / 2 - 1 : h / 2 + 4)) + '" text-anchor="middle" class="slotMark">?</text>'
    + (room && label ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 13) + '" text-anchor="middle" class="slotLabel">' + esc(label) + '</text>' : '')
    + '</g>';
}
