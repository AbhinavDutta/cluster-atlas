import {locations} from './locations.js';

export function initWorldMap(clusters, onSelect) {
  const root = document.querySelector('#worldMap');
  const mapped = clusters.filter(c=>locations[c.id]);
  const unknown = clusters.filter(c=>!locations[c.id]);
  const escape = s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let zoom=1, groups=[], activeId=null, chosen=[];
  root.innerHTML=`<details class="world-discovery" open><summary><span><span class="eyebrow">GLOBAL ATLAS</span><strong>Explore the world of compute</strong></span><span class="map-summary">${mapped.length} mapped clusters <span class="map-chevron">⌄</span></span></summary>
    <div class="world-layout"><div class="world-surface"><div class="world-toolbar"><span>Select a pin to explore</span><div><button type="button" data-map-zoom="-1" aria-label="Zoom world map out">−</button><button type="button" data-map-zoom="1" aria-label="Zoom world map in">+</button><button type="button" data-map-reset>Reset map</button></div></div>
    <div class="world-scroll" tabindex="0" role="region" aria-label="World map. Scroll to pan; use zoom buttons to enlarge."><div class="world-canvas"><img src="./world-land.svg" alt="" draggable="false"><div class="world-pins"></div></div></div>
    <div class="world-credit">Approximate city locations · Numbered pins group nearby clusters<br>Land: <a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Natural Earth</a> · Scroll to pan</div></div>
    <aside class="world-panel" aria-label="Clusters at selected map location"><div class="world-results" aria-live="polite"></div>${unknown.length?`<div class="world-unknown"><strong>Location not mapped</strong><p>City not verified in this catalog, or the system spans multiple sites.</p>${unknown.map(c=>`<button data-map-cluster="${c.id}">${escape(c.name)} <span>Explore ↗</span></button>`).join('')}</div>`:''}</aside></div></details>`;
  const canvas=root.querySelector('.world-canvas'), pins=root.querySelector('.world-pins'), results=root.querySelector('.world-results'), scroller=root.querySelector('.world-scroll');
  function showChoices(items) {
    chosen=items;
    results.innerHTML=items.length?`<h2>${items.length===1?'Selected location':`${items.length} nearby clusters`}</h2><p>Choose a system to open its architecture.</p>${items.map(c=>{const l=locations[c.id];return `<div class="world-choice"><button data-map-cluster="${c.id}" ${c.id===activeId?'aria-current="true"':''}><strong>${escape(c.name)} <span>↗</span></strong><small>${escape(l.city)}<br>${escape(c.country)}</small></button><a href="${l.source}" target="_blank" rel="noopener noreferrer">Location source ↗</a></div>`}).join('')}`:'<h2>From a place to a processor</h2><p>Pick a pin to discover its clusters, then explore their nodes and interconnects.</p><div class="world-key"><i></i> Cluster location<br><b>2</b> Nearby or shared locations</div>';
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
    pins.innerHTML=groups.map((g,i)=>{const x=g.points.reduce((a,p)=>a+p.x,0)/g.points.length,y=g.points.reduce((a,p)=>a+p.y,0)/g.points.length,names=g.points.map(p=>p.c.name).join(', '),active=g.points.some(p=>p.c.id===activeId);return `<button class="world-pin ${active?'selected':''}" style="left:${x}px;top:${y}px" data-map-group="${i}" aria-label="${escape(g.points.length>1?`Choose from ${names}`:`Explore ${names}`)}" title="${escape(names)}"><span>${g.points.length>1?g.points.length:'●'}</span></button>`}).join('');
    root.querySelector('[data-map-zoom="-1"]').disabled=zoom===1;
    root.querySelector('[data-map-zoom="1"]').disabled=zoom===4;
  }
  function openCluster(id){const c=clusters.find(c=>c.id===id);if(c)onSelect(c);}
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.mapCluster){openCluster(b.dataset.mapCluster);return;}
    if(b.dataset.mapGroup!==undefined){const items=groups[Number(b.dataset.mapGroup)].points.map(p=>p.c);showChoices(items);if(items.length===1)openCluster(items[0].id);else {const first=results.querySelector('button');first.focus({preventScroll:true});first.scrollIntoView({block:'nearest',inline:'nearest'});}return;}
    if(b.hasAttribute('data-map-reset')){zoom=1;draw();scroller.scrollTo(0,0);showChoices([]);return;}
    if(b.dataset.mapZoom){const old=zoom;zoom=Math.max(1,Math.min(4,zoom+Number(b.dataset.mapZoom)));const cx=scroller.scrollLeft+scroller.clientWidth/2,cy=scroller.scrollTop+scroller.clientHeight/2;draw();scroller.scrollTo(cx*zoom/old-scroller.clientWidth/2,cy*zoom/old-scroller.clientHeight/2);}
  });
  new ResizeObserver(()=>draw()).observe(scroller);
  showChoices([]);draw();
  return {select(id){activeId=id;const c=clusters.find(c=>c.id===id);if(c&&locations[id])showChoices([c]);else showChoices([]);draw();}};
}
