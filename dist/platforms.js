// Vendor platform specifications.
//
// A ranked system's node type is frequently a named vendor platform whose full
// specification is published even when the operator page is thin. Recording the
// platform once keeps those facts available to every cluster built on it instead
// of repeating them, and makes the provenance explicit: the fact is a platform
// claim, not an operator measurement.
//
// `spec` fields are shown only when the operator record does not already state
// them. `source` is attached to any cluster that uses the platform.
export const platforms = {
  // OEM accelerator chassis. Unlike the DGX entries these are multi-option
  // platforms: the chassis fixes the accelerator COUNT and the socket count, but
  // the accelerator model, CPU SKU and memory are ordered per system. Only the
  // fixed properties are recorded, so a platform fact never overwrites an
  // operator's own configuration.
  xe9680: {
    name: 'Dell PowerEdge XE9680',
    formFactor: '6U rack, two sockets, eight accelerators',
    sources: [{title: 'Dell · PowerEdge XE9680 system configurations and features', url: 'https://www.dell.com/support/manuals/en-us/poweredge-xe9680/xe9680_ism_pub/dell-poweredge-xe9680-system-configurations-and-features'}],
    spec: {
      cpus: 2,
      gpus: 8,
      formFactor: '6U rack server · 6 power supply units (5+1 redundant)'
    }
  },
  crayXd670: {
    name: 'HPE Cray XD670',
    formFactor: '5U single-node chassis, two sockets, eight SXM5 accelerators',
    sources: [{title: 'HPE · Cray XD670 QuickSpecs', url: 'https://support.hpe.com/hpesc/public/docDisplay?docId=a50004292enw'}],
    spec: {
      cpus: 2,
      gpus: 8,
      formFactor: '5U single-node chassis · 6 Titanium power supplies (N+2)',
      nicTopology: 'Eight PCIe Gen5 x16 half-height slots for GPUDirect RDMA network adapters'
    }
  },
  proliantXd685: {
    name: 'HPE ProLiant Compute XD685',
    formFactor: '5U direct-liquid-cooled or 6U air-cooled chassis, two sockets, eight accelerators',
    sources: [{title: 'HPE · ProLiant Compute XD685', url: 'https://buy.hpe.com/us/en/compute/rack-servers/proliant-compute-xd600-servers/proliant-compute-xd600-server/hpe-proliant-compute-xd685/p/1014862906'}],
    spec: {
      cpus: 2,
      gpus: 8,
      formFactor: '5U direct-liquid-cooled or 6U air-cooled chassis · 6 × 3000 W Titanium Plus (N+1)'
    }
  },
  a22gaNbrt: {
    // The only chassis of the four with a single accelerator option, so the model
    // and its memory are fixed by the chassis rather than ordered.
    name: 'Supermicro SYS-A22GA-NBRT',
    formFactor: '10U rackmount, two sockets, NVIDIA HGX B200 8-GPU',
    sources: [{title: 'Supermicro · SYS-A22GA-NBRT', url: 'https://www.supermicro.com/en/products/system/gpu/10u/sys-a22ga-nbrt'},
      {title: 'NVIDIA · HGX platform', url: 'https://www.nvidia.com/en-us/data-center/hgx/'}],
    spec: {
      cpus: 2,
      gpu: 'NVIDIA B200',
      gpus: 8,
      vram: '180 GB HBM3e per GPU',
      link: 'NVLink 5 · all GPU pairs',
      onNodeFabric: 'NVLink 5 through NVLink Switch — 1.8 TB/s GPU-to-GPU, 14.4 TB/s aggregate across the HGX B200 baseboard',
      formFactor: '10U rackmount · 6 × 5250 W Titanium (3+3 redundant)',
      nicTopology: 'PCIe 5.0 x16 slots 2–9 are the GPU-linked east-west backend network adapter slots'
    }
  },

  dgxH100: {
    name: 'NVIDIA DGX H100',
    formFactor: '8U rackmount, 6 × 3.3 kW power supplies (4+2 redundant)',
    sources: [
      {title: 'NVIDIA · DGX H100/H200 user guide, hardware overview', url: 'https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html'},
      {title: 'NVIDIA · NVLink and NVLink Switch specifications', url: 'https://www.nvidia.com/en-us/data-center/nvlink/'}
    ],
    spec: {
      systemModel: 'NVIDIA DGX H100',
      formFactor: '8U rackmount · 6 × 3.3 kW power supplies (4+2 redundant)',
      cpus: 2,
      cpu: 'Intel Xeon Platinum 8480C · 56 cores (2.0 / 2.9 / 3.8 GHz base / all-core turbo / max turbo)',
      gpus: 8,
      vram: '80 GB HBM3 per GPU · 640 GB total',
      ram: '2 TB DDR5 (32 DIMMs)',
      link: 'NVLink 4 · all GPU pairs',
      onNodeFabric: 'NVLink 4 through 4 × 4th-generation NVSwitch, 900 GB/s GPU-to-GPU',
      hostLink: 'PCIe Gen5',
      disk: '2 × 1.92 TB NVMe M.2 SSD in RAID 1 (OS) + 8 × 3.84 TB NVMe U.2 SSD in RAID 0 (data cache)',
      nic: 8,
      nicModel: 'NVIDIA ConnectX-7 single-port InfiniBand',
      nicSpeed: '400 Gb/s InfiniBand per adapter',
      nicTopology: 'One adapter per GPU',
      managementNic: '2 × ConnectX-7 dual-port Ethernet (storage and in-band management) + 1 GbE BMC'
    }
  },
  dgxB200: {
    name: 'NVIDIA DGX B200',
    formFactor: '10U rackmount, 6 × 3.3 kW power supplies (5+1 redundant), 14.3 kW maximum',
    sources: [
      {title: 'NVIDIA · DGX B200 user guide, introduction', url: 'https://docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html'},
      {title: 'NVIDIA · DGX B200 system specifications', url: 'https://www.nvidia.com/en-us/data-center/dgx-b200/'}
    ],
    spec: {
      systemModel: 'NVIDIA DGX B200',
      formFactor: '10U rackmount · 6 × 3.3 kW power supplies (5+1 redundant) · 14.3 kW maximum',
      cpus: 2,
      cpu: 'Intel Xeon Platinum 8570 · 56 cores (2.1 / 4.0 GHz base / max turbo)',
      gpus: 8,
      vram: '180 GB HBM3e per GPU · 1,440 GB total',
      ram: '2 TB DDR5 (32 DIMMs, upgradable to 4 TB)',
      link: 'NVLink 5 · all GPU pairs',
      onNodeFabric: 'NVLink 5 through 2 × 5th-generation NVSwitch, 14.4 TB/s aggregate GPU bandwidth',
      hostLink: 'PCIe Gen5',
      disk: '2 × 1.92 TB NVMe M.2 SSD in RAID 1 (OS) + 8 × 3.84 TB NVMe U.2 SSD in RAID 0 (data cache)',
      nic: 8,
      nicModel: 'NVIDIA ConnectX-7 single-port InfiniBand',
      nicSpeed: '400 Gb/s InfiniBand per adapter',
      nicTopology: 'One adapter per GPU',
      managementNic: '2 × BlueField-3 DPU dual-port (storage and in-band management)'
    }
  },
  // The GB200/GB300-class and GH200 "superchip" platforms are deliberately
  // partial. NVIDIA publishes the chip itself, but the number of superchips (or
  // Grace-Blackwell units) per node, the node count, the memory variant and the
  // rack fabric are chosen by the operator and differ between installations, so
  // they are never filled from a platform default.
  gh200: {
    name: 'NVIDIA GH200 Grace Hopper Superchip',
    formFactor: 'Superchip module — nodes per system and per-node superchip counts are operator-specific',
    sources: [
      {title: 'NVIDIA · GH200 Grace Hopper Superchip', url: 'https://www.nvidia.com/en-us/data-center/grace-hopper-superchip/'},
      {title: 'NVIDIA · NVLink-C2C', url: 'https://www.nvidia.com/en-us/data-center/nvlink-c2c/'}
    ],
    spec: {
      cpu: 'NVIDIA Grace · 72 Arm Neoverse V2 cores',
      hostLink: 'NVLink-C2C · 900 GB/s coherent CPU ↔ GPU'
    }
  },
  dgxA100: {
    name: 'NVIDIA DGX A100',
    formFactor: '6U rackmount',
    sources: [
      {title: 'NVIDIA · DGX A100 user guide', url: 'https://docs.nvidia.com/dgx/pdf/dgxa100-user-guide.pdf'},
      {title: 'NVIDIA · A100 Tensor Core GPU specifications', url: 'https://www.nvidia.com/en-us/data-center/a100/'}
    ],
    spec: {
      systemModel: 'NVIDIA DGX A100',
      formFactor: '6U rackmount',
      cpus: 2,
      cpu: 'AMD EPYC 7742 · 64 cores',
      gpus: 8,
      link: 'NVLink 3 · all GPU pairs',
      onNodeFabric: 'NVLink 3 through NVSwitch, 600 GB/s GPU-to-GPU',
      hostLink: 'PCIe 4.0',
      nic: 8,
      nicModel: 'NVIDIA ConnectX-6 / ConnectX-7 (platform configuration)',
      nicTopology: 'One adapter per GPU'
    }
  }
};
