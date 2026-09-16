/* Archive adapter only: keep experiment storage and cross-tab leases out of the live demo. */
(() => {
  const sha=document.currentScript.dataset.version;
  const pane=new URLSearchParams(location.search).get('pane')||'solo';
  const prefix='ww-time-machine:'+sha+':'+pane+':';
  window.__soundBase=new URL('world/',document.baseURI).href;
  if(window.indexedDB){
    const native=window.indexedDB;
    const scoped=new Proxy(native,{get:(t,k)=>k==='open'?(name,...args)=>t.open(prefix+name,...args):k==='deleteDatabase'?name=>t.deleteDatabase(prefix+name):k==='databases'?async()=>((await t.databases()).filter(d=>d.name?.startsWith(prefix)).map(d=>({...d,name:d.name.slice(prefix.length)}))):typeof t[k]==='function'?t[k].bind(t):t[k]});
    Object.defineProperty(window,'indexedDB',{configurable:true,get:()=>scoped});
  }
  for(const name of ['localStorage','sessionStorage']){
    try{
      const native=window[name];
      const keys=()=>Object.keys(native).filter(k=>k.startsWith(prefix)).map(k=>k.slice(prefix.length));
      const methods={getItem:k=>native.getItem(prefix+k),setItem:(k,v)=>native.setItem(prefix+k,String(v)),removeItem:k=>native.removeItem(prefix+k),clear:()=>keys().forEach(k=>native.removeItem(prefix+k)),key:i=>keys()[i]??null};
      const scoped=new Proxy(methods,{get:(t,k)=>k==='length'?keys().length:k in t?t[k]:typeof k==='string'?native.getItem(prefix+k):undefined,set:(t,k,v)=>{native.setItem(prefix+String(k),String(v));return true;},ownKeys:keys,getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
      Object.defineProperty(window,name,{configurable:true,get:()=>scoped});
    }catch(e){console.warn('Archive storage isolation unavailable');}
  }
  if(window.BroadcastChannel){const Native=window.BroadcastChannel;window.BroadcastChannel=class extends Native{constructor(name){super(prefix+name);}};}
  let last='';
  setInterval(()=>{
    const ready=!!window.__world?.ready;
    const veil=document.querySelector('#veil'),msg=document.querySelector('#vm')?.textContent||'';
    const failed=!ready&&/could not|refused|failed/i.test(msg);
    const state=ready?'ready':failed?'fault':'loading';
    if(state!==last){last=state;parent.postMessage({type:'ww-archive-status',sha,pane,state,message:failed?msg.slice(0,400):''},location.origin);}
  },750);
})();
