# Future artifact integration

## Stable data boundary

The frontend consumes normalized micrometer geometry and time-indexed digital events, not raw EDA databases. Replacing geometry leaves UI state, language, camera controls, animation, simulator engines and analytics intact. Importing deliberately fits the new geometry and clears the previous module selection; existing simulation state is retained.

Schemas:

- `public/generated-data/layout.schema.json`
- `public/generated-data/waveform.schema.json`
- TypeScript contracts: `src/types/data.ts`; runtime validation: `src/data-adapters/project.ts`.

Browser imports are limited to **20 MiB** and **20,000 macro extents**. Prefer the 113 top-level macros over flattened standard cells. Repeated geometry is instanced. Raw files remain outside `public/`.

## Regenerate the current source evidence

Run from `chip-visualizer/` while the original project remains its parent:

```sh
python scripts/extraction/extract_project.py
```

If the web folder is in its own repository:

```sh
python scripts/extraction/extract_project.py --project-root "path/to/GEMM32-ASIC-sky130"
```

The script never invokes the research generator's CLI (which writes design files). It imports only its pure placement function with Python bytecode writes disabled and exports a reconstruction into the website. Evidence copies are a small explicit allowlist; no PDK is copied. Baseline checksums are created once, not silently refreshed on subsequent imports.

`source-baseline.json` belongs to this audited export. If intentionally upgrading the underlying research version, review the diff, keep a versioned old baseline and create a new baseline deliberately; do not use a regenerated baseline to conceal source modifications. Run the hash verification after extraction.

## DEF + macro LEF

Supply only the relevant **macro** LEFs (row, SRAM, AXI), not every standard-cell LEF:

```sh
python scripts/extraction/extract_project.py \
  --def-file "path/to/GEMM_top.def" \
  --lef "path/to/ProcessingElementRow.lef" \
  --lef "path/to/sram_antenna.lef" \
  --lef "path/to/GemmAxiShell_antenna.lef"
```

PowerShell: put the command on one line, or use PowerShell backticks instead of `\` line continuations.

Output: `public/generated-data/imported-layout.json`. In the app, **Settings → Import normalized layout JSON** and select it. The adapter reads DEF units, rectangular die bounds, macro master/instance names, placement coordinates and orientation, and LEF SIZE. Rotations E/W/FE/FW swap displayed extents. Unknown master sizes are recorded in `unresolvedMasters`, never guessed.

Current rendering uses axis-aligned bounding boxes. Pin/obstruction outlines, metal/vias, nonrectangular dies, full net geometry and standard-cell detail are not extracted. Reflected/rotated abstract surfaces do not show pin orientation. Do not enable illustrative overlays and interpret them as imported wiring.

## GDS (optional adapter)

No GDS exists in this workspace, so this path has **not been executed on a real design**. Install the optional KLayout Python API on a machine with suitable resources:

```sh
python -m pip install klayout
python scripts/extraction/extract_gds.py "path/to/GEMM_top.gds" --top GEMM_top
```

This exports matched top-level macro **bounding boxes**, expands instance arrays and records cell transforms. GDS does not preserve DEF instance names, so generated IDs explicitly include cell/master/index. Use `--master-pattern` for other macro master names. Multiple top cells require an explicit `--top`.

The top-cell bbox may differ from the die boundary, and is identified as such. This is **not** polygon/layer extraction, not transistor visualization and not a flattened full-layout renderer. Large polygon support would require an additional offline tiling/LOD adapter; its output should extend the existing geometry contract rather than changing UI components. Do not copy the raw GDS to `public/`.

## VCD

```sh
python scripts/extraction/extract_project.py --vcd "path/to/windowed_trace.vcd"
```

Output: `public/generated-data/imported-waveform.json`. Import it through **Settings → Import normalized waveform JSON**, then use Signal / Waveform. Loading a JSON does not automatically call an EDA executable.

The offline importer limits input to **128 MiB** and **12,000 recorded value-change lines**; it marks truncated output. Pre-window a large trace using the project's existing VCD window tools, writing into a separate output location. Shared VCD ID aliases update **all** names. Scope, width, timestamps, scalar/vector binary values and x/z are preserved. Real-valued VCD signals are omitted. Events must be time sorted; unknown before first transition remains unknown. No exact signal-to-layout mapping is inferred from a name.

The existing sparse text trace stays visibly different from continuous VCD: only recorded samples are drawn, without inventing clock edges or transitions across missing cycles.

## STA, metrics, logs and other artifacts

`extract_project.py` already normalizes selected quoted CSV tables, module declarations, key/value trace lines and Markdown run-history rows. Signoff summary fields are deliberately transcribed with an evidence classification; inspect the source and update the mapping when changing research versions.

Additional adapters can emit `Table` datasets and use existing chart/CSV-export components:

| Input | Current support | Integration boundary |
|---|---|---|
| OpenLane metrics CSV/JSON | Selected project CSV tables parsed | Normalize units, run, corner and activity metadata before adding a chart |
| OpenLane/OpenROAD logs | Source links + recorded ECO/history rows | Additional structured event parser needed for arbitrary raw logs |
| STA full paths / Liberty | Summary + histogram tables | Add explicit startpoint/endpoint/corner/path schema; never infer paths from bins |
| SPEF | Not implemented | Offline RC reduction and source provenance required |
| SDF | Not implemented | Event/RTL simulator integration required; not read by mathematical demo |
| SDC | Inventoried and source-mapped | No constraint evaluator in browser |
| ODB | Not implemented | Use a compatible OpenROAD reader offline; export the same JSON geometry |
| GDS polygons/vias | Not implemented | Tiled, layered offline geometry with LOD needed |

## Provenance rules

Keep `source`, `kind`, run/version, unit, operating frequency/voltage/corner, activity window and extraction limitations next to each dataset. Do not copy a value from core_v11 into a final-IP table. Incomplete fields must remain unavailable. Exported figures and summary records do not substitute for raw signoff reports.

Run typecheck, unit/parser tests, missing-translation checks, build and browser import tests after integrating a new adapter. Review distribution rights for any additional public evidence. The browser does not gain filesystem access merely because a dataset contains a path string.
