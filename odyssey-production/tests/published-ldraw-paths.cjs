const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve(__dirname,'../..');
(async()=>{
for(const [pathname,opts,expected] of [
 ['/tractor-dce-gyo/odyssey-production/native/word-to-world.html',{base:'.'},'../..'],
 ['/odyssey-production/native/cinerium.html',{},'../..'],
 ['/native/word-to-world.html',{base:'.'},'.'],
 ['/tractor-dce-gyo/word-to-world.html',{},'.'],
 ['/odyssey-production/native/word-to-world.html',{base:'/custom'},'/custom']]){
 let config,url,map;const engine={loader:{},ready:Promise.resolve(),setDiagnostics(){},setFileMap(m){map=m}};
 const context={console,document:{},location:{pathname},fetch:async u=>{url=u;return{ok:true,json:async()=>({stud:'p/stud.dat'})}}};
 context.window={Nabugo:{CELL:20,GRID:10},THREE:{LDrawLoader:{}},BetaPrimeEngine:{create(c){config=c;return engine}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'odyssey-production/native/nabugo-ui.js'),'utf8'),context);
 await context.window.NabugoUI.makeViewer({},opts);
 assert.equal(config.loaderPath,expected+'/ldraw/');assert.equal(url,expected+'/ldraw-resolve-map.json');assert.ok(map);
}
const map=JSON.parse(fs.readFileSync(path.join(root,'ldraw-resolve-map.json')));
for(const name of ['stud.dat','4-4edge.dat','4-4cyli.dat','box4-7a.dat','4493c01.dat'])assert.ok(fs.existsSync(path.join(root,'ldraw',map[name]||'parts/'+name)),name);
console.log('PASS: GitHub project path, local paths, explicit bases, resolver and required geometry');
})().catch(e=>{console.error(e);process.exit(1)});
