# Implementation status — 2026-10-23

**Working, tested research website; partial fidelity as a hardware digital twin.** The interrupted initial scaffold was retained and completed. Only `chip-visualizer/` was changed. There is no local Git checkout metadata, so no branch/commit claim is made.

## COMPLETE — implemented behavior

| Function | Actual behavior / evidence |
|---|---|
| Standalone React/TypeScript/Vite app | Dev and production startup verified; no backend or research folders needed for browsing bundled evidence |
| Bilingual UI and themes | EN/VI immediate switching and language/theme persistence; 324 dictionary pairs, typed keys, missing-lookup check; source excerpts remain original |
| Navigation | All 15 destinations render; no JavaScript errors in browser navigation tests |
| Panel controls | Left/right/bottom collapse, focus mode, reset layout, desktop pointer resize; 3D state and inspector search survive control panel close/reopen |
| 3D macro explorer | WebGL2 with 113 full-IP macro extents: 32 row, 80 SRAM, 1 AXI. Instanced boxes, abstract surface markers and selective projected labels |
| Cameras | Orbit/zoom/pan, independent auto-rotate/speed, top/front/side/isometric/fit/focus, perspective/orthographic and smooth camera movement |
| Selection / inspector | Canvas raycast and module search, hierarchy/RTL/dimensions/location/orientation/source, highlight/isolate/focus; no invented per-module timing/power |
| Explosion animation | Independent rotation/explosion; expand/collapse/loop, speed/distance, scrub, play/pause/stop/replay. Browser verifies pause holds progress and stop resets |
| Visibility / rendering | Macro/boundary toggles, labels/IDs/legend, opacity/X-ray/wireframe, volume clipping, three quality levels, canvas PNG export |
| Conceptual architecture | Separate 1,024-instanced-PE scene, illustrative activity front driven by animation progress, clickable RTL blocks/declared ports |
| GEMM mathematical demo | Editable 4×4 signed INT8, random/example, per-MAC step/play/pause/reset/scrub, INT32 accumulation, software reference, source-derived shift/half-up/saturation |
| IP v1 validator | All documented M/K/N, Kb/Nb and F/W/O bounds; explicit E1/E2 warnings; original RTL untouched |
| AXI protocol demonstration | Three 256-bit streams, VALID/READY acceptance, stable stalled payload/TLAST/TSTRB, periodic/seeded/manual stalls, trace and historical cursor |
| AXI register demonstration | Real map 0x00–0x24, field masks, WSTRB, RO IDs/version, W1C event priority, registered IRQ, clear-done busy refusal, AW/W/B/AR/R handshake demonstration |
| Ten-stage adapter | Correct required order, native script mapping, previous/next/speed/scrub/play/pause/stop/replay; explicitly mapped Post CTS/Route Opt |
| Antenna ECO evidence replay | Recorded 446→37→6→3→1→0 sequence, selected round, runtime/rerouted-net source, separate DRV progression |
| Available-data analytics | Workload power/energy/throughput, hierarchy/phase power, TT/SS/FF & RC histogram filters, area/density, routing occupancy, IR models/figures/nodes, clock slew |
| Verification / comparison | Source-linked documented signoff, PE formal/row/GLS scopes, directed errata cases, numerical documented pre/post ECO comparison, core-history excerpts and missing-data states |
| Trace viewer | Actual sparse M2 debug samples at recorded cycles; signal search/add/remove, radix, time cursor/zoom/playback |
| Supported offline import | DEF units/rectangular bounds, macro LEF extents and placements; digital VCD events/scopes/aliases; inputs read-only, JSON output only inside web folder |
| Runtime dataset replacement | Validated normalized layout/waveform JSON file imports; preserves UI language and settings, no arbitrary filesystem/shell interface; malformed JSON rejected |
| Static deployment | Relative Vite base and dataset paths; full browser suite also passed production preview under `/gemm32/` |
| Research preservation | SHA-256 verification passed for all **418 original source files** |

## PARTIAL — useful implementation with explicit bounds

| Function | Completed / missing |
|---|---|
| Physical digital twin | Source-derived macro XY geometry complete; no final DEF/GDS in this export. Not an as-built layout |
| Layer visualization | Abstract macro volumes and illustrative power/clock/route/metal/pin overlays work; real polygon layers/vias/standard cells absent |
| Cross-section | Real clipping of box volumes; no caps on cut surface, explanatory lines unaffected |
| PD replay | Script mapping and documented data work; no per-stage DEF snapshots, cell evolution or live EDA logs. Same reconstruction remains visible |
| Hardware simulation | Correctly labeled math/protocol demos; no full-IP cycle-equivalent RTL execution, co-simulation or physical switching simulation |
| Signal replay | Actual sparse RTL samples and imported digital VCD work; original raw VCD/GLS traces and signal-to-layout mapping absent |
| Timing / PPA | Available source tables and documented summary are presented; no full critical-path graph, TNS extraction, transistor/thermal model or silicon measurements |
| IR / congestion | Real original static IR figures, summary and sparse nodes; routing occupancy bars. No interpolated fake full-chip heatmap; no transient IR simulator |
| Run comparison | Documented ip_v3r/final numerical comparison plus historical core excerpts; raw older runs/AXI-alternative PPA absent |
| GDS adapter | Optional KLayout macro-bbox script and schema are provided. **Not executed on real GDS / KLayout in this environment**; not polygon extraction |
| Large-scale rendering | Instancing, frustum culling, bounded labels, DPR cap and lazy chunks; no benchmarked adaptive FPS or tiled multi-million-polygon LOD |
| Source declaration hierarchy | Real module/port scan and known RTL block paths; not a complete parameter-elaborated synthesized netlist tree |

## NOT IMPLEMENTED

- Execute Real Build local backend/process monitoring/cancellation; no EDA tool runs from the browser.
- Full polygon GDS/ODB rendering, detailed wires/vias/pin extraction, macro-internal silicon geometry.
- SPEF/SDF/Liberty/full-STA-path evaluation/import and electrical/transistor/thermal simulation.
- Exact RTL/gate-level co-simulation and synchronized physical signal-to-layout activity.
- Full chip standard-cell placement evolution, real clock tree topology and geometry-derived congestion.
- Controlled numerical comparisons for missing core versions and AXI thin/reg/lean runs.
- Editable arbitrary-sized matrices driving the whole 1,024-PE hardware schedule. The working math demo is 4×4; its job validator handles larger shapes separately.
- Automatic publish/commit/push. No such action was performed.

## Tests actually executed

| Check | Result |
|---|---|
| Dependency installation | PASS, pnpm 11.25.0, included lockfile; React 19 / Fiber 9 compatibility checked against official docs |
| `pnpm run typecheck` | PASS |
| `pnpm run lint` | PASS |
| `pnpm test` | **20/20 PASS** |
| `pnpm run test:parsers` | **5/5 PASS**, including 418 source-file SHA-256 comparisons |
| `pnpm run check:i18n` | PASS, **324 bilingual dictionary pairs** and no missing literal lookup |
| `pnpm run build` | PASS, Vite 7.3.7 production build; Three/R3F chunk about 1.15 MB raw / 320 kB gzip |
| `pnpm run test:e2e` | **5/5 PASS** on dev server, Chrome headless / WebGL |
| Same Playwright suite on production `/gemm32/` | **5/5 PASS**; relative assets/data function under a project subpath |

The 5 browser scenarios cover WebGL, raycast selection, auto rotation, pause/stop, camera/panels, state-preserving EN/VI/theme, GEMM reference/errata, AXI backpressure/register read, every navigation destination, workload filters, desktop/laptop/mobile overflow and normalized artifact import/error handling. Screenshots were inspected and the camera fit/label lifecycle issues found during QA were repaired before the passing runs.

Browser report: ignored `playwright-report/index.html`. Persistent example screenshots: `docs/screenshots/`. Build output: ignored `dist/`. The feature classification is deliberately separate from a PASS of the implemented subset.
