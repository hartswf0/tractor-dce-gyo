/* BEFLIX silhouettes to editable LDraw assemblies. No model/API calls. */
(function(root){
'use strict';
function parse(text,w,h){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>128||h>96)throw Error('Grid must fit 128 × 96.');
 const lines=String(text).split(/\r?\n/);if(lines.length>5000)throw Error('Limit: 5,000 commands.');
 let cells=new Uint8Array(w*h),owners=new Int32Array(w*h),frames=[],ticks=0;
 const put=(x,y,v,line)=>{if(x>=0&&y>=0&&x<w&&y<h){cells[y*w+x]=v;owners[y*w+x]=line;}};
 const save=n=>{if(frames.length>=256||ticks+n>100000)throw Error('Recording limit exceeded.');frames.push({cells:Array.from(cells),owners:Array.from(owners),start:ticks,duration:n});ticks+=n;};
 lines.forEach((raw,index)=>{
 const clean=raw.replace(/#.*/,'').trim();if(!clean)return;
 const tokens=clean.split(/\s+/),op=tokens.shift().toUpperCase(),a=tokens.map(Number),sizes={CLR:1,PNT:5,LIN:5,REC:1};
 if(!(op in sizes)||a.length!==sizes[op]||a.some(n=>!Number.isInteger(n)||Math.abs(n)>4096))throw Error('Line '+(index+1)+': invalid '+op+' command.');
 const v=a[a.length-1];if(op!=='REC'&&(v<0||v>7))throw Error('Line '+(index+1)+': ink must be 0–7.');
 if(op==='CLR'){cells.fill(a[0]);owners.fill(index+1);}
 if(op==='PNT'){const [x,y,rw,rh,v]=a;if(rw<0||rh<0)throw Error('Negative rectangle size.');for(let j=Math.max(0,y);j<Math.min(h,y+rh);j++)for(let i=Math.max(0,x);i<Math.min(w,x+rw);i++)put(i,j,v,index+1);}
 if(op==='LIN'){let [x,y,x1,y1,v]=a,dx=Math.abs(x1-x),sx=x<x1?1:-1,dy=-Math.abs(y1-y),sy=y<y1?1:-1,err=dx+dy;for(;;){put(x,y,v,index+1);if(x===x1&&y===y1)break;const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}}
 if(op==='REC'){if(a[0]<1)throw Error('REC requires a positive duration.');save(a[0]);}
 });
 if(!frames.length)save(1);
 return {w,h,frames,ticks};
}
function assemble(frame,w,h,depth,threshold,Dsl){
 if(!Number.isInteger(depth)||depth<1||depth>8)throw Error('Depth must be 1–8 studs.');
 if(!Number.isInteger(threshold)||threshold<1||threshold>7)throw Error('Threshold must be 1–7.');
 const occupied=frame.cells.filter(v=>v>=threshold).length;if(occupied>4096)throw Error('Reduce the grid or occupied area below 4,096 cells.');
 const ops=[],regions=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;){
 if(frame.cells[y*w+x]<threshold){x++;continue;}
 let end=x;while(end<w&&frame.cells[y*w+end]>=threshold)end++;
 const sourceLines=[...new Set(frame.owners.slice(y*w+x,y*w+end))];
 regions.push({x,y,w:end-x,sourceLines});
 ops.push({op:'box',x,z:0,w:end-x,d:depth,y:h-y-1,h:1,col:19});x=end;
 }
 const program={name:'BEFLIX extrusion',ops};
 const result=Dsl.compile(program,{bond:true,maxOps:10000});
 if(result.report.errors.length||result.report.unknown.length)throw Error('Brick compiler rejected the assembly.');
 const projected=new Uint8Array(w*h),parts={};
 for(const p of result.pieces){
 parts[p.part]=(parts[p.part]||0)+1;const size=Dsl.foot(p.part,p.rot),height=Math.round(Dsl.DIMS[p.part][4]/8);
 for(let py=p.y;py<p.y+height;py++)for(let x=p.x;x<p.x+size[0];x++){const y=h-1-Math.floor(py/3);if(x>=0&&x<w&&y>=0&&y<h)projected[y*w+x]=1;}
 }
 let mismatch=0;for(let i=0;i<projected.length;i++)if(projected[i]!==+(frame.cells[i]>=threshold))mismatch++;
 return {program,result,parts,regions,projected:Array.from(projected),mismatch,occupied,mpd:Dsl.toMPD(result,'beflix-extrusion')};
}
const api={parse,assemble};root.BeflixBricks=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
