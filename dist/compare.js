const norm=v=>typeof v==='string'&&/^not verified$/i.test(v)?'Not publicly available':v;
const esc=s=>String(s==null?'Not publicly available':norm(s)).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>(n==null||/^not verified$/i.test(String(n)))?'Not publicly available':typeof n==='number'?n.toLocaleString('en-US'):String(n);
const sum=(c,f)=>c.parts.some(p=>f(p)==null)?null:c.parts.reduce((s,p)=>s+f(p),0);

export function initComparison(clusters,getCurrent){
  const root=document.querySelector('#comparison');
  let sides=[{c:clusters[0],p:0},{c:clusters.find(c=>c.id==='deltaai')||clusters[1],p:0}];
  root.innerHTML=`<details class="comparison"><summary><span><span class="eyebrow">COMPARE ARCHITECTURES</span><strong>Two systems, side by side</strong></span><span>Compare clusters ⌄</span></summary><div class="compare-intro"><p>Choose a cluster and node type on each side. Highlighted rows have different specifications.</p><p>Capacities retain their documented units. These specifications are not a performance ranking; shared CPU/GPU memory must not be added twice.</p></div><div class="compare-scroll" role="region" aria-label="Cluster comparison" tabindex="0"><table class="compare-table"><caption class="sr-only">Cluster totals and specifications for one node of each selected type</caption><thead><tr><th scope="col">Specification</th>${[0,1].map(i=>`<th scope="col"><label for="compare-cluster-${i}">${i?'B':'A'} · Cluster</label><select id="compare-cluster-${i}" data-compare-cluster="${i}">${clusters.map(c=>`<option value="${c.id}" ${c===sides[i].c?'selected':''}>${esc(c.name)}</option>`).join('')}</select><label for="compare-part-${i}">Node type</label><select id="compare-part-${i}" data-compare-part="${i}"></select></th>`).join('')}</tr></thead><tbody></tbody></table></div><div class="compare-detail" role="status">Select a component or connection in either node diagram for details.</div></details>`;
  const tbody=root.querySelector('tbody');
  function options(i){root.querySelector(`#compare-part-${i}`).innerHTML=sides[i].c.parts.map((p,j)=>`<option value="${j}" ${j===sides[i].p?'selected':''}>${esc(p.name)}</option>`).join('');}
  function diagram(c,p,i){
    if(p.gpus==null||p.compact)return '<div class="compare-node"><strong>'+esc(p.name)+'</strong><p>Representative profile; exact wiring is not asserted.</p>'+[['cpu','CPU',p.cpu],['gpu','Accelerator',(p.gpu||'Model not verified')+' · '+fmt(p.gpus)],['ram','Memory',p.ram],['network','Interconnect',c.network]].map(([kind,label,value])=>'<button data-component="'+kind+'" data-side="'+i+'">'+label+' · '+esc(value)+'</button>').join('')+'</div>';

    const chip=(kind,label,n)=>`<div class="compare-chips">${Array.from({length:n??1},(_,j)=>`<button data-component="${kind}" data-side="${i}" aria-label="${i?'Right':'Left'} ${esc(c.name)} ${label} ${n==null?'representative':j+1}"><span>${kind==='cpu'?'▣':'▥'}</span>${label} ${n==null?'?':j+1}</button>`).join('')}</div>`;
    return `<div class="compare-node"><div class="compare-node-title">${esc(p.name)} · one representative node</div><button class="compare-memory" data-component="ram" data-side="${i}">▤ ${p.apu?'Unified':'Host'} memory · ${esc(p.ram)}</button><div class="compare-bus" aria-hidden="true"></div>${p.apu?`<p class="compare-package">Each APU combines CPU + GPU + shared memory</p>${chip('gpu','APU',p.gpus)}`:chip('cpu','CPU',p.cpus)}${p.gpus&&!p.apu?`<button class="compare-link" data-component="host" data-side="${i}">↕ ${esc(p.hostLink)}</button>${chip('gpu','GPU',p.gpus)}`:!p.gpus?'<p class="compare-package">No GPU in this node profile</p>':''}${p.gpus>1?`<button class="compare-link" data-component="local" data-side="${i}">${esc(p.link)}</button>`:''}<div class="compare-bus" aria-hidden="true"></div><div class="compare-node-bottom"><button data-component="network" data-side="${i}">⌘ Cluster network</button><button data-component="disk" data-side="${i}">▱ Storage</button></div><p class="compare-package">Logical connections; exact lanes and cable routes are not shown.${p.cpus==null?' CPU symbol is representative; count is not published.':''}</p></div>`;
  }
  function paint(){
    const ps=sides.map(s=>s.c.parts[s.p]);
    const section=name=>`<tr class="compare-section"><th colspan="3">${name}</th></tr>`;
    const row=(label,values)=>`<tr class="${values[0]!==values[1]?'compare-different':''}"><th scope="row">${label}</th>${values.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`;
    const clusterRow=(label,f)=>row(label,sides.map(s=>f(s.c)));
    const nodeRow=(label,f)=>row(label,ps.map(f));
    tbody.innerHTML=section('Cataloged inventory (see profile scope)')+
      clusterRow('Operator / site',c=>c.site)+clusterRow('Country',c=>c.country)+clusterRow('Profile scope',c=>c.profileScope||'Documented compute inventory')+
      clusterRow('Manufacturer',c=>c.manufacturer)+clusterRow('Operating system',c=>c.os)+
      clusterRow('Total compute nodes',c=>fmt(sum(c,p=>p.count)))+
      clusterRow('Total physical accelerators',c=>fmt(sum(c,p=>p.gpus===0?0:p.count==null||p.gpus==null?null:p.count*p.gpus)))+
      clusterRow('Documented node types',c=>fmt(c.parts.length))+
      section('Published benchmark (TOP500 · June 2026)')+
      clusterRow('HPL rank',c=>c.benchmark?('#'+c.benchmark.rank):'Not ranked')+
      clusterRow('HPL Rmax (PFlop/s)',c=>c.benchmark?.rmax!=null?c.benchmark.rmax.toLocaleString('en-US'):'Not published')+
      clusterRow('Theoretical peak Rpeak (PFlop/s)',c=>c.benchmark?.rpeak!=null?c.benchmark.rpeak.toLocaleString('en-US'):'Not published')+
      clusterRow('Ranked core count',c=>c.benchmark?.cores!=null?c.benchmark.cores.toLocaleString('en-US'):'Not published')+
      clusterRow('Measured power (kW)',c=>c.benchmark?.powerKw!=null?c.benchmark.powerKw.toLocaleString('en-US'):'Not published')+
      clusterRow('Energy efficiency (GFlop/s per watt)',c=>c.benchmark?.efficiencyGFlopsPerWatt!=null?c.benchmark.efficiencyGFlopsPerWatt.toFixed(2):'Not published')+
      section('Selected node type')+nodeRow('Nodes of this type',p=>fmt(p.count))+
      `<tr><th scope="row">Inside one node</th>${sides.map((s,i)=>`<td>${diagram(s.c,ps[i],i)}</td>`).join('')}</tr>`+
      section('Per-node hardware')+
      nodeRow('System / node model',p=>p.systemModel)+
      nodeRow('CPU model',p=>p.cpu)+nodeRow('CPU count / CPU-bearing packages',p=>p.apu?`${p.cpus??'Not verified'} APU packages (CPU integrated)`:fmt(p.cpus))+
      nodeRow('Cores per socket',p=>p.coresPerSocket)+
      nodeRow('Accelerator model',p=>p.gpus===0?'No accelerator':p.gpu||'Not verified')+nodeRow('Physical accelerators',p=>`${fmt(p.gpus)}${p.apu?' APUs (CPU + GPU)':''}`)+
      nodeRow('Host / unified memory',p=>p.ram)+nodeRow('Accelerator memory (as documented)',p=>p.gpus===0?'Not applicable':p.vram)+
      nodeRow('Storage (as documented)',p=>p.disk)+
      section('Connections')+nodeRow('CPU ↔ accelerator',p=>p.gpus===0?'Not applicable':p.hostLink)+
      nodeRow('Accelerator ↔ accelerator',p=>p.gpus==null?'Not verified':p.gpus>1?p.link:'Not applicable')+
      nodeRow('On-node fabric',p=>p.onNodeFabric)+
      nodeRow('Network interfaces per node',p=>fmt(p.nic))+
      nodeRow('Interface model',p=>p.nicModel)+
      nodeRow('Interface speed',p=>p.nicSpeed)+
      nodeRow('Interface-to-accelerator topology',p=>p.nicTopology?p.nicTopology+(p.scaleOut?` (${p.scaleOut.perAccelerator?'dedicated per accelerator':'shared node interface'})`:''):'Not published')+
      nodeRow('Aggregate scale-out per node',p=>p.aggregateScaleOut)+
      nodeRow('GPUDirect RDMA',p=>p.gpuDirect)+
      clusterRow('Cluster interconnect',c=>c.network)+clusterRow('Cluster network topology',c=>c.topology)+
      section('Public record coverage')+
      clusterRow('Documented tracked fields',c=>`${c.completeness.documented} / ${c.completeness.total} (${c.completeness.percent}%)`)+
      clusterRow('Not published for this system',c=>[...c.completeness.missing,...Object.entries(c.completeness.nodeMissing).flatMap(([n,l])=>l.map(m=>n+': '+m))].join(', ')||'No gaps recorded')+
      section('Notes and sources')+clusterRow('Inventory / architecture caveats',c=>c.notes)+
      `<tr><th scope="row">Sources</th>${sides.map(s=>`<td>${s.c.sources.map(src=>`<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">${esc(src.title)} ↗</a>`).join('')}</td>`).join('')}</tr>`;
    tbody.querySelectorAll('tr').forEach(tr=>tr.querySelectorAll('td').forEach((td,i)=>{const label=document.createElement('span');label.className='compare-side-label';label.textContent=(i?'B':'A')+' · '+sides[i].c.name;td.prepend(label);}));
    root.querySelector('.compare-detail').textContent='Select a component or connection in either node diagram for details.';
  }
  root.addEventListener('change',e=>{
    const t=e.target;
    if(t.dataset.compareCluster!==undefined){const i=Number(t.dataset.compareCluster);sides[i]={c:clusters.find(c=>c.id===t.value),p:0};options(i);paint();}
    if(t.dataset.comparePart!==undefined){sides[Number(t.dataset.comparePart)].p=Number(t.value);paint();}
  });
  root.addEventListener('click',e=>{const b=e.target.closest('[data-component]');if(!b)return;const i=Number(b.dataset.side),s=sides[i],p=s.c.parts[s.p];const values={cpu:p.cpu,gpu:(p.gpu||'Model not verified')+(p.mixed?' · 8 MI100 devices and 1 MI210.':'')+(p.apu?' · CPU and GPU share package memory.':''),ram:p.ram+(p.apu?' · Unified memory; do not add accelerator memory again.':''),host:p.hostLink,local:p.link,network:s.c.network,disk:p.disk};root.querySelector('.compare-detail').textContent=`${i?'Right':'Left'} · ${s.c.name} · ${values[b.dataset.component]??'Not verified'}`;const node=b.closest('.compare-node');if(node){root.querySelectorAll('.compare-inline-detail').forEach(e=>e.remove());const d=document.createElement('p');d.className='compare-inline-detail';d.setAttribute('role','status');d.textContent=values[b.dataset.component]??'Not verified';node.append(d);}});
  options(0);options(1);paint();
  document.querySelector('#compareBtn').onclick=()=>{const current=getCurrent();sides[0]={c:current.cluster,p:current.pi};root.querySelector('#compare-cluster-0').value=current.cluster.id;options(0);paint();root.querySelector('details').open=true;root.scrollIntoView({block:'start'});root.querySelector('#compare-cluster-1').focus({preventScroll:true});};
  return {getState(){return {open:root.querySelector('details').open,sides:sides.map(s=>({id:s.c.id,part:s.p}))};},restore(state){if(!state)return;state.sides?.forEach((v,i)=>{const c=clusters.find(c=>c.id===v.id);if(c&&i<2){sides[i]={c,p:Number.isInteger(v.part)&&v.part>=0&&v.part<c.parts.length?v.part:0};root.querySelector('#compare-cluster-'+i).value=c.id;options(i);}});paint();root.querySelector('details').open=!!state.open;}};

}
