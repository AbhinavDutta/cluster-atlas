import {readView,initSharing} from './sharing.js';
import {initDiscovery} from './discovery.js';
import {initComparison} from './compare.js';
import {initWorldMap} from './world-map.js';
import {clusters,catalogDate,matchCluster} from './data.js';
// "Not verified" is the internal sentinel for a fact this catalog has not
// recorded. At the interface it is rendered as "Not publicly available", which is
// the reader-facing statement: the field is not present in the sources consulted.
// These helpers, the catalog ranges and the one drawing for a missing fact all
// live in viz.js so the three views cannot disagree about any of them.
import {esc,fmt,isUnknown,UNKNOWN,capacityGB,gpuMemoryGB,bandwidthGbps,linkWeight,rateLabel,
 peerBar,unknownSlot,totalNodes} from './viz.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let cluster=clusters.find(c=>c.id==='frontier')||clusters[0],pi=0,view='network',selected=0,zoom=1,detail=null;
const nodeWord=n=>n==null?'node count not published':fmt(n)+' node'+(n===1?'':'s');
const part=()=>cluster.parts[pi], total=()=>cluster.parts.some(p=>p.count==null)?null:cluster.parts.reduce((s,p)=>s+p.count,0);
function list(){ $('#clusterList').innerHTML=clusters.filter(c=>c.rank>=1&&c.rank<=10).sort((a,b)=>a.rank-b.rank).map(c=>'<button class="clusteritem '+(c===cluster?'active':'')+'" data-cluster="'+c.id+'" aria-pressed="'+(c===cluster)+'"><span class="clustericon">▦</span><span><strong>'+c.name+'</strong><small>'+c.country+'</small></span><span class="listrank">'+(c.rank?'#'+c.rank:'')+'</span></button>').join(''); }
function selectCluster(c){if(document.body.dataset.clusterId&&document.body.dataset.clusterId!==c.id){location.assign('/clusters/'+c.id);return;}cluster=c;pi=0;selected=0;view='network';zoom=1;detail=null;render();history.replaceState(null,'',location.pathname+'#'+c.id)}
function render(){worldMap.select(cluster.id);list();$('#location').textContent=cluster.country.toUpperCase()+' / '+(cluster.rank?'TOP500':'RESEARCH / AI');$('#clusterName').textContent=cluster.name;$('#institution').textContent=cluster.site;$('#rank').textContent=cluster.rank?'#'+cluster.rank+' · JUN 2026':'RESEARCH / AI';
 let accelerators=cluster.parts.some(p=>p.gpus==null||(p.count==null&&p.gpus>0))?null:cluster.parts.reduce((s,p)=>s+(p.count||0)*p.gpus,0);
 const eff=cluster.efficiency;
 $('#stats').innerHTML=[['COMPUTE NODES',fmt(total()),cluster.profileScope||'documented inventory'],['ACCELERATORS',fmt(accelerators),'physical accelerators'],['HPL RMAX',cluster.rmax?cluster.rmax.toLocaleString('en-US'):'Not published','PFlop/s · Jun 2026'],['THEORETICAL PEAK',cluster.rpeak?cluster.rpeak.toLocaleString('en-US'):'Not published','PFlop/s · Rpeak'],['MEASURED POWER',cluster.powerKw?cluster.powerKw.toLocaleString('en-US'):'Not published',eff?eff.toFixed(2)+' GFlop/s per watt':'kW · not reported'],['PUBLIC RECORD',cluster.completeness.documented+' / '+cluster.completeness.total,cluster.completeness.percent+'% of tracked fields documented']].map((s,i)=>'<div class="stat"><label>'+s[0]+'</label><strong class="'+(String(s[1]).length>10?'textstat':'')+'">'+s[1]+'</strong><br><small style="margin-left:0">'+s[2]+'</small></div>').join('');
 $('#partition').innerHTML=cluster.parts.map((p,i)=>'<option value="'+i+'">'+p.name+'</option>').join('');$('#partition').value=pi;$('#partitionCount').textContent=nodeWord(part().count);
 $('#mapNote').textContent=cluster.notes+' Node numbers are illustrative indices, not hostnames or live status. '+(cluster.topology==='Not verified'?'Connectivity is conceptual; physical topology is not publicly available.':'Cable routes and port assignments are simplified.');
 renderView();inspect();}
function renderView(){$('#visual').onpointerover=null;$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-selected',b.dataset.view===view)});$('#viewhint').textContent=view==='specs'?'Every documented field for this cluster':view==='network'?'Select a group to explore':'Select a component or connection';
 if(view==='specs'){$('#visual').innerHTML=specificationView();$('#viewhint').textContent='Scroll for every documented field';return;}
 if(view==='network')$('#viewhint').textContent='Select a node type, group or switch to inspect';
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
// Sources are rendered as a list of links rather than a run of raw URLs.
// The completeness figure is a control: opening it lists every tracked field and
// whether the operator has published it.
// Only benchmark figures that were published are shown; anything missing is
// reported by the ledger rather than repeated here as "Not published".
// ------------------------------------------------------- specifications
//
// Grouped by what a reader is looking for — compute, memory, interconnect,
// storage, performance, provenance — rather than by which record a fact came
// from. The old sheet split facts by origin, so a cluster's core count and a
// node's accelerator count sat in different blocks with identical typography,
// and the whole tab read as one 40-row run of label/value pairs.
//
// Numeric fields carry a bar placing them in the catalog's distribution, which
// is the difference between "512 GB" and "512 GB, more than most".
// A value the catalog read from its own CPU or model designation is still a
// published fact, but it is a different kind of claim from one the operator
// stated in its own row, so the sheet says which is which.
const DERIVED_KEY={'Cores per socket':'coresPerSocket','Physical CPU cores':'physicalCores','Accelerator memory':'vram','System / node model':'systemModel'};
const SPEC_GROUP_ORDER=['Compute','Memory','Interconnect','Storage','Performance & power','Provenance'];
const shown=v=>v===true?'Yes':v===false?'No':typeof v==='number'?v.toLocaleString('en-US'):String(v);
// The comparable number behind a field, where there is one. Capacities arrive as
// prose ("512 GB DDR4") and are parsed conservatively; anything ambiguous yields
// null and the row simply carries no bar.
function metricValue(f,p){
 if(!f.metric)return null;
 if(f.metric==='ramGB')return capacityGB(f.value);
 if(f.metric==='vramGB')return p?(gpuMemoryGB(p)??capacityGB(f.value)):capacityGB(f.value);
 return typeof f.value==='number'?f.value:null;
}
const specRow=(label,value,o={})=>
 '<div class="specrow'+(o.platform?' platformfact':'')+(o.derived?' derivedfact':'')+'"><span class="k">'+esc(label)+(o.scope?' · '+esc(o.scope):'')+'</span>'
 +'<span class="v">'+(o.raw?value:esc(value))+'</span>'+(o.metric&&o.num?peerBar(o.metric,o.num,label.toLowerCase()):'')+'</div>';
// Sources are rendered as a list of links rather than a run of raw URLs.
function sourceLinks(sources){return '<ul class="sourceList">'+sources.map(s=>'<li><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+' ↗</a></li>').join('')+'</ul>'}
// The completeness figure leads with a meter instead of a 34-item tick list. The
// list is still there, one disclosure away, because the gaps are the point.
function fieldLedger(c){
 const groups=[{name:'Cluster',fields:c.completeness.clusterFields},...c.parts.map(p=>({name:p.name,fields:c.completeness.nodeFields[p.name]||[]}))];
 const present=c.completeness.documented,total=c.completeness.total,gap=total-present;
 const cell=f=>{const state=f.applicable===false?'na':f.present?'present':'absent';const mark=state==='present'?'✓':state==='absent'?'✕':'–';const word=state==='present'?'documented':state==='absent'?'not publicly available':'not applicable to this system';return '<li class="'+state+'"><span class="mark" aria-hidden="true">'+mark+'</span>'+esc(f.label+(f.unit?' ('+f.unit+')':''))+'<span class="sr-only"> — '+word+'</span></li>'};
 return '<details class="coverage"><summary aria-label="'+present+' of '+total+' tracked fields are documented. Open the full list.">'
  +'<span class="coveragefig">'+present+' / '+total+'</span>'
  +'<span class="coveragemeter" aria-hidden="true"><i style="width:'+Math.round(present/total*100)+'%"></i></span>'
  +'<span class="coveragelabel">documented fields · '+gap+' not published</span><span class="chevron" aria-hidden="true">⌄</span></summary>'
  +'<div class="coveragebody"><p class="specnote">Every field this catalog checks for '+esc(c.name)+'. A field marked absent is not publicly available in the sources we could verify, which does not mean the hardware is missing. Fields that cannot apply to this system, such as benchmark results for an unranked cluster, are excluded from the total.</p>'
  +groups.map(g=>{const scored=g.fields.filter(f=>f.applicable!==false);return '<div class="ledgergroup"><h4>'+esc(g.name)+' <small>'+scored.filter(f=>f.present).length+' / '+scored.length+'</small></h4><ul>'+g.fields.map(cell).join('')+'</ul></div>'}).join('')
  +'</div></details>';
}
function specificationView(){
 const c=cluster,multi=c.parts.length>1,rows={};
 const push=(group,html)=>{(rows[group]=rows[group]||[]).push(html)};
 push('Provenance',specRow('Operator / site',c.site));
 push('Provenance',specRow('Country',c.country));
 push('Provenance',specRow('Profile scope',c.profileScope||'Documented compute inventory'));
 push('Provenance',specRow('Data checked',c.checked||catalogDate));
 if(c.rmax!=null)push('Performance & power',specRow('HPL Rmax',c.rmax.toLocaleString('en-US')+' PFlop/s',{metric:'rmax',num:c.rmax}));
 if(c.rank!=null)push('Performance & power',specRow('TOP500 rank','#'+c.rank+' · June 2026'));
 push('Interconnect',specRow('Cluster interconnect',c.network));
 // Only fields with a value appear here; the rest are carried by the meter
 // below, which keeps the two from ever disagreeing.
 for(const f of c.completeness.clusterFields)if(f.present)
  push(f.group,specRow(f.label,shown(f.value)+(f.unit?' '+f.unit:''),{metric:f.metric,num:metricValue(f,null)}));
 for(const p of c.parts)for(const f of (c.completeness.nodeFields[p.name]||[]))if(f.present)
  push(f.group,specRow(f.label,shown(f.value)+(f.unit?' '+f.unit:''),{metric:f.metric,num:metricValue(f,p),scope:multi?p.name:'',platform:!!p.platformFacts,derived:(p.derivedFields||[]).includes(DERIVED_KEY[f.label])}));
 const platformNote=(c.parts.some(p=>p.platformFacts)?'<p class="specscope">Items marked ▧ come from the documented '+esc(c.platform?c.platform.name:'vendor')+' platform specification rather than an operator source.</p>':'')
  +(c.parts.some(p=>p.derivedFields&&p.derivedFields.length)?'<p class="specscope">Items marked ↩ were read from this record\'s own CPU or model designation — for example a core count stated inside the CPU name — rather than from a separate statement by the operator.</p>':'');
 return '<div class="specsheet"><div class="spechead"><div><span class="pill">FULL PUBLIC RECORD</span><h2>'+esc(c.name)+' specifications</h2>'
  +'<p>Every documented fact, grouped by what it tells you. Bars place a value against the rest of the catalog. Fields the operator has not published are listed in the coverage meter below.</p></div></div>'
  +'<div class="specgroups">'
  +SPEC_GROUP_ORDER.filter(g=>rows[g]&&rows[g].length).map(g=>
    '<section class="specgroup"><h3>'+esc(g)+'<span class="gcount">'+rows[g].length+' documented</span></h3><div class="specrows">'+rows[g].join('')+'</div>'+(g==='Provenance'?platformNote:'')+'</section>').join('')
  +'</div>'
  +fieldLedger(c)
  +'<section class="specgroup"><h3>Scope and sources</h3><div class="specrows">'
  +specRow('Node types',String(c.parts.length))
  +specRow('Catalog notes',c.notes)
  +specRow('Sources',sourceLinks(c.sources),{raw:true})
  +'</div></section></div>';
}

function inspect(preview=false){const p=part();const isNetwork=view==='network'&&!preview;let content='<h2>'+ (isNetwork?'The connected system':'Node '+String(selected+1).padStart(5,'0'))+'</h2><span class="pill">'+esc(p.name)+'</span><p>'+(isNetwork?(cluster.topology==='Not verified'?'The fabric specification and node profile are shown separately. Switch layout and node-to-node routes are not publicly available.':'Start with the network. Open a group to see its nodes, then explore the hardware inside.'):'Representative '+esc(p.name)+' configuration. Select a chip or link to learn what it does.')+'</p>';
 if(detail)content+='<div class="componentdetail" role="status"><h3>'+esc(detail.title)+'</h3><p>'+esc(detail.body)+'</p></div>';
 if(isNetwork)content+='<div class="specs">'+spec('⌘','CLUSTER FABRIC',cluster.network,'purple')+spec('▦','ORGANIZATION',cluster.topology)+spec('⊞','SELECTED NODE TYPE',nodeWord(p.count),'green')+'</div>'+(cluster.benchmark&&cluster.benchmark.rmax?'<div class="specs">'+spec('▲','HPL RMAX',cluster.benchmark.rmax.toLocaleString('en-US')+' PFlop/s','green')+spec('◇','THEORETICAL PEAK',cluster.benchmark.rpeak?cluster.benchmark.rpeak.toLocaleString('en-US')+' PFlop/s':'Not published')+spec('⊟','MEASURED POWER',cluster.benchmark.powerKw?cluster.benchmark.powerKw.toLocaleString('en-US')+' kW':'Not published','purple')+'</div>':'')+'<button class="primary" data-action="inside">Explore a node ↗</button><button class="quiet" data-action="specs">Full specification sheet →</button>';
 else content+='<div class="specs">'+spec('▣',p.apu?'CPU INSIDE EACH APU':'PROCESSORS',p.cpus==null?p.cpu+' · socket count not published':p.cpus+' × '+p.cpu)+spec('▥',p.apu?'INTEGRATED ACCELERATORS':'ACCELERATORS',p.gpus==null?(p.gpu||'Model not published')+' · count not published':p.gpus?p.gpus+' × '+p.gpu:'No accelerator','green')+spec('▤','HOST / UNIFIED MEMORY',p.ram)+ (p.gpus!==0?spec('▤','ACCELERATOR MEMORY',p.vram,'green'):'')+spec('▱','LOCAL STORAGE',p.disk,'purple')+'</div>'+(p.scaleOut?'<div class="specs">'+spec('⌘','SCALE-OUT ADAPTERS',p.nic?p.nic+' × '+(p.nicModel||'interface'):'Not published','purple')+spec('↗','PER-ACCELERATOR PATH',p.scaleOut.perAccelerator?'Dedicated adapter per accelerator'+(p.scaleOut.speed?' · '+p.scaleOut.speed:''):'Shared node interface')+(p.aggregateScaleOut?spec('Σ','AGGREGATE SCALE-OUT',p.aggregateScaleOut):'')+'</div>':'')+(preview?'<button class="primary" data-action="inside">Open node diagram ↗</button>':'')+'<button class="quiet" data-action="specs">Full specification sheet →</button>';
 
 content+='<p class="subnote">Source-backed profile · checked '+(cluster.checked||catalogDate)+'</p><a href="'+cluster.sources[cluster.sources.length-1].url+'" target="_blank" rel="noopener noreferrer">Open operator / ranking source ↗</a>';
 $('#inspector').innerHTML=content;}
function info(type){const p=part();const infos={
 cpu:['CPU · central processing unit',(p.cpus??'Count not published')+' × '+p.cpu+'. Executes general-purpose instructions and coordinates work.'],
 gpu:[p.acceleratorLabel?'AI accelerator':p.apu?'APU · integrated CPU + GPU':'GPU · parallel accelerator',(p.gpu||'Accelerator model not verified')+'. '+(p.apu?'CPU and GPU share the memory on each APU.':p.vram+'. Runs many parallel operations.')+(p.mixed?' This node has 8 MI100 devices and 1 MI210; the last symbol represents MI210.':'')],
 ram:['Memory',p.ram+'. '+(p.apu?'Shared by the CPU and GPU in each package.':'Host memory is separate from GPU memory, except where documented as unified.')],
 disk:['Storage',p.disk+'. A “not published” field does not imply the node has no storage.'],
 network:['Cluster interconnect',cluster.network+'. '+(p.nic?p.nic+' network interfaces per node. ':'')+'Carries messages between nodes. '+(cluster.topology==='Not verified'?'Exact topology is not publicly available.':'Topology: '+cluster.topology+'.')],
 host:['CPU ↔ accelerator',p.hostLink+'. '+(p.paired?'Each CPU is paired with its corresponding GPU. ':'')+'This diagram summarizes connectivity; it does not specify every switch, lane, or port.'],
 local:['Accelerator ↔ accelerator',p.link+'. '+(cluster.id==='perlmutter'?'Four NVLink 3 connections per GPU pair, each 25 GB/s per direction. ':'')+'This is within a node, distinct from the network between nodes.'],
 memory:['Processor ↔ memory','Memory connection shown schematically. Capacity: '+p.ram+'. Memory-channel wiring is not modeled.'],
 nic:['CPU ↔ network interface',(cluster.id==='perlmutter'?'PCIe 4.0':'Host-to-NIC bus not published')+'. Network interfaces attach the node to the cluster fabric. '+(p.scaleOut&&p.scaleOut.perAccelerator?'In this node type each accelerator has its own dedicated adapter ('+(p.nicModel||'model not published')+(p.scaleOut.speed?', '+p.scaleOut.speed:'')+'), so GPU data can leave the node without passing through the host at all'+(p.gpuDirect?', using GPUDirect RDMA':', whether that path uses GPUDirect RDMA is not published')+'.':'GPU peer-to-peer links are a separate path from the node network interfaces.')],
 storage:['Node ↔ storage','Logical storage access; local bus, filesystem route and physical wiring are not verified in this profile.'],
 group:['Network group',cluster.id==='perlmutter'?'16 switches connect within a Dragonfly group. Local electrical links join switches; global optical links join groups.':'Logical display bundles keep the map readable. Their sizes do not assert physical rack or switch-group membership.']
 };let d=infos[type]||['Connection','Not verified'];detail={title:d[0],body:d[1]};inspect();}
const svgOpen=(cls,box)=>'<svg class="'+cls+'" viewBox="'+box+'" xmlns="http://www.w3.org/2000/svg" aria-label="Interactive architecture diagram">';
function accessible(label,attr){return ' role="button" tabindex="0" aria-label="'+esc(label)+'" '+attr}
// ------------------------------------------------------------------ network
//
// Two layers over one canvas.
//
// The spine is the inventory drawn to scale, and it is the layer every cluster
// can support: node types are always known, and a node count is published for
// half the catalog's node types. Drawing it to scale is what makes a 24-node
// machine and a 158,976-node machine look different, which the previous
// six-bundle diagram could not express — it drew the same six boxes for every
// system in the catalog.
//
// The fabric is the layer only ten clusters can fill. Where a topology is
// published it is drawn as its actual shape; where it is not, the layer still
// draws, carrying the interconnect name with its arrangement marked unknown.
// Fifty-five clusters used to get a paragraph here instead of a diagram.

// Fit the whole inventory into the canvas: shrink the tile, then coarsen the
// scale, until every node type's band fits. Whatever the outcome, the number of
// nodes one tile stands for is stated beside the drawing, so the tiles are never
// mistaken for a literal node count.
// Scale is chosen once per cluster, then stated. A single tile size for the whole
// catalog is impossible — it runs from 24 nodes to 158,976 — so the drawing works
// the way a map does: it picks a legible scale and prints it. The cross-cluster
// comparison that the tiles therefore cannot carry is carried instead by the
// node-count peer bar in the header, which is an absolute claim.
//
// Tiles are made as large as will fit rather than as small as will work, because
// a field that leaves two thirds of the canvas empty reads as a rendering
// accident rather than as an inventory.
// Fabric renderers. Each draws the shape its topology actually has; none of them
// invents a group or switch count, so where a number is unpublished the drawing
// is explicitly captioned as schematic.
function fabricSVG(c,p,{x=40,y=320,w=620,h=150}={}){
 const topo=c.topology,known=!isUnknown(topo),expanded=h>200;
 const cx=x+w/2,name=esc(c.network);
 let s='<rect class="fabricband" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10"/>'
  +'<text class="fabricname" x="'+(x+14)+'" y="'+(y+20)+'">'+(known?esc(topo).toUpperCase():'FABRIC · ARRANGEMENT NOT PUBLISHED')+'</text>'
  +'<text class="fabricnote" x="'+(x+w-14)+'" y="'+(y+20)+'" text-anchor="end">'+name+'</text>';
 const my=y+h/2+14;
 if(!known){
  // Still a drawing, not a paragraph: the interconnect is documented, its layout
  // is not, and the dashed plane is where that layout would have been.
  s+=unknownSlot(cx-150,my-26,300,52,'SWITCH LAYOUT AND ROUTES NOT PUBLISHED',accessible('Cluster interconnect '+c.network+', arrangement not published','data-info="network"'));
  return s;
 }
 const hasGroups=p.groupSize!=null&&p.count!=null;
 const groups=hasGroups?Math.ceil(p.count/p.groupSize):6;
 if(/dragonfly/i.test(topo)){
  // All-to-all between groups is what distinguishes a dragonfly from a tree, so
  // that is what gets drawn. Given room the groups sit on a ring, where every
  // chord is visible; in the compact band they fall back to a row.
  const n=Math.min(expanded?12:8,groups);
  let gx,gy;
  if(expanded){const rx=w/2-70,ry=h/2-46,cy0=y+h/2;
   gx=i=>cx+rx*Math.cos(-Math.PI/2+i*2*Math.PI/n);gy=i=>cy0+ry*Math.sin(-Math.PI/2+i*2*Math.PI/n);}
  else{const gap=(w-80)/Math.max(n-1,1);gx=i=>x+40+i*gap;gy=()=>my+10;}
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)s+=expanded
   ?'<path class="fabriclink" d="M'+gx(i).toFixed(1)+' '+gy(i).toFixed(1)+' L'+gx(j).toFixed(1)+' '+gy(j).toFixed(1)+'"'+accessible('Global link between groups','data-info="network"')+'/>'
   :'<path class="fabriclink" d="M'+gx(i)+' '+gy(i)+' Q'+((gx(i)+gx(j))/2)+' '+(gy(i)+(j-i)*11)+' '+gx(j)+' '+gy(j)+'"'+accessible('Global link between groups','data-info="network"')+'/>';
  for(let i=0;i<n;i++)s+='<rect class="grouphull" x="'+(gx(i)-17).toFixed(1)+'" y="'+(gy(i)-(expanded?13:26)).toFixed(1)+'" width="34" height="26" rx="5"'+accessible('Network group '+(i+1),'data-info="group"')+'/>';
  s+='<text class="fabricnote" x="'+cx+'" y="'+(y+h-9)+'" text-anchor="middle">'+(hasGroups?groups.toLocaleString('en-US')+' groups of '+p.groupSize+' nodes · all-to-all between groups'+(groups>n?' · '+n+' drawn':''):'schematic · group count not published')+'</text>';
 }else if(/fat.?tree/i.test(topo)){
  // Tiers, because a tree's defining property is that every level aggregates the
  // one below it.
  const tiers=/3-level/i.test(topo)?3:2,per=[2,4,8];
  for(let t=0;t<tiers;t++){
   const span=Math.min(60,(h-70)/tiers),top=y+h/2-span*(tiers-1)/2-20;
   const n=per[t],ty=top+t*span,step=(w-120)/Math.max(n-1,1);
   for(let i=0;i<n;i++){const sx=x+60+i*step;
    s+='<rect class="switchnode" x="'+(sx-13)+'" y="'+ty+'" width="26" height="13" rx="3"'+accessible('Tier '+(tiers-t)+' switch','data-info="network"')+'/>';
    if(t){const pn=per[t-1],pstep=(w-120)/Math.max(pn-1,1),px=x+60+Math.floor(i*pn/n)*pstep;
     s+='<path class="fabriclink" d="M'+sx+' '+ty+' L'+px+' '+(ty-span+13)+'"/>';}
   }
  }
  s+='<text class="fabricnote" x="'+cx+'" y="'+(y+h-9)+'" text-anchor="middle">schematic · '+tiers+' switch tiers · radix and switch count not published</text>';
 }else{
  // Mesh / torus: a grid whose edges wrap, drawn as the wrap-around stubs.
  const cols=6,rows=2,sx=(w-120)/(cols-1),sy=26;
  for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){const px=x+60+col*sx,py=my-16+r*sy;
   if(col<cols-1)s+='<path class="fabriclink" d="M'+px+' '+py+' L'+(px+sx)+' '+py+'"/>';
   if(r<rows-1)s+='<path class="fabriclink" d="M'+px+' '+py+' L'+px+' '+(py+sy)+'"/>';
   s+='<circle class="switchnode" cx="'+px+'" cy="'+py+'" r="4.5"'+accessible('Mesh node','data-info="network"')+'/>';}
  for(let r=0;r<rows;r++){const py=my-16+r*sy;s+='<path class="fabriclink" stroke-dasharray="3 3" d="M'+(x+60)+' '+py+' q -26 '+(sy/2)+' 0 '+sy+'"/>';}
  s+='<text class="fabricnote" x="'+cx+'" y="'+(y+h-9)+'" text-anchor="middle">schematic · '+esc(topo)+' · dimensions wrap; extent not published</text>';
 }
 return s;
}
function network(){
 const p=part(),parts=cluster.parts,known=!isUnknown(cluster.topology);
 const nodes=totalNodes(cluster),multi=parts.length>1;
 // An unpublished layout does not deserve a full canvas. It gets a compact band,
 // and the space goes to the fabric facts the operator did publish instead of to
 // a large empty rectangle.
 vbH=known?460:210;
 const s=svgOpen('spinesvg','0 0 700 '+vbH)+'<g id="zoomLayer" transform="'+zoomTransform()+'">'
  +fabricSVG(cluster,p,{x:40,y:26,w:620,h:vbH-52})+'</g></svg>';
 // The inventory is a number, not a picture. Drawing one tile per node filled
 // the canvas with identical squares that said nothing the figure does not say
 // already, and took the space the fabric actually needs. What a count needs is
 // context, so it gets the peer bar instead.
 const head='<div class="netstat"><div class="netfig"><label>COMPUTE NODES</label>'
  +'<strong>'+(nodes==null?'Not published':fmt(nodes))+'</strong></div>'
  +(nodes?peerBar('nodes',nodes,'a node count'):'')+'</div>';
 // Composition is the one thing a multi-partition machine cannot say in a single
 // number, so it gets one bar — drawn only when every count is published, since
 // a proportion with a missing term would be invented.
 const comp=(multi&&parts.every(x=>x.count!=null))?'<div class="compbar" role="img" aria-label="'
   +esc('Node type mix: '+parts.map(x=>x.name+' '+nodeWord(x.count)).join(', '))+'">'
   +parts.map((x,i)=>'<i class="s'+(i%6+1)+'" style="flex:'+x.count+'" title="'+esc(x.name+' · '+nodeWord(x.count))+'"></i>').join('')+'</div>':'';
 const legend=parts.map((x,i)=>'<button data-part="'+i+'"'+(i===pi?' aria-current="true"':'')+'>'
   +'<span class="swatch s'+(i%6+1)+'"></span>'+esc(x.name)+'<small>'+(x.count==null?'count not published':nodeWord(x.count))+'</small></button>').join('');
 // What the operator did publish about the fabric, shown where the topology
 // drawing cannot be. These are facts, not filler: interface count and rate are
 // the next thing a reader asks once the layout turns out to be unavailable.
 const fact=(k,v)=>v==null||isUnknown(v)?'':'<div class="netfact"><small>'+k+'</small><strong>'+esc(v)+'</strong></div>';
 const factHtml=known?'':fact('Interconnect',cluster.network)
   +fact('Interfaces per node',p.nic!=null?p.nic+' × '+(p.nicModel||'interface'):null)
   +fact('Interface rate',p.nicSpeed)+fact('Aggregate per node',p.aggregateScaleOut)
   +fact('Accelerator path',p.scaleOut&&p.scaleOut.perAccelerator?'Dedicated adapter per accelerator':null);
 const facts=factHtml?'<div class="netfacts">'+factHtml+'</div>':'';
 $('#visual').innerHTML='<div class="spinewrap'+(known?'':' compactfabric')+'">'+head+comp+s+facts
  +'<div class="spinelegend">'+legend+'</div>'
  +'<div class="zoomtools"><button aria-label="Zoom out" data-zoom="-0.2">−</button><span id="zoomLabel">'+Math.round(zoom*100)+'%</span><button aria-label="Zoom in" data-zoom="0.2">+</button></div></div>';
 $('#visual').onwheel=e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(e.deltaY<0?.15:-.15)}};
}
// The canvas height follows the drawing, so the zoom pivot is derived rather
// than hardcoded to the old 700x490 centre.
let vbH=460;
const zoomTransform=()=>'translate(350 '+(vbH/2)+') scale('+zoom+') translate(-350 -'+(vbH/2)+')';
function setZoom(d){zoom=Math.min(2.6,Math.max(.6,zoom+d));const z=$('#zoomLayer');if(z)z.setAttribute('transform',zoomTransform());if($('#zoomLabel'))$('#zoomLabel').textContent=Math.round(zoom*100)+'%'}
// -------------------------------------------------------------- inside a node
//
// The skeleton of this drawing is unchanged; what changed is what it encodes.
// Previously every connection was the same hairline, so an NVLink fabric and a
// management NIC looked identical, and every memory box was the same size
// whether it held 128 GB or 2 TB. Now a link's weight follows its published
// rate and a memory block's bar follows its published capacity, which means the
// picture carries the two numbers a reader actually came for.
//
// Nothing is drawn from a standard's headline figure. "PCIe 4.0" and "NVLink 3"
// name a standard without stating a rate for this machine, so those links keep
// the neutral default weight rather than borrowing a number from a spec sheet.
function inside(){
 $('#visual').onwheel=null;
 const p=part();
 const accelUnknown=p.gpus==null||!!p.compact;
 const gpus=accelUnknown?0:p.gpus,cpus=p.cpus||1,apu=p.apu,paired=p.paired;
 let s=svgOpen('nodesvg','0 0 620 390');
 const perAccelerator=!!(p.scaleOut&&p.scaleOut.perAccelerator&&gpus>1);
 const nicY=272,nicH=30,busY=314;
 // Capacity is drawn relative to the largest published figure in this node, so
 // the comparison is between host memory and one accelerator's memory — the
 // ratio someone sizing a job actually wants.
 const hostGB=capacityGB(p.ram),vramGB=gpuMemoryGB(p)??capacityGB(p.vram);
 const accelTotalGB=vramGB&&gpus?vramGB*gpus:null;
 const capBar=()=>'';
 function wire(x1,y1,x2,y2,color,type,dash='',rate=null){
  const g=bandwidthGbps(rate);
  return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" class="svgLink" stroke="'+color+'" stroke-width="'+linkWeight(g).toFixed(2)+'" '+(dash?'stroke-dasharray="5 5"':'')+accessible(type+' connection'+(g?', '+rateLabel(rate):''),'data-info="'+type+'"')+'/>';
 }
 function chip(x,y,w,h,label,sub,type,color,extra=''){const single=h<40;return '<g class="svgClick" '+extra+' '+accessible(label+' '+sub,'data-info="'+type+'"')+'><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6" fill="'+color+'" stroke="'+(type==='cpu'?'#82a6d9':'#75b5a5')+'"/><text x="'+(x+w/2)+'" y="'+(y+(single?h/2+4:21))+'" text-anchor="middle" font-size="'+(single?9:12)+'" fill="#244858">'+label+'</text>'+(single?'':'<text x="'+(x+w/2)+'" y="'+(y+36)+'" text-anchor="middle" font-size="9" fill="#587780">'+esc(sub)+'</text>')+'</g>'}
 const cpuX=Array.from({length:cpus},(_,i)=>310+(i-(cpus-1)/2)*125), gpuX=Array.from({length:gpus},(_,i)=>50+i*(520/Math.max(gpus-1,1)));
 const fabricStr=p.onNodeFabric||p.link;
 s+=wire(310,67,310,100,'#9bb4c9','memory');
 if(!apu)cpuX.forEach(x=>s+=wire(310,100,x,100,'#9bb4c9','memory'));
 if(gpus&&!apu)gpuX.forEach((x,i)=>{let cx=paired?cpuX[i]:cpuX[Math.min(cpus-1,Math.floor(i*cpus/gpus))];s+=wire(cx,142,x,195,isUnknown(p.hostLink)?'#a5b0b6':'#83a5c5','host',isUnknown(p.hostLink),p.hostLink).replace('<path','<path data-gpu="'+i+'"')});
 if(gpus>1&&!p.noGpuLinks){const gw=linkWeight(bandwidthGbps(fabricStr)).toFixed(2);
  if(String(p.link).includes('all GPU pairs')||apu){for(let i=0;i<gpus;i++)for(let j=i+1;j<gpus;j++)s+='<path d="M'+gpuX[i]+' 243 Q'+((gpuX[i]+gpuX[j])/2)+' '+(256+(j-i)*8)+' '+gpuX[j]+' 243" class="svgLink" stroke="#44a38e" stroke-width="'+gw+'" '+accessible('GPU pair connection','data-info="local"')+'/>'}
  else{s+=wire(gpuX[0],256,gpuX[gpus-1],256,'#44a38e','local',isUnknown(p.link),fabricStr);gpuX.forEach(x=>s+=wire(x,240,x,256,'#44a38e','local',isUnknown(p.link),fabricStr))}
  const fr=rateLabel(fabricStr);if(fr)s+='<text class="linkrate" x="310" y="286" text-anchor="middle">'+esc(fr)+'</text>';
 }
 s+=chip(190,20,240,48,apu?'UNIFIED MEMORY':'HOST MEMORY',p.ram,'ram','#eef3fb');
 s+=chip(480,20,118,48,'STORAGE',isUnknown(p.disk)?UNKNOWN:'Select for detail','disk','#f2f0f7');
 if(!apu)cpuX.forEach((x,i)=>{s+=chip(x-53,100,106,48,'▣ CPU '+(i+1),p.cpus==null?'Count not published':p.paired?'Grace':p.cpu.includes('EPYC')?'AMD EPYC':p.cpu.includes('Xeon')?'Intel Xeon':p.cpu.includes('A64FX')?'A64FX':'LX2','cpu','#eaf0fa')});
 if(apu){s+='<text x="310" y="130" text-anchor="middle" font-size="11" fill="#64818a">CPU + GPU + shared HBM in each package</text>';gpuX.forEach((x,i)=>{s+=wire(310,68,x,185,'#9bb4c9','memory');s+=chip(x-48,185,96,60,'▣ APU '+(i+1),'MI300A','gpu','#e3f2ed','data-gpu="'+i+'"')})}
 else if(gpus)gpuX.forEach((x,i)=>{let w=gpus>6?58:80;let label=p.mixed?(i===8?'MI210':'MI100'):(/\b(GB300|GB200|B300|B200|H200|H100|A100|A40|V100|MI355X|MI300X|MI300A|MI250X|MI210|MI100|Trainium2|Gaudi3|GH200)\b/i.exec(p.gpu||'')?.[1]||(/Hopper/i.test(p.gpu||'')?'Hopper':/Data Center GPU Max/i.test(p.gpu||'')?'GPU Max':'GPU'));s+=chip(x-w/2,195,w,48,'GPU '+(i+1),label,'gpu','#e3f2ed','data-gpu="'+i+'"')});
 else if(accelUnknown){
  // The accelerator bay is drawn empty rather than the whole diagram collapsing
  // to a list of buttons. The node still has a CPU, memory, storage and a known
  // interface count, and all of that stays visible beside the gap.
  s+=unknownSlot(60,195,500,48,(p.gpu?esc(p.gpu)+' · ':'')+'ACCELERATOR COUNT NOT PUBLISHED',accessible('Accelerator count not published','data-info="gpu"'));
  s+=wire(cpuX[0],148,310,195,'#a5b0b6','host',true);
 }
 else s+='<text x="310" y="224" text-anchor="middle" font-size="12" fill="#7b9099">CPU-only node · no accelerator</text>';
 if(perAccelerator&&gpus){
  // One dedicated adapter per accelerator, collected onto the scale-out fabric.
  const nw=gpus>6?54:66;
  gpuX.forEach((x,i)=>s+=wire(x,243,x,nicY,'#9680b8','nic','',p.nicSpeed).replace('<path','<path data-gpu="'+i+'"'));
  gpuX.forEach((x,i)=>s+=chip(x-nw/2,nicY,nw,nicH,'NIC '+(i+1),'','nic',i%2?'#eee9f5':'#e8e4f2','data-gpu="'+i+'"'));
  gpuX.forEach((x,i)=>s+=wire(x,nicY+nicH,x,busY,'#9680b8','network','',p.nicSpeed).replace('<path','<path data-gpu="'+i+'"'));
  s+=wire(gpuX[0],busY,gpuX[gpus-1],busY,'#9680b8','network','',p.aggregateScaleOut);
  s+='<text class="linkrate" x="310" y="'+(busY+16)+'" text-anchor="middle">'+esc(p.scaleOut.speed||'dedicated per-accelerator scale-out')+'</text>';
  s+=wire(310,busY,310,332,'#9680b8','network','',p.aggregateScaleOut);
  s+=chip(180,332,260,44,'⌘ CLUSTER FABRIC',p.aggregateScaleOut||cluster.network,'network','#eee9f5');
 }else{
  const anchor=apu?50:cpuX[0];
  s+='<path d="M'+anchor+' '+(apu?245:147)+' L'+anchor+' 256 L180 256 L180 '+nicY+' L205 '+nicY+'" class="svgLink" stroke="#9680b8" stroke-width="'+linkWeight(bandwidthGbps(p.nicSpeed)).toFixed(2)+'" '+(isUnknown(p.hostLink)?'stroke-dasharray="5 5"':'')+accessible('Host to network interface','data-info="nic"')+'/>';
  s+=chip(205,nicY,210,44,'⌘ NETWORK',p.nic?p.nic+' interface'+(p.nic===1?'':'s')+(rateLabel(p.nicSpeed)?' · '+rateLabel(p.nicSpeed):''):'Interface count not published','network','#eee9f5');
 }
 s+=wire(550,63,550,85,'#a8b7bd','storage',true);s+=wire(550,85,310,85,'#a8b7bd','storage',true);
 if(gpus&&!apu)s+='<text class="linkrate" x="310" y="178" text-anchor="middle">'+esc(p.hostLink)+'</text>';
 s+='</svg>';
 // The legend doubles as the weight key: each entry draws its own link at the
 // weight used in the diagram, so the encoding is learnable without a separate
 // scale. Entries without a published rate say so.
 // Host memory against the node's total accelerator memory, to scale. Both are
 // drawn only when both were published as an unambiguous capacity; a string that
 // offers a choice of variants is left as text rather than plotted.
 const memStrip=(hostGB&&accelTotalGB)?(()=>{const m=Math.max(hostGB,accelTotalGB);
  const bar=(label,gb,cls)=>'<div class="membar"><span class="memk">'+label+'</span><span class="memtrack"><i class="'+cls+'" style="width:'+(gb/m*100).toFixed(1)+'%"></i></span><span class="memv">'+Math.round(gb).toLocaleString('en-US')+' GB</span></div>';
  return '<div class="memstrip">'+bar('Host memory',hostGB,'s2')+bar('Accelerator memory · '+gpus+' × '+Math.round(vramGB).toLocaleString('en-US')+' GB',accelTotalGB,'s1')+'</div>';})():'';
 const key=(type,label,str)=>{const g=bandwidthGbps(str);return '<button data-info="'+type+'"><span class="w" style="border-top-width:'+Math.max(1,linkWeight(g)/1.6).toFixed(1)+'px"></span>'+label+' · '+esc(g?rateLabel(str):(isUnknown(str)?UNKNOWN:'rate not published'))+'</button>'};
 $('#visual').innerHTML='<div class="insidewrap"><div class="nodecontrols"><button data-action="prev" aria-label="Previous node" '+(!p.count||selected===0?'disabled':'')+'>←</button><span>NODE '+String(selected+1).padStart(5,'0')+' / '+(p.count?fmt(p.count):'REPRESENTATIVE')+'</span><button data-action="next" aria-label="Next node" '+(!p.count||selected>=p.count-1?'disabled':'')+'>→</button></div>'+s
  +'<div class="linklegend">'+(gpus?key('host','CPU–GPU',p.hostLink):'')+(gpus>1?key('local','GPU–GPU',fabricStr):'')+(perAccelerator?key('nic','GPU–NIC ×'+gpus,p.nicSpeed):'')+key('network','Node–network',p.aggregateScaleOut||p.nicSpeed)+'</div>'
  +memStrip+'<p class="legendscale">Line weight follows the published rate; unpublished rates draw thinnest, dashed means unverified. Bus lines summarize connections, not exact wiring.</p>'
  +'</div>';
 // Hovering an accelerator lights its own path to the fabric and recedes the
 // rest, which is the question the diagram is usually being asked.
 $('#visual').onpointerover=e=>{const g=e.target.closest('[data-gpu]');const svg=$('#visual svg');if(!svg)return;
  svg.querySelectorAll('.dim').forEach(n=>n.classList.remove('dim'));
  if(!g)return;const id=g.dataset.gpu;
  svg.querySelectorAll('[data-gpu]').forEach(n=>{if(n.dataset.gpu!==id)n.classList.add('dim')});};
 $('#visual').onpointerleave=()=>{const svg=$('#visual svg');if(svg)svg.querySelectorAll('.dim').forEach(n=>n.classList.remove('dim'))};
}
function sources(){ $('#sourceBody').innerHTML='<p>Public documentation snapshot checked '+(cluster.checked||catalogDate)+'. Rankings use the June 2026 TOP500 list. Hardware inventory can differ from the subset used in an HPL benchmark.</p><h3>'+cluster.name+'</h3>'+cluster.sources.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+s.url+'">'+esc(s.title)+' ↗</a>').join('')+'<p>'+esc(cluster.notes)+'</p><h3>How to interpret the catalog</h3><p>Node identifiers are illustrative indices within a node type, not physical hostnames. Nodes of one type share a representative hardware profile. Display bundles are not rack assignments. The application has no live telemetry or scheduler connection.</p><p>Unknown fields are kept explicit. “Not verified” means this catalog has not confirmed the detail; it does not mean the hardware is absent. Clickable buses summarize link families rather than reproducing every lane or cable.</p><p>Unknown clusters are not silently mapped to an unrelated machine. Search handles names, natural-language phrases and small spelling mistakes locally.</p><h3>Extend the catalog</h3><p>Profiles are stored in the site’s data.js asset, separately from diagram rendering. Add documented node types, counts, links, and source URLs to extend coverage.</p>';$('#sourceDialog').showModal()}
// Selecting a node type is a different act from opening a node. A tile or band
// header carries both, so it switches type and dives in; a legend entry carries
// only the type, so it stays on the map.
function selectPart(i){if(i===pi)return;pi=i;selected=0;detail=null;$('#partition').value=i;$('#partitionCount').textContent=nodeWord(part().count)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cluster],[data-filter],[data-view],[data-info],[data-group],[data-node],[data-part],[data-action],[data-zoom]');if(!b)return;
 if(b.dataset.cluster){selectCluster(clusters.find(c=>c.id===b.dataset.cluster));return}
 if(b.dataset.filter){list();return}
 if(b.dataset.view){setView(b.dataset.view);return}
 if(b.dataset.info){info(b.dataset.info);return}
 if(b.dataset.zoom){setZoom(Number(b.dataset.zoom));return}
 if(b.dataset.node!==undefined){if(b.dataset.part!==undefined)selectPart(Number(b.dataset.part));selected=Math.max(0,Math.min(Number(b.dataset.node),(part().count||1)-1));setView('inside');return}
 if(b.dataset.part!==undefined){selectPart(Number(b.dataset.part));renderView();inspect();return}
 if(b.dataset.group!==undefined){selected=Math.min(Number(b.dataset.group),(part().count||1)-1);setView('inside');return}
 let action=b.dataset.action;
 if(action==='inside'||action==='specs'){setView(action);return}if(action==='prev'||action==='next'){selected=Math.max(0,Math.min((part().count||1)-1,selected+(action==='next'?1:-1)));detail=null;inside();inspect()}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
$('#partition').onchange=e=>{pi=Number(e.target.value);selected=0;zoom=1;detail=null;$('#partitionCount').textContent=nodeWord(part().count);renderView();inspect()};
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


document.querySelector('.sidebar .eyebrow span').textContent=clusters.length;
document.querySelector('#search').setAttribute('list','clusterNames');
const catalogOptions=document.createElement('datalist');catalogOptions.id='clusterNames';catalogOptions.innerHTML=clusters.map(c=>'<option value="'+esc(c.name)+'">'+esc(c.site)+'</option>').join('');document.querySelector('#searchForm').append(catalogOptions);
