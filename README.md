# Cluster Atlas

**An interactive field guide to supercomputing.**

Cluster Atlas makes large-scale computing systems easier to understand by turning publicly available hardware specifications into interactive visualizations.

Explore supercomputers and AI clusters, inspect their node configurations, compare systems side-by-side, and see how CPUs, GPUs, memory, storage, and interconnects fit together.

**Live demo:** https://cluster-atlas-5rp.pages.dev/

---

## Why Cluster Atlas?

Supercomputer specifications are usually spread across operator documentation, TOP500 entries, technical papers, and vendor pages.

Even after finding the numbers, it can be difficult to build an intuition for what a machine actually looks like:

- How many compute nodes does it have?
- How many GPUs are inside each node?
- How are CPUs and accelerators connected?
- What network connects the nodes?
- How does one system compare with another?

Cluster Atlas tries to make those answers visual.

Rather than presenting only a table of specifications, it lets you explore the machine from the cluster level down to an individual node.

---

## Features

### Explore supercomputers

Browse a catalog of major HPC and AI systems, including machines from the TOP500 as well as notable research and AI clusters.

### Interactive architecture views

Move between multiple levels of abstraction:

- **Network view** — understand the cluster-level organization
- **Node inventory** — browse the compute nodes in a system
- **Node architecture** — inspect CPUs, GPUs, memory, storage, and interconnects

### Hardware discovery

Search and filter systems based on their hardware characteristics and explore clusters matching particular accelerator or processor configurations.

### Cluster comparison

Compare two systems side-by-side to understand differences in:

- compute-node counts
- CPUs
- accelerators
- memory
- interconnects
- topology

### Global cluster map

Explore where major supercomputing systems are located around the world.

### Source-backed data

Hardware information is linked to public sources such as:

- TOP500
- supercomputing-center documentation
- system operator documentation
- vendor and architecture documentation

Unknown or insufficiently documented fields are explicitly marked rather than inferred.

---

## What the diagrams represent

Cluster Atlas is intended as an **educational architecture explorer**, not an exact physical reconstruction of a datacenter.

Node diagrams show representative hardware configurations.

Network diagrams may simplify:

- switch layouts
- cable routes
- PCIe topology
- rack placement
- network grouping

When reliable public information about a topology is unavailable, Cluster Atlas explicitly labels it as **not verified** instead of inventing a layout.

Node identifiers shown in the interface are illustrative indices, not real hostnames.

---

## Project structure

```text
cluster-atlas/
├── dist/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── data.js
│   ├── top50.js
│   ├── discovery.js
│   ├── compare.js
│   ├── locations.js
│   ├── world-map.js
│   ├── catalog-expansion.js
│   └── world-land.svg
│
├── scripts/
│   ├── import-top50.py
│   └── test-discovery.mjs
│
└── TODOs.md
```

The site intentionally has no frontend framework or build dependency. It is built with plain:

- HTML
- CSS
- JavaScript

This keeps the application lightweight and makes it easy to deploy as a static site.

---

## Running locally

Clone the repository:

```bash
git clone https://github.com/AbhinavDutta/cluster-atlas.git
cd cluster-atlas
```

Because the application uses JavaScript modules, serve the `dist` directory through a local HTTP server rather than opening `index.html` directly.

For example, with Python:

```bash
cd dist
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No package installation or build step is required.

---

## Data

The catalog currently combines manually curated system profiles with TOP500-derived information.

The largest generated catalog is stored in:

```text
dist/top50.js
```

Additional architecture information and richer system profiles live in:

```text
dist/data.js
dist/catalog-expansion.js
```

The TOP500 import utility is located at:

```text
scripts/import-top50.py
```

Public documentation is preferred over secondary descriptions whenever possible.

---

## Design principles

Cluster Atlas follows a few simple rules:

**Show uncertainty.**  
If a specification cannot be verified, it is marked as unknown rather than guessed.

**Keep sources accessible.**  
Users should be able to trace important hardware claims back to public documentation.

**Prefer intuition over exhaustive schematics.**  
The goal is to explain how a system is structured without pretending to reproduce every physical connection.

**Stay lightweight.**  
The entire application runs as a static website without a backend or JavaScript framework.

---

## Contributing

Contributions are welcome, particularly for:

- adding new clusters
- improving existing hardware profiles
- correcting outdated specifications
- adding primary sources
- improving architecture visualizations
- improving search and discovery
- fixing accessibility or UI issues

For data corrections, please include a source that supports the proposed change.

---

## Adding a cluster

A useful cluster entry typically includes as much of the following information as can be verified:

```text
System name
Operator / institution
Country
Compute-node count
CPU model
CPUs per node
Accelerator model
Accelerators per node
Host memory
Accelerator memory
Local storage
Node interconnect
Cluster interconnect
Network topology
Source URLs
```

It is completely acceptable for fields to remain unknown when reliable public information is unavailable.

---

## Current limitations

Cluster Atlas does **not** currently provide:

- live scheduler information
- cluster utilization
- job monitoring
- real node hostnames
- exact rack layouts
- exact cable or switch-port mappings

The project models publicly documented architecture rather than live infrastructure.

---

## Feedback

Found an incorrect specification or know of a cluster that should be included?

Open an issue or submit a pull request.

Suggestions for making HPC architecture easier to understand are especially welcome.

---

## License

A license has not yet been specified for this repository.

If you plan to reuse or redistribute the code or dataset, please check the repository for an updated license first.

## Generated cluster pages

After changes to catalog data, page layout, or asset versions, run `node scripts/generate-cluster-pages.mjs` and commit the generated `dist/clusters/` pages, sitemap, and robots.txt. Cloudflare publishes the checked-in `dist` directory. These pages provide static specifications and sources plus the interactive explorer. Existing hash links remain supported.
