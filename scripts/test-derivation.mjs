// Guardrail against reporting a fact as unavailable that the record already holds.
//
// The audit that prompted this found the catalog telling readers "Cores per
// socket: not publicly available" on the same page as "CPU model: AMD EPYC 7763
// · 64 cores", and scoring bare-metal blades against Azure VM disk metrics they
// cannot have. Both made the public record look thinner than it is. These checks
// fail the build if either returns.
import {clusters} from '../dist/data.js';
import {enrichment} from '../dist/enrichment.js';
import {readFileSync} from 'node:fs';

const failures = [];

const fail = m => failures.push(m);
const isSet = v => v != null && !/^not verified$/i.test(String(v));

for (const c of clusters) {
  for (const p of c.parts) {
    const where = `${c.id}/${p.name}`;

    // 1. A core count stated inside the CPU designation must reach the field.
    const stated = /·\s*(\d+)\s*cores/i.exec(p.cpu || '');
    if (stated && !p.apu && p.coresPerSocket !== Number(stated[1]))
      fail(`${where}: cpu says "${p.cpu}" but coresPerSocket is ${p.coresPerSocket}`);

    // 2. Cores per node is sockets x cores per socket, by definition.
    if (!p.apu && p.cpus > 0 && p.coresPerSocket > 0 && p.physicalCores !== p.cpus * p.coresPerSocket)
      fail(`${where}: ${p.cpus} sockets x ${p.coresPerSocket} cores should be ${p.cpus * p.coresPerSocket} physical cores, record says ${p.physicalCores}`);

    // 3. Per-device memory stated in the accelerator designation must reach vram.
    const vm = /(\d+(?:\.\d+)?)\s*GB\b/i.exec(p.gpu || '');
    if (vm && p.gpus !== 0 && !p.mixed && !p.apu && !isSet(p.vram))
      fail(`${where}: gpu says "${p.gpu}" but vram is ${JSON.stringify(p.vram)}`);

    // 4. A TOP500 submission string leads with the vendor model designation.
    if (c.hardwareDescription && !p.systemModel)
      fail(`${where}: hardwareDescription starts "${c.hardwareDescription.split(',')[0]}" but systemModel is unset`);

    // 5. Cloud-VM instance metrics must not be scored against non-VM hardware.
    const cloud = ['NVMe data disks', 'Max remote data disks', 'Uncached disk IOPS',
      'Uncached disk throughput', 'Aggregate scale-out per node'];
    for (const f of c.completeness.nodeFields[p.name] || []) {
      if (cloud.includes(f.label) && f.applicable && !p.vmSku)
        fail(`${where}: "${f.label}" is a cloud-VM instance metric but is scored against non-VM hardware`);
      // 6. And a field carrying a value must never be scored as absent.
      if (f.applicable && !f.present && isSet(f.value))
        fail(`${where}: "${f.label}" holds ${JSON.stringify(f.value)} but is scored as not documented`);
    }
  }
}

// A duplicate key in a JS object literal is silently dropped — the later one
// wins and the earlier one's fields vanish with no error. That happened once
// while building this overlay, so it is checked against the source text.
const overlaySource = readFileSync(new URL('../dist/enrichment.js', import.meta.url), 'utf8');
const keys = [...overlaySource.matchAll(/^  '([a-z0-9-]+)': \{/gm)].map(m => m[1]);
const seen = new Set();
for (const id of keys) {
  if (seen.has(id)) failures.push(`enrichment defines "${id}" more than once; the earlier entry is silently discarded`);
  seen.add(id);
}

for (const [id, entry] of Object.entries(enrichment)) {
  const c = clusters.find(x => x.id === id);
  if (!c) { failures.push(`enrichment names unknown cluster "${id}"`); continue; }
  if (!(entry.sources || []).length)
    failures.push(`enrichment for "${id}" carries researched values but no source`);
  for (const url of (entry.sources || []).map(s => s.url))
    if (!c.sources.some(s => s.url === url)) failures.push(`enrichment source ${url} did not reach ${id}`);
}

if (failures.length) {
  console.error(`FAIL derivation audit — ${failures.length} issue(s):\n` + failures.slice(0, 25).map(f => '  · ' + f).join('\n'));
  process.exit(1);
}

const derived = clusters.flatMap(c => c.parts.flatMap(p => p.derivedFields || [])).length;
const total = clusters.reduce((n, c) => n + c.completeness.total, 0);
const doc = clusters.reduce((n, c) => n + c.completeness.documented, 0);
console.log(`PASS derivation audit: no field is reported unavailable while its value is recoverable from the same record; ${derived} values read from sibling fields; ${doc}/${total} applicable fields documented (${Math.round(doc / total * 100)}%).`);
export {};
