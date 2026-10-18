# Official repository findings — GEMM32 research website

Audit date: 18 October 2026 (Asia/Bangkok). This document is an evidence map, not a claim that ASIC experiments were rerun during website development.

## Source snapshots and access

- Official branch: `hierarchical-openlane-flow`.
- GEMM commit: `eb8529822c826babe042158af7cd0c3a8f95a25a`, resolved using GitHub REST branch API. All GEMM files in `docs/reference/gemm/` were fetched by immutable SHA, rather than the moving branch.
- Immutable repository: https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/tree/eb8529822c826babe042158af7cd0c3a8f95a25a
- Primary documentation: [README](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/README.md), [HUONGDAN](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/HUONGDAN.md), [NHATKY](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/NHATKY.md).
- GitHub recursive tree saved to `docs/reference/gemm/tree.json`; no run logs, GDS, DEF or physical reports are committed in this tree. Therefore the numerical results below are verified as repository-documented results, not independently reproduced measurements or raw-report reanalysis.
- Downloaded every specifically requested GEMM source file (README, HUONGDAN, NHATKY, PE/row/array/core/AXI RTL, core/IP configs, run_flow, verification and analysis tools), plus bounded supporting text files: shared config, row comparison testbench, ASIC defines, floorplan generator and channel cleanup hook.
- Reference NPU source snapshot: `ca41cabd19e49c70f375b1df38faa8b0c6a29261` (main branch SHA resolved during audit). Four requested files are under `docs/reference/npu/`. All four inspection copies were re-fetched by immutable SHA after resolution. No NPU image/branding assets were fetched or used.
- The web browsing service could not fetch the supplied pages; ordinary HTTPS GitHub REST/raw requests succeeded. The parent task handles live browser inspection of the reference page.

## Recommended publication baseline

Use **core_v11** throughout PPA and final core verification. Scope is `GemmAccelerator`, a pre-silicon hardened core, not a complete packaged or fabricated chip. Earlier core_v9/v10 physically routed but shared the faulty old row macro.

| Claim | Value and conditions | Classification | Evidence |
|---|---|---|---|
| Array | 32×32, 1,024 signed INT8 PEs, weight-stationary | Repository-verified architecture | README; `rtl_asic/PE.v`, `PE_array.v`, `gemm_asic_cfg.vh` |
| PE operation | Registered signed 8×8 multiply; product sign-extended into a 21-bit row partial sum; two-cycle PE latency | RTL-verified architecture | PE.v; PE_array.v |
| Core output accumulation | 32-bit output accumulation, then shifted/quantized output | RTL-verified architecture | GEMM_core.v parameters, OutputBuffer instantiation |
| Hard macro count | 32 PE-row macros + 80 OpenRAM SRAM = 112 hard macros at core scope | Repository/code verified | Core config blackboxes and EXTRA_GDS/LEF; run_flow macro-count guards |
| SRAM split | 24 input-buffer SRAM + 24 feeder-tile SRAM + 32 output-buffer SRAM | Code verified | `openlane/gen_core_files.py`, macros_of calls and v3 guard |
| SRAM type | `sky130_sram_2kbyte_1rw1r_32x512_8` | Config verified | core config |
| Die dimensions | ~7.06×10.24 mm | Documented physical result | README, NHATKY |
| Die area | ~72.3 mm² (rounded) | Documented physical result | README |
| Core standard-cell area including rows | 7,684,240 µm² = 7.68424 mm² | Documented synthesis-derived area; excludes SRAM | HUONGDAN AXI comparison; not interchangeable with die area |
| Clock | 10 ns target = 100 MHz | Config and documented result | gemm_common.tcl |
| Typical timing | TT, 25°C, 1.80 V: internal setup +1.21 ns, hold +0.27 ns | Documented STA | README, NHATKY |
| Slow timing | SS, 100°C, 1.60 V: setup −7.61 ns RC max, −6.35 ns RC min at 10 ns target; ~57 MHz estimated limit | Documented STA + derived frequency | NHATKY, HUONGDAN |
| Fast hold | FF, −40°C, 1.95 V: clean at RC min and RC max | Documented STA | NHATKY |
| I/O timing | 196 setup paths waived, worst −0.81 ns at TT; no pad ring | Explicit limitation | README, NHATKY |
| Router DRC | 0 | Documented physical result | README, NHATKY |
| Magic | 48 abstract-view flags, all checked on full GDS; 0 real errors | Documented verification plus scope qualifier | HUONGDAN §5, NHATKY; do not hide 48 flags |
| LVS | Match, 0 errors | Documented physical verification | README, NHATKY |
| Antenna | **219 pins on 205 nets remain**, median severity ~1.4× limit; 0 SRAM pins | Open limitation | README, HUONGDAN |
| Power activity window | Core+row gate-level simulation, matrix 64×64×64, second-job compute phase, cycles 2300–3200 | Methodology | HUONGDAN §5, tools/power.sh |
| VCD power | 1.530 W at TT/25°C/1.80 V, 100 MHz | Pre-silicon estimate | NHATKY power table |
| Vectorless power | 2.892 W with OpenSTA default activity | Separate pre-silicon estimate | NHATKY power table |
| Peak throughput | 204.8 GOPS = 2×32×32×100 MHz | Theoretical, counts multiply and add separately | README, HUONGDAN |
| Energy efficiency | ~134 GOPS/W = peak 204.8 GOPS / estimated 1.530 W | Derived estimate; not measured sustained efficiency | README, HUONGDAN |
| Throughput density | ~2.83 GOPS/mm² = 204.8 / 72.3 | Derived theoretical value | README |

Do not label fully signoff clean: the generic core run checker still returns FAIL due to antenna and raw abstract Magic flags. Manual full-layout macro checks resolve Magic flags, but antenna remains open.

### VCD power breakdown (mW)

| Group | Sequential | Clock tree | Combinational | Total |
|---|---:|---:|---:|---:|
| SRAM (80 macros) | — | — | — | 445 |
| 32 PE rows | 402 | 262 | 118 | 782 |
| Remaining core | 120 | 136 | 46 | 302 |
| Rounded component sum | | | | 1,529 |
| Reported total | | | | 1,530 |

The 1 mW difference is rounding. SRAM library energy per clock edge is unchanged when unselected, making the SRAM contribution an upper bound. Functional gate models omit gate-delay glitch power; do not describe the estimate as silicon measurement.

## C1: exact hierarchy and physical hardening distinction

[Core config](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/openlane/designs/gemm_core/config.tcl) directly lists hardened `ProcessingElementRow` and SRAM views; it synthesizes `PE_array.v` with surrounding core logic. Thus the array is a successfully implemented **standalone demonstration stage**, but the final core does not instantiate one giant hardened array macro. It reuses 32 row macros directly. Show `PE → Row → Array → Core` as logical/flow hierarchy, and annotate the actual core macro boundary at the row level.

- PE run: 6,604 µm² reported, 2 min. A separate sizing/hardening experiment, not 1,024 independent hard macro instances in core.
- Row: 32 PE, macro 3517.62×133.28 µm; fixed defaults, no parent parameter override; blocks met1–met4; top/bottom aligned buses.
- Standalone array: FeatureSkew +32 rows +OutputDeskew, 19.9 mm² reported, 3 h 14 min, 10 iterations, I/O timing waived.
- Core: InputBuffer +BufferFeeder/GemmComputeCore/array +OutputBuffer, 32 rows+80 SRAM.
- Weight preload shifts upward through row chain; `i_weight_load` copies each shift stage to stationary active weights. Feature values propagate horizontally; partial sums flow downward. Do not animate weights continually moving during the compute phase as if this were output-stationary.
- Weight/feature memory sizes W1024/F512/O512 are words of different widths, not all byte counts.
- Generator describes v3 SRAM locality: 48 SRAM in region A near feeder/input lanes; 32 accumulation SRAM in 4×8 region B under row stack. A newly drawn overview should say conceptual unless it is generated from actual placed coordinates.

## C2: reconstruction of experiments

All entries below are from NHATKY, crosschecked against config comments and scripts. Run names describe experiments, not a uniform benchmark series.

| Run / event | Problem and intervention | Documented outcome |
|---|---|---|
| core_v1 | SRAM collected into large blocks | Global-route crash: severe congestion / excessively long detours |
| core_v1r | Resume from after CTS | Still congested, ~390k overflowing gcell edges; skew/deskew paths cross macros |
| floorplan v2/v3 probes | Relocate each SRAM near consuming logic; output region below row stack | Probe experiments, no named standalone run |
| core_v4 | v3 layout; disable synthesis fanout buffering (`SYNTH_BUFFERING=0`) | Overflow ~321k→~6.8k in the compared v3 case; ~9.5k DRT shorts from cells trapped between rows |
| core_v5 | FeatureSkew strip enlarged 320→1000 µm | No improvement |
| core_v6 | `keep_rows_clear.tcl`; die 7.06×10.24 mm | Overflow 575, one met5 short remaining; LVS spent 7 h due to short |
| core_v6r | Repeat routing seeds 7,23,101 | Same SRAM met5 short for all seeds; RightShifter setup −1.24 ns |
| core_v7 | Rewrite RightShifter to remove 32-bit adder from path; block met5 over SRAM; retain 50% met1 capacity | Stopped mid-DRT to add full standard-cell-layout Magic checking |
| core_v7r | Resume routing | SRAM met5 short fixed; internal setup clean, hold −0.01 ns; 23 DRT errors from one net crossing blocked SRAM |
| core_v8 | Disable heuristic diodes | Global overflow 46 versus v7r 515; no macro-crossing net; stop to add SRAM antenna data |
| core_v9 | Add SRAM LEF ANTENNAGATEAREA/ANTENNADIFFAREA; 3 antenna ECO rounds | DRT0/LVS match; setup+1.01/hold+0.11 ns TT; antenna221pins/209nets; 7h02m,13.0GB; subsequently found functionally wrong |
| core_v10 | Hold margin0.7, GRT_ANT_MARGIN50 | Hold clean all corners, TT setup−0.06ns, worse slow-corner setup; 219 antenna nets; rejected in favor of v9 configuration; also faulty old row |
| core_v11 | v9 configuration with corrected row macro | DRT0/LVS match; setup+1.21/hold+0.27ns TT; antenna219pins/205nets; 9h26m,13.5GB; full row-netlist GLS passes |

Avoid a single continuous trend chart combining every overflow count: 390k is the first resumed floorplan,321k is a different v3 probe baseline,46 is v8 global-route stop, and the final v11 documented value is not supplied. A discrete experiment table is safest. A clearly labeled pair comparison v7r(515)→v8(46) is supported.

Comparable v9 versus v11 metrics: total runtime7h02→9h26; route3h22→5h44; peak memory13.0→13.5GB; TT setup+1.01→+1.21ns; TT hold+0.11→+0.27ns; antenna nets209→205/pins221→219. Show v9 as invalid functionally; the purpose is repaired correctness, not overall speedup.

Mechanisms:

1. ABC synthesis buffer grouping lacks physical location, ties control sinks in distant lanes and distorts placement. Disable synthesis buffers; let post-placement `repair_design` build localized trees.
2. Roughly1,300 cells/repeaters in narrow row channels cannot escape because rows block met1–met4. Cleanup hook moves these cells to free regions before each detailed placement, leaving legitimate row-to-row hold buffers.
3. SRAM blocks met1–met4. Allowing met5 track changes above SRAM produced unrecoverable geometric shorts; block met5 over SRAM and ensure no global guide crosses the macro interior.
4. Check macro crossings after global route (threshold50µm), stop early; repeated route seeds cannot solve impossible geometry.
5. Heuristic diodes caused congestion. Disable heuristic insertion, add accurate antenna information and targeted ECO diode placement. Rerouting creates new violations elsewhere, so antenna settles near200 nets rather than reaching0.

## C3: functional correctness case

[Incident source](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/NHATKY.md#lỗi-chức-năng-trong-row_v1-phát-hiện-0410).

- Detected4October2026, row/core rebuilt4–5October.
- Earlier core GLS modeled rows with RTL, masking the hard-macro netlist bug. Gate-level row netlists exposed wrong output column23.
- Row random co-simulation localized to PE23, product bits12–15.
- After CTS and step15 netlist correct; after step17 post-global-route resizer timing optimization incorrect.
- Log: `Swapped pins on 1 instances`; `repair_timing` swapped A_N and B of `and2b_1`, a noncommutative cell.
- All32 macros in core_v9/core_v10 reused the faulty row; core-level pin swap had already been disabled, so error originated inside reused macro.
- LVS proves layout corresponds to the final netlist. Both inherited the same changed logic; it does not prove equivalence to reference RTL.
- Flow now adds `-skip_pin_swap` to `repair_timing`; row output is checked against RTL via `sim/row_equiv.sh`.
- Corrected row:2,000random stimulus cycles,0bit mismatches. This is **simulation-based comparison**, not formal proof.
- Rebuilt row: DRT0, Magic0, LVS match, antenna0; TT setup+4.20ns,hold+0.29ns;76,554cells;27min;2.4GB.
- Macro geometry unchanged, so core_v11 reused v9 floorplan.
- Core-v11 GLS uses final core netlist and gate-level netlist for every row. `run_flow.sh core-gls` defaults ROW=gl, although raw `sim/run_gls.sh` defaults ROW=rtl. Documentation should distinguish entry points.
- GLS uses sky130 functional models,1ns sequential unit delays/zero-delay logic, not an SDF-annotated timing simulation. Do not claim post-layout SDF signoff.

| M×K×N | Compared output events | Elapsed simulation | core_v11 result |
|---|---:|---:|---|
|64×64×64|258|327s|PASS; same result cycles as FPGA RTL|
|8×32×544|274|~570s|PASS; same result cycles as FPGA RTL|
|16×992×32|34|1317s|PASS; same result cycles as FPGA RTL|

Peak GLS memory3.1GB. No ASIC simulation was run for website development; these are documented regression results.

### Exact and2b boolean function

Official SkyWater source downloaded into `docs/reference/sky130/sky130_fd_sc_hd__and2b.functional.v`:
https://github.com/google/skywater-pdk-libs-sky130_fd_sc_hd/blob/main/cells/and2b/sky130_fd_sc_hd__and2b.functional.v

`X=(NOT A_N) AND B`. With connected signals swapped: `X_swapped=(NOT B) AND A_N`.

|A_N|B|Original X|Swapped X|
|---:|---:|---:|---:|
|0|0|0|0|
|0|1|1|0|
|1|0|0|1|
|1|1|0|0|

## AXI status and measurements

[HUONGDAN §8](https://github.com/HoangNhan2412-ICD/GEMM32-ASIC-sky130/blob/eb8529822c826babe042158af7cd0c3a8f95a25a/HUONGDAN.md#8-axi-accelerator-ip-gemm_top)

- AXI4-Lite control +three256-bit AXI4-Stream interfaces(feature,weight,result).
- Original control0x00–0x0C preserved; IRQ_ENABLE0x10,IRQ_STATUS0x14,ERROR0x18,JOB_CYCLES0x1C,IP_ID0x20,IP_VERSION0x24; irq supported.
- thin connects streams directly; reg uses two-entry skid buffers; lean uses one-entry input forward slices/two-entry result skid; lean_cg gates stream data banks.
- Default REG2/CG1 (lean+clock-gating), selected after10October shell experiment.
- Documented axi-sim ALL PASS, test variants thin/reg/reg_cg/lean/lean_cg plus OpenRAM models; random backpressure and error/register tests.
- Separate shell hardening measured four variants. DRC/LVS clean, antenna remains. Documented axi-gls lean_cg wrapping final core_v11 netlist passes; duration refers to one matrix, so do not claim all three AXI GLS shapes passed.
- HUONGDAN explicitly labels full integrated GEMM_top physical implementation a future step. Current code includes **newer gemm_ip/gemm_ip_shell configs and ip-* commands** implementing113macro hierarchy(32rows+80SRAM+1AXI shell). Therefore report **flow implemented; completed IP physical signoff not evidenced in supplied snapshot**. Do not equate existence of config with completed GDS. No committed run outputs prove completion.
- Standalone shell clock tree does not share core CTS; interface timing of complete IP not yet established. Do not add shell slack directly to core slack.

Documented10October2026 results:

|Metric|thin|reg|lean|lean_cg|
|---|---:|---:|---:|---:|
|Std-cell area µm²|10372|72708|47632|32765|
|Area/core including row logic|0.14%|0.95%|0.62%|0.43%|
|Placed area µm²|51858|159101|123163|100931|
|Flops|123|1676|1158|1158|
|Slowest internal setup ns|+5.31|+0.95|+0.40|+3.01|
|Typical internal hold ns|+0.36|+0.30|+0.30|+0.31|
|Vectorless mW|3.86|44.4|32.7|6.91|
|Full testbench VCD mW|1.79|14.3|9.87|3.02|
|Compute-window VCD mW|3.13|16.6|11.9|≤12.1|
|Antenna violating pins|6|56|38|12|
|Output delay versus KV260 cycles|0|1–3|1–3|1–4|

Full-testbench VCD is a fair same-window comparison of shell variants. Lean→lean_cg area reduction~31%,VCD reduction~69%. Compute-window lean_cg≤12.1mW is an upper bound: OpenSTA mishandles zero-toggle gated-clock activity in this window. Core has no full-testbench power reference, so do not compute a full-job IP energy efficiency from these rows.

## Publication and provenance cautions

- Source facts are attributable to the project repository; report classification as documented verified result rather than independently rerun signoff.
- Local proposal numerical conflicts are audited by parent task. Expected50MHz/104.8GOPS figures must not replace the coherent100MHz/204.8GOPS baseline. Theoretical50MHz peak would be102.4GOPS;104.8is not consistent with2×1024×50MHz without another definition.
- The reference NPU GDS/3D data is unrelated to GEMM and must not be published as GEMM evidence. Reference implementation uses a self-contained library-free WebGL2 renderer with compressed geometry,13layers,drag rotate,shift/right drag pan,wheel/pinch zoom,fullscreen,presets,and static fallback. Learn interaction behavior only.
- No physical implementation/synthesis/route/ASIC tools were executed, no original ASIC checkout modified, no heavy design assets downloaded.

