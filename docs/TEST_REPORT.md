# Website validation — 18 October 2026

Validation performed in the local Windows workspace using Node24.19 and the Codex in-app browser. Browser results apply to this environment; no ASIC flow was rerun.

## Completed checks

| Check | Actual observation |
|---|---|
| Development HTTP | `node scripts/serve.mjs`, GET/HEAD localhost4173 returned200 |
| Production build | `node scripts/build.mjs` completed successfully; static `dist/` generated |
| Syntax and anchors | `node scripts/check.mjs`: main/data JS syntax valid,63unique IDs, all explicit internal anchors resolve |
| Static assets | `node scripts/check_assets.mjs`:20 local references/HTTPassets verified; includes images, font URLs, modules, model and evidence maps |
| Repository base path | Production page actually opened at`http://127.0.0.1:4173/dist/index.html`; relative CSS/JS/images/model load correctly |
| Desktop |1440px viewport observed; document scroll width1425px (15px scrollbar), no horizontal page overflow; screenshot saved |
| Mobile |375px viewport observed; document width360px, no horizontal page overflow; screenshot saved |
| Tablet |768px viewport observed; document width753px; inspected stacked hero |
| Small desktop |1024px viewport observed; document width1009px; inspected two-column hero/navigation |
| Mobile menu |Open/close state toggles true/false; Escape closes and returns focus; anchor selection closes menu |
| Anchor navigation |Architecture, physical design, optimization, layout, verification and results destinations exercised in browser |
| Systolic illustration |Play sets pressed=true and advances step; pause and reset return step00 |
| Hierarchy |PE/Row/Array/Core selections update diagram and text; ArrowRight changes focused tab and panel |
| Optimization timeline |v4/v6/v11 panels inspected; ArrowDown changes experiment; final antenna and corrected baseline content visible |
| Gallery filter |Architecture filter returns01figure; All restores03 |
| Lightbox |Open, next/previous, zoom1.5×, fit, Close and Escape exercised; correct caption and original figure displayed |
| Pin-swap Boolean example |Input toggles produce agreement for11 and disagreement for10/01; displayed expressions match official cell function |
| Results tabs |Timing, power/performance and functional verification tables inspected; ArrowRight switches categories; corner/window qualifiers visible |
| Mobile results |Table scroll width640px inside316px panel; page remains360px. Tab strip scrolls independently |
| Model3D render |Real embedded WebGL2 geometry displayed in iframe and fullscreen; dimensions159.66×170.38µm and2741cells visible |
| Model mouse rotate |Dragged actual canvas; camera orientation visibly changed |
| Model wheel zoom |Wheel over actual canvas; model visibly zoomed out |
| Model reset |Original reset control restores camera |
| Layer controls |Metal-only sets diff.checked=false; All sets it true again |
| Signal activity |Toggle signal mode, scrub to End shows cycle200/200, Home returns to first sample; return to3D works |
| Fullscreen |Actual fullscreen model rendered; inner exit button visible and exits successfully |
| Fonts |Newsreader and Inter loaded from local TTF resources; no font console error |
| Console production |After model interaction/recorded playback/fullscreen, error/warning log returned empty |
| Original data |Original DOCX/HTML retained; parent sources only read. No push/deploy/ASIC flow execution |

## Repairs from browser QA

1. WebGL fallback initially searched all body text, which included the renderer's JavaScript error string. Changed to detecting the actual rendered `.err` element.
2. A `syncSim` recorded-sample index error appeared during display/fullscreen changes. In the public copy only, clamp negative animation deltas and recorded sample indices. Geometry/data/control code is otherwise preserved. `scripts/prepare_model.py` reproduces the exact two replacements.
3. Added a visible exit control inside the fullscreen element; the external button is inaccessible in fullscreen.
4. Tablet hero now stacks rather than forcing narrow columns; mobile heading scales to keep three readable lines.
5. Self-hosted font filenames/formats correctly describe the downloaded TTF resources.

## Explicitly not tested / not claimed PASS

- Physical touch/pinch, right-button pan, Safari/Firefox and other GPUs were not exercised. Original pan/pinch handlers were inspected; desktop rotate/wheel/reset were exercised.
- A forced no-WebGL browser environment was not available. Fallback trigger/display code was inspected; normal supported WebGL execution was verified.
- OS-level reduced-motion preference was not forced. CSS and the model wrapper handle the preference, and animation starts paused by default.
- Exhaustive screen-reader audit, color-contrast instrumentation and every external GitHub link navigation were not performed. Local anchor/assets and immutable source paths were validated; semantic landmarks/heading levels/focus/tab keyboard behavior were inspected.
- Remote deployment was intentionally not performed. No full-top physical integration, fabricated chip or independent ASIC report reproduction was verified.

Screenshots:`docs/qa/desktop.png`, `docs/qa/mobile.png`. The gallery remains limited to real supplied assets: one PE model capture and two proposal figures. Missing full-core layout imagery is disclosed on the page.
