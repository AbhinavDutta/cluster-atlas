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

// 3. No undocumented cluster/part field that the interface cannot show.
// The registry lives in app.js; these are the keys app.js and the other modules
// are known to consume, plus structural keys.
const STRUCTURAL=new Set(['aliases','benchmark','checked','completeness','country','id','network','notes','parts','platform','profileScope','rank','rmax','site','sources','topology']);
const RENDERED=new Set(['name','count','cpu','cpus','coresPerSocket','gpu','gpus','ram','vram','link','hostLink','disk','systemModel','nic','nicModel','nicSpeed','nicTopology','scaleOut','aggregateScaleOut','gpuDirect','onNodeFabric','managementNic','nvme','remoteDisks','diskIops','diskThroughputMBps','physicalCores','cpuNote','formFactor','platformFacts','apu','paired','mixed','noGpuLinks','compact','groupSize','acceleratorLabel','detail']);
const KNOWN_CLUSTER=new Set([...STRUCTURAL,'name','manufacturer','os','cores','rpeak','powerKw','efficiency','hardwareDescription','platform','interconnectDetails']);
for(const c of clusters){
  for(const key of Object.keys(c))if(!KNOWN_CLUSTER.has(key))fail(`${c.id}: unclassified cluster field "${key}" — add it to the interface registry or the audit allow-list`);
  for(const p of c.parts)for(const key of Object.keys(p))if(!RENDERED.has(key))fail(`${c.id}: unclassified node field "${key}" — add it to the interface registry or the audit allow-list`);
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