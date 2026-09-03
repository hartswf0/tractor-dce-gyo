import assert from 'node:assert/strict';
import {createShadowCompiler,parseShadowMeta,buildStudContactGraph} from '../beaver-hogwarts/shadow-connectors.js';

const real=new Map([
 ['parts/testbrick.dat',`0 test brick\n1 16 -10 0 0 1 0 0 0 1 0 0 0 1 stud.dat\n1 16 10 0 0 1 0 0 0 1 0 0 0 1 stud.dat\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/bottom.dat`],
 ['p/stud.dat','0 stud geometry'],
 ['parts/s/bottom.dat','0 bottom geometry']
]);
const shadow=new Map([
 ['p/stud.dat','0 !LDCAD SNAP_CYL [ID=studC] [gender=M] [caps=one] [secs=R 6 4]'],
 ['parts/s/bottom.dat','0 !LDCAD SNAP_CYL [gender=F] [caps=one] [secs=R 6 20] [pos=0 24 0] [grid=C 2 1 20 0]']
]);
const compiler=createShadowCompiler({loadReal:async p=>real.get(p)??null,loadShadow:async p=>shadow.get(p)??null});
const c=await compiler.compilePart('testbrick');assert.equal(c.ports.length,4);assert.equal(c.clickable.length,4);assert.equal(c.ports.filter(p=>p.gender==='M').length,2);assert.equal(c.ports.filter(p=>p.gender==='F').length,2);
const graph=buildStudContactGraph([
 {uid:'a',partId:'testbrick',t:[0,0,0],r:[1,0,0,0,1,0,0,0,1]},
 {uid:'b',partId:'testbrick',t:[0,-24,0],r:[1,0,0,0,1,0,0,0,1]}
],new Map([['testbrick',c]]));assert.equal(graph.edges.length,2);assert.equal(graph.connectedNodes,2);assert.equal(graph.isolatedNodes,0);

const insertion=parseShadowMeta('0 !LDCAD SNAP_CYL [gender=F] [caps=none] [secs=R 6 20] [slide=true]');assert.equal(insertion.ops.length,1);
const real2=new Map([['parts/socket.dat','0 socket']]),shadow2=new Map([['parts/socket.dat','0 !LDCAD SNAP_CYL [gender=F] [caps=none] [secs=R 6 20] [slide=true]']]);
const c2=await createShadowCompiler({loadReal:async p=>real2.get(p)??null,loadShadow:async p=>shadow2.get(p)??null}).compilePart('socket');assert.equal(c2.ports[0].clickable,false);assert.equal(c2.ports[0].reason,'INSERTION_DEPTH_UNMODELED');
console.log('BEAVER / HOGWARTS SHADOW CONNECTORS');
console.log('PASS · inherited stud snaps · grid expansion · target contact graph · insertion remains blocked');
