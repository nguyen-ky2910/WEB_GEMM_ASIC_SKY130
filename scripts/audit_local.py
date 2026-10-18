from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json,re,hashlib
from PIL import Image,ImageOps,ImageDraw
root=Path.cwd(); out=root/'docs/extracted'; images=root/'public/images'
records=[]; thumbs=[]
for p in [*root.glob('*.docx'),*root.parent.glob('*.docx')]:
    target=out/p.stem.strip(); target.mkdir(parents=True,exist_ok=True)
    with ZipFile(p) as z:
        tree=ET.fromstring(z.read('word/document.xml'))
        ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        paras=[''.join(t.itertext()) for t in tree.findall('.//w:p',ns)] if False else [''.join(t.text or '' for t in el.findall('.//w:t',ns)) for el in tree.findall('.//w:p',ns)]
        (target/'text.txt').write_text('\n'.join(paras),encoding='utf-8')
        for n in z.namelist():
            if n.startswith('word/media/'):
                f=target/Path(n).name; f.write_bytes(z.read(n))
                try:
                    im=Image.open(f); records.append({'document':str(p),'file':str(f.relative_to(root)),'size':im.size})
                    thumb=ImageOps.contain(im.convert('RGB'),(320,220)); tile=Image.new('RGB',(350,265),'#eeeeea'); tile.paste(thumb,((350-thumb.width)//2,5)); ImageDraw.Draw(tile).text((10,235),p.stem[:20]+'/'+f.name,fill='black'); thumbs.append(tile)
                except Exception: pass
if thumbs:
    sheet=Image.new('RGB',(350*4,265*((len(thumbs)+3)//4)),'white')
    for i,im in enumerate(thumbs): sheet.paste(im,((i%4)*350,(i//4)*265))
    sheet.save(out/'contact-sheet.jpg')
(out/'images.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
html=(root/'ProcessingElement 3D (1).html').read_text(encoding='utf-8')
lines=[s for s in html.splitlines() if len(s)<1500]
(out/'model-code.txt').write_text('\n'.join(lines),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False,indent=2)); print('Document images:',len(records))
