import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');let checked=0;
for(const [file,pattern] of [['index.html',/(?:href|src)="([^"#]+)"/g],['src/style.css',/url\(['"]?([^'")]+)['"]?\)/g],['src/main.js',/from ['"]([^'"]+)['"]/g]]){
 const body=fs.readFileSync(path.join(root,file),'utf8');
 for(const m of body.matchAll(pattern)){if(/^(https?:|data:|#)/.test(m[1]))continue;const resolved=path.resolve(root,path.dirname(file),m[1].split('#')[0]);if(!fs.existsSync(resolved))throw Error(`Missing asset ${file}: ${m[1]}`);checked++}
}
for(const file of ['images/pe-3d.png','images/architecture.png','images/workflow.png','models/processing-element.html','evidence/SOURCE_AUDIT.md','evidence/CONTENT_SOURCES.md']){
 const response=await fetch('http://127.0.0.1:4173/'+file);if(response.status!==200)throw Error(`HTTP${response.status} ${file}`);checked++;
}
console.log(`Verified ${checked} local static references and HTTP assets. Relative resolution remains valid under a repository base path.`);
