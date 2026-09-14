const src=(title,url)=>({title,url});
const P=(name,count,cpu,cpus,gpu,gpus,ram,vram,link='Not verified',extra={})=>({name,count,cpu,cpus,gpu,gpus,ram,vram,link,hostLink:'Not verified',disk:'Not verified',...extra});
const C=(id,name,site,country,network,parts,sources,notes,extra={})=>({id,name,site,country,rank:null,rmax:null,network,topology:'Not verified',parts,sources,notes,checked:'14 September 2026',profileScope:'Documented compute profile',...extra});
const dgx=src('NVIDIA · DGX H100/H200 hardware','https://docs.nvidia.com/dgx/dgxh100-user-guide/');
const dgxa=src('NVIDIA · DGX A100 hardware','https://docs.nvidia.com/dgx/pdf/dgxa100-user-guide.pdf');
export const extraClusters=[
 C('stargate-abilene','Stargate · Abilene','OpenAI / Oracle Cloud Infrastructure','United States','OCI scale-out RDMA fabric; site-specific technology not verified',[
 P('GB200 platform · partial site profile',null,'NVIDIA Grace',null,'NVIDIA Blackwell (GB200)',null,'Not verified','Not verified','NVLink within GB200 NVL72 racks',{hostLink:'NVLink-C2C'})
 ],[src('OpenAI · Abilene infrastructure','https://openai.com/index/building-the-compute-infrastructure-for-the-intelligence-age/'),src('Oracle · GB200 NVL72 architecture','https://blogs.oracle.com/cloud-infrastructure/behind-the-scenes-nvidia-gb200-nvl72-oci-apis')],'Abilene site only, not the entire Stargate initiative. OpenAI confirms OCI and GB200. Oracle documents 72 GPUs per NVL72 rack; a rack is not treated as one compute node. Exact site inventory, per-node configuration and scale-out fabric are not verified.',{aliases:['stargate','openai stargate','stargate abilene'],profileScope:'Abilene site · partial public profile'}),
 C('colossus','Colossus','xAI','United States','NVIDIA Spectrum-X Ethernet / RDMA',[
 P('Hopper deployment · partial profile',null,'Not verified',null,'NVIDIA Hopper',null,'Not verified','Not verified')
 ],[src('NVIDIA · Colossus deployment, October 2024','https://nvidianews.nvidia.com/news/spectrum-x-ethernet-networking-xai-colossus')],'Historical October 2024 deployment snapshot: NVIDIA reported 100,000 Hopper GPUs in Memphis. This is not a current live inventory. Node count, CPUs, per-node accelerator count and memory are not verified here.',{aliases:['xai colossus'],profileScope:'October 2024 deployment snapshot'}),
 C('meta-rsc','Meta Research SuperCluster','Meta','United States','NVIDIA Quantum InfiniBand · 1,600 Gb/s per node (2022 report)',[
 P('DGX A100 · 2022 first phase',760,'AMD EPYC 7742',2,'NVIDIA A100',8,'Not verified','Not verified','NVLink / NVSwitch',{hostLink:'PCIe 4.0'})
 ],[src('Meta · RSC first-phase architecture','https://ai.meta.com/blog/ai-rsc/'),dgxa],'January 2022 first-phase snapshot: 760 DGX A100 systems / 6,080 GPUs. Later expansion plans are not counted as installed hardware. CPU and on-node links follow the documented DGX A100 platform; installed memory variant is unverified.',{aliases:['rsc','meta rsc','research supercluster'],profileScope:'January 2022 first-phase snapshot'}),
 C('rainier','Project Rainier','AWS / Anthropic','United States','AWS Elastic Fabric Adapter (EFAv3) · 3.2 Tb/s per Trn2 instance',[
 P('Trn2 instance · representative building block',null,'Host CPU model not verified · 192 vCPUs per instance',null,'AWS Trainium2',16,'2 TB host memory (instance specification)','1.5 TB HBM3 across 16 chips','NeuronLink',{disk:'4 × 1.92 TB NVMe (instance specification)',acceleratorLabel:'AI chip',compact:true})
 ],[src('Amazon · Project Rainier deployment','https://www.aboutamazon.com/news/aws/aws-project-rainier-ai-trainium-chips-compute-cluster'),src('AWS · Trn2 instance and UltraServer specifications','https://aws.amazon.com/ec2/instance-types/trn2/')],'Multi-site compute cluster; no single city pin. A representative Trn2 instance has 16 Trainium2 chips; four instances form a 64-chip UltraServer. The reported approximately half-million-chip deployment is not converted into an exact node count. Trainium chips are AI accelerators, not GPUs.',{aliases:['aws rainier','anthropic rainier','project rainier'],profileScope:'Multi-site cluster · representative Trn2 instance'}),
 C('polaris','Polaris','Argonne Leadership Computing Facility','United States','HPE Slingshot 11 · two adapters per node',[
 P('A100 compute',560,'AMD EPYC 7543P · 32 cores',1,'NVIDIA A100',4,'512 GiB DDR4','40 GiB per GPU','NVLink · all GPU pairs',{hostLink:'PCIe 4.0',nic:2,disk:'2 × 1.6 TB SSD in RAID0'})
 ],[src('ALCF · Polaris machine overview','https://docs.alcf.anl.gov/polaris/')],'Compute nodes only; login, gateway and service nodes are excluded.'),
 C('frontera','Frontera','Texas Advanced Computing Center','United States','InfiniBand HDR',[
 P('Cascade Lake main partition',8008,'Intel Xeon Platinum 8280 · 28 cores',2,null,0,'192 GB DDR4',null,'Not applicable')
 ],[src('TACC · Frontera guide','https://docs.tacc.utexas.edu/hpc/frontera/'),src('TACC · main compute configuration','https://frontera-portal.tacc.utexas.edu/media/filer_public/47/66/4766f78d-dc63-465c-b731-ef6dc31d7b12/01_welcome_frontera-ug-jan2021-stanzione.pdf')],'Main CPU partition only. Large-memory nodes and auxiliary accelerator systems are not included in these totals.',{profileScope:'Main CPU partition'}),
 C('derecho','Derecho','NSF NCAR · Wyoming Supercomputing Center','United States','HPE Slingshot 11 · 200 Gb/s per port',[
 P('CPU compute',2488,'AMD EPYC 7763 · 64 cores',2,null,0,'256 GB DDR4',null,'Not applicable',{nic:1}),
 P('A100 compute',82,'AMD EPYC 7763 · 64 cores',1,'NVIDIA A100',4,'512 GB DDR4','40 GB HBM2 per GPU','NVLink',{nic:4})
 ],[src('NCAR · Derecho hardware','https://ncar-hpc-docs.readthedocs.io/en/latest/compute-systems/derecho/')],'Production CPU and GPU compute nodes only; login and development nodes excluded.',{topology:'Dragonfly'}),
 C('sophia','Sophia','Argonne Leadership Computing Facility','United States','InfiniBand HDR200 · 8 compute ports per node',[
 P('DGX A100 · 40 GB',22,'AMD Rome · 64 cores',2,'NVIDIA A100',8,'1 TB DDR4','40 GB per GPU','NVLink / NVSwitch',{nic:8,disk:'4 × 3.84 TB NVMe'}),
 P('DGX A100 · 80 GB',2,'AMD Rome · 64 cores',2,'NVIDIA A100',8,'2 TB DDR4','80 GB per GPU','NVLink / NVSwitch',{nic:8,disk:'4 × 3.84 TB NVMe'})
 ],[src('ALCF · Sophia machine overview','https://docs.alcf.anl.gov/sophia/'),dgxa],'Twenty-two 320 GB GPU-memory nodes and two 640 GB GPU-memory nodes. Memory capacities are kept separate by node type.',{topology:'Fat-tree'}),
 C('juwels-booster','JUWELS Booster','Jülich Supercomputing Centre','Germany','InfiniBand HDR200 · 4 adapters per node',[
 P('A100 booster',936,'AMD EPYC 7402 · 24 cores',2,'NVIDIA A100',4,'512 GB DDR4','40 GB per GPU','NVLink 3 · all GPU pairs',{nic:4,hostLink:'PCIe 4.0'})
 ],[src('JSC · JUWELS Booster overview','https://apps.fz-juelich.de/jsc/hps/juwels/booster-overview.html')],'Booster module only; JUWELS Cluster module excluded.',{topology:'Dragonfly+',profileScope:'Booster module'}),
 C('israel-1','Israel-1','NVIDIA','Israel','NVIDIA Spectrum-X Ethernet · Spectrum-4 / BlueField-3',[
 P('Dell XE9680 / HGX H100',null,'Intel Xeon Platinum 8480+ · 56 cores',null,'NVIDIA H100',8,'Not verified','Not verified','NVLink / NVSwitch')
 ],[src('NVIDIA · Israel-1 platform','https://www.nvidia.com/en-sg/news/nvidia-launches-accelerated-ethernet-platform-for-hyperscale-generative-ai/'),src('TOP500 · June 2026 listing (#59)','https://top500.org/lists/top500/list/2026/06/')],'NVIDIA confirms the HGX H100 eight-GPU server platform. Installed node count and memory are not verified here.',{aliases:['nvidia israel1']}),
 C('expanse','Expanse','San Diego Supercomputer Center','United States','InfiniBand HDR',[
 P('Standard CPU',728,'AMD EPYC 7742 · 64 cores',2,null,0,'256 GB DRAM',null,'Not applicable',{disk:'1 TB NVMe'}),
 P('V100 GPU',52,'Intel Xeon Gold 6248 · 20 cores',2,'NVIDIA V100',4,'384 GB DRAM','32 GB per GPU','NVLink',{disk:'1.6 TB NVMe'})
 ],[src('SDSC · Expanse configuration','https://www.sdsc.edu/systems/expanse/index.html')],'Standard CPU and GPU partitions only. Four large-memory nodes are excluded from this profile pending detailed verification.',{profileScope:'Standard CPU and GPU partitions'}),
 C('stampede3','Stampede3','Texas Advanced Computing Center','United States','Intel Omni-Path (CPU partitions)',[
 P('Sapphire Rapids HBM',560,'Intel Xeon CPU Max 9480 · 56 cores',2,null,0,'128 GB HBM2e',null,'Not applicable',{disk:'150 GB /tmp'}),
 P('Skylake',1060,'Intel Xeon Platinum 8160 · 24 cores',2,null,0,'192 GB DDR4',null,'Not applicable',{disk:'90 GB /tmp'})
 ],[src('TACC · Stampede3 guide','https://docs.tacc.utexas.edu/hpc/stampede3/')],'Sapphire Rapids and Skylake CPU partitions only. Ice Lake and accelerator partitions are outside this profile; totals are not the whole installation.',{profileScope:'Sapphire Rapids and Skylake CPU partitions'})
];

export function enrichRanked(c){
 const add=(p,url,notes)=>{c.parts=[p];c.sources.push(src('Operator · node architecture',url));c.notes=notes;};
 if(c.rank===11)add(P('LUMI-G',2978,'AMD EPYC Trento · 64 cores',1,'AMD MI250X',4,'512 GiB DDR4','128 GB per physical accelerator','Infinity Fabric',{nic:4}),'https://docs.lumi-supercomputer.eu/hardware/lumig/','LUMI-G partition only. Each physical MI250X contains two GPU dies; diagram counts physical accelerators. LUMI-C and LUMI-D are outside this profile.');
 if(c.rank===12)add(P('Booster',3456,'Intel Xeon Platinum 8358 · 32 cores',1,'NVIDIA A100',4,'512 GiB DDR4','64 GB per GPU'),'https://docs.hpc.cineca.it/hpc/leonardo.html','Booster partition only. Leonardo general-purpose CPU partition is excluded.');
 if(c.rank===13)add(P('GH200 compute',1320,'NVIDIA Grace · 72 cores',4,'NVIDIA Hopper (GH200)',4,'480 GB LPDDR5X · 460 GB usable','96 GB per GPU','NVLink',{hostLink:'NVLink-C2C',paired:true,nic:4}),'https://docs.isambard.ac.uk/specs/','Phase 2 only: 1,320 compute nodes. The 42 Phase 1 nodes and login nodes are excluded. Four 200 Gb/s Slingshot 11 adapters per compute node.');
 if(c.rank===14){add(P('MI300A compute',1144,'AMD Zen 4 · 24 cores per MI300A',4,'AMD MI300A',4,'512 GB unified HBM3 per node','128 GB shared CPU/GPU memory per APU','Infinity Fabric',{hostLink:'Infinity Fabric',apu:true}),'https://hpc.llnl.gov/hardware/compute-platforms/tuolumne','1,144 compute nodes (1,100 batch + 44 debug); the published 1,152 total includes eight login nodes. CPU cores and GPU share memory within each MI300A; unified memory is not an additional separate RAM allocation.');c.sources.push(src('LLNL · Tuolumne node count','https://psaap.llnl.gov/computer-resource-team'));}
 if(c.rank===19)add(P('H200 compute',766,'Intel Xeon Platinum 8558 · 48 cores',2,'NVIDIA H200',8,'2 TB DDR5','141 GB HBM3e per GPU','Not verified',{nic:8,disk:'2 × 7.68 TB NVMe'}),'https://abci.ai/en/about_abci/computing_resource.html','766 compute nodes. Eight NDR200 compute-network ports per node; a separate HDR connection serves storage. Local GPU and host wiring remain unverified in this profile.');
 if(c.parts[0].name.startsWith('NVIDIA DGX H100')){
  Object.assign(c.parts[0],{name:'DGX H100 platform',cpus:2,gpus:8,ram:'2 TB (DGX H100 platform specification)',vram:'80 GB per GPU',link:'NVLink / NVSwitch',hostLink:'PCIe 5.0'});c.sources.push(dgx);c.notes+=' Per-node CPU/GPU counts, RAM and local links use NVIDIA DGX H100 platform specifications; operator-specific modifications are not verified.';
 }
 if(c.rank===45){Object.assign(c.parts[0],{name:'DGX A100 platform',cpus:2,gpus:8,link:'NVLink / NVSwitch',hostLink:'PCIe 4.0'});c.sources.push(dgxa);c.notes+=' DGX A100 node counts and local links follow NVIDIA platform documentation; installed memory variant is unverified.';}
 return c;
}
