import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(here,'..');
const app=fs.readFileSync(path.join(root,'beaver/app-multi.js'),'utf8');
const html=fs.readFileSync(path.join(root,'beaver/index.html'),'utf8');
const ids=['runBtn','stepBtn','resetBtn','nextBtn','suiteBtn','buildSelect','vocabSelect'];

for(const id of ids){
  if(!html.includes(`id="${id}"`))throw new Error(`UI lock target missing from HTML: ${id}`);
}
if(app.includes('$(id).disabled'))throw new Error('Regression: toggle uses CSS tag lookup instead of element ID lookup');
if(!app.includes('byId=id=>document.getElementById(id)'))throw new Error('UI lock must use getElementById');
if(!app.includes("$('#buildSelect').value=String(buildIndex)"))throw new Error('Build selector must resync to actual solver state');
if(!app.includes("$('#vocabSelect').value=vocabMode"))throw new Error('Vocabulary selector must resync to actual solver state');
const releases=(app.match(/finally\{running=false;toggle\(false\)\}/g)||[]).length;
if(releases<3)throw new Error(`Expected RUN, STEP and SUITE finally-release guards; found ${releases}`);

console.log('BEAVER / UI CONTRACT');
console.log(`PASS · ${ids.length} lock targets exist · ID lookup verified · ${releases} finally-release guards`);
