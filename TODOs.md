# Cluster Atlas TODOs

Feature backlog and completed additions.

- [x] Expand to the June 2026 TOP500 top 50 plus 14 additional research/AI profiles, with sources and explicit gaps.
- [x] Surface the full public record instead of a subset: ranked cores, Rpeak, measured power, energy efficiency, manufacturer and OS are now shown for every ranked system, and documented vendor platform facts (NVSwitch count, per-GPU link bandwidth, per-GPU scale-out adapters, form factor) are attached to DGX-class node types. See the Specifications tab.
- [x] Draw per-accelerator scale-out in the node diagram, so a node with one dedicated adapter per accelerator (for example Eagle's 8 × 400 Gb/s Quantum-2 CX7) is no longer collapsed into a single NIC box.
- [x] Add a public-record completeness meter and an explicit "not published for this system" list to every profile.
- [x] Add `scripts/audit-coverage.mjs` as an onboarding guardrail, plus a documented checklist for adding clusters without dropping published facts.
- [x] Add named vendor platforms that were previously missing: NVIDIA DGX B200 (full chassis) and the GH200 Grace Hopper Superchip (chip-level facts only — per-node superchip counts and memory variants are operator-specific and are never filled from a platform default). CHIE-4 (DGX B200) and DAEDALUS (GH200) now resolve to these.
- [x] Enrich operator-documented profiles: DAEDALUS (GH200, 64/72-core CPU partition vs 8-core accelerated partition, 1 PB NVMe + 10 PB storage), Gefion (>1,540 GPUs across DGX H100 and B300, 110 PB WEKA), MareNostrum 5 ACC (1,120 nodes, 4× H100 64 GB, 512 GB DDR5, 4× CX7 NDR200, 480 GB NVMe, three-level fat-tree of 324 switches, 248 PB + 402 PB tape) and Arrhenius GPU (382 nodes × 4 GH200, 128 GB LPDDR5X per module, 4× Slingshot 200 Gb/s, 1.8 TB NVMe, 25 PB Lustre disk + 2 PB flash).
- [x] Add Azure ND H200 v5 (Reindeer, TOP500 #57) as a curated profile with the full public VM specification, matching the ND H100 v5 (Eagle) treatment.
- [x] Render the internal "not recorded" sentinel as "Not publicly available" at the display layer across the app, comparison, discovery, sharing, static pages and the completeness ledger. The sentinel is normalised in one place per surface so the data value and the reader-facing wording cannot drift.
- [ ] Continue enriching profiles where an operator has since published more. DAEDALUS, Gefion, CHIE-4 and Reindeer are now covered; Nano 4, CHIE-2, CHIE-3, Core42 SuperPOD, SSC-24, Njoerd and Cassava were researched this cycle and their node-level specifications are not publicly available from operator, vendor or ranking sources, so they are labelled as such rather than given platform defaults.
- [ ] Record interconnect topology where an operator publishes it. The 50 ranked systems were only checked against TOP500, whose submissions do not carry topology; several operators (EuroHPC members in particular) do document their fabric, so this is a known gap rather than a settled "not available".
- [x] Add an interactive world map with pins at HPC cluster locations. Clicking a pin opens that cluster's information and visualization.
- [x] Add side-by-side cluster comparison for GPUs, memory, node architecture, and networking.
- [x] Add workload suitability filters, such as GPU memory, CPU architecture, interconnect, and research access, with links to eligibility and allocation instructions.
- [x] Add shareable views for specific clusters and node configurations, plus sourced diagram exports for lectures, presentations, and technical discussions.

- [ ] Expand verified research-access routes beyond the initial seven systems; keep eligibility and application links current.
- [x] Add social-preview metadata, a 1200×630 preview, and the supplied logo as the site brand and favicon.
