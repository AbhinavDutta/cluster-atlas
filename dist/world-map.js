import {locationFor} from './locations.js';

export function initWorldMap(clusters, onSelect) {
  const root = document.querySelector('#worldMap');
  const locations=Object.fromEntries(clusters.map(c=>[c.id,locationFor(c)]));
  const mapped=clusters;
  const unknown=[];
  const escape = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let zoom=1, groups=[], activeId=null, chosen=[];
  root.innerHTML=`<details class="world-discovery" open><summary><span><span class="eyebrow">GLOBAL ATLAS</span><strong>Explore the world of compute</strong></span><span class="map-summary">${mapped.length} mapped clusters <span class="map-chevron">⌄</span></span></summary>
    <div class="world-layout"><div class="world-surface"><div class="world-toolbar"><span>Select a pin to explore</span><div><button type="button" data-map-zoom="-1" aria-label="Zoom world map out">−</button><button type="button" data-map-zoom="1" aria-label="Zoom world map in">+</button><button type="button" data-map-reset>Reset map</button></div></div>
    <div class="world-scroll" tabindex="0" role="region" aria-label="World map. Scroll or pinch to zoom; drag to pan."><div class="world-canvas"><img src="./world-land.svg" alt="" draggable="false"><div class="world-pins"></div></div></div>
    <div class="world-credit">All indexed clusters · Numbered pins contain every grouped system<br>Land: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · Scroll or pinch to zoom · Drag to pan<br>Dashed pins include country-level markers, not verified facility locations</div></div>
    <aside class="world-panel" aria-label="Clusters at selected map location"><div class="world-results" aria-live="polite"></div>${unknown.length?`<div class="world-unknown"><strong>Location not mapped</strong><p>City not verified in this catalog, or the system spans multiple sites.</p>${unknown.map(c=>`<button data-map-cluster="${c.id}">${escape(c.name)} <span>Explore ↗</span></button>`).join('')}</div>`:''}</aside></div></details>`;
  const canvas=root.querySelector('.world-canvas'), pins=root.querySelector('.world-pins'), results=root.querySelector('.world-results'), scroller=root.querySelector('.world-scroll');
  function showChoices(items) {
    chosen=items;
    results.innerHTML=items.length?`<h2>${items.length===1?'Selected location':`${items.length} nearby clusters`}</h2><p>Choose a system to open its architecture.</p>${items.map(c=>{const l=locations[c.id];return `<div class="world-choice"><button data-map-cluster="${c.id}" ${c.id===activeId?'aria-current="true"':''}><strong>${escape(c.name)} <span>↗</span></strong><small>${escape(l.city)}<br>${escape(c.country)}<br>${escape(l.precision)}</small></button><a href="${l.source}" target="_blank" rel="noopener noreferrer">Location source ↗</a></div>`}).join('')}`:'<h2>From a place to a processor</h2><p>Pick a pin to discover its clusters, then explore their nodes and interconnects.</p><div class="world-key"><i></i> Cluster location<br><b>2</b> Nearby or shared locations</div>';
  }
  function draw() {
    const width=Math.max(720,scroller.clientWidth)*zoom;
    canvas.style.width=width+'px';
    canvas.style.height=width*.45+'px';
    groups=[];
    for(const c of mapped){const l=locations[c.id],point={c,x:(l.lon+180)/360*width,y:(85-l.lat)/360*width};groups.push({points:[point]});}
    // Merge overlapping touch targets, including systems sharing one location.
    let merged=true;
    while(merged){merged=false;outer:for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      if(groups[i].points.some(a=>groups[j].points.some(b=>Math.hypot(a.x-b.x,a.y-b.y)<48))){groups[i].points.push(...groups[j].points);groups.splice(j,1);merged=true;break outer;}
    }}
    pins.innerHTML=groups.map((g,i)=>{const x=g.points.reduce((a,p)=>a+p.x,0)/g.points.length,y=g.points.reduce((a,p)=>a+p.y,0)/g.points.length,names=g.points.map(p=>p.c.name).join(', '),active=g.points.some(p=>p.c.id===activeId);return `<button class="world-pin ${g.points.some(p=>locations[p.c.id].approximate)?'approximate':''} ${active?'selected':''}" style="left:${x}px;top:${y}px" data-map-group="${i}" aria-label="${escape(g.points.length>1?`Choose from ${names}`:`Explore ${names}`)}" title="${escape(names)}"><span>${g.points.length>1?g.points.length:'●'}</span></button>`}).join('');
    root.querySelector('[data-map-zoom="-1"]').disabled=zoom<=1;
    root.querySelector('[data-map-zoom="1"]').disabled=zoom>=12;
  }
  function openCluster(id){const c=clusters.find(c=>c.id===id);if(c)onSelect(c);}
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.mapCluster){openCluster(b.dataset.mapCluster);return;}
    if(b.dataset.mapGroup!==undefined){const items=groups[Number(b.dataset.mapGroup)].points.map(p=>p.c);showChoices(items);if(items.length===1)openCluster(items[0].id);else {const first=results.querySelector('button');first.focus({preventScroll:true});first.scrollIntoView({block:'nearest',inline:'nearest'});}return;}
    if(b.hasAttribute('data-map-reset')){zoom=1;draw();scroller.scrollTo(0,0);showChoices([]);return;}
    if(b.dataset.mapZoom)setZoom(zoom*Math.pow(1.5,Number(b.dataset.mapZoom)),scroller.clientWidth/2,scroller.clientHeight/2);

  });
  function setZoom(value,x,y,previousX=x,previousY=y){
    const old=zoom;zoom=Math.max(1,Math.min(12,value));
    const cx=scroller.scrollLeft+previousX,cy=scroller.scrollTop+previousY;
    draw();scroller.scrollTo(cx*zoom/old-x,cy*zoom/old-y);
  }
  let wheelFrame=0,wheelDelta=0,wheelPoint;
  scroller.addEventListener('wheel',e=>{
    e.preventDefault();const r=scroller.getBoundingClientRect();wheelPoint=[e.clientX-r.left,e.clientY-r.top];
    wheelDelta+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?scroller.clientHeight:1);
    if(!wheelFrame)wheelFrame=requestAnimationFrame(()=>{wheelFrame=0;setZoom(zoom*Math.exp(-wheelDelta*.002),...wheelPoint);wheelDelta=0;});
  },{passive:false});
  const pointers=new Map();let gesture=null,suppressClick=false;
  function sample(){const p=[...pointers.values()];return p.length>1?{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}:{...p[0],d:0};}
  scroller.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=sample();
    if(pointers.size===1)suppressClick=false;
    if(pointers.size>1)suppressClick=true;
  });
  scroller.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=sample();
    if(!suppressClick&&Math.hypot(next.x-gesture.x,next.y-gesture.y)<5)return;
    suppressClick=true;scroller.setPointerCapture(e.pointerId);
    if(next.d&&gesture.d){const r=scroller.getBoundingClientRect();setZoom(zoom*next.d/gesture.d,next.x-r.left,next.y-r.top,gesture.x-r.left,gesture.y-r.top);}
    else scroller.scrollBy(gesture.x-next.x,gesture.y-next.y);
    gesture=next;
  });
  const release=e=>{pointers.delete(e.pointerId);gesture=pointers.size?sample():null;};
  scroller.addEventListener('pointerup',release);scroller.addEventListener('pointercancel',release);
  scroller.addEventListener('pointerleave',e=>{if(!scroller.hasPointerCapture(e.pointerId))release(e);});
  scroller.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
  new ResizeObserver(()=>draw()).observe(scroller);
  showChoices([]);draw();
  return {select(id){activeId=id;const c=clusters.find(c=>c.id===id);if(c&&locations[id])showChoices([c]);else showChoices([]);draw();}};
}
