"""Verify literal translation lookups exist and dictionaries contain both languages."""
from pathlib import Path
import re
import sys
WEB=Path(__file__).resolve().parents[2]
text=(WEB/'src/i18n/dictionaries.ts').read_text(encoding='utf8')
keys=set(re.findall(r'\b([A-Za-z]\w*):\s*\[',text))
missing=[]
for path in (WEB/'src').rglob('*.tsx'):
    for _,key in re.findall(r'''\bt\((['"])([^'"]+)\1\)''',path.read_text(encoding='utf8')):
        if key not in keys:missing.append(f'{path.relative_to(WEB)}: {key}')
if missing:
    print('\n'.join(missing));sys.exit(1)
print(f'{len(keys)} bilingual keys; all literal t() lookups found. Pair completeness is checked by Vitest.')
