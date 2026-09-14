const esc=s=>String(s??'Not verified').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro={program:'EuroHPC',eligibility:'Proposal-based research access; geographic, project and call conditions apply.',url:'https://www.eurohpc-ju.europa.eu/eurohpc-ju-call-proposals-regular-access-mode_en',policy:'https://eurohpc-ju.europa.eu/access-our-supercomputers/access-policy-and-faq_en'};
export const researchAccess=Object.fromEntries(['jupiter','lumi','leonardo','marenostrum-5-acc','arrhenius-gpu'].map(id=>[id,euro]));
researchAccess.perlmutter={program:'NERSC / ERCAP',eligibility:'For research aligned with DOE Office of Science missions; allocation approval is required.',url:'https://www.nersc.gov/users/become-a-nersc-user/working-with-us',policy:'https://docs.nersc.gov/allocations/ercap_form/'};
researchAccess.stampede3={program:'NSF ACCESS',eligibility:'U.S.-based principal investigators can request research allocations; program conditions apply.',url:'https://allocations.access-ci.org/get-your-first-project',policy:'https://allocations.access-ci.org/allocations-policy',source:'https://docs.tacc.utexas.edu/hpc/stampede3/'};

export function cpuArchitecture(p){
 if(/Grace|A64FX|GH Superchip/i.test(p.cpu))return 'Arm';
 if(/EPYC|Xeon|AMD (Zen|Rome|Milan)/i.test(p.cpu))return 'x86-64';
 if(/SW26010/i.test(p.cpu))return 'Sunway';
 return null;
}
export function acceleratorModel(p){return p.gpus===0?'CPU only':p.gpu||null;}
// Require an explicit capacity per physical device. Never use a node/rack total,
// ambiguous variant, mixed-device profile or CPU-shared pool as dedicated VRAM.
export function gpuMemoryGB(p){
 if(p.gpus===0||p.mixed||p.apu||/MI250X/i.test(p.gpu||'')||/shared|unified/i.test(p.vram||''))return null;
 const m=/^(\d+(?:\.\d+)?)\s*(GiB|GB)\b.*\bper (?:physical )?(?:GPU|accelerator)\b/i.exec(p.vram||'');
 return m?Number(m[1])*(m[2].toLowerCase()==='gib'?2**30/1e9:1):null;
}
export function networkFamily(c){
 if(/not verified/i.test(c.network))return null;
 return ['Slingshot','InfiniBand','Ethernet','Tofu','Omni-Path','Sunway','LingQi','BXI'].find(n=>new RegExp(n,'i').test(c.network))||null;
}
export function matchingParts(c,f){
 if(f.access&&(!researchAccess[c.id]||(f.access!=='research'&&researchAccess[c.id].program!==f.access)))return [];
 if(f.network&&networkFamily(c)!==f.network)return [];
 return c.parts.map((p,index)=>({p,index})).filter(({p})=>(!f.model||acceleratorModel(p)===f.model)&&(!f.cpu||cpuArchitecture(p)===f.cpu)&&(!f.memory||(gpuMemoryGB(p)!=null&&gpuMemoryGB(p)>=Number(f.memory))));
}
export function initDiscovery(clusters,onOpen,onCompare){
 const root=document.querySelector('#discovery');
 const select=(id,label,values)=>`<label>${label}<select id="filter-${id}" name="${id}"><option value="">Any</option>${values.map(v=>`<option value="${esc(Array.isArray(v)?v[0]:v)}">${esc(Array.isArray(v)?v[1]:v)}</option>`).join('')}</select></label>`;
 const models=[...new Set(clusters.flatMap(c=>c.parts.map(acceleratorModel)).filter(Boolean))].sort();
 root.innerHTML=`<details class="discovery" open><summary><span><span class="eyebrow">FIND YOUR HARDWARE</span><strong>Discover clusters by requirements</strong></span><span>Filter catalog ⌄</span></summary><div class="discovery-body"><form id="hardwareFilters"><div class="hardware-filters">${select('model','GPU / accelerator model',models)}${select('memory','Minimum memory per GPU',[['32','32 GB'],['40','40 GB'],['80','80 GB'],['96','96 GB'],['128','128 GB'],['141','141 GB']])}${select('cpu','CPU architecture',['x86-64','Arm','Sunway'])}${select('network','Cluster interconnect',[...new Set(clusters.map(networkFamily).filter(Boolean))].sort())}${select('access','Research access',[['research','Documented application route'],'EuroHPC','NERSC / ERCAP','NSF ACCESS'])}</div><div class="discovery-actions"><button type="button" data-filter-preset>Try: 80 GB GPUs + research access</button><button type="reset">Clear filters</button></div></form><p class="discovery-note">Requirements must match the same node type. Unknown specifications do not qualify. GPU memory excludes shared APU memory, MI250X package totals (two GPU dies), and ambiguous variants; GiB is converted to GB for filtering. Hardware matches do not guarantee workload performance or access.</p><div class="discovery-count" role="status" aria-live="polite"></div><div class="discovery-results" role="region" aria-label="Matching clusters" tabindex="0"></div></div></details>`;
 const form=root.querySelector('form'),results=root.querySelector('.discovery-results'),status=root.querySelector('.discovery-count');
 function render(){
  const f=Object.fromEntries(new FormData(form));
  if(!Object.values(f).some(Boolean)){status.textContent='Choose a requirement to discover matching clusters.';results.innerHTML='';return;}
  const matches=clusters.map(c=>({c,parts:matchingParts(c,f)})).filter(r=>r.parts.length);
  status.textContent=`${matches.length} matching clusters · ${matches.reduce((n,r)=>n+r.parts.length,0)} matching node types`;
  results.innerHTML=matches.length?matches.map(({c,parts})=>{const a=researchAccess[c.id];return `<article class="discovery-result"><h3>${esc(c.name)} <small>${esc(c.country)}</small></h3><p>${esc(c.network)}</p>${parts.map(({p,index})=>`<div class="discovery-part"><strong>${esc(p.name)}</strong><p>${esc(p.cpu)} · ${esc(acceleratorModel(p))}<br>GPU memory: ${esc(p.vram||'Not applicable')}${p.apu?' (shared with CPU)':''}</p><div class="discovery-actions"><button data-discover-open="${c.id}" data-part="${index}">Explore this node ↗</button><button data-discover-compare="${c.id}" data-part="${index}">Compare ↔</button></div></div>`).join('')}<div class="discovery-access">${a?`<strong>${esc(a.program)} · application route</strong><p>${esc(a.eligibility)}</p><a href="${a.url}" target="_blank" rel="noopener noreferrer">How to apply ↗</a> · <a href="${a.policy}" target="_blank" rel="noopener noreferrer">Eligibility & instructions ↗</a>${a.source?` · <a href="${a.source}" target="_blank" rel="noopener noreferrer">Operator confirmation ↗</a>`:''}<small>Access information checked 14 September 2026. Confirm current calls and eligible partitions with the operator.</small>`:'Research access: not verified in this catalog.'}</div><a href="${esc(c.sources[0].url)}" target="_blank" rel="noopener noreferrer">Hardware source ↗</a></article>`}).join(''):'<p class="discovery-empty">No documented node types meet every requirement. Try lowering the memory threshold or clearing a filter. Incomplete profiles may not appear even if the hardware exists.</p>';
 }
 form.addEventListener('change',render);
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('reset',()=>queueMicrotask(render));
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-filter-preset')){form.reset();form.elements.memory.value='80';form.elements.access.value='research';render();return;}const id=b.dataset.discoverOpen||b.dataset.discoverCompare;if(!id)return;const c=clusters.find(c=>c.id===id),index=Number(b.dataset.part);if(b.dataset.discoverCompare)onCompare(c,index);else onOpen(c,index);});
 render();
}
