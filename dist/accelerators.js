// Canonical identity is separate from the operator/catalog specification label.
// Match explicit model tokens only: an architecture such as Hopper is not a model.
export function acceleratorDevices(p){
 if(p.gpus===0)return [];
 const label=p.gpu||'';
 const definitions=[['NVIDIA',/\b(GH200|GB200|H100|H200|A100|A40|B200|V100)\b/gi],['AMD Instinct',/\b(MI100|MI210|MI250X|MI300A|MI300X)\b/gi],['AWS',/\b(Trainium2)\b/gi]];
 const devices=[];
 for(const [vendor,pattern] of definitions)for(const match of label.matchAll(pattern)){
  const model=vendor==='AWS'?'Trainium2':match[1].toUpperCase();
  const name=vendor+' '+model;
  if(!devices.some(d=>d.model===name))devices.push({model:name,specification:label,memory:p.vram||null,formFactor:/\b(SXM5|SXM)\b/i.exec(label)?.[1].toUpperCase()||null,mixed:!!p.mixed});
 }
 if(/Intel Data Center GPU Max/i.test(label))devices.push({model:'Intel Data Center GPU Max',specification:label,memory:p.vram||null,formFactor:null,mixed:!!p.mixed});
 return devices;
}
export function acceleratorModels(p){return p.gpus===0?['CPU only']:acceleratorDevices(p).map(d=>d.model);}
