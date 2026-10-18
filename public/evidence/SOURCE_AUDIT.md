# Source audit — GEMM32 research website

Audit: 18 October 2026, Asia/Bangkok. Workspace verified before editing: `D:\NGHIEN_CUU_KHOA_HOC\RESFES LẦN 2\WED_ASIC_GEMM`.

## Scope and preservation

Initial workspace tree:
```
WED_ASIC_GEMM/
  ProcessingElement 3D (1).html  (1,205,040 bytes)
  PROPOSAL_ASIC_GEMM.docx        (610,076 bytes)
```
The parent contains `hình vẽ/FPGT-Trang-5.pdf`, `FPGT-Trang-6.pdf`, `Proposal_SKY130_citation_dong_bo.docx`, `định hướng proposal resfes.docx`, and `bạn pd có axi chưa kết hợp .docx`. Local DOCX files were read as ZIP/XML and media extracted under `docs/extracted/`. Both parent PDFs were text-extracted and rendered for inspection. No other local raster/vector layouts, CSV, JSON, GIF or video files were found in these supplied sources. Original files were read only. No ASIC implementation commands ran. No Git push or Internet deployment occurred.

## Sources and verification

| Source | Evidence and use | Status |
|---|---|---|
| Local PROPOSAL_ASIC_GEMM.docx | Research scope, C1/C2/C3, authors, advisor, two embedded figures | Read and extracted; primary local proposal |
| Three parent DOCX files | Supporting framing, scope and consistency checks | Read/extracted; older drafts are not the baseline |
| Parent hình vẽ PDFs | Architecture and workflow diagrams | Text and rendered visual inspection; same content as proposal images |
| Original PE HTML | Embedded GDS geometry, standalone WebGL2 renderer, controls, recorded activity | Inspected source and exercised in local browser |
| Official GEMM branch | README, HUONGDAN, NHATKY, RTL, configurations and requested analysis tools | Immutable snapshot downloaded as text only |
| Reference NPU site | Actual page layout, two-column hero, tables, 3D model behavior, spacing | Browser inspected; four source files inspected, not copied into website |
| SkyWater and2b functional Verilog | Boolean expression for C3 teaching tool | Official functional model checked |

Official branch: **hierarchical-openlane-flow**. Resolved SHA: **eb8529822c826babe042158af7cd0c3a8f95a25a**.
Reference NPU SHA: `ca41cabd19e49c70f375b1df38faa8b0c6a29261`.
See `REPOSITORY_FINDINGS.md` and `reference/` for the bounded inspection snapshot. No RTL or heavy GDS/DEF/SPEF files enter the browser bundle.

## Selected baseline and conflicts

- Use **core_v11**, with corrected row_v1, for final PPA and GLS. v9/v10 reused a faulty row and are historical physical experiments only.
- The actual current proposal already states **100 MHz / 204.8 theoretical GOPS**. None of the inspected proposal documents establishes a competing 50 MHz /104.8 GOPS baseline. These hypothetical numbers from the brief are not published.
- Rounded die area 72.3 mm² is not the 7.68424 mm² synthesis-derived cell area excluding SRAM.
- 134 GOPS/W is peak theoretical throughput divided by 1.530 W compute-window estimate. It is explicitly not measured workload efficiency.
- DRT=0, full-layout rechecked Magic=0 real errors, LVS match and remaining antenna **219 pins/205 nets** are separate claims. 48 raw abstract-view Magic flags remain in the documented report and are disclosed.
- TT internal setup/hold +1.21/+0.27 ns at100 MHz is not all-corner100 MHz. SS RC-max setup−7.61 ns implies about57 MHz; 196 core I/O paths are waived.
- README shorthand describes PE→row→array→core hardening. Core config/code clarifies final core directly uses32 row macros, not one giant array macro. A standalone array_v1 exists at19.9 mm².
- HUONGDAN calls full AXI physical integration a future step. Newer commands/configuration exist in run_flow. No final full-top reports were available: website says **completion not evidenced**, rather than assuming the flow has no implementation.
- `row_equiv.sh` compares2000 random cycles in simulation; this is not formal equivalence.
- The standalone PE HTML is not identified with corrected row_v1/core_v11. Its159.66×170.38µm outline and2741 cells must not be merged with row/PE-sizing-run area claims.

## Asset inventory and usage

| Website asset | Original | Interpretation |
|---|---|---|
| public/images/architecture.png | Proposal word/media/image1.png | Conceptual hierarchy,32 rows and80 SRAMs, SoC extension |
| public/images/workflow.png | Proposal word/media/image2.png | Research implementation/verification workflow |
| public/images/pe-3d.png | Browser capture of original local PE model | Actual supplied model view; vertical dimensions approximate |
| public/models/processing-element.html | ProcessingElement 3D (1).html | Copy with two defensive playback guards, embedded in iframe |

The two extracted images were visually inspected via contact sheet; the parent architecture PDF was rendered and inspected. No NPU imagery, author branding or source components appear in the deliverable.

## Model audit

Custom WebGL2; no Three.js, external JavaScript, external texture, iframe or separate geometry dependency. Geometry and activity are embedded as JSON. Only Google Fonts URLs are external, with system fallbacks; geometry and operation do not require Internet. A localhost server is used for consistent embedding. Original controls include rotate, pan, zoom, reset, layer visibility, layer separation/thickness, sections, fill/top-wire visibility, cell selection and signal/activity playback. Website provides iframe fullscreen and WebGL fallback; the original control language is Vietnamese. Site starts the viewer in the3D inspection mode. Signal data are embedded unit-delay gate-level activity described by the source, not a live runtime simulator. The model identifies its source as ProcessingElement.gds, but raw GDS provenance was not independently revalidated.

## Missing evidence / deliberate limits

- No full-core/row/array GDS, placement or routing screenshots in supplied local source files. Gallery does not claim to show those stages.
- No raw ASIC run outputs committed in the audited remote tree. Numerical values verified against repository documentation and code, not independently reproduced.
- No silicon measurements, fabricated-chip evidence, full signoff, full-top physical completion or exhaustive verification claims.
- Local proposal is not placed into the public build: research text contains signatures/AI declarations and other material unnecessary for website presentation. Public resources link technical GitHub sources and a redacted evidence map.
- No language switch is offered; the site is consistently English except the preserved original model controls.

Fonts: Newsreader, Inter, IBM Plex Mono downloaded from Google Fonts and self-hosted, each with SIL OFL text in `public/fonts/`. System fallbacks remain. Optional original-model Google Fonts are not required for rendering.

## Browser-driven integration repairs

The original research HTML remains unchanged. The public copy has exactly two defensive changes, reproducible with `scripts/prepare_model.py`: clamp animation-frame delta to a nonnegative range and bound the recorded playback sample index to the available plan/sample arrays. An out-of-range syncSim error was observed during browser/fullscreen testing. Geometry, recorded activity, controls and shaders are unchanged. The wrapper detects a rendered `.err` element for WebGL fallback, rather than searching script text. A visible fullscreen exit control is provided inside the fullscreen container.

Original SHA256: HTML `953A35F2359824050BCBCE68CD102213E54169EE08B40979FC2455CC4F3B36E4`; proposal `83E13067EB5D72D05B0C8EC7B754565960865CE9FDACEF2EE320DFA7AD235CDB`.
