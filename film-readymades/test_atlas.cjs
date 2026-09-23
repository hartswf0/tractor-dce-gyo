const fs=require('fs'),vm=require('vm'),path=require('path');
const root=__dirname,html=fs.readFileSync(path.join(root,'Film-Butter-Donor-Atlas.html'),'utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const template=fs.readFileSync(path.join(root,'atlas.template.html'),'utf8');
const functions=template.slice(template.indexOf('function parse('),template.indexOf('function download('));
const data=JSON.parse(fs.readFileSync(path.join(root,'catalogue.json')));
const context={DONORS:Object.fromEntries(data.kits.map(k=>[k.id,fs.readFileSync(path.join(root,k.file),'utf8')]))};
vm.createContext(context);vm.runInContext(functions,context);
for(const m of data.modules){context.kit=data.kits.find(k=>k.id===m.kit);context.mod=m;const actual=vm.runInContext('extract()',context);const expected=fs.readFileSync(path.join(root,'modules',m.id+'.mpd'),'utf8');const normalize=s=>s.split(/\r?\n/).filter(l=>l.trim()).join('\n');if(normalize(actual)!==normalize(expected))throw Error('Export mismatch: '+m.id)}
console.log('Atlas JavaScript syntax and all '+data.modules.length+' MPD exports verified.');
