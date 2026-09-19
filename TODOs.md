# Cluster Atlas TODOs

Feature backlog and completed additions.

- [x] Expand to the June 2026 TOP500 top 50 plus 14 additional research/AI profiles, with sources and explicit gaps.
- [x] Surface the full public record instead of a subset: ranked cores, Rpeak, measured power, energy efficiency, manufacturer and OS are now shown for every ranked system, and documented vendor platform facts (NVSwitch count, per-GPU link bandwidth, per-GPU scale-out adapters, form factor) are attached to DGX-class node types. See the Specifications tab.
- [x] Draw per-accelerator scale-out in the node diagram, so a node with one dedicated adapter per accelerator (for example Eagle's 8 × 400 Gb/s Quantum-2 CX7) is no longer collapsed into a single NIC box.
- [x] Add a public-record completeness meter and an explicit "not published for this system" list to every profile.
- [x] Add `scripts/audit-coverage.mjs` as an onboarding guardrail, plus a documented checklist for adding clusters without dropping published facts.
- [ ] Continue enriching partial profiles as more operator documentation becomes available. Priority: DAEDALUS, Nano 4, CHIE-2/3/4, Gefion, Core42 SuperPOD, SSC-24, Njoerd, Cassava.
- [ ] Verify interconnect topology for systems currently marked "Not verified", starting with the InfiniBand NDR400 fleets.
- [ ] Decide whether Azure's ND H200 v5 (Reindeer) deserves the same treatment as ND H100 v5 (Eagle).
- [x] Add an interactive world map with pins at HPC cluster locations. Clicking a pin opens that cluster's information and visualization.
- [x] Add side-by-side cluster comparison for GPUs, memory, node architecture, and networking.
- [x] Add workload suitability filters, such as GPU memory, CPU architecture, interconnect, and research access, with links to eligibility and allocation instructions.
- [x] Add shareable views for specific clusters and node configurations, plus sourced diagram exports for lectures, presentations, and technical discussions.

- [ ] Expand verified research-access routes beyond the initial seven systems; keep eligibility and application links current.
- [x] Add social-preview metadata, a 1200×630 preview, and the supplied logo as the site brand and favicon.
