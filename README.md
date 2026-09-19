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
- **Node architecture** — inspect CPUs, GPUs, memory, storage, and interconnects
- **Specifications** — the full documented public record for the cluster and each
  node type, including facts a diagram cannot draw, with the fields the operator
  has not published listed explicitly

The node diagram draws each accelerator's own path to the cluster fabric when a
source documents one, so a node with a dedicated network adapter per accelerator
is shown as such rather than as a single shared interface.

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

The catalog tries to show everything the cited sources state, not only the subset
a diagram can draw. Each profile reports how many tracked fields are documented and
lists the ones that are not, so a gap is visible rather than implied.

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
│   ├── ranked-extras.js
│   ├── platforms.js
│   ├── enrich.js
│   ├── sources.js
│   ├── discovery.js
│   ├── compare.js
│   ├── locations.js
│   ├── world-map.js
│   ├── catalog-expansion.js
│   └── world-land.svg
│
├── scripts/
│   ├── import-top50.py
│   ├── audit-coverage.mjs
│   ├── generate-cluster-pages.mjs
│   ├── generate-icons.mjs
│   ├── test-discovery.mjs
│   ├── test-icons.mjs
│   ├── test-sharing.mjs
│   └── test-social.mjs
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

Published ranking fields that the generator does not carry in `top50.js` are transcribed in:

```text
dist/ranked-extras.js   ranked core count, theoretical peak, measured power, OS, manufacturer
```

Vendor platform specifications cited by node type are stored in:

```text
dist/platforms.js       e.g. NVSwitch count and per-GPU link bandwidth for DGX H100/H200/A100
```

Site icons are generated from `dist/logo.png` rather than committed by hand:

```bash
node scripts/generate-icons.mjs   # writes favicon.ico, favicon-16/32.png,
                                  # apple-touch-icon.png, icon-192/512.png
node scripts/test-icons.mjs       # verifies sizes, colour type and ICO payloads
```

Run the generator after replacing `logo.png`. Downscaling averages in
premultiplied alpha, so the logo's transparent background does not bleed dark
fringes into the mark. The favicon is deliberately multi-size: browsers request
`/favicon.ico` directly when a page has no icon link, and bookmark managers, RSS
readers and search engines do so regardless.

The TOP500 import utility is located at:

```text
scripts/import-top50.py
```

Public documentation is preferred over secondary descriptions whenever possible.

### Adding a cluster without omitting published information

A profile is only considered complete when every fact the cited sources state has
somewhere to appear. Adding a cluster means:

1. **Collect the primary sources first.** Operator documentation, the vendor
   platform datasheet, and the ranking entry if the system is ranked.
2. **Record every field the sources state**, even when a diagram cannot draw it:
   CPU sockets and cores, accelerator count, host and accelerator memory, local
   storage, network interface count, model and speed, the link between an
   accelerator and its interface, remote storage, power and operating system.
3. **State scale-out honestly.** If each accelerator has its own network adapter,
   say so (`nicTopology` / `nic` per accelerator); if the node has one shared
   interface, say that instead. If it is not published, leave it unverified.
4. **Attach a vendor platform** in `dist/platforms.js` when the node type is a
   named platform, rather than re-typing its facts per cluster.
5. **Preserve uncertainty.** Use `Not verified` for anything a source does not
   state. Never infer a count, socket layout or bandwidth from a system name.
6. **Run the guardrail:**

   ```bash
   node scripts/audit-coverage.mjs
   ```

   It fails when a ranked system is missing its published benchmark fields, a
   documented platform is missing its specification, or a record has grown a
   field that the interface cannot display.

The specification sheet in the interface renders a stable list of known fields and
then appends any remaining keys of the record. A new fact therefore appears
automatically once its key is classified, and the audit above fails if it is not.

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

Accelerator discovery uses canonical model identities in dist/accelerators.js. Original GPU labels, memory and form factor remain metadata; mixed profiles expose each explicitly named model. Architecture-only labels are excluded from model filtering. When adding hardware, extend the recognized model tokens and run scripts/test-discovery.mjs. Do not infer a chip model from its architecture name.
