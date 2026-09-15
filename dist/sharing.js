const esc=s=>String(s??'Not verified').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function readView(hash,clusters){
 const [id,query='']=hash.replace(/^#/,'').split('?');const c=clusters.find(c=>c.id===id);if(!c)return null;
 const q=new URLSearchParams(query),integer=(v,max)=>{const n=Number(v);return Number.isInteger(n)&&n>=0&&n<max?n:0;};
 const part=integer(q.get('part'),c.parts.length),node=integer(q.get('node'),c.parts[part].count||1);
 const z=Number(q.get('zoom')||1);
 return {cluster:c,pi:part,selected:node,view:['network','nodes','inside'].includes(q.get('view'))?q.get('view'):'network',zoom:Number.isFinite(z)?Math.max(.6,Math.min(2.6,z)):1,comparison:{open:q.get('compare')==='1',sides:[0,1].map(i=>({id:q.get('c'+i),part:Number(q.get('p'+i)||0)}))}};
}
export function viewLink(state,base){
 const u=new URL(base),q=new URLSearchParams({part:state.pi,view:state.view,node:state.selected,zoom:state.zoom});
 if(state.comparison?.open){q.set('compare','1');state.comparison.sides.forEach((s,i)=>{q.set('c'+i,s.id);q.set('p'+i,s.part);});}
 u.pathname='/clusters/'+state.cluster.id;u.search='';u.hash=state.cluster.id+'?'+q;return u.href;
}
function diagramSnapshot(){
 const original=document.querySelector('#visual svg');if(!original)return '';
 const copy=original.cloneNode(true),src=[original,...original.querySelectorAll('*')],dst=[copy,...copy.querySelectorAll('*')];
 src.forEach((el,i)=>{const style=getComputedStyle(el);for(const key of ['fill','stroke','stroke-width','stroke-opacity','fill-opacity','stroke-dasharray','font-size','font-family','font-weight','text-anchor','opacity'])dst[i].style.setProperty(key,style.getPropertyValue(key));dst[i].removeAttribute('tabindex');dst[i].removeAttribute('role');});
 copy.setAttribute('x','30');copy.setAttribute('y','100');copy.setAttribute('width','1040');copy.setAttribute('height','490');
 return new XMLSerializer().serializeToString(copy);
}
export function makeExport(state,clusters){
 const compare=state.comparison?.open;
 if(compare){
  const panels=state.comparison.sides.map(s=>makeExport({...state,cluster:clusters.find(c=>c.id===s.id),pi:s.part,selected:0,view:'inside',summaryOnly:true,comparison:{open:false}},clusters));
  const heights=panels.map(svg=>Number(/height="(\d+)"/.exec(svg)[1]));
  return '<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="'+(Math.max(...heights)+70)+'"><rect width="100%" height="100%" fill="white"/><text x="30" y="38" font-family="Arial" font-size="26" fill="#284657">Cluster Atlas · Side-by-side node configuration comparison</text>'+panels.map((svg,i)=>svg.replace('<svg ', '<svg x="'+i*1100+'" y="70" ')).join('')+'</svg>';
 }

 const entries=compare?state.comparison.sides.map(s=>({c:clusters.find(c=>c.id===s.id),pi:s.part})): [{c:state.cluster,pi:state.pi}];
 let y=35,body='';const text=(value,size=15,color='#284657')=>{const words=String(value??'Not verified').split(/\s+/);let line='';for(const word of words){for(let w of word.match(/.{1,110}/g)||['']){if((line+' '+w).length>110){body+=`<text x="30" y="${y}" font-size="${size}" fill="${color}">${esc(line)}</text>`;y+=size+8;line='';}line+=(line?' ':'')+w;}}body+=`<text x="30" y="${y}" font-size="${size}" fill="${color}">${esc(line)}</text>`;y+=size+10;};
 text(compare?'Cluster Atlas · Architecture comparison':'Cluster Atlas · '+state.cluster.name,24);
 text(compare?'Selected node configurations':`${state.view==='nodes'?'Node inventory summary':state.view==='inside'?'Inside a node':'Network'} · ${state.cluster.parts[state.pi].name} · illustrative node ${state.selected+1}`);
 if(!state.summaryOnly&&!compare&&state.view!=='nodes'){const svg=diagramSnapshot();if(svg){body+=svg;y=620;}}
 for(const {c,pi} of entries){const p=c.parts[pi];text(c.name+' · '+p.name,20);text(c.site+' · '+c.country);text('Scope: '+(c.profileScope||'Documented compute inventory'));
  const cards=[['CPU',(p.cpus??'?')+' × '+p.cpu],['ACCELERATOR',p.gpus===0?'None':(p.gpus??'?')+' × '+(p.gpu||'Not verified')],['MEMORY',p.ram],['DEVICE MEMORY',p.vram||'Not applicable']];
  for(const [label,value] of cards){body+=`<rect x="30" y="${y-17}" width="1040" height="32" rx="4" fill="#edf5f6"/>`;text(label+': '+value);y+=8;}
  text('Nodes of this type: '+(p.count??'Not verified'));text('Cluster interconnect: '+c.network+' · Topology: '+c.topology);text('Within node: '+p.link+' · Host link: '+p.hostLink);text('Storage: '+p.disk);
  text('Notes: '+c.notes,13);text('Checked: '+(c.checked||'13 September 2026')+' · Rankings: June 2026 TOP500',13);
  for(const s of c.sources){text(s.title,12);text(s.url,12);}y+=22;
 }
 text('Schematic only. Node indices are illustrative, not hostnames. Unknown fields do not mean absent hardware. Shared memory must not be counted twice. Exports are snapshots, not live inventory.',13);
 text('View: '+viewLink(state,location.href),12);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${y+25}" viewBox="0 0 1100 ${y+25}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial, sans-serif">${body}</g></svg>`;
}
export function initSharing(getState,clusters){
 const host=document.createElement('div');host.className='share-tools';host.innerHTML='<label>Share or export <select aria-label="Share or export scope"><option value="view">Cluster view</option><option value="comparison">Comparison</option></select></label><button data-share="copy">Copy view link</button><button data-share="svg">Export SVG</button><button data-share="png">Export PNG</button><span role="status" aria-live="polite"></span><input class="share-fallback" aria-label="Link to copy" readonly hidden>';
 document.querySelector('.clusterhead').after(host);
 const status=host.querySelector('[role=status]');
 host.addEventListener('click',async e=>{const button=e.target.closest('[data-share]');if(!button)return;const state=getState();state.comparison={...state.comparison,open:host.querySelector('select').value==='comparison'};host.querySelector('input').hidden=true;button.disabled=true;
 try{if(button.dataset.share==='copy'){const link=viewLink(state,location.href);try{await navigator.clipboard.writeText(link);status.textContent='Link copied.';}catch{const input=host.querySelector('input');input.hidden=false;input.value=link;input.focus();input.select();status.textContent='Copy the selected link.';}return;}
  status.textContent='Preparing export…';const svg=makeExport(state,clusters);let blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
  if(button.dataset.share==='png'){const url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG unavailable')),'image/png'));}finally{URL.revokeObjectURL(url);}}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cluster-atlas-'+(state.comparison.open?'comparison':state.cluster.id+'-'+state.view)+'.'+button.dataset.share;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='Export downloaded with sources.';
 }catch(err){status.textContent='Could not export. Try SVG or another browser.';}finally{button.disabled=false;}});
}
