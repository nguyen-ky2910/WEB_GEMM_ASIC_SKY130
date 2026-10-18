import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['scripts/check.mjs'],{stdio:'inherit'});
const workspace=fs.realpathSync('.');
const output=path.resolve(workspace,'dist');
if(path.dirname(output)!==workspace||path.basename(output)!=='dist')throw Error('Unsafe build output path');
// Only the generated dist directory is replaced; research originals are outside it.
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync('dist',{recursive:true});
for(const name of ['index.html','src'])fs.cpSync(name,path.join('dist',name),{recursive:true});
fs.cpSync('public','dist',{recursive:true});
fs.mkdirSync('dist/evidence',{recursive:true});
for(const name of ['SOURCE_AUDIT.md','CONTENT_SOURCES.md'])fs.copyFileSync('docs/'+name,'dist/evidence/'+name);
fs.writeFileSync('dist/.nojekyll','');
console.log('Build complete: dist/ (static, relative paths, GitHub Pages ready)');
