import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const file of ['src/main.js','src/data.js'])execFileSync(process.execPath,['--check',file]);
const html=fs.readFileSync('index.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
if(ids.length!==new Set(ids).size)throw Error('Duplicate IDs');
for(const m of html.matchAll(/href="#([^"]+)"/g))if(!ids.includes(m[1]))throw Error('Broken anchor '+m[1]);
for(const file of ['public/models/processing-element.html','public/images/architecture.png','public/images/workflow.png','docs/SOURCE_AUDIT.md','docs/CONTENT_SOURCES.md'])if(!fs.existsSync(file))throw Error('Missing '+file);
console.log(`Checks passed: JavaScript syntax, ${ids.length} unique IDs, internal anchors, required assets and evidence docs.`);
