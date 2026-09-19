import {readView,initSharing} from './sharing.js';
import {initDiscovery} from './discovery.js';
import {initComparison} from './compare.js';
import {initWorldMap} from './world-map.js';
import {clusters,catalogDate,matchCluster} from './data.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n==null?'Not verified':n.toLocaleString('en-US');
const esc=s=>String(s??'Not verified').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cluster=clusters.find(c=>c.id==='frontier')||clusters[0],pi=0,view='network',selected=0,zoom=1,detail=null;
const part=()=>cluster.parts[pi], total=()=>cluster.parts.some(p=>p.count==null)?null:cluster.parts.reduce((s,p)=>s+p.count,0);
function list(){ $('#clusterList').innerHTML=clusters.filter(c=>c.rank>=1&&c.rank<=10).sort((a,b)=>a.rank-b.rank).map(c=>'<button class="clusteritem '+(c===cluster?'active':'')+'" data-cluster="'+c.id+'" aria-pressed="'+(c===cluster)+'"><span class="clustericon">▦</span><span><strong>'+c.name+'</strong><small>'+c.country+'</small></span><span class="listrank">'+(c.rank?'#'+c.rank:'')+'</span></button>').join(''); }
function selectCluster(c){if(document.body.dataset.clusterId&&document.body.dataset.clusterId!==c.id){location.assign('/clusters/'+c.id);return;}cluster=c;pi=0;selected=0;view='network';zoom=1;detail=null;render();history.replaceState(null,'',location.pathname+'#'+c.id)}
function render(){worldMap.select(cluster.id);list();$('#location').textContent=cluster.country.toUpperCase()+' / '+(cluster.rank?'TOP500':'RESEARCH / AI');$('#clusterName').textContent=cluster.name;$('#institution').textContent=cluster.site;$('#rank').textContent=cluster.rank?'#'+cluster.rank+' · JUN 2026':'RESEARCH / AI';
 let accelerators=cluster.parts.some(p=>p.gpus==null||(p.count==null&&p.gpus>0))?null:cluster.parts.reduce((s,p)=>s+(p.count||0)*p.gpus,0);
 const eff=cluster.efficiency;
 $('#stats').innerHTML=[['COMPUTE NODES',fmt(total()),cluster.profileScope||'documented inventory'],['ACCELERATORS',fmt(accelerators),'physical accelerators'],['HPL RMAX',cluster.rmax?cluster.rmax.toLocaleString('en-US'):'Not published','PFlop/s · Jun 2026'],['THEORETICAL PEAK',cluster.rpeak?cluster.rpeak.toLocaleString('en-US'):'Not published','PFlop/s · Rpeak'],['MEASURED POWER',cluster.powerKw?cluster.powerKw.toLocaleString('en-US'):'Not published',eff?eff.toFixed(2)+' GFlop/s per watt':'kW · not reported'],['PUBLIC RECORD',cluster.completeness.documented+' / '+cluster.completeness.total,cluster.completeness.percent+'% of tracked fields documented']].map((s,i)=>'<div class="stat"><label>'+s[0]+'</label><strong class="'+(String(s[1]).length>10?'textstat':'')+'">'+s[1]+'</strong><br><small style="margin-left:0">'+s[2]+'</small></div>').join('');
 $('#partition').innerHTML=cluster.parts.map((p,i)=>'<option value="'+i+'">'+p.name+'</option>').join('');$('#partition').value=pi;$('#partitionCount').textContent=fmt(part().count)+' nodes';
 $('#mapNote').textContent=cluster.notes+' Node numbers are illustrative indices, not hostnames or live status. '+(cluster.topology==='Not verified'?'Connectivity is conceptual; physical topology is not verified.':'Cable routes and port assignments are simplified.');
 renderView();inspect();}
function renderView(){$('#visual').onpointerover=null;$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-selected',b.dataset.view===view)});$('#viewhint').textContent=view==='specs'?'Every documented field for this cluster':view==='network'?'Select a group to explore':'Select a component or connection';
 if(view==='specs'){$('#visual').innerHTML=specificationView();$('#viewhint').textContent='Scroll for every documented field';return;}
 if(view==='network'&&cluster.topology==='Not verified')$('#viewhint').textContent='Inspect the fabric or representative node';
 if(view==='network')network();else inside();}
function setView(v){view=v;detail=null;renderView();inspect()}
function spec(icon,label,value,color=''){return '<div class="spec"><span class="specicon '+color+'">'+icon+'</span><div><label>'+label+'</label><strong>'+esc(value)+'</strong></div></div>'}
// Field registry for the full specification sheet.
//
// The sheet renders the curated fields below in a stable order and then appends
// every remaining own key of the record, so a newly added fact can never be
// silently dropped from the interface again. Keys listed in SKIP are structural
// rather than specifications.
// The specification sheets list only fields that have a value, so they read as
// what is known about the machine. Fields that are absent are carried by the
// completeness ledger instead, which keeps the two from disagreeing: both derive
// from the one registry in enrich.js.
const shown=v=>v===true?'Yes':v===false?'No':typeof v==='number'?v.toLocaleString('en-US'):String(v);
function fieldRows(fields,scope){return fields.filter(f=>f.present).map(f=>({label:f.label+(f.unit?' ('+f.unit+')':''),value:f.value,scope}));}
function sheet(title,entries,note=''){if(!entries.length)return '';return '<section class="specblock"><h3>'+esc(title)+'</h3>'+(note?'<p class="specnote">'+esc(note)+'</p>':'')+'<dl aria-label="'+esc(title)+'">'+entries.map(e=>'<div'+(e.scope?' class="platformfact"':'')+'><dt>'+esc(e.label)+'</dt><dd>'+esc(shown(e.value))+'</dd></div>').join('')+'</dl></section>'}
// Sources are rendered as a list of links rather than a run of raw URLs.
function sourceLinks(sources){return '<ul class="sourceList">'+sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a></li>').join('')+'</ul>'}
// The completeness figure is a control: opening it lists every tracked field and
// whether the operator has published it.
function fieldLedger(c){const groups=[{name:'Cluster',fields:c.completeness.clusterFields},...c.parts.map(p=>({name:p.name,fields:c.completeness.nodeFields[p.name]||[]}))];
 const present=c.completeness.documented,total=c.completeness.total;
 const cell=f=>{const state=f.applicable===false?'na':f.present?'present':'absent';const mark=state==='present'?'✓':state==='absent'?'✕':'–';const word=state==='present'?'documented':state==='absent'?'not published':'not applicable to this system';return '<li class="'+state+'"><span class="mark" aria-hidden="true">'+mark+'</span>'+esc(f.label+(f.unit?' ('+f.unit+')':''))+'<span class="sr-only"> — '+word+'</span></li>'};
 return '<details class="ledger"><summary aria-label="'+present+' of '+total+' tracked fields are documented. Open the full list."><span class="ledgerfigure">'+present+' / '+total+'</span> <span class="ledgerlabel">documented fields <em>· view all '+total+'</em></span><span class="chevron" aria-hidden="true">⌄</span></summary><div class="ledgerbody"><p class="specnote">Every field this catalog checks for '+esc(c.name)+'. The sheets above list the fields that have a value; the rest are listed here. A field marked absent is not published in the sources we could verify, which does not mean the hardware is missing. Fields that cannot apply to this system, such as benchmark results for an unranked cluster, are excluded from the total.</p>'+groups.map(g=>{const scored=g.fields.filter(f=>f.applicable!==false);return '<div class="ledgergroup"><h4>'+esc(g.name)+' <small>'+scored.filter(f=>f.present).length+' / '+scored.length+'</small></h4><ul>'+g.fields.map(cell).join('')+'</ul></div>'}).join('')+'</div></details>'}
// Only benchmark figures that were published are shown; anything missing is
// reported by the ledger rather than repeated here as "Not published".
function benchmarkStrip(c){const b=c.benchmark;if(!b)return '';const items=[['HPL Rmax',b.rmax?b.rmax.toLocaleString('en-US')+' PFlop/s':null],['Theoretical peak',b.rpeak?b.rpeak.toLocaleString('en-US')+' PFlop/s':null],['Ranked cores',b.cores?b.cores.toLocaleString('en-US'):null],['Measured power',b.powerKw?b.powerKw.toLocaleString('en-US')+' kW':null],['Energy efficiency',b.efficiencyGFlopsPerWatt?b.efficiencyGFlopsPerWatt.toFixed(2)+' GFlop/s·W':null],['TOP500 rank','#'+b.rank]].filter(([,v])=>v);return items.length?'<div class="benchmark">'+items.map(([label,value])=>'<div><small>'+label+'</small><strong>'+value+'</strong></div>').join('')+'</div>':''}
function specificationView(){const c=cluster,p=part();
 return '<div class="specsheet"><div class="spechead"><div><span class="pill">FULL PUBLIC RECORD</span><h2>'+esc(c.name)+' specifications</h2><p>Every fact this catalog holds for '+esc(c.name)+', including fields that are not part of a diagram. Values the operator has not published are listed under the documented-fields control below rather than shown as empty rows.</p></div></div>'
 +benchmarkStrip(c)
 +sheet('Cluster · '+p.name,[
   {label:'Operator / site',value:c.site},
   {label:'Country',value:c.country},
   {label:'Profile scope',value:c.profileScope||'Documented compute inventory'},
   {label:'Data checked',value:c.checked||catalogDate},
   ...fieldRows(c.completeness.clusterFields)
 ])
 +c.parts.map(pp=>sheet(pp.name+(pp===p?' · selected node type':''),fieldRows(c.completeness.nodeFields[pp.name]||[],pp.platformFacts?'platform':''),pp.platformFacts&&c.platform?'Items marked ▧ come from the documented '+c.platform.name+' platform specification.':pp.platformFacts?'Items marked ▧ come from the documented vendor platform specification.':'')).join('')
 +fieldLedger(c)
 +'<section class="specblock"><h3>Scope, caveats and sources</h3><dl><div><dt>Profile scope</dt><dd>'+esc(c.profileScope||'Documented compute inventory')+'</dd></div><div><dt>Catalog notes</dt><dd>'+esc(c.notes)+'</dd></div><div><dt>Node types</dt><dd>'+esc(c.parts.length)+'</dd></div><div><dt>Sources</dt><dd>'+sourceLinks(c.sources)+'</dd></div></dl></section></div>';}

function inspect(preview=false){const p=part();const isNetwork=view==='network'&&!preview;let content='<h2>'+ (isNetwork?'The connected system':'Node '+String(selected+1).padStart(5,'0'))+'</h2><span class="pill">'+esc(p.name)+'</span><p>'+(isNetwork?(cluster.topology==='Not verified'?'The fabric specification and node profile are shown separately. Switch layout and node-to-node routes are not verified.':'Start with the network. Open a group to see its nodes, then explore the hardware inside.'):'Representative '+esc(p.name)+' configuration. Select a chip or link to learn what it does.')+'</p>';
 if(detail)content+='<div class="componentdetail" role="status"><h3>'+esc(detail.title)+'</h3><p>'+esc(detail.body)+'</p></div>';
 if(isNetwork)content+='<div class="specs">'+spec('⌘','CLUSTER FABRIC',cluster.network,'purple')+spec('▦','ORGANIZATION',cluster.topology)+spec('⊞','SELECTED NODE TYPE',fmt(p.count)+' nodes','green')+'</div>'+(cluster.benchmark&&cluster.benchmark.rmax?'<div class="specs">'+spec('▲','HPL RMAX',cluster.benchmark.rmax.toLocaleString('en-US')+' PFlop/s','green')+spec('◇','THEORETICAL PEAK',cluster.benchmark.rpeak?cluster.benchmark.rpeak.toLocaleString('en-US')+' PFlop/s':'Not published')+spec('⊟','MEASURED POWER',cluster.benchmark.powerKw?cluster.benchmark.powerKw.toLocaleString('en-US')+' kW':'Not published','purple')+'</div>':'')+'<button class="primary" data-action="inside">Explore a node ↗</button><button class="quiet" data-action="specs">Full specification sheet →</button>';
 else content+='<div class="specs">'+spec('▣',p.apu?'CPU INSIDE EACH APU':'PROCESSORS',(p.cpus==null?'Count not verified':p.cpus+' ×')+' '+p.cpu)+spec('▥',p.apu?'INTEGRATED ACCELERATORS':'ACCELERATORS',p.gpus==null?(p.gpu||'Model not verified')+' · count not verified':p.gpus?p.gpus+' × '+p.gpu:'No accelerator','green')+spec('▤','HOST / UNIFIED MEMORY',p.ram)+ (p.gpus!==0?spec('▤','ACCELERATOR MEMORY',p.vram,'green'):'')+spec('▱','LOCAL STORAGE',p.disk,'purple')+'</div>'+(p.scaleOut?'<div class="specs">'+spec('⌘','SCALE-OUT ADAPTERS',p.nic?p.nic+' × '+(p.nicModel||'interface'):'Not published','purple')+spec('↗','PER-ACCELERATOR PATH',p.scaleOut.perAccelerator?'Dedicated adapter per accelerator'+(p.scaleOut.speed?' · '+p.scaleOut.speed:''):'Shared node interface')+(p.aggregateScaleOut?spec('Σ','AGGREGATE SCALE-OUT',p.aggregateScaleOut):'')+'</div>':'')+(preview?'<button class="primary" data-action="inside">Open node diagram ↗</button>':'')+'<button class="quiet" data-action="specs">Full specification sheet →</button>';
 
 content+='<p class="subnote">Source-backed profile · checked '+(cluster.checked||catalogDate)+'</p><a href="'+cluster.sources[cluster.sources.length-1].url+'" target="_blank" rel="noopener noreferrer">Open operator / ranking source ↗</a>';
 $('#inspector').innerHTML=content;}
function info(type){const p=part();const infos={
 cpu:['CPU · central processing unit',(p.cpus??'Unverified count')+' × '+p.cpu+'. Executes general-purpose instructions and coordinates work.'],
 gpu:[p.acceleratorLabel?'AI accelerator':p.apu?'APU · integrated CPU + GPU':'GPU · parallel accelerator',(p.gpu||'Accelerator model not verified')+'. '+(p.apu?'CPU and GPU share the memory on each APU.':p.vram+'. Runs many parallel operations.')+(p.mixed?' This node has 8 MI100 devices and 1 MI210; the last symbol represents MI210.':'')],
 ram:['Memory',p.ram+'. '+(p.apu?'Shared by the CPU and GPU in each package.':'Host memory is separate from GPU memory, except where documented as unified.')],
 disk:['Storage',p.disk+'. A “not verified” field does not imply the node has no storage.'],
 network:['Cluster interconnect',cluster.network+'. '+(p.nic?p.nic+' network interfaces per node. ':'')+'Carries messages between nodes. '+(cluster.topology==='Not verified'?'Exact topology is not verified.':'Topology: '+cluster.topology+'.')],
 host:['CPU ↔ accelerator',p.hostLink+'. '+(p.paired?'Each CPU is paired with its corresponding GPU. ':'')+'This diagram summarizes connectivity; it does not specify every switch, lane, or port.'],
 local:['Accelerator ↔ accelerator',p.link+'. '+(cluster.id==='perlmutter'?'Four NVLink 3 connections per GPU pair, each 25 GB/s per direction. ':'')+'This is within a node, distinct from the network between nodes.'],
 memory:['Processor ↔ memory','Memory connection shown schematically. Capacity: '+p.ram+'. Memory-channel wiring is not modeled.'],
 nic:['CPU ↔ network interface',(cluster.id==='perlmutter'?'PCIe 4.0':'Host-to-NIC bus not verified')+'. Network interfaces attach the node to the cluster fabric. '+(p.scaleOut&&p.scaleOut.perAccelerator?'In this node type each accelerator has its own dedicated adapter ('+(p.nicModel||'model not verified')+(p.scaleOut.speed?', '+p.scaleOut.speed:'')+'), so GPU data can leave the node without passing through the host at all'+(p.gpuDirect?', using GPUDirect RDMA':', whether that path uses GPUDirect RDMA is not verified')+'.':'GPU peer-to-peer links are a separate path from the node network interfaces.')],
 storage:['Node ↔ storage','Logical storage access; local bus, filesystem route and physical wiring are not verified in this profile.'],
 group:['Network group',cluster.id==='perlmutter'?'16 switches connect within a Dragonfly group. Local electrical links join switches; global optical links join groups.':'Logical display bundles keep the map readable. Their sizes do not assert physical rack or switch-group membership.']
 };let d=infos[type]||['Connection','Not verified'];detail={title:d[0],body:d[1]};inspect();}
const svgOpen=(cls,box)=>'<svg class="'+cls+'" viewBox="'+box+'" xmlns="http://www.w3.org/2000/svg" aria-label="Interactive architecture diagram">';
function accessible(label,attr){return ' role="button" tabindex="0" aria-label="'+esc(label)+'" '+attr}
function unknownNetwork(){
 const p=part();$('#visual').onwheel=null;
 $('#visual').innerHTML='<div class="unknown-network"><span class="pill">TOPOLOGY NOT VERIFIED</span><h2>Known hardware. Undocumented layout.</h2><p>No switch groups or node-to-node paths are drawn because their arrangement is not verified.</p><button class="unknown-fabric" data-info="network"><span class="unknown-mark" aria-hidden="true">?</span><span><small>CLUSTER INTERCONNECT · SELECT FOR DETAILS</small><strong>'+esc(cluster.network)+'</strong><em>Switch layout and cable routes not verified</em></span></button><div class="unknown-inventory"><div><small>DOCUMENTED NODE INVENTORY</small><strong>'+(p.count?fmt(p.count)+' nodes':'Node count not verified')+'</strong><p>'+esc(p.name)+'</p></div><button class="unknown-node" data-action="inside"><span aria-hidden="true">▣</span><strong>Representative node</strong><small>Explore CPUs, accelerators and memory ↗</small></button></div><p class="subnote">The dashed boundary marks missing layout information, not a physical network shape.</p></div>';
}
function network(){if(cluster.topology==='Not verified'){unknownNetwork();return;}const p=part();const actual=cluster.id==='perlmutter',groupSize=p.groupSize||Math.max(1,Math.ceil((p.count||48)/12)),groups=p.count?Math.ceil(p.count/groupSize):null;
 let positions=cluster.topology.includes('mesh')?[[150,125],[350,125],[550,125],[150,300],[350,300],[550,300]]:[[115,150],[350,100],[585,150],[115,340],[350,390],[585,340]];
 const shown=Math.min(6,groups||6);positions=positions.slice(0,shown);
 let s=svgOpen('networksvg','0 0 700 490')+'<g id="zoomLayer" transform="translate(350 245) scale('+zoom+') translate(-350 -245)">';
 if(cluster.topology.includes('mesh')){[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5]].forEach(([a,b])=>{s+='<path class="svgLink" stroke="#9583bc" d="M'+positions[a].join(' ')+' L'+positions[b].join(' ')+'"'+accessible('Tofu network connection','data-info="network"')+'/>'})}
 else{for(let i=0;i<shown;i++)for(let j=i+1;j<shown;j++){s+='<path class="svgLink" stroke="#a397bd" stroke-opacity="'+(j-i===3?.6:.38)+'" d="M'+positions[i].join(' ')+' Q350 245 '+positions[j].join(' ')+'"'+accessible('Inter-group connection','data-info="network"')+'/>'}}
 s+='<rect x="255" y="224" width="190" height="39" rx="7" fill="#f7fafb" stroke="#d5e1e6"/><text x="350" y="240" text-anchor="middle" font-size="11" fill="#547481">'+(cluster.topology==='Not verified'?'CONCEPTUAL FABRIC':cluster.topology.toUpperCase())+'</text><text x="350" y="254" text-anchor="middle" font-size="9" fill="#788c94">SELECT A CONNECTION TO INSPECT</text>';
 positions.forEach(([x,y],i)=>{let idx=groups?Math.floor(i*groups/shown):i;let start=idx*groupSize;let count=p.count?Math.min(groupSize,p.count-start):null;
 s+='<g class="group" '+accessible('Open '+(actual?'group ':'bundle ')+(idx+1),'data-group="'+start+'"')+'><rect class="outer" x="'+(x-72)+'" y="'+(y-45)+'" width="144" height="89" rx="8" fill="white" stroke="#c8d9df"/><text x="'+(x-58)+'" y="'+(y-25)+'" fill="#5e7781" font-size="10">'+(actual?'GROUP ':groups?'BUNDLE ':'SAMPLE ')+String(idx+1).padStart(2,'0')+'</text><text x="'+(x+57)+'" y="'+(y-25)+'" text-anchor="end" fill="#8ba0a8" font-size="10">↗</text>';
 for(let n=0;n<Math.min(8,count||1);n++){let xx=x-56+(n%4)*29,yy=y-13+Math.floor(n/4)*18;s+='<rect class="groupnode" x="'+xx+'" y="'+yy+'" width="24" height="12" rx="2" fill="#d8ece7" stroke="#78b6a5" data-node="'+(start+Math.min(n,(count||1)-1))+'"><title>Node '+(start+Math.min(n,(count||1)-1)+1)+' · '+esc(p.name)+'</title></rect>'}
 s+='<rect x="'+(x-45)+'" y="'+(y+21)+'" width="90" height="4" rx="2" fill="#b2a2cc" data-info="group"/>';s+='<text x="'+x+'" y="'+(y+35)+'" text-anchor="middle" font-size="9" fill="#768c94">'+(count?(actual?'16 switches · ':'')+fmt(count)+' nodes':'count not verified')+'</text></g>'});
 s+='</g></svg>';
 $('#visual').innerHTML='<div class="mapcaption">'+(groups?shown+' OF '+groups+' '+(actual?'GROUPS':'DISPLAY BUNDLES')+' SHOWN':'REPRESENTATIVE VIEW · COUNT UNVERIFIED')+'</div>'+s+'<div class="zoomtools"><button aria-label="Zoom out" data-zoom="-0.2">−</button><span id="zoomLabel">'+Math.round(zoom*100)+'%</span><button aria-label="Zoom in" data-zoom="0.2">+</button></div>';
 $('#visual').onpointerover=e=>{const n=e.target.closest('[data-node]');if(n){selected=Number(n.dataset.node);inspect(true)}};
 $('#visual').onwheel=e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(e.deltaY<0?.15:-.15)}};
}
function setZoom(d){zoom=Math.min(2.6,Math.max(.6,zoom+d));const z=$('#zoomLayer');if(z)z.setAttribute('transform','translate(350 245) scale('+zoom+') translate(-350 -245)');if($('#zoomLabel'))$('#zoomLabel').textContent=Math.round(zoom*100)+'%'}
function inside(){ $('#visual').onwheel=null;const p=part();if(p.gpus==null||p.compact){partialNode(p);return;}let s=svgOpen('nodesvg','0 0 620 390');const gpus=p.gpus,cpus=p.cpus||1,apu=p.apu,paired=p.paired;
 // Per-accelerator scale-out is drawn explicitly when a source documents a
 // dedicated adapter per accelerator. Collapsing it into one NIC box was hiding
 // the defining property of systems such as Eagle and the DGX/HGX platforms.
 const perAccelerator=!!(p.scaleOut&&p.scaleOut.perAccelerator&&gpus>1);
 const nicY=272,nicH=30,busY=314;
 function wire(x1,y1,x2,y2,color,type,dash=''){return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" class="svgLink" stroke="'+color+'" '+(dash?'stroke-dasharray="5 5"':'')+accessible(type+' connection','data-info="'+type+'"')+'/>'}
 function chip(x,y,w,h,label,sub,type,color){const single=h<40;return '<g class="svgClick" '+accessible(label+' '+sub,'data-info="'+type+'"')+'><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6" fill="'+color+'" stroke="'+(type==='cpu'?'#82a6d9':'#75b5a5')+'"/><text x="'+(x+w/2)+'" y="'+(y+(single?h/2+4:21))+'" text-anchor="middle" font-size="'+(single?9:12)+'" fill="#244858">'+label+'</text>'+(single?'':'<text x="'+(x+w/2)+'" y="'+(y+36)+'" text-anchor="middle" font-size="9" fill="#587780">'+esc(sub)+'</text>')+'</g>'}
 const cpuX=Array.from({length:cpus},(_,i)=>310+(i-(cpus-1)/2)*125), gpuX=Array.from({length:gpus},(_,i)=>50+i*(520/Math.max(gpus-1,1)));
 s+=wire(310,67,310,100,'#9bb4c9','memory');
 if(!apu)cpuX.forEach(x=>s+=wire(310,100,x,100,'#9bb4c9','memory'));
 if(gpus&&!apu)gpuX.forEach((x,i)=>{let cx=paired?cpuX[i]:cpuX[Math.min(cpus-1,Math.floor(i*cpus/gpus))];s+=wire(cx,142,x,195,p.hostLink==='Not verified'?'#a5b0b6':'#83a5c5','host',p.hostLink==='Not verified')});
 if(gpus>1&&!p.noGpuLinks){if(String(p.link).includes('all GPU pairs')||apu){for(let i=0;i<gpus;i++)for(let j=i+1;j<gpus;j++)s+='<path d="M'+gpuX[i]+' 243 Q'+((gpuX[i]+gpuX[j])/2)+' '+(256+(j-i)*8)+' '+gpuX[j]+' 243" class="svgLink" stroke="#44a38e" '+accessible('GPU pair connection','data-info="local"')+'/>'}else{s+=wire(gpuX[0],256,gpuX[gpus-1],256,'#44a38e','local',p.link==='Not verified');gpuX.forEach(x=>s+=wire(x,240,x,256,'#44a38e','local',p.link==='Not verified'))}}
 s+=chip(190,20,240,48,apu?'UNIFIED MEMORY':'HOST MEMORY',p.ram,'ram','#eef3fb');
 s+=chip(480,20,118,48,'STORAGE',p.disk==='Not verified'?'Not verified':'Select for detail','disk','#f2f0f7');
 if(!apu)cpuX.forEach((x,i)=>{s+=chip(x-53,100,106,48,'▣ CPU '+(i+1),p.cpus==null?'Count unknown':p.paired?'Grace':p.cpu.includes('EPYC')?'AMD EPYC':p.cpu.includes('Xeon')?'Intel Xeon':p.cpu.includes('A64FX')?'A64FX':'LX2','cpu','#eaf0fa')});
 if(apu){s+='<text x="310" y="130" text-anchor="middle" font-size="11" fill="#64818a">CPU + GPU + shared HBM in each package</text>';gpuX.forEach((x,i)=>{s+=wire(310,68,x,185,'#9bb4c9','memory');s+=chip(x-48,185,96,60,'▣ APU '+(i+1),'MI300A','gpu','#e3f2ed')})}
 else if(gpus)gpuX.forEach((x,i)=>{let w=gpus>6?58:80;let label=p.mixed?(i===8?'MI210':'MI100'):p.gpu.includes('A100')?'A100':p.gpu.includes('Hopper')?'Hopper':p.gpu.includes('H100')?'H100':p.gpu.includes('MI250')?'MI250X':'GPU';s+=chip(x-w/2,195,w,48,'GPU '+(i+1),label,'gpu','#e3f2ed')});
 else s+='<text x="310" y="224" text-anchor="middle" font-size="12" fill="#7b9099">CPU-only node · no accelerator</text>';
 if(perAccelerator&&gpus){
  // One dedicated adapter per accelerator, collected onto the scale-out fabric.
  const nw=gpus>6?54:66;
  gpuX.forEach(x=>s+=wire(x,243,x,nicY,'#9680b8','nic'));
  gpuX.forEach((x,i)=>s+=chip(x-nw/2,nicY,nw,nicH,'NIC '+(i+1),'','nic',i%2?'#eee9f5':'#e8e4f2'));
  gpuX.forEach(x=>s+=wire(x,nicY+nicH,x,busY,'#9680b8','network'));
  s+=wire(gpuX[0],busY,gpuX[gpus-1],busY,'#9680b8','network');
  s+='<text x="310" y="'+(busY+16)+'" text-anchor="middle" font-size="9" fill="#68829a">'+esc(p.scaleOut.speed||'dedicated per-accelerator scale-out')+'</text>';
  s+=wire(310,busY,310,332,'#9680b8','network');
  s+=chip(180,332,260,44,'⌘ CLUSTER FABRIC',p.aggregateScaleOut||cluster.network,'network','#eee9f5');
 }else{
  s+='<path d="M'+(apu?50:cpuX[0])+' '+(apu?245:147)+' L'+(apu?50:cpuX[0])+' 256 L180 256 L180 '+nicY+' L205 '+nicY+'" class="svgLink" stroke="#9680b8" '+(cluster.id==='perlmutter'?'':'stroke-dasharray="5 5"')+accessible('Host to network interface','data-info="nic"')+'/>';
  s+=chip(205,nicY,210,44,'⌘ NETWORK',p.nic?p.nic+' interfaces':'Interface count not verified','network','#eee9f5');
 }
 s+=wire(550,63,550,85,'#a8b7bd','storage',true);s+=wire(550,85,310,85,'#a8b7bd','storage',true);
 if(gpus&&!apu)s+='<text x="310" y="175" text-anchor="middle" font-size="10" fill="#68829a">'+esc(p.hostLink)+'</text>';
 s+='</svg>';
 const scaleNote=perAccelerator?' Each of the '+gpus+' accelerators has its own '+esc(p.scaleOut.model||'network adapter')+(p.scaleOut.speed?' at '+esc(p.scaleOut.speed):'')+', so the node reaches the fabric through '+gpus+' independent paths rather than one shared interface.':'';
 $('#visual').innerHTML='<div class="insidewrap"><div class="nodecontrols"><button data-action="prev" aria-label="Previous node" '+(!p.count||selected===0?'disabled':'')+'>←</button><span>NODE '+String(selected+1).padStart(5,'0')+' / '+(p.count?fmt(p.count):'REPRESENTATIVE')+'</span><button data-action="next" aria-label="Next node" '+(!p.count||selected>=p.count-1?'disabled':'')+'>→</button></div>'+s+'<div class="linklegend">'+(gpus?'<button data-info="host">CPU–GPU · '+esc(p.hostLink)+'</button>':'')+(gpus>1?'<button data-info="local">GPU–GPU · '+esc(p.link)+'</button>':'')+(perAccelerator?'<button data-info="nic">GPU–NIC ×'+gpus+' · '+esc(p.scaleOut.speed||'dedicated')+'</button>':'')+'<button data-info="network">Node–network ↗</button></div>'+(scaleNote?'<p class="scalenote">'+scaleNote+'</p>':'')+'<p class="subnote" style="color:#6d828b">Schematic connectivity. Dashed paths are unverified; bus lines summarize connections, not exact wiring.</p></div>';
}
function sources(){ $('#sourceBody').innerHTML='<p>Public documentation snapshot checked '+(cluster.checked||catalogDate)+'. Rankings use the June 2026 TOP500 list. Hardware inventory can differ from the subset used in an HPL benchmark.</p><h3>'+cluster.name+'</h3>'+cluster.sources.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+s.url+'">'+esc(s.title)+' ↗</a>').join('')+'<p>'+esc(cluster.notes)+'</p><h3>How to interpret the catalog</h3><p>Node identifiers are illustrative indices within a node type, not physical hostnames. Nodes of one type share a representative hardware profile. Display bundles are not rack assignments. The application has no live telemetry or scheduler connection.</p><p>Unknown fields are kept explicit. “Not verified” means this catalog has not confirmed the detail; it does not mean the hardware is absent. Clickable buses summarize link families rather than reproducing every lane or cable.</p><p>Unknown clusters are not silently mapped to an unrelated machine. Search handles names, natural-language phrases and small spelling mistakes locally.</p><h3>Extend the catalog</h3><p>Profiles are stored in the site’s data.js asset, separately from diagram rendering. Add documented node types, counts, links, and source URLs to extend coverage.</p>';$('#sourceDialog').showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cluster],[data-filter],[data-view],[data-info],[data-group],[data-node],[data-action],[data-zoom]');if(!b)return;
 if(b.dataset.cluster){selectCluster(clusters.find(c=>c.id===b.dataset.cluster));return}
 if(b.dataset.filter){list();return}
 if(b.dataset.view){setView(b.dataset.view);return}
 if(b.dataset.info){info(b.dataset.info);return}
 if(b.dataset.zoom){setZoom(Number(b.dataset.zoom));return}
 if(b.dataset.node!==undefined){selected=Number(b.dataset.node);setView('inside');return}
 if(b.dataset.group!==undefined){selected=Math.min(Number(b.dataset.group),(part().count||1)-1);setView('inside');return}
 let action=b.dataset.action;if(action==='inside'||action==='specs'){setView(action);return}if(action==='prev'||action==='next'){selected=Math.max(0,Math.min((part().count||1)-1,selected+(action==='next'?1:-1)));detail=null;inside();inspect()}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
$('#partition').onchange=e=>{pi=Number(e.target.value);selected=0;zoom=1;detail=null;$('#partitionCount').textContent=fmt(part().count)+' nodes';renderView();inspect()};
$('#reset').onclick=()=>{selected=0;zoom=1;setView('network')};
$('#searchForm').onsubmit=e=>{e.preventDefault();let query=$('#search').value.trim();if(!query){$('#searchStatus').textContent='Enter a cluster name, such as Perlmutter.';return}let c=matchCluster(query);$('#searchStatus').className=c?'':'noresult';$('#searchStatus').textContent=c?'Showing '+c.name+'.':'We do not have information for “'+query+'” yet. Coverage can be added in a future catalog update.';if(c){selectCluster(c)}};
$('#sourcesBtn').onclick=sources;$('#sourceLink').onclick=sources;$('#closeDialog').onclick=()=>$('#sourceDialog').close();$('#sourceDialog').onclick=e=>{if(e.target===$('#sourceDialog')){let r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
const worldMap=initWorldMap(clusters,c=>{selectCluster(c);const heading=document.querySelector('.clusterhead');heading.scrollIntoView({block:'start'});heading.focus({preventScroll:true})});
const savedView=readView(location.hash||'#'+(document.body.dataset.clusterId||''),clusters);
if(savedView){cluster=savedView.cluster;pi=savedView.pi;selected=savedView.selected;view=savedView.view;zoom=savedView.zoom;}render();
const comparison=initComparison(clusters,()=>({cluster,pi}));
if(savedView)comparison.restore(savedView.comparison);
initSharing(()=>({cluster,pi,selected,view,zoom,comparison:comparison.getState()}),clusters);
window.addEventListener('hashchange',()=>{const saved=readView(location.hash||'#'+(document.body.dataset.clusterId||''),clusters);if(!saved)return;cluster=saved.cluster;pi=saved.pi;selected=saved.selected;view=saved.view;zoom=saved.zoom;detail=null;render();comparison.restore(saved.comparison);});
initDiscovery(clusters,(c,index)=>{if(document.body.dataset.clusterId&&document.body.dataset.clusterId!==c.id){location.assign('/clusters/'+c.id+'#'+c.id+'?part='+index+'&view=inside');return;}selectCluster(c);pi=index;view='inside';render();document.querySelector('.clusterhead').scrollIntoView({block:'start'});document.querySelector('.clusterhead').focus({preventScroll:true});},(c,index)=>{if(document.body.dataset.clusterId&&document.body.dataset.clusterId!==c.id){location.assign('/clusters/'+c.id+'#'+c.id+'?part='+index+'&compare=1&c0='+c.id+'&p0='+index+'&c1=deltaai&p1=0');return;}selectCluster(c);pi=index;render();document.querySelector('#compareBtn').click();});


function partialNode(p){
 const card=(type,icon,label,value)=>'<button data-info="'+type+'"><span>'+icon+' '+label+'</span><strong>'+esc(value)+'</strong></button>';
 $('#visual').innerHTML='<div class="partial-node"><span class="pill">'+(p.compact?'REPRESENTATIVE COMPUTE BUILDING BLOCK':'PARTIAL PUBLIC NODE PROFILE')+'</span><h2>'+esc(p.name)+'</h2><p>Known components are shown without assuming an undocumented device count or wiring layout.</p><div class="partial-components">'+card('cpu','▣','CPU',(p.cpus??'Count not verified')+' · '+p.cpu)+card('gpu','▥','Accelerator',(p.gpus??'Count not verified')+' · '+(p.gpu||'Model not verified'))+card('ram','▤','Host memory',p.ram)+card('disk','▱','Storage',p.disk)+'</div><div class="partial-links">'+card('host','↕','Host ↔ accelerator',p.hostLink)+card('local','↔','Accelerator fabric',p.onNodeFabric||p.link)+card('nic','⇥','Scale-out interfaces',p.nic?(p.nic+' × '+(p.nicModel||'interface')+(p.nicSpeed?' · '+p.nicSpeed:'')):'Interface count not published')+card('network','⌘','Cluster fabric',cluster.network)+'</div><button class="quiet" data-action="specs">Full specification sheet →</button></div>';
}
document.querySelector('.sidebar .eyebrow span').textContent=clusters.length;
document.querySelector('#search').setAttribute('list','clusterNames');
const catalogOptions=document.createElement('datalist');catalogOptions.id='clusterNames';catalogOptions.innerHTML=clusters.map(c=>'<option value="'+esc(c.name)+'">'+esc(c.site)+'</option>').join('');document.querySelector('#searchForm').append(catalogOptions);
