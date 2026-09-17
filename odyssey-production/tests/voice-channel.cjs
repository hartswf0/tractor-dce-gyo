const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const flush=()=>new Promise(r=>setImmediate(r));
function setup(){
 const nodes=new Map(),handlers={},providers=['local','browser','whisper'].map(x=>({dataset:{provider:x},setAttribute(){}}));
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',hidden:false,textContent:'',setAttribute(){},append(){},focus(){},dispatchEvent(){},querySelector:s=>node(s.slice(1)),querySelectorAll:()=>providers});return nodes.get(id)};
 let grant,options,stops=0,requests=[],actions=[],key='test-key',defer=false,fetchResolve;
 const stream={getTracks:()=>[{stop(){stops++}}]};
 class Recorder{static isTypeSupported(t){return t==='audio/mp4'}constructor(s,o){this.mimeType=o.mimeType;this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['sample audio'],{type:this.mimeType})});this.onstop?.()}}
 const W={ready:true,mode:'walk',character:'odysseus',place:{name:'Ithaca'},setSky:x=>actions.push(['sky',x]),setWeather:x=>actions.push(['weather',x]),wbOpen(){}};
 const window={__world:W,Ai:{key:()=>key,request:async()=>({program:{reply:'Try a lower camera.'}})},MediaRecorder:Recorder,OdysseyPerformance:{command:x=>actions.push(['move',x])},addEventListener(n,f){handlers[n]=f}};
 const document={body:{append(){}},head:{append(){}},createElement:tag=>node(tag),getElementById:node,addEventListener(n,f){handlers[n]=f}};
 const context={window,document,navigator:{mediaDevices:{getUserMedia:o=>{options=o;return new Promise(r=>grant=r)}}},MediaRecorder:Recorder,Blob,FormData,AbortController,DOMException,Event,setTimeout,clearTimeout,console,fetch:async(u,o)=>{requests.push({u,o});if(defer)return await new Promise(r=>fetchResolve=r);return {ok:true,json:async()=>({text:'weather fog'})}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../native/world/odyssey-voice.js'),'utf8'),context);
 providers.find(p=>p.dataset.provider==='whisper').onclick();
 return {node,window,W,requests,actions,grant:()=>grant(stream),options:()=>options,stops:()=>stops,setKey:k=>key=k,defer:()=>defer=true,resolve:()=>fetchResolve({ok:true,json:async()=>({text:'late transcript'})})};
}
(async()=>{
 const x=setup();const opening=x.node('ovListen').onclick();assert.equal(x.options().video,false);assert.ok(x.options().audio);x.window.OdysseyVoice.cancel();x.grant();await opening;assert.equal(x.stops(),1);assert.equal(x.requests.length,0);
 const start=x.node('ovListen').onclick();x.grant();await start;await x.node('ovListen').onclick();await flush();assert.equal(x.requests[0].o.body.get('model'),'whisper-1');assert.equal(x.requests[0].o.body.get('file').name,'speech.m4a');assert.equal(x.node('ovText').value,'weather fog');assert.equal(x.actions.length,0,'transcript must not execute automatically');x.node('ovCommand').onclick();assert.deepEqual(x.actions,[['weather','fog']]);
 x.node('ovText').value='walk forward';x.node('ovCommand').onclick();assert.deepEqual(x.actions.at(-1),['move','walk forward']);
 await x.node('ovAsk').onclick();assert.equal(x.node('ovReply').textContent,'Try a lower camera.');assert.equal(x.actions.length,2,'discussion must not mutate scene');
 x.node('ovText').value='preserved';x.defer();const s=x.node('ovListen').onclick();x.grant();await s;await x.node('ovListen').onclick();x.window.OdysseyVoice.cancel();x.resolve();await flush();assert.equal(x.node('ovText').value,'preserved','late transcript cannot overwrite after cancel');
 const y=setup();y.setKey('');await y.node('ovListen').onclick();assert.equal(y.requests.length,0);assert.match(y.node('ovState').textContent,/key/);
 console.log('PASS: audio-only permission, late-permission cleanup, Whisper MIME/model, transcript review, commands, read-only discussion, stale response cancellation, missing key');
})().catch(e=>{console.error(e);process.exit(1)});
