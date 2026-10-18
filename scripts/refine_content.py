from pathlib import Path
p=Path('index.html');s=p.read_text(encoding='utf-8')
needle='<p class="source-note">Historical results:'
addition='''<div class="run-comparison"><p class="eyebrow">COST OF THE CORRECTED BASELINE / REPORTED RUNS</p><div class="table-scroll"><table class="results-table"><thead><tr><th scope="col">Run</th><th scope="col">Functional status</th><th scope="col">Total runtime</th><th scope="col">Peak RAM</th><th scope="col">Antenna pins / nets</th></tr></thead><tbody><tr><td>core_v9</td><td>Faulty old row</td><td>7 h 02 m</td><td>13.0 GB</td><td>221 / 209</td></tr><tr><td>core_v11</td><td>Reported GLS pass</td><td>9 h 26 m</td><td>13.5 GB</td><td>219 / 205</td></tr></tbody></table></div><p class="fine">Same core configuration, regenerated row macro. The objective is restored correctness; these results do not establish a runtime speedup. Values are total OpenLane runtime and documented peak RAM.</p></div>'''
assert needle in s
if 'run-comparison' not in s:s=s.replace(needle,addition+needle)
p.write_text(s,encoding='utf-8')
for name in ['README.md','docs/SOURCE_AUDIT.md']:
 p=Path(name);s=p.read_text(encoding='utf-8').replace('Bản sao byte-identical của HTML gốc','Bản sao HTML gốc + hai bảo vệ playback').replace('Byte-preserved copy of original, embedded in iframe','Copy with two defensive playback guards, embedded in iframe')
 p.write_text(s,encoding='utf-8')
p=Path('docs/SOURCE_AUDIT.md');s=p.read_text(encoding='utf-8')
s+='''
## Browser-driven integration repairs

The original research HTML remains unchanged. The public copy has exactly two defensive changes, reproducible with `scripts/prepare_model.py`: clamp animation-frame delta to a nonnegative range and bound the recorded playback sample index to the available plan/sample arrays. An out-of-range syncSim error was observed during browser/fullscreen testing. Geometry, recorded activity, controls and shaders are unchanged. The wrapper detects a rendered `.err` element for WebGL fallback, rather than searching script text. A visible fullscreen exit control is provided inside the fullscreen container.

Original SHA256: HTML `953A35F2359824050BCBCE68CD102213E54169EE08B40979FC2455CC4F3B36E4`; proposal `83E13067EB5D72D05B0C8EC7B754565960865CE9FDACEF2EE320DFA7AD235CDB`.
'''
p.write_text(s,encoding='utf-8')
