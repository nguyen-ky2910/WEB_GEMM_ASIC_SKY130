# Content sources — immutable evidence map

Snapshot:18 October2026. Branch:`hierarchical-openlane-flow`. Commit:`eb8529822c826babe042158af7cd0c3a8f95a25a`.
Baseline:**core_v11**, pre-silicon GemmAccelerator core, without pads/package/fabrication. Numerical evidence is repository-reported; no ASIC experiment was rerun for this website.

## Claim classes

- **Verified result**: claim verified against the cited documentation/code; not independent silicon or flow reproduction.
- **Theoretical calculation**: formula and assumptions supplied.
- **Pre-silicon estimate**: model/activity dependent, not measurement.
- **Conceptual illustration**: teaching visualization, not placement, gate timing or RTL simulation.
- **Work in progress**: documented open issue.
- **Future work / unverified**: no completed evidence available.

| Website section / claim | Class | Source |
|---|---|---|
| Overview32×32,1024PE, INT8, weight-stationary | Verified architecture | [README](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/README.md), [PE.v](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/rtl_asic/PE.v) |
| SRAM24+24+32, direct32 row instances | Verified code | [Core generator](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/openlane/gen_core_files.py), [core config](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/openlane/designs/gemm_core/config.tcl) |
| C1 row dimensions, standalone array, macro boundary | Verified code and documented implementation | [PE_row.v](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/rtl_asic/PE_row.v), [NHATKY](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/NHATKY.md) |
| C2 timeline,515→46 global overflow | Verified historical experiments | [NHATKY](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/NHATKY.md). Chart intentionally shows one comparable pair, not a synthetic all-version trend. |
| C2 channel relocation / macro layers | Verified mechanism from code | [keep_rows_clear](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/openlane/designs/gemm_core/keep_rows_clear.tcl), core config, run_flow |
| C3 PE23, product bits12–15, post-route timing repair input swap | Verified documented case | NHATKY, [run_flow](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/openlane/run_flow.sh) |
| and2b function X=(~A_N)&B | Verified Boolean definition | [Official SkyWater functional Verilog](https://github.com/google/skywater-pdk-libs-sky130_fd_sc_hd/blob/main/cells/and2b/sky130_fd_sc_hd__and2b.functional.v). Truth table with swapped signal mapping:00→0/0,01→1/0,10→0/1,11→0/0. Interactive example is conceptual. |
| Row2000cycles0mismatch; core GLS3 sizes | Verified reported simulation results | NHATKY, [row_equiv](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/sim/row_equiv.sh), [run_gls](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/sim/run_gls.sh). No claim of formal proof or SDF-annotated core GLS. |
| Results72.3mm², DRT0, Magic0real/48flags, LVS match | Verified documented physical results | README, NHATKY, [HUONGDAN](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/HUONGDAN.md) |
| Antenna219pins/205nets | Work in progress | README, NHATKY; kept distinct from router DRC. |
| Timing TT+1.21/+0.27ns, SS−7.61ns, FFholdclean,196I/Owaivers | Verified documented STA, with scope limits | README, NHATKY; [STA tool](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/tools/sta_corners.py) |
| Power1.530W /2.892W | Pre-silicon estimate | NHATKY, HUONGDAN, [power.sh](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/tools/power.sh). TT25°C1.8V100MHz; VCD64×64×64 compute window cycles2300–3200. SRAM445mW upper bound. |
|204.8GOPS /134GOPS/W | Theoretical peak / derived estimate |2×1024×100MHz;204.8/1.530. Not workload throughput or measured efficiency. |
| AXI control/status, streams, shell hardening | Verified code and documented shell results | [GEMM_top](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/rtl_asic/axi/GEMM_top.v), [GemmAxiShell](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/rtl_asic/axi/GemmAxiShell.v), HUONGDAN |
| Full-top final physical signoff | Unverified / missing evidence | Flow commands and config exist; completed run artifacts were not available. |
| Hero/3D/gallery dimensions2741cells | Supplied model evidence | Original local HTML embedded data; not baseline core_v11 or old PE sizing-run measurements. Vertical dimensions approximate. |
| Architecture and workflow figures, authors/advisor | Local proposal evidence | PROPOSAL_ASIC_GEMM.docx: title page and embedded images1/2. |
| Systolic demo / hierarchy and AXI drawings | Conceptual illustration | Author-created SVG based on cited RTL architecture. Not a physical layout or cycle-accurate emulator. |

## Scope guardrails

No fabricated/taped-out-chip claim. No all-corner100MHz. No antenna-clean claim. No formal-equivalence claim for the2000-cycle row comparison. No full-AXI-GDS completion inferred from config existence. No unrelated NPU data or imagery. No proposal download is exposed; originals stay private/local.
