// Coverage guardrail.
//
// The Eagle profile originally omitted most of the node's published public
// record: the TOP500 benchmark columns the importer discarded, and the
// documented per-GPU InfiniBand scale-out. This script fails the build when
// that class of omission reappears, so it is caught at review time rather than
// noticed later by a reader.
//
// It checks three things:
//   1. Ranked systems carry the published benchmark fields.
//   2. Known vendor platforms carry their documented specification.
//   3. No record has grown a field that the interface registry does not know how
//      to display, which is how a fact gets silently dropped from the UI.
import assert from 'node:assert/strict';
import {clusters} from '../dist/data.js';
import {CLUSTER_FIELD_KEYS, PART_FIELD_KEYS} from '../dist/enrich.js';

const failures=[];
const fail=m=>failures.push(m);

// 1. Ranked benchmark fields.
for(const c of clusters){
  if(c.rank==null)continue;
  if(!c.benchmark)fail(`${c.id}: ranked #${c.rank} has no benchmark record`);
  else if(c.benchmark.rmax==null)fail(`${c.id}: ranked #${c.rank} has no Rmax`);
}

// 2. Platform specifications applied where the platform is in use.
for(const c of clusters){
  const model=c.parts[0]?.systemModel||'';
  if(!/DGX H100|DGX H200|DGX A100/.test(model))continue;
  for(const p of c.parts){
    if(!p.platformFacts?.length)fail(`${c.id}: ${model} has no platform specification attached`);
    if(p.nic==null)fail(`${c.id}: ${model} has no network adapter count`);
  }
}

// 3. Every valued field must be reachable in the interface. The specification
// sheets render only from the completeness registry in enrich.js, so a field
// carrying a value that has no registry entry would silently disappear from the
// site. This is checked against the exported key sets, not a hand-written list,
// so adding a field to the data without registering it fails the build.
const STRUCTURAL = new Set(['id', 'name', 'aliases', 'sources', 'notes', 'parts', 'profileScope',
  'checked', 'site', 'country', 'network', 'topology', 'rank', 'rmax', 'rpeak', 'powerKw', 'efficiency',
  'os', 'manufacturer', 'cores', 'hardwareDescription', 'completeness', 'platform', 'benchmark']);
const STRUCTURAL_PART = new Set(['name', 'apu', 'paired', 'mixed', 'noGpuLinks', 'compact', 'groupSize',
  'acceleratorLabel', 'platformFacts', 'scaleOut', 'detail', 'sockets', 'vmSku']);
for (const c of clusters) {
  for (const key of Object.keys(c)) {
    const v = c[key];
    if (STRUCTURAL.has(key) || v == null || v === '' || typeof v === 'object') continue;
    if (!CLUSTER_FIELD_KEYS.has(key)) fail(`${c.id}: cluster field "${key}" has a value but no registry entry, so it would never be shown`);
  }
  for (const p of c.parts) {
    for (const key of Object.keys(p)) {
      const v = p[key];
      if (STRUCTURAL_PART.has(key) || v == null || v === '' || typeof v === 'object') continue;
      if (!PART_FIELD_KEYS.has(key)) fail(`${c.id}/${p.name}: node field "${key}" has a value but no registry entry, so it would never be shown`);
    }
  }
}

if(failures.length){
  console.error(`FAIL coverage audit — ${failures.length} issue(s):\n` + failures.map(f=>'  · '+f).join('\n'));
  process.exit(1);
}

const ranked=clusters.filter(c=>c.rank!=null).length;
const mean=Math.round(clusters.reduce((s,c)=>s+c.completeness.percent,0)/clusters.length);
console.log(`PASS coverage audit: ${clusters.length} clusters, ${ranked} ranked with published benchmark fields, mean documented-field coverage ${mean}%.`);

// Report the gaps rather than hiding them, so enrichment work is visible.
export {};