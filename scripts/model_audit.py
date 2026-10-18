from pathlib import Path
import re,json
p=Path('ProcessingElement 3D (1).html')
s=p.read_text(encoding='utf-8')
for m in re.finditer(r'<script[^>]*id="([^"]+)"[^>]*>(.*?)</script>',s,re.S):
    try:
        d=json.loads(m[2]);print(m[1],{k:len(v) if isinstance(v,(list,dict)) else v for k,v in d.items() if k in ['plan','samples','ncyc','clk']})
    except Exception: pass
