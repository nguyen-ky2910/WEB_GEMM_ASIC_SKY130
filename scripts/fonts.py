from pathlib import Path
import urllib.request,re
root=Path.cwd()/'public/fonts';root.mkdir(exist_ok=True)
fonts=[('newsreader','Newsreader:wght@400;500','ofl/newsreader/OFL.txt'),('inter','Inter:wght@400;500;600','ofl/inter/OFL.txt'),('plex','IBM+Plex+Mono:wght@400;500','ofl/ibmplexmono/OFL.txt')]
for name,family,license in fonts:
    req=urllib.request.Request('https://fonts.googleapis.com/css2?family='+family+'&display=swap',headers={'User-Agent':'Mozilla/5.0'})
    try:
        css=urllib.request.urlopen(req,timeout=20).read().decode()
        urls=re.findall(r'url\((https://[^)]+)\)',css)
        url=urls[0] # Regular weight; browsers synthesize heavier UI labels.
        (root/(name+'.ttf')).write_bytes(urllib.request.urlopen(url,timeout=20).read())
        (root/(name+'-OFL.txt')).write_bytes(urllib.request.urlopen('https://raw.githubusercontent.com/google/fonts/main/'+license,timeout=20).read())
        print(name,'downloaded',len((root/(name+'.ttf')).read_bytes()))
    except Exception as e: print(name,str(e))
