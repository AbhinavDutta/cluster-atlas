import {initComparison} from './compare.js';
import {initWorldMap} from './world-map.js';
import {clusters,catalogDate,matchCluster} from './data.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const fmt=n=>n==null?'Not verified':n.toLocaleString('en-US');
const esc=s=>String(s??'Not verified').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cluster=clusters[0],pi=0,view='network',selected=0,zoom=1,detail=null,raf=0,resizeObserver;
const part=()=>cluster.parts[pi], total=()=>cluster.parts.some(p=>p.count==null)?null:cluster.parts.reduce((s,p)=>s+p.count,0);
function list(){ $('#clusterList').innerHTML=clusters.filter(c=>c.rank>=1&&c.rank<=10).sort((a,b)=>a.rank-b.rank).map(c=>'<button class="clusteritem '+(c===cluster?'active':'')+'" data-cluster="'+c.id+'" aria-pressed="'+(c===cluster)+'"><span class="clustericon">▦</span><span><strong>'+c.name+'</strong><small>'+c.country+'</small></span><span class="listrank">'+(c.rank?'#'+c.rank:'')+'</span></button>').join(''); }
function selectCluster(c){cluster=c;pi=0;selected=0;view='network';zoom=1;detail=null;render();history.replaceState(null,'','#'+c.id)}
function render(){worldMap.select(cluster.id);list();$('#location').textContent=cluster.country.toUpperCase()+' / '+(cluster.rank?'TOP500':'RESEARCH / AI');$('#clusterName').textContent=cluster.name;$('#institution').textContent=cluster.site;$('#rank').textContent=cluster.rank?'#'+cluster.rank+' · JUN 2026':'RESEARCH / AI';
 let accelerators=cluster.parts.some(p=>p.gpus==null||(p.count==null&&p.gpus>0))?null:cluster.parts.reduce((s,p)=>s+(p.count||0)*p.gpus,0);
 $('#stats').innerHTML=[['COMPUTE NODES',fmt(total()),cluster.profileScope||'documented inventory'],['ACCELERATORS',fmt(accelerators),'physical accelerators'],['NODE TYPES',cluster.parts.length,'configurations'],['NETWORK TOPOLOGY',cluster.topology,'schematic view']].map((s,i)=>'<div class="stat"><label>'+s[0]+'</label><strong class="'+(i===3||String(s[1]).length>10?'textstat':'')+'">'+s[1]+'</strong><br><small style="margin-left:0">'+s[2]+'</small></div>').join('');
 $('#partition').innerHTML=cluster.parts.map((p,i)=>'<option value="'+i+'">'+p.name+'</option>').join('');$('#partition').value=pi;$('#partitionCount').textContent=fmt(part().count)+' nodes';
 $('#mapNote').textContent=cluster.notes+' Node numbers are illustrative indices, not hostnames or live status. '+(cluster.topology==='Not verified'?'Connectivity is conceptual; physical topology is not verified.':'Cable routes and port assignments are simplified.');
 renderView();inspect();}
function renderView(){$('#visual').onpointerover=null;if(resizeObserver)resizeObserver.disconnect();cancelAnimationFrame(raf);$$('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-selected',b.dataset.view===view)});$('#viewhint').textContent=view==='network'?'Select a group to explore':view==='nodes'?'Hover to preview · click to inspect':'Select a component or connection';
 if(view==='network')network();else if(view==='nodes')nodes(selected);else inside();}
function setView(v){view=v;detail=null;renderView();inspect()}
function spec(icon,label,value,color=''){return '<div class="spec"><span class="specicon '+color+'">'+icon+'</span><div><label>'+label+'</label><strong>'+esc(value)+'</strong></div></div>'}
function inspect(preview=false){const p=part();const isNetwork=view==='network'&&!preview;let content='<h2>'+ (isNetwork?'The connected system':'Node '+String(selected+1).padStart(5,'0'))+'</h2><span class="pill">'+esc(p.name)+'</span><p>'+(isNetwork?'Start with the network. Open a group to see its nodes, then explore the hardware inside.':'Representative '+esc(p.name)+' configuration. Select a chip or link to learn what it does.')+'</p>';
 if(detail)content+='<div class="componentdetail" role="status"><h3>'+esc(detail.title)+'</h3><p>'+esc(detail.body)+'</p></div>';
 if(isNetwork)content+='<div class="specs">'+spec('⌘','CLUSTER FABRIC',cluster.network,'purple')+spec('▦','ORGANIZATION',cluster.topology)+spec('⊞','SELECTED NODE TYPE',fmt(p.count)+' nodes','green')+'</div><button class="primary" data-action="inside">Explore a node ↗</button>';
 else content+='<div class="specs">'+spec('▣',p.apu?'CPU INSIDE EACH APU':'PROCESSORS',(p.cpus==null?'Count not verified':p.cpus+' ×')+' '+p.cpu)+spec('▥',p.apu?'INTEGRATED ACCELERATORS':'ACCELERATORS',p.gpus==null?(p.gpu||'Model not verified')+' · count not verified':p.gpus?p.gpus+' × '+p.gpu:'No accelerator','green')+spec('▤','HOST / UNIFIED MEMORY',p.ram)+ (p.gpus!==0?spec('▤','ACCELERATOR MEMORY',p.vram,'green'):'')+spec('▱','LOCAL STORAGE',p.disk,'purple')+'</div>'+((view==='nodes'||preview)?'<button class="primary" data-action="inside">Open node diagram ↗</button>':'');
 
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
 nic:['CPU ↔ network interface',(cluster.id==='perlmutter'?'PCIe 4.0':'Host-to-NIC bus not verified')+'. Network interfaces attach the node to the cluster fabric. GPU peer-to-peer links are a separate path.'],
 storage:['Node ↔ storage','Logical storage access; local bus, filesystem route and physical wiring are not verified in this profile.'],
 group:['Network group',cluster.id==='perlmutter'?'16 switches connect within a Dragonfly group. Local electrical links join switches; global optical links join groups.':'Logical display bundles keep the map readable. Their sizes do not assert physical rack or switch-group membership.']
 };let d=infos[type]||['Connection','Not verified'];detail={title:d[0],body:d[1]};inspect();}
const svgOpen=(cls,box)=>'<svg class="'+cls+'" viewBox="'+box+'" xmlns="http://www.w3.org/2000/svg" aria-label="Interactive architecture diagram">';
function accessible(label,attr){return ' role="button" tabindex="0" aria-label="'+esc(label)+'" '+attr}
function network(){const p=part();const actual=cluster.id==='perlmutter',groupSize=p.groupSize||Math.max(1,Math.ceil((p.count||48)/12)),groups=p.count?Math.ceil(p.count/groupSize):null;
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
 $('#visual').innerHTML='<div class="mapcaption">'+(groups?shown+' OF '+groups+' '+(actual?'GROUPS':'DISPLAY BUNDLES')+' SHOWN':'REPRESENTATIVE VIEW · COUNT UNVERIFIED')+'</div>'+s+'<button class="unroll primary" data-action="nodes">▦ Unroll '+(p.count?'all '+fmt(p.count)+' nodes':'node profile')+'</button><div class="zoomtools"><button aria-label="Zoom out" data-zoom="-0.2">−</button><span id="zoomLabel">'+Math.round(zoom*100)+'%</span><button aria-label="Zoom in" data-zoom="0.2">+</button></div>';
 $('#visual').onpointerover=e=>{const n=e.target.closest('[data-node]');if(n){selected=Number(n.dataset.node);inspect(true)}};
 $('#visual').onwheel=e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(e.deltaY<0?.15:-.15)}};
}
function setZoom(d){zoom=Math.min(2.6,Math.max(.6,zoom+d));const z=$('#zoomLayer');if(z)z.setAttribute('transform','translate(350 245) scale('+zoom+') translate(-350 -245)');if($('#zoomLabel'))$('#zoomLabel').textContent=Math.round(zoom*100)+'%'}
function nodes(start){$('#visual').onwheel=null;const p=part();if(!p.count){$('#visual').innerHTML='<div class="blank"><span class="pill">PARTIAL PUBLIC PROFILE</span><h2>Exact node count not verified</h2><p>We can show the documented hardware profile, but cannot enumerate nodes without a verified count.</p><button class="primary" data-action="inside">Explore representative node ↗</button></div>';return}
 $('#visual').innerHTML='<form class="gridtoolbar" id="jumpForm"><label for="jump">Jump to node</label><input id="jump" type="number" min="1" max="'+p.count+'" value="'+(selected+1)+'" required><button>Go</button><span id="range"></span></form><div class="nodeviewport" tabindex="0" aria-label="Scrollable node inventory"><div class="virtualcontent"></div></div>';
 let vp=$('.nodeviewport'),content=$('.virtualcontent'),cols=1;function paint(){cols=Math.max(2,Math.floor(vp.clientWidth/130));const rows=Math.ceil(p.count/cols);content.style.height=rows*96+'px';let first=Math.max(0,Math.floor(vp.scrollTop/96)-1),last=Math.min(rows,first+Math.ceil(vp.clientHeight/96)+3);let str='';
 for(let r=first;r<last;r++){str+='<div class="noderow" style="top:'+r*96+'px;grid-template-columns:repeat('+cols+',minmax(0,1fr))">';for(let col=0;col<cols;col++){let i=r*cols+col;if(i>=p.count)break;str+='<button class="nodecard '+(i===selected?'selected':'')+'" data-select-node="'+i+'" aria-label="Inspect node '+(i+1)+'" title="'+esc(p.cpu+'; '+p.gpus+' GPUs; '+p.ram)+'"><strong>▦ '+String(i+1).padStart(5,'0')+'</strong><span class="chipdots">'+Array.from({length:Math.min(p.cpus||1,4)},()=>'<i></i>').join('')+Array.from({length:Math.min(p.gpus,8)},()=>'<i class="g"></i>').join('')+'</span><small>'+(p.apu?'4 APUs':(p.cpus??'?')+' CPU · '+(p.gpus??'?')+' accelerators')+'</small></button>'}str+='</div>'}content.innerHTML=str;$('#range').textContent=fmt(Math.min(p.count,Math.floor(vp.scrollTop/96)*cols+1))+' / '+fmt(p.count)}
 vp.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(paint)});resizeObserver=new ResizeObserver(paint);resizeObserver.observe(vp);paint();if(start!==undefined){vp.scrollTop=Math.floor(start/cols)*96;paint()}
 $('#jumpForm').onsubmit=e=>{e.preventDefault();let n=Number($('#jump').value);if(!Number.isInteger(n)||n<1||n>p.count)return;selected=n-1;vp.scrollTop=Math.floor(selected/cols)*96;paint();inspect()};
 vp.onmouseover=e=>{let b=e.target.closest('[data-select-node]');if(b){selected=Number(b.dataset.selectNode);inspect()}};
 vp.onfocusin=e=>{let b=e.target.closest('[data-select-node]');if(b){selected=Number(b.dataset.selectNode);inspect()}};
}
function inside(){ $('#visual').onwheel=null;const p=part();if(p.gpus==null||p.compact){partialNode(p);return;}let s=svgOpen('nodesvg','0 0 620 355');const gpus=p.gpus,cpus=p.cpus||1,apu=p.apu,paired=p.paired;
 function wire(x1,y1,x2,y2,color,type,dash=''){return '<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" class="svgLink" stroke="'+color+'" '+(dash?'stroke-dasharray="5 5"':'')+accessible(type+' connection','data-info="'+type+'"')+'/>'}
 function chip(x,y,w,h,label,sub,type,color){return '<g class="svgClick" '+accessible(label+' '+sub,'data-info="'+type+'"')+'><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="6" fill="'+color+'" stroke="'+(type==='cpu'?'#82a6d9':'#75b5a5')+'"/><text x="'+(x+w/2)+'" y="'+(y+21)+'" text-anchor="middle" font-size="12" fill="#244858">'+label+'</text><text x="'+(x+w/2)+'" y="'+(y+36)+'" text-anchor="middle" font-size="9" fill="#587780">'+esc(sub)+'</text></g>'}
 const cpuX=Array.from({length:cpus},(_,i)=>310+(i-(cpus-1)/2)*125), gpuX=Array.from({length:gpus},(_,i)=>50+i*(520/Math.max(gpus-1,1)));
 // Schematic memory bus, host paths and fabric attachment. Unknown paths are dashed.
 s+=wire(310,67,310,100,'#9bb4c9','memory');
 if(!apu)cpuX.forEach(x=>s+=wire(310,100,x,100,'#9bb4c9','memory'));
 if(gpus&&!apu)gpuX.forEach((x,i)=>{let cx=paired?cpuX[i]:cpuX[Math.min(cpus-1,Math.floor(i*cpus/gpus))];s+=wire(cx,142,x,195,p.hostLink==='Not verified'?'#a5b0b6':'#83a5c5','host',p.hostLink==='Not verified')});
 if(gpus>1&&!p.noGpuLinks){if(String(p.link).includes('all GPU pairs')||apu){for(let i=0;i<gpus;i++)for(let j=i+1;j<gpus;j++)s+='<path d="M'+gpuX[i]+' 243 Q'+((gpuX[i]+gpuX[j])/2)+' '+(260+(j-i)*10)+' '+gpuX[j]+' 243" class="svgLink" stroke="#44a38e" '+accessible('GPU pair connection','data-info="local"')+'/>'}else{s+=wire(gpuX[0],256,gpuX[gpus-1],256,'#44a38e','local',p.link==='Not verified');gpuX.forEach(x=>s+=wire(x,240,x,256,'#44a38e','local',p.link==='Not verified'))}}
 s+='<path d="M'+(apu?50:cpuX[0])+' '+(apu?245:147)+' L'+(apu?50:cpuX[0])+' 284 L180 284 L180 320 L205 320" class="svgLink" stroke="#9680b8" '+(cluster.id==='perlmutter'?'':'stroke-dasharray="5 5"')+accessible('Host to network interface','data-info="nic"')+'/>';s+=wire(310,345,310,355,'#9680b8','network');
 s+=wire(550,63,550,85,'#a8b7bd','storage',true);s+=wire(550,85,310,85,'#a8b7bd','storage',true);
 s+=chip(190,20,240,48,apu?'UNIFIED MEMORY':'HOST MEMORY',p.ram,'ram','#eef3fb');
 s+=chip(480,20,118,48,'STORAGE',p.disk==='Not verified'?'Not verified':'Select for detail','disk','#f2f0f7');
 if(!apu)cpuX.forEach((x,i)=>{s+=chip(x-53,100,106,48,'▣ CPU '+(i+1),p.cpus==null?'Count unknown':p.paired?'Grace':p.cpu.includes('EPYC')?'AMD EPYC':p.cpu.includes('Xeon')?'Intel Xeon':p.cpu.includes('A64FX')?'A64FX':'LX2','cpu','#eaf0fa')});
 if(apu){s+='<text x="310" y="130" text-anchor="middle" font-size="11" fill="#64818a">CPU + GPU + shared HBM in each package</text>';gpuX.forEach((x,i)=>{s+=wire(310,68,x,185,'#9bb4c9','memory');s+=chip(x-48,185,96,60,'▣ APU '+(i+1),'MI300A','gpu','#e3f2ed')})}
 else if(gpus)gpuX.forEach((x,i)=>{let w=gpus>6?58:80;let label=p.mixed?(i===8?'MI210':'MI100'):p.gpu.includes('A100')?'A100':p.gpu.includes('Hopper')?'Hopper':p.gpu.includes('H100')?'H100':p.gpu.includes('MI250')?'MI250X':'GPU';s+=chip(x-w/2,195,w,48,'GPU '+(i+1),label,'gpu','#e3f2ed')});
 else s+='<text x="310" y="224" text-anchor="middle" font-size="12" fill="#7b9099">CPU-only node · no accelerator</text>';
 s+=chip(205,297,210,48,'⌘ NETWORK',p.nic?p.nic+' interfaces':'Interface count not verified','network','#eee9f5');
 if(gpus&&!apu)s+='<text x="310" y="175" text-anchor="middle" font-size="10" fill="#68829a">'+esc(p.hostLink)+'</text>';
 s+='</svg>';
 $('#visual').innerHTML='<div class="insidewrap"><div class="nodecontrols"><button data-action="prev" aria-label="Previous node" '+(!p.count||selected===0?'disabled':'')+'>←</button><span>NODE '+String(selected+1).padStart(5,'0')+' / '+(p.count?fmt(p.count):'REPRESENTATIVE')+'</span><button data-action="next" aria-label="Next node" '+(!p.count||selected>=p.count-1?'disabled':'')+'>→</button></div>'+s+'<div class="linklegend">'+(gpus?'<button data-info="host">CPU–GPU · '+esc(p.hostLink)+'</button>':'')+(gpus>1?'<button data-info="local">GPU–GPU · '+esc(p.link)+'</button>':'')+'<button data-info="network">Node–network ↗</button></div><p class="subnote" style="color:#6d828b">Schematic connectivity. Dashed paths are unverified; bus lines summarize connections, not exact wiring.</p></div>';
}
function sources(){ $('#sourceBody').innerHTML='<p>Public documentation snapshot checked '+(cluster.checked||catalogDate)+'. Rankings use the June 2026 TOP500 list. Hardware inventory can differ from the subset used in an HPL benchmark.</p><h3>'+cluster.name+'</h3>'+cluster.sources.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+s.url+'">'+esc(s.title)+' ↗</a>').join('')+'<p>'+esc(cluster.notes)+'</p><h3>How to interpret the catalog</h3><p>Node identifiers are illustrative indices within a node type, not physical hostnames. Nodes of one type share a representative hardware profile. Display bundles are not rack assignments. The application has no live telemetry or scheduler connection.</p><p>Unknown fields are kept explicit. “Not verified” means this catalog has not confirmed the detail; it does not mean the hardware is absent. Clickable buses summarize link families rather than reproducing every lane or cable.</p><p>Unknown clusters are not silently mapped to an unrelated machine. Search handles names, natural-language phrases and small spelling mistakes locally.</p><h3>Extend the catalog</h3><p>Profiles are stored in the site’s data.js asset, separately from diagram rendering. Add documented node types, counts, links, and source URLs to extend coverage.</p>';$('#sourceDialog').showModal()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-cluster],[data-filter],[data-view],[data-info],[data-group],[data-node],[data-action],[data-zoom],[data-select-node]');if(!b)return;
 if(b.dataset.cluster){selectCluster(clusters.find(c=>c.id===b.dataset.cluster));return}
 if(b.dataset.filter){list();return}
 if(b.dataset.view){setView(b.dataset.view);return}
 if(b.dataset.info){info(b.dataset.info);return}
 if(b.dataset.zoom){setZoom(Number(b.dataset.zoom));return}
 if(b.dataset.node!==undefined){selected=Number(b.dataset.node);setView('inside');return}
 if(b.dataset.group!==undefined){selected=Math.min(Number(b.dataset.group),(part().count||1)-1);view='nodes';renderView();inspect();return}
 if(b.dataset.selectNode!==undefined){selected=Number(b.dataset.selectNode);setView('inside');return}
 let action=b.dataset.action;if(action==='inside'||action==='nodes'){setView(action);return}if(action==='prev'||action==='next'){selected=Math.max(0,Math.min((part().count||1)-1,selected+(action==='next'?1:-1)));detail=null;inside();inspect()}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
$('#partition').onchange=e=>{pi=Number(e.target.value);selected=0;zoom=1;detail=null;$('#partitionCount').textContent=fmt(part().count)+' nodes';renderView();inspect()};
$('#reset').onclick=()=>{selected=0;zoom=1;setView('network')};
$('#searchForm').onsubmit=e=>{e.preventDefault();let query=$('#search').value.trim();if(!query){$('#searchStatus').textContent='Enter a cluster name, such as Perlmutter.';return}let c=matchCluster(query);$('#searchStatus').className=c?'':'noresult';$('#searchStatus').textContent=c?'Showing '+c.name+'.':'We do not have information for “'+query+'” yet. Coverage can be added in a future catalog update.';if(c){selectCluster(c)}};
$('#sourcesBtn').onclick=sources;$('#sourceLink').onclick=sources;$('#closeDialog').onclick=()=>$('#sourceDialog').close();$('#sourceDialog').onclick=e=>{if(e.target===$('#sourceDialog')){let r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
const worldMap=initWorldMap(clusters,c=>{selectCluster(c);const heading=document.querySelector('.clusterhead');heading.scrollIntoView({block:'start'});heading.focus({preventScroll:true})});
const initial=clusters.find(c=>c.id===location.hash.slice(1));if(initial)cluster=initial;render();
initComparison(clusters,()=>({cluster,pi}));


function partialNode(p){
 const card=(type,icon,label,value)=>'<button data-info="'+type+'"><span>'+icon+' '+label+'</span><strong>'+esc(value)+'</strong></button>';
 $('#visual').innerHTML='<div class="partial-node"><span class="pill">'+(p.compact?'REPRESENTATIVE COMPUTE BUILDING BLOCK':'PARTIAL PUBLIC NODE PROFILE')+'</span><h2>'+esc(p.name)+'</h2><p>Known components are shown without assuming an undocumented device count or wiring layout.</p><div class="partial-components">'+card('cpu','▣','CPU',(p.cpus??'Count not verified')+' · '+p.cpu)+card('gpu','▥','Accelerator',(p.gpus??'Count not verified')+' · '+(p.gpu||'Model not verified'))+card('ram','▤','Host memory',p.ram)+card('disk','▱','Storage',p.disk)+'</div><div class="partial-links">'+card('host','↕','Host ↔ accelerator',p.hostLink)+card('local','↔','Accelerator fabric',p.link)+card('network','⌘','Cluster fabric',cluster.network)+'</div></div>';
}
document.querySelector('.sidebar .eyebrow span').textContent=clusters.length;
document.querySelector('#search').setAttribute('list','clusterNames');
const catalogOptions=document.createElement('datalist');catalogOptions.id='clusterNames';catalogOptions.innerHTML=clusters.map(c=>'<option value="'+esc(c.name)+'">'+esc(c.site)+'</option>').join('');document.querySelector('#searchForm').append(catalogOptions);
