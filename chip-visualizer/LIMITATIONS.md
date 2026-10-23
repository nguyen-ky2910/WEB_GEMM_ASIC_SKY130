# Limitations / Giới hạn

## Evidence and hardware

- This is an educational/research visualizer, **not a transistor-level electrical digital twin**. No measured silicon PPA exists in the included dataset.
- The source export has no Git metadata. The user's reference `eco-signoff-wip` branch/commit cannot be verified locally.
- Physical view is a **Constraints-Based Reconstruction** from checked-in placement functions and summary dimensions. It is not a final DEF/GDS snapshot. Standard-cell positions, macro internals, pins, actual signal routes, clock topology, vias and polygon-level metal are not extracted.
- Abstract macro surface marks, power/clock/interconnect sheets, 3D heights and layer spacing are illustrative. Cross-section clips volumes without capping the cut; explanatory overlay lines are not clipped.
- GDS adapter exports macro bounding boxes only and was not tested on absent GDS or an unavailable KLayout API. ODB/SPEF/SDF/full Liberty/full STA-path importers are not implemented. The supported DEF/LEF and digital VCD parsers are intentionally limited, not complete language implementations.
- The ten-stage flow replays script mappings and documented evidence. It does not invent per-stage DEFs, evolving placements or execution progress. Local EDA execution/backend is not implemented, and no long EDA task was run.
- Earlier core runs are documented history; raw run directories are absent. Missing PPA stays unavailable. Only documented pre/post ECO IP comparisons have numerical data. AXI thin/reg/lean alternative PPA comparisons are unavailable.

## Signoff scope

- **50 MHz is TT-library signoff**, not all-corner verified frequency or silicon validation. OpenRAM SRAM has only TT Liberty; SRAM timing is extrapolated outside characterized slew.
- Final documented SS macro setup is **−4.944 ns**, SS I/O hold **−4.041 ns**. These are reporting exceptions under the project's policy. A different policy could fail signoff. I/O timing needs the integrator's actual clock context.
- Core_v11 100 MHz and 204.8 GOPS are historical hypothetical values when macro paths were not fully checked; they are not final IP headline benchmarks.
- Power comes from unit-delay GLS activity and static analysis, without glitches. SRAM Liberty estimates are upper bounds; the app reports total-IP lower/upper estimates where available. Clock-tree contributions overlap hierarchy totals.
- Effective job throughput uses the original testbench with input gaps/backpressure. Peak theoretical throughput is separate.
- IR is static PSM under explicit source models. Original figures are source evidence; sparse worst-node dots are not an interpolated full-chip heatmap. Top-level and row-internal voltage drops require separate analysis. No transient, thermal or electric-field model is present.
- Verification PASS is scoped to its check/workload. PE formal proof is not a full-IP formal proof; GLS comparison with RTL can reproduce a known RTL defect.

## IP v1 errata

- E1: usable word counts are feature ≤511, weight ≤1023, output ≤511. A nominally full input buffer can hang; nominally full output can produce wrong data/extra beats.
- E2: M=1 produces incorrect data / extra output beats. Use M≥2 under the documented host policy.
- The validator applies `Kb=ceil(K/32)`, `Nb=ceil(N/32)`, `M*Kb≤511`, `32*Kb*Nb≤1023`, `M*Nb≤511`, `Kb≤31`, `Nb≤31`. It does not alter the original RTL.

## Simulation and UI

- GEMM is an editable 4×4 **Ideal Math Demo** with source-derived quantization; the separate M/K/N widget validates larger host jobs but does not resize or execute the demonstration. It does not reproduce defective v1 behavior or run an RTL simulator.
- AXI is a deterministic **protocol-level demo**. It respects VALID/READY acceptance, stable stalled beat/sidebands and modeled register fields, strobes/W1C/IRQ. It is not cycle-equivalent to all pipeline variants, reset synchronizers or the real AXI shell. Clock-gate visualization indicates demo buffer load only. No silicon is controlled.
- Sparse RTL debug samples preserve unknown gaps. Full VCD/GLS replay needs imported data; no exact activity-to-layout mapping is claimed.
- Auto rotate and explosion are intentionally independent. Pause freezes explosion; disable Auto rotate to stop camera motion. Each simulation stops stepping while its page is inactive; returning resumes its prior play state.
- Labels are selectively rendered, never all millions of cells. Raw screenshot export captures the WebGL canvas; HTML labels, legends and controls are omitted. Playwright page screenshots include those overlays.
- Responsive behavior prioritizes desktop/laptop. On phones panels overlay the viewer and can be closed; intricate charts/tables may scroll locally.
- Self-hosted DM Sans does not contain every Vietnamese glyph; Segoe UI/system fallback supplies missing characters. Original source text and scientific figure labels are preserved in their original language, while authored controls/explanations have EN/VI versions.

## Licensing and deployment

No license file exists in the research export. This work does not invent a redistribution license for the hardware or third-party PDKs. Only selected lightweight project evidence is copied; review it before public distribution. Nothing was committed, pushed or published.
