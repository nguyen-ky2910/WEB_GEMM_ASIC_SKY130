# Data inventory / Kiểm kê dữ liệu

Audit: **418 original files**, **21 RTL modules**, **56 CSV files**, **41 `.rpt`**, **27 `.log`**, **7 SDC**, selected original layout/IR figures. The audit excludes `chip-visualizer/`. The complete relative-path, size and SHA-256 inventory is in `public/generated-data/project.json` and `scripts/validation/source-baseline.json`.

This workspace has **no `.git` directory**. Current branch, commit and uncommitted Git status are therefore **Not Available**. `eco-signoff-wip` is the user's reference branch, not a verified local branch.

| Category | Available | Used in website | Limits |
|---|---|---|---|
| RTL hierarchy | `rtl_asic/*.v`, `rtl_asic/axi/*.v` | Module/port inventory, block explorer, related-source links | Lightweight declaration scan, not a synthesized elaborated netlist |
| Physical hierarchy | Placement generators, configs, IP/row/AXI summary CSV | 32 row + 80 SRAM + 1 AXI macro extents | Constraints-Based Reconstruction, not as-built coordinates |
| SRAM macros | Master name and dimensions in generator, source wrappers | 80 × 2 KiB, 160 KiB total | No internal SRAM polygons or distributed PDK views |
| Netlists | RTL / black-box declarations only | Related hierarchy | Final synthesized/gate netlists absent |
| Layout stages | Native Tcl flow + generators + figures | Ten-stage mapping with explanatory overlays | No per-stage physical snapshots or placement evolution |
| Waveforms | Sparse text `errata_trace_M2_2x32x32.txt` | Discrete real samples at recorded cycles | No reconstructed clock or interpolation across gaps |
| Digital VCD | None | Offline importer and browser JSON adapter | No raw VCD replay until imported |
| GLS | Perf CSV, `gls_errata.txt`, documented signoff | Workload evidence and recorded results | Full gate-level waveforms absent; JS demo is not GLS |
| PPA | 22 selected CSV tables + report summaries | Conditioned charts and comparisons | Post-layout estimates/simulation; no silicon measurement |
| STA | Endpoint slack histograms, block fmax reports, signoff document | TT/SS/FF, RC, check/path filters | Full critical-path timing graph and TNS not extracted |
| DRC/LVS/XOR/ARC | Signoff summary and history | Documented final check results | Raw final signoff logs are outside this export |
| ECO | Antenna convergence + DRV CSV; ECO scripts | Recorded round replay | Not live process telemetry; no modified-net geometry |
| IR drop | Models A/B CSV, original figures, worst100 nodes | Model selector, original figures, sparse node map | Static PSM; top-level versus row effects differ; no transient model |
| Clock | SRAM before/after slew CSV, document results | Clock slew analysis | No extracted clock topology or insertion-delay tree |
| DEF / LEF / GDS / SPEF / SDF / ODB | **Absent** | Import adapter entry points | No full-layout extraction can be claimed |
| Run history | `NHATKY.md` core_v1 through core_v11 variants | Original change/result narratives | Earlier raw run directories absent; incomplete comparisons remain unavailable |
| AXI alternatives | RTL switches thin/reg/lean/lean_cg and final shell CSV | Source architecture, final shell, protocol demo | No comparable raw PPA runs for all alternatives |

## Data labels

- **REAL:** parsed source CSV, declarations, source reports or explicitly transcribed documented signoff values.
- **REPLAY:** sampled trace, recorded ECO sequence or script-mapped flow evidence, with no tool execution.
- **DEMO:** `demo-data/`, mathematical GEMM, protocol/clock-gate illustration, conceptual 1,024-PE positions and explanatory interconnect/metal overlays.

The source-derived XY reconstruction carries its own visible label; decorative top-surface marks represent abstract macro surfaces, not extracted metal. Z heights and explosion distance are visualization scales.
