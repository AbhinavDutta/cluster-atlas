// Researched facts that the generated ranking snapshot does not carry.
//
// dist/top50.js is regenerated wholesale by scripts/import-top50.py, so any edit
// made there is lost at the next import. Hand-researched detail therefore lives
// here, keyed by cluster id, and is merged over the imported record before
// enrichment runs. Curated profiles in data.js do not need an entry — they are
// already hand-maintained.
//
// Every value must be traceable to a source listed in the same entry. A field
// nobody publishes is simply left out: the catalog reports a gap rather than a
// guess, and the completeness ledger depends on that being true.

export const enrichment = {
  'venado': {
    os: 'Linux',
    // hpc.lanl.gov is login-gated, so there is no public LANL system page. These
    // figures come from LANL's own presentation decks published through OSTI,
    // the DOE technical-report repository.
    sources: [
      {title: 'TOP500 · Venado system record', url: 'https://top500.org/system/180246/'},
      {title: 'LANL · Venado partitions (LA-UR-25-20378)', url: 'https://www.osti.gov/servlets/purl/2506977'},
      {title: 'LANL · a first look at Grace/Grace performance', url: 'https://www.osti.gov/servlets/purl/2283350'}
    ],
    notes: 'Venado has two partitions, which the ranking submission collapses into one entry. Both follow LANL presentation decks published through OSTI. Three figures are disputed and are recorded conservatively: the deck labels the accelerator "H200 with 96GB HBM2" while TOP500 names a GH200 Superchip, so only the 96 GB capacity is carried; LANL gives 3.4 and 3.45 GHz against TOP500\'s 3.1 GHz; and LANL writes the Slingshot rate as 200GB/s where Slingshot 11 ports are 200 Gb/s. The TOP500 core count of 481,440 does not reconcile with the partitions as published, which total 316,800 CPU cores. Network topology and node-local storage are not published for Venado.',
    parts: {
      0: {
        name: 'Grace–Hopper (CG1)',
        systemModel: 'HPE Cray EX254n (Blanca Peak blade)',
        count: 640,
        cpu: 'NVIDIA Grace · 72 cores',
        cpus: 4,
        coresPerSocket: 72,
        physicalCores: 288,
        gpus: 4,
        ram: '480 GB LPDDR5 (120 GB per socket)',
        vram: '96 GB per GPU',
        nic: 4,
        nicModel: 'HPE Cray Cassini (Slingshot 11)',
        nicSpeed: '200 Gb/s per socket',
        nicTopology: 'A dedicated Slingshot adapter per Grace Hopper superchip'
      }
    },
    addParts: [{
      name: 'Grace–Grace (C2)',
      systemModel: 'HPE Cray EX254n (Paradise blade)',
      count: 920,
      cpu: 'NVIDIA Grace · 72 cores',
      cpus: 2,
      coresPerSocket: 72,
      physicalCores: 144,
      gpu: null,
      gpus: 0,
      ram: '240 GB LPDDR5 (120 GB per socket)',
      vram: 'Not applicable',
      link: 'Not applicable',
      hostLink: 'Not applicable',
      disk: 'Not verified',
      nic: 2,
      nicModel: 'HPE Cray Cassini (Slingshot 11)',
      nicSpeed: '200 Gb/s per socket'
    }]
  },

  'lineshine': {
    sources: [{title: 'National Supercomputing Centre in Shenzhen', url: 'https://www.nsccsz.cn/'}],
    notes: 'The operator\'s site carries news of the ranking but publishes no hardware specification page for the system, so node count, memory and on-node wiring are unavailable rather than merely unlocated.'
  },

  'cassava-ai-factory': {
    sources: [{title: 'Cassava Technologies · NVIDIA-powered AI factories', url: 'https://www.cassavatechnologies.com/cassava-scales-african-ai-infrastructure-with-nvidia-powered-ai-factories-to-accelerate-sovereign-data-capabilities/'}],
    notes: 'Neither Cassava Technologies nor Africa Data Centres publishes a hardware specification for this system; their pages name NVIDIA accelerators and NVIDIA Cloud Partner reference architectures without a configuration. The Cape Town facility page gives building and power figures only. Accelerators per node follow the documented HPE Cray XD670 chassis.'
  },

  'maximus-02': {
    sources: [{title: 'Core42 · AI Cloud', url: 'https://www.core42.ai/products/ai-cloud'}],
    notes: 'The name MAXIMUS-02 does not appear on any Core42 or G42 property. Core42 publishes a company-wide fleet figure and an H200 product listing, neither scoped to this cluster, so no node-level field is recorded from them.'
  },

  'ai-03': {
    sources: [{title: 'Core42 · AI Cloud industrialising intelligence at frontier scale', url: 'https://www.core42.ai/resources/whitepapers/how-core42-ai-cloud-industrializes-intelligence-at-frontier-scale'}],
    notes: 'Core42 acknowledges only "the AMD MI210 system at #38" and publishes no configuration. Accelerators per node are not recorded because the Supermicro AS-4125GS-TNRT2 chassis takes up to ten double-width PCIe GPUs, so the chassis does not fix a per-node count the way an eight-GPU baseboard would.'
  },

  'shakti-cloud': {
    sources: [{title: 'Yotta · Shakti Cloud bare-metal service', url: 'https://shakticloud.ai/bare-metal-service/'}],
    notes: 'Yotta publishes per-node figures for purchasable H100 SKUs but nothing scoped to the ranked cluster, and its own pages disagree between the bare-metal listing and the virtualised product. Its platform-wide "16,384 H100 GPUs" covers the whole estate. None of those figures is recorded as this system\'s configuration; accelerators per node follow the documented Dell PowerEdge XE9680 chassis.'
  },

  'hpc6': {
    parts: {0: {systemModel: 'HPE Cray EX4000', formFactor: '3,472 nodes in 28 racks'}},
    sources: [
      {title: 'Eni · HPC6 technology', url: 'https://www.eni.com/visual-design/infographics/hpc6-longform/en/technology/'},{title: 'Eni · boosts supercomputing infrastructure at the Green Data Center', url: 'https://www.eni.com/en-IT/media/press-release/2024/01/eni-boosts-supercomputing-infrastructure-green-data-center.html'}],
    topology: 'Dragonfly'
  },

  'hpc7': {
    // Eni states the fabric rate for HPC7 but, unlike HPC6, names no topology.
    sources: [{title: 'Eni · ranks as world leading company in the TOP500', url: 'https://www.eni.com/en-IT/media/press-release/2026/06/eni-ranks-as-world-s-leading-company-top500-global-ranking.html'}],
    parts: {0: {nicSpeed: '200 Gb/s (HPE Slingshot)', systemModel: 'HPE Cray EX4000'}}
  },

  'aurora': {
    sources: [{title: 'ALCF · Aurora job placement', url: 'https://docs.alcf.anl.gov/aurora/running-jobs-aurora/'}],
    parts: {0: {formFactor: '166 racks · 8 chassis per rack · 8 nodes per chassis (64 nodes per rack) · each rack is one Dragonfly group'}}
  },

  'abci-3-0': {
    // AIST publishes full-bisection bandwidth but never names a topology; the
    // three-tier fat-tree wording appears only in an AIST staff paper.
    sources: [{title: 'AIST · ABCI 3.0 computing resources', url: 'https://abci.ai/en/about_abci/computing_resource.html'}],
    notes: 'AIST states that compute nodes communicate at full-bisection bandwidth but names no topology on its own pages; a three-tier fat-tree appears only in a paper by AIST staff, so no topology is recorded here.',
    parts: {0: {
      nicSpeed: '200 Gb/s per port (InfiniBand NDR200)',
      nicTopology: 'Eight InfiniBand NDR200 ports per compute node',
      managementNic: 'One additional InfiniBand HDR port per node for storage'
    }}
  },

  'nipa-nhn-cloud-cl-1': {
    sources: [
      {title: 'NIPA · National AI computing resource portal', url: 'https://aiinfrahub.kr/'},{title: 'NHN · NIPA GPU cluster build', url: 'https://inside.nhn.com/news/948'}],
    notes: 'Korea\'s national AI computing portal, run by NIPA, publishes the per-server configuration for this cluster: up to eight B200 accelerators, a 72-core CPU complement and 2,304 GB of memory per server, with up to 400 Gb/s InfiniBand between servers. NHN states the cluster comprises 510 nodes and 4,080 B200 GPUs. It publishes no per-node CPU, memory or adapter detail; accelerators per node follow the documented HPE ProLiant XD685 chassis.',
    parts: {0: {count: 510, ram: '2,304 GB', nicSpeed: '400 Gb/s (InfiniBand)'}}
  },

  'nipa-nhn-cloud-cl-2': {
    sources: [
      {title: 'NIPA · National AI computing resource portal', url: 'https://aiinfrahub.kr/'},{title: 'NHN · NIPA GPU cluster build', url: 'https://inside.nhn.com/news/948'}],
    notes: 'Korea\'s national AI computing portal, run by NIPA, publishes the per-server configuration for this cluster: up to eight B200 accelerators, a 72-core CPU complement and 2,304 GB of memory per server, with up to 400 Gb/s InfiniBand between servers. NHN states the cluster comprises 255 nodes and 2,040 B200 GPUs. It publishes no per-node CPU, memory or adapter detail; accelerators per node follow the documented HPE ProLiant XD685 chassis.',
    parts: {0: {count: 255, ram: '2,304 GB', nicSpeed: '400 Gb/s (InfiniBand)'}}
  },

  'nipa-kakao': {
    // Kakao Cloud published an engineering build report for this ranked cluster.
    sources: [
      {title: 'NIPA · National AI computing resource portal', url: 'https://aiinfrahub.kr/'},{title: 'Kakao Cloud · B200 cluster build report', url: 'https://blog.kakaocloud.com/283'}],
    notes: 'Korea\'s national AI computing portal lists three 510- and 255-server B200 clusters without naming their providers, one of which is this system; every one is listed with 2,304 GB per server and a 72-core CPU complement. The 72-core figure conflicts with this system\'s own TOP500 submission, whose core count implies 144 cores per node across two 72-core sockets, so neither the memory nor the core figure is carried over from the portal. Node count and fabric follow Kakao Cloud\'s own build report for this cluster. Kakao does not name a CPU, host memory, NVLink generation or adapter model; accelerators per node follow the documented Supermicro SYS-A22GA-NBRT chassis.',
    topology: '8-rail optimised fat-tree',
    parts: {0: {count: 255, nicModel: 'InfiniBand NDR'}}
  },

  'fpt-ai-factory-japan': {
    // FPT publishes a per-node specification for the Japan H200 configuration
    // but never states how many of those nodes form the ranked cluster.
    sources: [{title: 'FPT · dual AI factories named in the TOP500', url: 'https://fptcloud.com/en/fpts-dual-ai-factories-named-top500-worlds-fastest-supercomputers/'},
      {title: 'FPT · Metal Cloud GPU node specification', url: 'https://factory.fpt.ai/metal-cloud'}],
    notes: 'The per-node figures are FPT\'s published Japan H200 node configuration; FPT does not state how many such nodes form the ranked cluster, so no node count is recorded. FPT names NVLink but no generation or aggregate bandwidth.',
    parts: {0: {
      cpu: 'Intel Xeon Platinum 8558 · 48 cores',
      cpus: 2,
      gpus: 8,
      ram: '2 TB DDR5-4800',
      vram: '141 GB HBM3e per GPU',
      nic: 8,
      nicSpeed: '400 Gb/s per port (InfiniBand)',
      managementNic: 'Two 200 Gb/s BlueField-3 DPU ports per node',
      disk: '30 TB (8 × 3.84 TB NVMe SSD)'
    }}
  },

  'iseg2': {
    sources: [{title: 'Nebius · supercomputer', url: 'https://nebius.com/supercomputer'}],
    notes: 'Nebius names ISEG2 only for its rankings and publishes no hardware page for it. Its H200 platform documentation describes a purchasable product rather than this cluster, so it is not used as a source for these fields.'
  },

  'ssc-24': {
    sources: [{title: 'TOP500 · SSC-24 system record', url: 'https://top500.org/system/180381/'}],
    notes: 'Samsung has issued no press release about this system; it was first reported by a Korean newspaper, and roughly eighteen Korean outlets — including KISTI\'s own release — carry only its rank and Rmax. Samsung\'s newsroom search endpoints return 403 to every method tried. A companion entry, SSC-24 Energy Module, appears separately on the ranking with the same platform and operating system. Samsung publishes nothing about SSC-24 — not its existence, not its configuration — on any of its newsroom, semiconductor, research or SDS properties. Every node-level field here is unavailable rather than merely unlocated.'
  },

  'rainier': {
    sources: [{title: 'AWS · accelerated computing instance types', url: 'https://docs.aws.amazon.com/ec2/latest/instancetypes/ac.html'},
      {title: 'Amazon · Project Rainier', url: 'https://www.aboutamazon.com/news/aws/aws-project-rainier-ai-trainium-chips-compute-cluster'}],
    notes: 'Amazon states Project Rainier features nearly half a million Trainium2 chips across multiple United States data centres, and that an UltraServer combines four Trn2 instances into a 64-chip domain. It publishes no instance or UltraServer count, so none is recorded. A separate 900 MW Crusoe campus announced for Abilene supports Microsoft and is not part of this system; its 2.1 GW and 336 MW-per-building figures belong to that project.',
    parts: {0: {cpu: 'Intel Xeon Sapphire Rapids · 192 vCPUs per instance'}}
  },

  'colossus': {
    // xAI publishes a GPU total; the node and rack layout comes from a case
    // study hosted by Supermicro, whose own page names xAI and Colossus.
    sources: [{title: 'xAI · Colossus', url: 'https://x.ai/colossus'},
      {title: 'Supermicro · xAI Colossus', url: 'https://www.supermicro.com/en/featured/xai-colossus'}],
    notes: 'xAI states Colossus reached 200,000 H100 GPUs in a single interconnected cluster. The per-rack and per-node layout comes from a case study hosted by Supermicro but authored by a third party and sponsored by Supermicro, so it is a weaker claim than an operator statement: eight 4U servers of eight H100 per rack, with a dedicated network adapter per GPU. No CPU model is published by xAI or any vendor.',
    parts: {0: {
      systemModel: 'Supermicro 4U Universal GPU system (liquid-cooled)',
      gpus: 8,
      nicModel: 'NVIDIA BlueField-3 SuperNIC',
      nicTopology: 'A dedicated network adapter per accelerator',
      nicSpeed: '400 GbE per link · about 3.6 Tb/s per compute server',
      managementNic: 'A separate 400 GbE connection per CPU, on a different switch fabric from the accelerator network',
      formFactor: 'Eight 4U servers per rack (64 GPUs per rack) with a coolant distribution unit; racks arranged in groups of eight (512 GPUs); the initial cluster comprised four 25,000-GPU data halls'
    }}
  },

  'stargate-abilene': {
    sources: [{title: 'Crusoe · Abilene campus expansion to 1.2 GW', url: 'https://www.crusoe.ai/resources/newsroom/crusoe-expands-ai-data-center-campus-in-abilene-to-1-2-gigawatts'},
      {title: 'NVIDIA · GB200 NVL72', url: 'https://www.nvidia.com/en-us/data-center/gb200-nvl72/'}],
    notes: 'The site is the first of the Stargate programme, on the Lancium Clean Campus in Abilene, Texas. Crusoe, the site developer, publishes campus figures rather than a machine configuration: eight buildings, about 4 million square feet and 1.2 GW total capacity, with direct-to-chip liquid cooling. NVIDIA documents the GB200 NVL72 rack as 36 Grace CPUs and 72 Blackwell GPUs in one NVLink domain. Neither party publishes a rack count, system count or GPU total for Abilene, so none is recorded.',
    parts: {0: {formFactor: 'NVIDIA GB200 NVL72 rack — 36 Grace CPUs and 72 Blackwell GPUs per rack, direct-to-chip liquid cooled'}}
  },

  'isambard-ai-phase-2': {
    sources: [{title: 'BriCS · Isambard-AI specifications', url: 'https://docs.isambard.ac.uk/specs/'},
      {title: 'BriCS · system storage', url: 'https://docs.isambard.ac.uk/user-documentation/information/system-storage/'}],
    notes: 'Figures are for Phase 2 alone. Bristol news articles quote 1,362 nodes and 5,448 superchips, which combine Phase 1 (42 nodes) with Phase 2 (1,320); those combined figures are not used here.',
    parts: {0: {
      hostLink: 'NVIDIA NVLink-C2C · 800 Gbps per node',
      nicModel: 'HPE Cray Cassini (Slingshot 11)',
      nicSpeed: '200 Gb/s per NIC',
      nicTopology: 'Four Cassini NICs — a dedicated adapter per GH200 superchip',
      disk: 'None — on compute nodes the local scratch area is a tmpfs RAM disk with a 48 GiB quota, not a local disk',
      cpuNote: 'Each GH200 is power-capped at 660 W, shared dynamically between the Grace CPU and the Hopper GPU.'
    }}
  },

  'arrhenius-gpu': {
    sources: [{title: 'NAISS · Arrhenius technical description', url: 'https://www.naiss.se/resources/arrhenius-technical-description/'}],
    notes: 'NAISS lists the interconnect as "4x Slingshot 200 GB"; the unit as written is ambiguous, so a per-adapter rate is not recorded. NAISS also gives 29 PB for the parallel file system on its resource page against 25 PB disk plus 2 PB flash in the technical description, and does not reconcile the two.',
    parts: {0: {nicModel: 'HPE Slingshot'}}
  },

  'cea-he': {
    // CEA's own October 2025 site-update deck is the only CEA-authored source
    // with a node count; cea.fr publishes none.
    sources: [{title: 'CEA · Supercomputing complex site update (October 2025)', url: 'https://www.hpcuserforum.com/wp-content/uploads/2025/10/Gilles-Wiber_CEA-Supercomputing-Complex-Site-Update_CEA_Oct-2025-HPC-UF.pdf'},
      {title: 'CEA · EXA1', url: 'https://www-hpc.cea.fr/en/EXA.html'}],
    notes: 'Node count and rack count follow CEA\'s October 2025 site update, which states 672 Grace Hopper nodes in 28 BullSequana XH3000 racks. The April 2024 Eviden/CEA launch announcement gave 477 nodes and 104 PFlop/s peak against the later 672 nodes and 180 PFlop/s; CEA does not reconcile the two, so the later CEA-authored figure is used. Superchips per node are not published. CEA publishes a fat-tree topology only for the separate EXA1-HF partition, which is not carried across.',
    parts: {0: {
      count: 672,
      nicModel: 'Atos BXI v2 (quad-rail)',
      formFactor: '28 BullSequana XH3000 racks · direct liquid cooled'
    }}
  },

  'shaheen-iii-gpu': {
    sources: [{title: 'KAUST · Shaheen III interconnect', url: 'https://docs.hpc.kaust.edu.sa/systems/shaheen3/interconnect.html'},
      {title: 'KAUST · HPE to build Shaheen III', url: 'https://www.kaust.edu.sa/en/news/kaust-selects-hpe-to-build-powerful-supercomputer'}],
    notes: 'KAUST states 704 GPU compute nodes with four Grace Hopper Superchips each, which implies 2,816 superchips; its own documentation page instead states 2,800. The two cannot both be right, and KAUST does not reconcile them.',
    topology: 'Two-level Dragonfly',
    parts: {0: {
      count: 704,
      cpus: 4,
      gpus: 4,
      formFactor: '7 HPE Cray EX4000 cabinets · 16 Slingshot switches per cabinet · 64-port switch radix'
    }}
  },

  'discovery-6': {
    sources: [{title: 'ExxonMobil · the future of seismic imaging and technology', url: 'https://corporate.exxonmobil.com/who-we-are/technology-and-collaborations/the-future-of-seismic-imaging-and-technology'}],
    notes: 'ExxonMobil\'s corporate page, HPE\'s newsroom post and the wire coverage all reproduce the same single sentence; none adds a node count, a per-node configuration, storage or packaging. ExxonMobil publishes a total of 4,032 NVIDIA Grace Hopper Superchips but no node count and no per-node configuration, so neither is recorded.',
    parts: {0: {formFactor: 'HPE Cray Supercomputing EX4000 · 100 per cent direct liquid cooling'}}
  },

  'daedalus': {
    site: 'GRNET · Lavrion Technological and Cultural Park, NTUA',
    sources: [
      {title: 'GRNET · DAEDALUS among the world\'s leading supercomputers', url: 'https://grnet.gr/en/2026/06/24/daedalus-among-worlds-leading-supercomputers/'},{title: 'EuroHPC JU · our supercomputers', url: 'https://eurohpc-ju.europa.eu/supercomputers/our-supercomputers_en'},
      {title: 'GRNET · DAEDALUS among the world\'s leading supercomputers', url: 'https://grnet.gr/en/2026/06/24/daedalus-among-worlds-leading-supercomputers/'}],
    notes: 'GRNET publishes no DAEDALUS user documentation: daedalus.grnet.gr resolves but is not served, and the doc and docs subdomains do not answer. Its 2023 public-consultation tender annex specifies separate CPU-only and accelerated node types, which the delivered machine does not use, so none of its figures is carried over. DAEDALUS presents two virtual partitions over the same GH200 hardware: a CPU partition using 64 of the 72 Arm cores per superchip, and a GPU partition using the remaining 8 cores plus the H100. GRNET publishes no node count and no per-node configuration. The 2022 tender document states requirements rather than the as-built machine and is not used as a source.'
  },

  'chie-4': {
    // SoftBank publishes a GPU total for this named system but never a node or
    // DGX-system count, so no per-node count is recorded.
    sources: [{title: 'SoftBank · CHIE-4 SC2025 rankings', url: 'https://www.softbank.jp/corp/news/press/sbkk/2025/20251119_02/'}],
    notes: 'SoftBank states CHIE-4 carries over 4,000 NVIDIA Blackwell GPUs in NVIDIA DGX B200 systems, and that the build completed on 22 July 2025. It publishes no DGX-system or node count, so none is recorded. Node specifications follow the documented DGX B200 platform.'
  },

  'gefion': {
    sources: [
      {title: 'DCAI · Gefion ranks 21 on the TOP500', url: 'https://www.prnewswire.co.uk/news-releases/denmarks-new-ai-supercomputer-gefion-ranks-21-on-the-worlds-top500-list-302309000.html'},
      {title: 'TOP500 · Gefion system record', url: 'https://top500.org/system/180299/'}
    ],
    notes: 'Node count follows the DCAI announcement: 191 NVIDIA DGX H100 units totalling 1,528 H100 GPUs. The fabric is recorded as the rail structure TOP500 states; note that TOP500 names the interconnect HDR100 (100 Gb/s) while DCAI and NVIDIA describe Quantum-2 InfiniBand (NDR, 400 Gb/s), so the generation is unresolved.',
    topology: 'Octo-rail InfiniBand (eight-rail, rail-optimised)',
    parts: {0: {count: 191}}
  },

  'njoerd': {
    // Northern Data's investor release gives a cluster-scoped node count and the
    // fabric layout. Its Taiga Cloud platform page describes OTHER sites (Boden,
    // Kristiansand) and is deliberately not applied here.
    sources: [{title: 'Northern Data Group · TOP500 recognition for the London AI cluster', url: 'https://northerndata.de/en/investor-relations/news/northern-data-group-recognized-by-top500-for-world-class-london-ai-cluster'}],
    notes: 'Node count, accelerators per node and fabric follow the Northern Data investor release for the London cluster. Host memory and node-local storage are published only for the operator\'s other sites and are not carried across, so they remain unrecorded here.',
    topology: 'Rail-optimized',
    parts: {
      0: {
        count: 244,
        gpus: 8,
        nicSpeed: '400 Gb/s (InfiniBand NDR400)'
      }
    }
  },

  'explorer-wus3': {
    os: 'Ubuntu 20.04',
    // The SKU in the TOP500 submission has no published Azure specification.
    sources: [
      {title: 'TOP500 · Explorer-WUS3 system record', url: 'https://top500.org/system/180171/'},{title: 'Microsoft · ND family VM size series', url: 'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/nd-family'}],
    notes: 'Microsoft publishes no virtual-machine specification for the ND96_amsr_MI200_v4 size named in the TOP500 submission; the documented ND family covers the NVIDIA A100, H100, H200, GB200 and AMD MI300X sizes only. Per-node memory, accelerator count and node count are therefore unavailable rather than merely unlocated.'
  },

  'sunway-taihulight': {
    os: 'Sunway RaiseOS 2.0.5',
    // NSCC Wuxi publishes no hardware page. The canonical description is the
    // Dongarra system report hosted at netlib — a third-party reference, not an
    // operator statement, and labelled as such in the notes.
    sources: [
      {title: 'TOP500 · Sunway TaihuLight system record', url: 'https://top500.org/system/178764/'},{title: 'Dongarra · Report on the Sunway TaihuLight System (2016)', url: 'https://www.netlib.org/utk/people/JackDongarra/PAPERS/sunway-report-2016.pdf'}],
    notes: 'The operator, NSCC Wuxi, publishes no hardware specification page. Node count, memory, packaging and interconnect follow the Dongarra system report, which is a third-party technical reference rather than an operator statement.',
    topology: 'Sunway Network — three levels: a central switching network between supernodes, a super-node network fully connecting the 256 nodes of each supernode, and a resource-sharing network',
    parts: {
      0: {
        count: 40960,
        cpus: 1,
        coresPerSocket: 260,
        physicalCores: 260,
        cpuNote: 'Each SW26010 is four groups of one management processing element plus 64 computing processing elements — 260 cores in total per node.',
        ram: '32 GB DDR3 (4 × 8 GB, 136.51 GB/s)',
        disk: 'None — the report states non-volatile memory is not used in the system',
        formFactor: '256 nodes per supernode · 4 supernodes (1,024 nodes) per cabinet · 40 cabinets'
      }
    }
  },

  'alps': {
    // CSCS documents the Rome and A100 partitions in full; its pages still carry
    // a "Todo" for the MI300A and MI250X node specifications, so those stay as
    // recorded gaps rather than being filled from the accelerator vendor.
    sources: [{title: 'CSCS · Alps hardware', url: 'https://docs.cscs.ch/alps/hardware/'}],
    notes: 'Host memory for the A100 partition was corrected to the 512 GB DDR4 that CSCS documents. CSCS marks the MI300A and MI250X node specifications as still to be written, so those partitions carry node counts only.',
    parts: {
      1: {nic: 2, nicModel: 'HPE Cray Cassini (Slingshot 11)', nicSpeed: '200 Gb/s per NIC', formFactor: '256 blades · 4 nodes per blade'},
      2: {
        ram: '512 GB DDR4',
        vram: '80 GB HBM3 per GPU',
        nic: 4,
        nicModel: 'HPE Cray Cassini (Slingshot 11)',
        nicSpeed: '200 Gb/s per NIC',
        nicTopology: 'Four NICs — a dedicated adapter per accelerator',
        formFactor: '72 blades · 2 nodes per blade'
      },
      3: {formFactor: '64 blades · 2 nodes per blade'},
      4: {formFactor: '12 blades · 2 nodes per blade'}
    }
  },

  'delta': {
    // NCSA publishes a per-partition table plus GPU affinity matrices, which are
    // the only public statement of how many NVLinks bond each GPU pair.
    sources: [
      {title: 'NCSA · Delta architecture', url: 'https://docs.ncsa.illinois.edu/systems/delta/en/latest/user_guide/architecture.html'},
      {title: 'NCSA · Delta user documentation', url: 'https://docs.ncsa.illinois.edu/systems/delta/'}
    ],
    os: 'Red Hat Enterprise Linux 9',
    parts: {
      0: {onNodeFabric: 'NVLink — four bonded links between every GPU pair (NV4 in the operator affinity matrix)', nicSpeed: '200 Gb/s (HPE Slingshot 11)'},
      1: {
        link: 'PCIe Gen4 through the host — no GPU-to-GPU NVLink',
        onNodeFabric: 'None — NCSA\'s affinity matrix shows SYS (via the host bridge) between all four A40 GPUs',
        hostLink: 'PCIe Gen4',
        nicSpeed: '200 Gb/s (HPE Slingshot 11)'
      },
      2: {nicSpeed: '200 Gb/s (HPE Slingshot 11)'},
      3: {onNodeFabric: 'NVLink — twelve bonded links between every GPU pair (NV12 in the operator affinity matrix)', nicSpeed: '200 Gb/s (HPE Slingshot 11)'},
      4: {
        link: 'NVLink · all GPU pairs',
        onNodeFabric: 'NVLink — eighteen bonded links between every GPU pair (NV18 in the operator affinity matrix)',
        disk: '2.0 TB local',
        nicSpeed: '200 Gb/s (HPE Slingshot 11)'
      },
      5: {disk: '1.5 TB local', nicSpeed: '200 Gb/s (HPE Slingshot 11)'}
    }
  },

  'lumi': {
    os: 'HPE Cray OS',
    sources: [
      {title: 'TOP500 · LUMI system record', url: 'https://top500.org/system/180048/'},
      {title: 'LUMI · LUMI-G hardware', url: 'https://docs.lumi-supercomputer.eu/hardware/lumig/'},
      {title: 'LUMI · network', url: 'https://docs.lumi-supercomputer.eu/hardware/network/'}
    ],
    topology: 'Dragonfly',
    parts: {
      0: {
        cpu: 'AMD EPYC 7A53 "Trento" · 64 cores',
        onNodeFabric: 'Infinity Fabric — up to 400 GB/s bidirectional in-package between the two GCDs of one MI250X; 100 GB/s (single link) or 200 GB/s (double link) between GCDs on different modules',
        nicModel: 'HPE Cray Cassini (Slingshot 11)',
        nicSpeed: '200 Gb/s per endpoint · 25+25 GB/s peak',
        nicTopology: 'Four Slingshot endpoints, a dedicated adapter per MI250X accelerator module',
        disk: 'None — CSC states there is no local storage on LUMI-G compute nodes'
      }
    }
  },

  'leonardo': {
    os: 'Linux',
    sources: [
      {title: 'TOP500 · Leonardo system record', url: 'https://top500.org/system/180128/'},{title: 'CINECA · Leonardo', url: 'https://docs.hpc.cineca.it/hpc/leonardo.html'}],
    topology: 'Dragonfly+',
    parts: {
      0: {
        link: 'NVLink 3.0 · 200 GB/s',
        onNodeFabric: 'NVLink 3.0 · 200 GB/s',
        disk: 'None — CINECA lists no node-local storage for the Booster partition'
      }
    }
  },

  'marenostrum-5-acc': {
    topology: 'Three-layer fat-tree · 324 QM9790 switches · 3 GPP islands, 1 storage island and 7 ACC islands',
    os: 'Red Hat Enterprise Linux 9.1',
    sources: [
      {title: 'TOP500 · MareNostrum 5 ACC system record', url: 'https://top500.org/system/180238/'},{title: 'BSC · MareNostrum 5 overview', url: 'https://www.bsc.es/supportkc/docs/MareNostrum5/overview'}],
    parts: {0: {nicModel: 'NVIDIA ConnectX-7 (InfiniBand NDR200)', nicSpeed: '200 Gb/s per adapter · 800 Gb/s per node'}}
  },

  'juwels-booster': {
    sources: [{title: 'JSC · JUWELS configuration', url: 'https://apps.fz-juelich.de/jsc/hps/juwels/configuration.html'}],
    os: 'Rocky Linux 9',
    topology: 'Dragonfly+ (20 cells)',
    parts: {0: {nicModel: 'NVIDIA ConnectX-6 (InfiniBand HDR)', disk: 'Diskless — JSC states the compute nodes have no local disk'}}
  },

  'eos': {
    os: 'Ubuntu 22.04.3 LTS',
    // NVIDIA publishes two different Eos configurations; the catalog records the
    // ranked system, so neither node count is asserted here.
    sources: [
      {title: 'TOP500 · Eos system record', url: 'https://top500.org/system/180239/'},{title: 'NVIDIA · Eos supercomputer', url: 'https://blogs.nvidia.com/blog/eos/'}],
    notes: 'NVIDIA publishes two Eos configurations — 576 DGX H100 systems (4,608 H100 GPUs) and a separate 10,752-GPU Eos DGX SuperPOD used for MLPerf. Which of the two the ranked submission describes is not stated, so no node count is recorded. Node specifications follow the documented DGX H100 platform.',
    parts: {0: {nicSpeed: '400 Gb/s per adapter (NVIDIA Quantum-2 InfiniBand)'}}
  },

  'selene': {
    os: 'Ubuntu 20.04.1 LTS',
    // Selene was expanded after launch; the ranked entry is the larger one.
    sources: [
      {title: 'TOP500 · Selene system record', url: 'https://top500.org/system/179842/'},
      {title: 'NVIDIA · DGX A100 SuperPOD, Hot Chips 2020', url: 'https://hc32.hotchips.org/assets/program/tutorials/HC2020.NVIDIA.MichaelHouston.v02.pdf'},
      {title: 'Megatron-Turing NLG 530B (NVIDIA / Microsoft) — Selene configuration', url: 'https://ar5iv.labs.arxiv.org/html/2201.11990'},
      {title: 'SPEChpc 2021 · NVIDIA Selene submission', url: 'https://www.spec.org/hpc2021/results/res2022q4/hpc2021-20221017-00138.html'}
    ],
    notes: 'Selene was expanded after launch: NVIDIA\'s Hot Chips 2020 tutorial describes 280 DGX A100 systems, and the Megatron-Turing NLG paper by NVIDIA and Microsoft authors describes 560. The ranked entry is the expanded configuration — the TOP500 core count doubles between the June and November 2020 lists — so 560 is recorded. Host memory, accelerator memory and node-local storage follow NVIDIA\'s own SPEChpc submission for Selene.',
    topology: 'Three-level fat-tree (leaf, spine, core) with 850 switches',
    parts: {0: {
      count: 560,
      ram: '2 TB (32 × 64 GB)',
      vram: '80 GB per GPU',
      nicSpeed: '200 Gb/s per HCA (HDR InfiniBand)',
      managementNic: 'Two additional 200 Gb/s HDR InfiniBand HCAs per node dedicated to storage',
      disk: '2 TB OS drive plus 30 TB internal NVMe SSD (8 × 3.84 TB)'
    }}
  },

  'meta-rsc': {
    sources: [{title: 'Meta · AI Research SuperCluster', url: 'https://ai.meta.com/blog/ai-rsc/'}],
    topology: 'Two-level Clos, no oversubscription',
    parts: {0: {nicModel: 'NVIDIA Quantum InfiniBand (1,600 Gb/s fabric)'}}
  },

  'israel-1': {
    // NVIDIA names the server and accelerator platform but publishes no counts.
    sources: [{title: 'NVIDIA · Spectrum-X accelerated Ethernet platform', url: 'https://nvidianews.nvidia.com/news/nvidia-launches-accelerated-ethernet-platform-for-hyperscale-generative-ai'}],
    parts: {0: {systemModel: 'Dell PowerEdge XE9680 (NVIDIA HGX H100 eight-GPU platform)', nicModel: 'NVIDIA BlueField-3 DPU and SuperNIC (Spectrum-4 switches)'}}
  },

  'perlmutter': {
    // NERSC publishes the node design and the fabric in full.
    sources: [{title: 'NERSC · Perlmutter architecture', url: 'https://docs.nersc.gov/systems/perlmutter/architecture/'}],
    topology: '3-hop dragonfly',
    parts: {
      0: {onNodeFabric: 'NVLink 3 — four links between each GPU pair, 25 GB/s per direction per link', nicModel: 'HPE Cray Cassini (Slingshot 11)', nicSpeed: '200 Gb/s (25 GB/s) per NIC', nicTopology: 'Four NICs on each GPU node, attached to the CPU over PCIe 4.0', formFactor: 'GPU cabinet: 8 chassis, each 8 compute blades and 4 switch blades; 2 GPU nodes per blade'},
      1: {onNodeFabric: 'NVLink 3 — four links between each GPU pair, 25 GB/s per direction per link', nicModel: 'HPE Cray Cassini (Slingshot 11)', nicSpeed: '200 Gb/s (25 GB/s) per NIC', formFactor: 'GPU cabinet: 8 chassis, each 8 compute blades and 4 switch blades; 2 GPU nodes per blade'},
      2: {nicModel: 'HPE Cray Cassini (Slingshot 11)', nicSpeed: '200 Gb/s (25 GB/s) per NIC', formFactor: 'CPU cabinet: 8 chassis, each 8 compute blades and 2 switch blades; 4 CPU nodes per blade'}
    }
  },

  'derecho': {
    sources: [{title: 'NCAR · Derecho compute system', url: 'https://ncar-hpc-docs.readthedocs.io/en/latest/compute-systems/derecho/'}],
    os: 'Cray variant of SUSE Linux Enterprise',
    parts: {
      0: {nicModel: 'HPE Slingshot 11', nicSpeed: '200 Gb/s per port per direction', nicTopology: 'One Slingshot injection port per CPU-only node'},
      1: {link: 'NVLink · 600 GB/s GPU interconnect', onNodeFabric: 'NVLink — 600 GB/s GPU interconnect', nicModel: 'HPE Slingshot 11', nicSpeed: '200 Gb/s per port per direction', nicTopology: 'Four Slingshot injection ports per GPU node'}
    }
  },

  'deltaai': {
    // NCSA publishes the superchip layout and the per-superchip NIC pairing.
    sources: [{title: 'NCSA · DeltaAI architecture', url: 'https://docs.ncsa.illinois.edu/systems/deltaai/en/latest/user-guide/architecture.html'}],
    parts: {0: {onNodeFabric: 'NVLink — six bonded links between every GPU pair (NV6 in the operator affinity matrix)', nicSpeed: '200 Gb/s per NIC', nicTopology: 'A dedicated Slingshot 11 Cassini adapter per Grace-Hopper superchip, four per node'}}
  },

  'expanse': {
    sources: [{title: 'SDSC · Expanse user guide', url: 'https://www.sdsc.edu/support/user_guides/expanse.html'}],
    os: 'Rocky Linux',
    topology: 'Hybrid fat-tree',
    parts: {
      0: {nicSpeed: '100 Gb/s (HDR100 to compute nodes)', formFactor: '13 SDSC Scalable Compute Units'},
      1: {nicSpeed: '100 Gb/s (HDR100 to compute nodes)'}
    }
  },

  'polaris': {
    // ALCF restructured its user guide; the machine overview now lives at the
    // system root. The OS comes from ALCF's own system-updates log.
    sources: [
      {title: 'ALCF · Polaris machine overview', url: 'https://docs.alcf.anl.gov/polaris/'},
      {title: 'ALCF · Polaris system updates', url: 'https://docs.alcf.anl.gov/polaris/system-updates/'}
    ],
    os: 'SUSE Linux Enterprise Server 15 SP7',
    parts: {0: {systemModel: 'HPE Apollo 6500 Gen 10+', onNodeFabric: 'NVLink — four bonded links between every GPU pair (NV4 in the operator affinity matrix), 600 GB/s', formFactor: '2 nodes per chassis · 7 chassis per rack · 40 racks'}}
  },

  'frontera': {
    sources: [{title: 'TACC · Frontera user guide', url: 'https://docs.tacc.utexas.edu/hpc/frontera/'}],
    topology: 'Fat-tree (six core switches, 22/18 oversubscription)',
    parts: {0: {nicSpeed: '100 Gb/s HDR100 to each compute node (200 Gb/s HDR between switches)', formFactor: '8,368 Cascade Lake nodes in 101 racks · two 40-port leaf switches per rack'}}
  },

  'stampede3': {
    sources: [{title: 'TACC · Stampede3 user guide', url: 'https://docs.tacc.utexas.edu/hpc/stampede3/'}],
    os: 'Rocky Linux',
    topology: 'Fat-tree (100 Gb/s Omni-Path)',
    parts: {
      0: {nicSpeed: '100 Gb/s Omni-Path'},
      1: {nicSpeed: '100 Gb/s Omni-Path'}
    }
  },

  'maximus-384': {
    site: 'Core42 · TeraWulf Lake Mariner, Buffalo, New York',
    // The TOP500 record contradicts itself on this system's CPU clock: the
    // Processor field reads 2.1GHz while the system-model string reads 4GHz.
    // Recording the contradiction is more useful than silently picking one.
    sources: [
      {title: 'Core42 · Maximus cluster TOP500 ranking', url: 'https://www.core42.ai/resources/news/core42-maximus-01-cluster-secures-top-20-ranking-on-the-global-top500-supercomputers-list'},{title: 'TOP500 · MAXIMUS-384 system record', url: 'https://top500.org/system/180422/'}],
    parts: {0: {cpuNote: 'The TOP500 record states two different base clocks for this part: the Processor field reads 2.1 GHz and the system-model string reads 4 GHz. Intel publishes 56 cores for the Xeon Platinum 8570; the clock is left unresolved.'}}
  },

  'harpia': {
    // Petrobras' own announcement and the TOP500 record disagree on peak
    // performance, and the submitted server model changed between lists.
    sources: [{title: 'Petrobras · Harpia supercomputer', url: 'https://agencia.petrobras.com.br/w/petrobras-coloca-em-operacao-o-supercomputador-harpia'}],
    parts: {0: {cpuNote: 'The submitted server model changed between TOP500 lists (ThinkSystem SR675 V3 with 284,160 cores in November 2025, SR665 V3 with 303,104 cores in June 2026). Petrobras states roughly 146 PFlop/s peak against the 141.00 PFlop/s on the TOP500 record. The submission is also internally inconsistent on the accelerator: Lenovo documents the SR665 V3 as a 2U PCIe server taking at most three double-wide GPUs and lists no SXM or HGX baseboard support, while the TOP500 string names an SXM5 part. No per-node accelerator count is recorded for this system.'}}
  },

  'el-dorado': {
    // Sandia states the node and cabinet count; LLNL's ATS-4 hardware overview
    // gives the shared node specification for the El Capitan / Tuolumne /
    // El Dorado / rzAdams family, and the two agree on 384 nodes.
    sources: [
      {title: 'Sandia · El Dorado supercomputer', url: 'https://newsreleases.sandia.gov/el-dorado-supercomputer/'},
      {title: 'LLNL · El Capitan systems hardware overview', url: 'https://hpc.llnl.gov/documentation/user-guides/using-el-capitan-systems/hardware-overview'}
    ],
    notes: 'Node count and cabinet count follow Sandia. The per-node specification follows the LLNL ATS-4 hardware overview, which documents one node design shared by El Capitan, Tuolumne, El Dorado and rzAdams.',
    parts: {
      0: {
        name: 'MI300A compute',
        count: 384,
        cpu: 'AMD Zen 4 · 24 cores per APU',
        cpus: 4,
        gpu: 'AMD Instinct MI300A',
        gpus: 4,
        ram: '512 GiB unified HBM3',
        vram: 'Shared with CPU',
        link: 'Infinity Fabric',
        hostLink: 'On-package Infinity Fabric',
        apu: true,
        onNodeFabric: 'AMD Infinity Fabric — each APU fully connected to its peers by two links at 256 GB/s',
        nic: 4,
        nicModel: 'HPE Slingshot 11',
        nicSpeed: '200 Gb/s (25 GB/s) per interface · 100 GB/s node injection',
        formFactor: '3 compute cabinets (HPE Cray EX4000 with EX255a blades)'
      }
    }
  },

  'tuolumne': {
    topology: 'Dragonfly',
    // Same ATS-4 node design; LLNL publishes Tuolumne's cabinet count alongside
    // El Capitan's. The node count already in the record comes from a different
    // LLNL page and is left as it stands.
    sources: [
      {title: 'LLNL · Getting started (March 2026)', url: 'https://hpc.llnl.gov/sites/default/files/2026-03/Getting-started-March-2026.pdf'},{title: 'LLNL · El Capitan systems hardware overview', url: 'https://hpc.llnl.gov/documentation/user-guides/using-el-capitan-systems/hardware-overview'}],
    parts: {
      0: {
        onNodeFabric: 'AMD Infinity Fabric — each APU fully connected to its peers by two links at 256 GB/s',
        nic: 4,
        nicModel: 'HPE Slingshot 11',
        nicSpeed: '200 Gb/s (25 GB/s) per interface · 100 GB/s node injection',
        formFactor: '9 compute cabinets (HPE Cray EX4000 with EX255a blades)'
      }
    }
  },

  'abci-q': {
    // AIST's G-QuAT user guide publishes the compute-node specification in full.
    // It does not state a node count, so none is recorded.
    sources: [{title: 'AIST G-QuAT · ABCI-Q system guide', url: 'https://unit.aist.go.jp/g-quat/HowToUse/abci_q/'}],
    notes: 'Per-node specification follows the AIST G-QuAT system guide. AIST does not publish a compute-node count for the ranked partition, so none is recorded.',
    parts: {
      0: {
        cpus: 2,
        gpus: 4,
        ram: '1 TB DDR5-5200',
        vram: '80 GB HBM3 per GPU',
        disk: '2 × 3.84 TB NVMe SSD',
        nic: 2,
        nicModel: 'InfiniBand NDR200',
        nicSpeed: '400 Gb/s per adapter (operator listing)'
      }
    }
  },

  'nano-4': {
    // NCHC publishes the node count and per-node configuration.
    sources: [{title: 'NCHC · 晶創26 / Nano 4 announcement', url: 'https://www.nchc.org.tw/Message/MessageView?id=4024&mid=46'}],
    notes: 'Node count, sockets, accelerator count and host memory follow the NCHC announcement, which states 220 H200 nodes each with dual Xeon Platinum processors, eight H200 GPUs and 2 TB of memory.',
    parts: {
      0: {
        count: 220,
        cpus: 2,
        gpus: 8,
        ram: '2 TB',
        nicSpeed: '400 Gb/s (InfiniBand NDR)'
      }
    }
  },

  'aspire-2b-gpu-partition': {
    // NSCC publishes the GPU total and the fabric rate. Its CPU core count and
    // system memory cover all of ASPIRE 2B, not this ranked GPU partition, so
    // neither is recorded here.
    sources: [{title: 'NSCC Singapore · ASPIRE 2B', url: 'https://www.nscc.sg/aspire-2b/'}],
    parts: {0: {nicSpeed: '400 Gb/s Slingshot (operator listing)'}}
  },

  // Operating systems published on each system's own TOP500 record, which is
  // already a cited source for these entries. The import script drops the OS
  // column, so the catalog was reporting it as unavailable while citing a page
  // that states it.

  'jean-zay-h100': {
    os: 'Red Hat Enterprise Linux 9.6',
    // IDRIS publishes the gpu_p6 partition specification in full.
    sources: [{title: 'IDRIS · Jean Zay hardware configuration', url: 'http://www.idris.fr/docs/jean-zay/jean-zay/jean-zay-hardware/'}],
    notes: 'Node count, socket count, cores per socket, host memory, accelerator count and accelerator memory follow the IDRIS hardware page for the gpu_p6 partition. On-node GPU-to-GPU wiring and node-local storage are not published.',
    parts: {
      0: {
        name: 'gpu_p6 · H100 partition',
        systemModel: 'Bull Sequana (BullSequana XH3000 extension)',
        count: 364,
        cpu: 'Intel Xeon Platinum 8468 · 48 cores',
        cpus: 2,
        coresPerSocket: 48,
        physicalCores: 96,
        ram: '512 GB',
        gpus: 4,
        vram: '80 GB per GPU'
      }
    }
  }
};

// Merge semantics: researched scalars replace the imported placeholder, sources
// are appended when the URL is new, and parts merge by index so an imported
// field the research did not touch is preserved.
export function applyEnrichment(clusters) {
  for (const c of clusters) {
    const e = enrichment[c.id];
    if (!e) continue;
    const {sources, parts, addParts, ...scalars} = e;
    Object.assign(c, scalars);
    for (const s of sources || []) if (!c.sources.some(x => x.url === s.url)) c.sources.push(s);
    for (const [index, fields] of Object.entries(parts || {})) {
      const part = c.parts[Number(index)];
      if (!part) throw new Error(`enrichment for ${c.id}: no part at index ${index}`);
      Object.assign(part, fields);
    }
    // A partition the imported record does not know about. Used where research
    // shows a system has node types the ranking submission collapsed into one.
    for (const extra of addParts || []) {
      if (c.parts.some(p => p.name === extra.name)) continue;
      c.parts.push(extra);
    }
  }
  return clusters;
}
