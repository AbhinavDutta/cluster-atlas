import {top50} from './top50.js';
import {extraClusters,enrichRanked} from './catalog-expansion.js';
import {enrichCluster} from './enrich.js';
import {source} from './sources.js';
const TOP=source("TOP500 · June 2026","https://www.top500.org/lists/top500/2026/06/");
const P=(name,count,cpu,cpus,gpu,gpus,ram,vram,link="Not verified",extra={})=>({name,count,cpu,cpus,gpu,gpus,ram,vram,link,disk:"Not verified",hostLink:"Not verified",...extra});
const S=(id,name,site,country,rank,rmax,network,topology,parts,sources,notes="")=>({id,name,site,country,rank,rmax,network,topology,parts,sources:[...(rank?[TOP]:[]),...sources],notes});
export const clusters=[
S("perlmutter","Perlmutter","NERSC · Berkeley Lab","United States",null,null,"HPE Slingshot 11 · 200 Gb/s per NIC","Dragonfly",[
 P("GPU · A100 40 GB",1536,"AMD EPYC 7763 · 64 cores",1,"NVIDIA A100",4,"256 GB DDR4","40 GB HBM2 per GPU","NVLink 3 · all GPU pairs",{hostLink:"PCIe 4.0",nic:4,groupSize:64,disk:"Shared Lustre scratch; local compute disk not documented"}),
 P("GPU · A100 80 GB",256,"AMD EPYC 7763 · 64 cores",1,"NVIDIA A100",4,"256 GB DDR4","80 GB HBM2e per GPU","NVLink 3 · all GPU pairs",{hostLink:"PCIe 4.0",nic:4,groupSize:64}),
 P("CPU only",3072,"AMD EPYC 7763 · 64 cores",2,null,0,"512 GB DDR4",null,"Not applicable",{hostLink:"PCIe 4.0",nic:1,groupSize:256})
],[source("NERSC · architecture","https://docs.nersc.gov/systems/perlmutter/architecture/")],"Compute nodes only. GPU groups contain 64 nodes; CPU groups contain 256. Network has 16 switches per group. Overview samples groups, not physical cable routes."),
S("lineshine","LineShine","National Supercomputing Centre · Shenzhen","China",1,2198.4,"LingQi","Not verified",[
 P("LX2 compute",null,"LX2 · 304 cores · 1.55 GHz",null,null,0,"Not verified",null)
],[],"TOP500 verifies the processor and fabric. Node count, socket count, memory and topology are not yet verified in this catalog; only a representative node is shown."),
S("el-capitan","El Capitan","Lawrence Livermore National Laboratory","United States",2,1809,"HPE Slingshot 11","Dragonfly",[
 P("MI300A compute",11520,"AMD Zen 4 · 24 cores per APU",4,"AMD MI300A",4,"512 GiB unified HBM3","Shared with CPU","Infinity Fabric",{apu:true,hostLink:"On-package Infinity Fabric",nic:4})
],[source("LLNL · hardware overview","https://hpc.llnl.gov/documentation/user-guides/using-el-capitan-systems/hardware-overview")],"Four APUs per node: each combines CPU and GPU with 128 GiB shared memory. Installed node count differs from the benchmark configuration."),
S("frontier","Frontier","Oak Ridge National Laboratory","United States",3,1353,"HPE Slingshot 11 · 200 Gb/s per NIC","Dragonfly",[
 P("MI250X compute",9856,"AMD optimized EPYC · 64 cores",1,"AMD Instinct MI250X",4,"512 GB DDR4","128 GB HBM2e per accelerator","Infinity Fabric",{hostLink:"Infinity Fabric",nic:4,disk:"2 × 1.92 TB NVMe SSD"})
],[source("OLCF · Frontier user guide","https://docs.olcf.ornl.gov/systems/frontier_user_guide.html")],"Each MI250X has two GPU compute dies: four physical accelerators appear as eight logical GPU devices. Diagram counts physical accelerators."),
S("aurora","Aurora","Argonne National Laboratory","United States",4,1012,"HPE Slingshot 11 · 200 Gb/s per endpoint","Dragonfly",[
 P("GPU Max compute",10624,"Intel Xeon CPU Max 9470 · 52 cores",2,"Intel Data Center GPU Max",6,"1,024 GB DDR5 + 128 GB CPU HBM","128 GB HBM per GPU","Xe Link",{hostLink:"PCIe",nic:8})
],[source("ALCF · Aurora","https://www.alcf.anl.gov/aurora")],"Six physical GPUs per node, each with two tiles. On-node links are summarized; not an exact PCIe switch map."),
S("jupiter","JUPITER Booster","Jülich Supercomputing Centre","Germany",5,1000,"InfiniBand NDR200 · 4 rails per node","Dragonfly+",[
 P("GH200 booster",5884,"NVIDIA Grace · 72 cores",4,"NVIDIA Hopper (GH200)",4,"480 GB LPDDR5X","96 GB HBM3 per GPU","NVLink 4 · all GPU pairs",{hostLink:"NVLink-C2C",nic:4,paired:true})
],[source("JSC · configuration","https://apps.fz-juelich.de/jsc/hps/jupiter/configuration.html"),source("JSC · network topology","https://www.fz-juelich.de/en/jsc/jupiter/tech")],"Booster module only. Each Grace CPU is paired with a Hopper GPU; the Cluster module is outside this profile."),
S("hpc7","HPC7","Eni · Green Data Center","Italy",6,571.5,"HPE Slingshot 11","Not verified",[
 P("MI300A compute",null,"AMD Zen 4 · 24 cores per APU",4,"AMD MI300A",4,"Not verified","Unified HBM3; capacity not verified","Infinity Fabric",{apu:true,hostLink:"On-package Infinity Fabric"})
],[source("Eni · HPC7 announcement","https://www.eni.com/en-IT/media/press-release/2026/06/eni-ranks-as-world-s-leading-company-top500-global-ranking.html")],"Eni reports over 3,400 nodes. Exact installed count is not verified here, so a representative node is shown."),
S("eagle","Eagle","Microsoft Azure","United States",7,561.2,"NVIDIA InfiniBand NDR","Not verified",[
 P("ND H100 v5",null,"Intel Xeon Platinum 8480C",null,"NVIDIA H100",8,"1,900 GiB (VM specification)","80 GB per GPU","NVLink 4 · all GPU pairs through NVSwitch",{
  hostLink:"PCIe 5.0",
  systemModel:"Microsoft ND H100 v5 (Azure Standard_ND96isr_H100_v5)",
  physicalCores:96,
  cpuNote:"Microsoft states the instance has 96 physical 4th Gen Intel Xeon Scalable cores, while the VM size reports 96 vCPUs. The host socket layout behind that allocation is not published.",
  disk:"1,024 GiB temporary disk (VM specification)",
  nvme:"Up to 8 × 28 TiB NVMe data disks (VM specification)",
  remoteDisks:32,
  diskIops:40800,
  diskThroughputMBps:612,
  nic:8,
  nicModel:"NVIDIA Quantum-2 CX7 InfiniBand",
  nicSpeed:"400 Gb/s per adapter",
  nicTopology:"One dedicated, topology-agnostic adapter per GPU",
  aggregateScaleOut:"3.2 Tb/s per VM",
  gpuDirect:true,
  onNodeFabric:"NVLink 4 within the VM"
})
],[source("Microsoft · ND H100 v5","https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series")],"The node model uses public ND H100 v5 VM specifications. Exact benchmark VM count, the physical host socket allocation behind the 96 reported vCPUs, and the scale-set topology are not verified."),
S("hpc6","HPC6","Eni · Green Data Center","Italy",8,477.9,"HPE Slingshot","Not verified",[
 P("MI250X compute",3472,"AMD EPYC · 64 cores",1,"AMD Instinct MI250X",4,"Not verified","Not verified","Not verified")
],[source("Eni · HPC6 technology","https://www.eni.com/visual-design/infographics/hpc6-longform/en/technology/")],"Installed configuration. Detailed memory and on-node wiring are not verified in this profile."),
S("fugaku","Fugaku","RIKEN Center for Computational Science","Japan",9,442.01,"Tofu interconnect D","6D mesh / torus",[
 P("A64FX compute",158976,"Fujitsu A64FX · 48 compute cores",1,null,0,"32 GiB HBM2",null,"Not applicable")
],[source("RIKEN · Fugaku","https://www.r-ccs.riken.jp/en/fugaku/about/index.html"),source("RIKEN · node specification","https://www.r-ccs.riken.jp/assets/uploads/2023/11/hpc_checklist_fugaku.pdf")],"The overview is a 2D projection of the 6D network, with omitted dimensions and wraparound links. Nodes connect through integrated network interfaces."),
S("alps","Alps","Swiss National Supercomputing Centre","Switzerland",10,434.9,"HPE Slingshot 11 · 200 Gb/s per GPU","Not verified",[
 P("GH200",2688,"NVIDIA Grace · 72 cores",4,"NVIDIA Hopper (GH200)",4,"512 GB LPDDR5X","96 GB HBM3 per GPU","NVLink",{hostLink:"NVLink-C2C",paired:true,nic:4}),
 P("CPU · Rome",1024,"AMD EPYC 7742 · 64 cores",2,null,0,"256 / 512 GB DDR (variant unspecified)",null),
 P("A100",144,"AMD EPYC · 64 cores",1,"NVIDIA A100",4,"128 GB","80 / 96 GB (operator listing)"),
 P("MI300A",128,"AMD Zen 4 (MI300A)",4,"AMD MI300A",4,"Not verified","Unified memory","Infinity Fabric",{apu:true}),
 P("MI250X",24,"AMD EPYC · 64 cores",1,"AMD MI250X",4,"128 GB","Not verified")
],[source("CSCS · Alps system specification","https://www.cscs.ch/computers/alps")],"Alps includes several node architectures. HPL ranking refers to the benchmarked system; the catalog includes all five operator-listed node types."),
S("delta","Delta","NCSA · University of Illinois","United States",null,null,"HPE Slingshot 11 · 200 Gb/s","Not verified",[
 P("A100 ×4",100,"AMD EPYC 7763 · 64 cores",1,"NVIDIA A100",4,"256 GB","40 GB per GPU","NVLink · all GPU pairs",{hostLink:"PCIe 4.0",disk:"1.5 TB local"}),
 P("A40 ×4",100,"AMD EPYC 7763 · 64 cores",1,"NVIDIA A40",4,"256 GB","48 GB per GPU","PCIe via host; no direct NVLink in operator map",{hostLink:"PCIe 4.0",disk:"1.5 TB local",noGpuLinks:true}),
 P("CPU only",132,"AMD EPYC 7763 · 64 cores",2,null,0,"256 GB",null,"Not applicable",{disk:"0.74 TB local",hostLink:"PCIe 4.0"}),
 P("A100 ×8",6,"AMD EPYC 7763 · 64 cores",2,"NVIDIA A100",8,"2,048 GB","40 GB per GPU","NVLink / NVSwitch",{hostLink:"PCIe 4.0",disk:"1.5 TB local"}),
 P("H200 ×8",8,"Intel Xeon Platinum 8558 · 48 cores",2,"NVIDIA H200",8,"2,048 GB","141 GB per GPU"),
 P("MI100 / MI210",1,"AMD Milan · 64 cores",2,"8 × MI100 + 1 × MI210",9,"2,048 GB","32 GB per GPU (operator table)","Not verified",{disk:"1.5 TB local",mixed:true})
],[source("NCSA · Delta architecture","https://docs.ncsa.illinois.edu/systems/delta/en/latest/user_guide/architecture.html")],"Compute-node counts follow individual specification tables. The operator page's introductory large-memory count is inconsistent with those tables."),
S("deltaai","DeltaAI","NCSA · University of Illinois","United States",null,null,"HPE Slingshot 11 · 4 × 200 Gb/s","Not verified",[
 P("GH200 ×4",152,"NVIDIA Grace · 72 cores",4,"NVIDIA Hopper (GH200)",4,"480 GB LPDDR5","96 GB HBM3 per GPU","NVLink · all GPU pairs",{hostLink:"NVLink-C2C",paired:true,nic:4,disk:"3.9 TB local"})
],[source("NCSA · DeltaAI architecture","https://docs.ncsa.illinois.edu/systems/deltaai/en/latest/user-guide/architecture.html")],"152 compute nodes: 132 NSF/NAIRR-funded and 20 Illinois Computes-funded. Four Grace-Hopper superchips per node.")
];
// Preserve richer existing profiles and stable links; update their ranking metadata.
for(const record of top50){
 const existing=clusters.find(c=>c.id===record.id || c.rank===record.rank || (record.rank===9&&c.id==='fugaku') || (record.rank===5&&c.id==='jupiter'));
 if(existing){existing.rank=record.rank;existing.rmax=record.rmax;if(!existing.sources.some(s=>s.url===record.sources[1].url))existing.sources.push(record.sources[1]);}
 else clusters.push(enrichRanked(record));
}
clusters.push(...extraClusters);
// Attach published ranking fields and documented platform specifications, then
// record which public fields each profile is still missing.
clusters.forEach(enrichCluster);
export const catalogDate="13 September 2026";
export function normalize(s){return s.toLowerCase().replace(/[^a-z0-9]/g,"")}
export function distance(a,b){let v=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let w=[i];for(let j=1;j<=b.length;j++)w[j]=Math.min(w[j-1]+1,v[j]+1,v[j-1]+(a[i-1]!==b[j-1]));v=w}return v[b.length]}
export function matchCluster(query){let q=normalize(query);if(!q)return null;let ranked=clusters.map(c=>{let names=[c.id,c.name,...(c.aliases||[]),...(c.id==="jupiter"?["jupiter"]:[])].map(normalize);let exact=names.some(n=>q===n);let contained=names.filter(n=>q.includes(n)).sort((a,b)=>b.length-a.length)[0];let words=query.toLowerCase().split(/\s+/).map(normalize).filter(Boolean);let d=Math.min(...names.flatMap(n=>[q,...words].map(w=>distance(n,w)/Math.max(n.length,w.length))));return {c,score:exact?2:contained?1+contained.length/100:1-d}}).sort((a,b)=>b.score-a.score);return ranked[0].score>=.73?ranked[0].c:null}

