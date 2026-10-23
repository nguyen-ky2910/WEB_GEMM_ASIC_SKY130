# Data provenance

All research paths are relative to the original source workspace. Every exported file is hashed in the inventory. Original source paragraphs remain in their original language when opened. No hardware version is inferred from an unavailable Git commit.

| Dataset / metric | Source | Variant, conditions | Method / confidence |
|---|---|---|---|
| Full IP geometry | `openlane/gen_core_files.py`, `openlane/gen_ip_files.py`, `openlane/run_flow.sh` CORE_GEN_DEFAULT, `row_summary.csv`, `axi_summary.csv`, `ip_summary.csv` | Full integrated IP constraints | Call pure layout_v3 function with read-only imports; use measured row extents; shift into IP extents and place AXI from generator default. Reconstruction, not final DEF |
| Full IP die/core bbox, macro/top cell area, flops, instance counts | `docs/paper/data/ip_summary.csv` | Final ECO evidence package | Direct CSV parse. Top cell count includes filler/tap; standard-cell area excludes nested macro internals |
| Row/AXI extents and counts | `row_summary.csv`, `axi_summary.csv` | row_v1 and final lean_cg AXI shell | Direct CSV parse; 76,554 cells is the referenced row, not an arbitrary imported macro |
| 50 MHz, TT setup/hold, FF/SS hold, SS macro/I/O exceptions, DRT/Magic/ARC/LVS/XOR/GLS | `docs/TIEN_DO_SIGNOFF.md` | Final `s7E/a5`, OL1 run `s5/final_a5`, documented 2026-10-20 | **Transcribed documented summary**, clearly marked; raw final check reports absent locally |
| Whole-job power, energy, throughput, pJ/MAC, SRAM total lower bound | `energy_job_50MHz.csv` | Final ECO IP, TT 25°C, 1.80 V, 50 MHz, SPEF RC nom, GLS whole job 2 | Direct CSV; unit-delay activity, no glitch; original testbench gaps/backpressure; estimated power |
| Phase/hierarchy/internal/switch/leak power | `power_by_phase_50MHz.csv` | Same three jobs and conditions | Direct CSV; clock-tree power overlaps the hierarchy decomposition and must not be added again |
| Clock-versus-data power | `power_clock_vs_data_64.csv` | **64×64×64 only**, same TT/RC/frequency | Direct CSV; non-clock toggles set to zero for clock-only analysis; not physical clock gating measurement |
| Theoretical peak 102.4 GOPS | RTL 32×32 array, documented 50 MHz target | Final ECO IP TT library condition | **Theoretical**: 2 × 32 × 32 × 50e6 / 1e9; not effective job throughput |
| Slack histograms | `slack_histogram_final.csv` | Library TT/SS/FF, RC min/nom/max, setup/hold, cc/macro/io | Direct CSV bins; bin edges are rounded, not exact critical-path slack |
| Routing occupancy | `routing_utilisation.csv` | Final ECO top, 50 µm tiles | Direct CSV; peak vs mean/p99 are distinct; not a reconstructed route geometry heatmap |
| Antenna ECO convergence | `antenna_convergence.csv` | ip_v3r round 1 → incremental dcf36133 rounds | Direct CSV; ARC tool differences and full-reroute sequences retained in exported evidence |
| DRV progression | `drv_by_eco_round.csv` | TT RC nom / SS RC max | Direct CSV; intermediate and final checks are independent of antenna-only replay |
| IR models A/B | `irdrop_v2A_summary.csv`, `irdrop_v2B_summary.csv`, `irdrop_ip_v2_summary.csv`, worst100 CSV | Static analysis with checkerboard vs stripe-end sources | Direct CSV + original project figure; sparse worst-node map isn't a full-chip heatmap; do not combine independent worst VDD/VSS nodes as a co-located measurement |
| SRAM clock slew | `sram_clk_slew_before_after.csv` | TT RC nom ≤0.75 ns / SS RC max ≤1.0 ns | Direct CSV; displayed small sample table plus full CSV download |
| Source trace | `errata_trace_M2_2x32x32.txt` | RTL directed M=2, K=32, N=32 | Parse actual debug key/value fields and cycle numbers; gaps unknown |
| Errata expected/observed results | `errata_rtl_tests.txt`, `gls_errata.txt`, `sim/run_errata.sh`, README | ASIC SRAM, lean + clock gating | Recorded directed results. PASS of defect test means expected WRONG/HANG reproduced; short M2 status polling can say OVERALL FAIL with correct data |
| PE equivalence | `pe_equiv2_yosys062.log`, SUMMARY §8 | Yosys equiv_induct with register-name matching | Recorded proof evidence, scoped to PE and setup; not an end-to-end full-IP formal proof |
| Core run changes | `NHATKY.md` | core_v1…core_v11 and reroute variants | Original documented history. Missing metrics not invented |
| Pre/post ECO comparison | `docs/TIEN_DO_SIGNOFF.md` comparison table | ip_v3r kept round vs final ECO, comparable reported scope | Documented values; vectorless power 1375.4/1377.6 mW must not be compared directly to VCD 745.05 mW |
| Register map / quantization | `rtl_asic/axi/AxiLiteControlRegs.v`, `GemmAxiShell.v`, `Right_shifter.v` | IP v1.1, array32, INT8 | Source-derived software semantics; browser demo is not RTL co-simulation |

## Signoff boundaries

50 MHz is a **TT-library** result, with macro libraries included. SRAM OpenRAM has only a TT Liberty and timing is extrapolated beyond the characterized slew range. SS macro setup is negative; SS I/O hold is negative. I/O clocks must be evaluated by an integrator. The website does not upgrade the project-specific signoff policy into all-corner or silicon validation.

The old core_v11 100 MHz and 204.8 GOPS values are excluded from final-IP headline results. Changes in constraints/RTL prevent causal attribution of run-history improvements to an isolated optimization.
