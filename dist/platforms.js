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
