"""Prepare the web copy only; the original research HTML remains untouched."""
from pathlib import Path
original=Path('ProcessingElement 3D (1).html').read_text(encoding='utf-8')
patched=original.replace('Math.min(0.05, (t - last) / 1000)', 'Math.max(0, Math.min(0.05, (t - last) / 1000))')
patched=patched.replace('Math.min(SIG.ncyc - 1, Math.floor(st.simT / SP))', 'Math.max(0, Math.min(SIG.ncyc - 1, SIG.plan.length - 1, SIG.samples.length - 1, Math.floor(st.simT / SP) || 0))')
assert patched!=original
Path('public/models/processing-element.html').write_text(patched,encoding='utf-8')
print('Prepared model copy: nonnegative frame delta and bounded recorded-sample index; source unchanged.')
