/* Turn-level native direction. Coordinates in each set's local metres. */
window.OdysseyDirection=(function(){
 const actor=(on,frame='close',move='hold',from='s')=>({on,frame,move,from,lens:frame==='close'?40:48});
 const cam=(pos,tgt,end)=>({pos,tgt,cameraEnd:end?{pos:end,tgt}:undefined,lens:42});
 const wide=()=>cam([12,7,15],[0,1.8,-1],[10,6,13]);
 const turn=(why,...coverage)=>({why,coverage});
 const plans={
 cave:{0:turn('Establish the enclosure and the exit behind the men.',wide()),2:turn('Odysseus steps forward to claim hospitality; the crew waits for the answer.',actor('odysseus','medium','push'),actor('crew','close','hold'),actor('odysseus','close','hold')),4:turn('Keep the giant off screen; his threat lands on the men and the blocked entrance.',actor('crew','close','push'),cam([6,2,6],[0,1,-2],[4,2,5]),actor('odysseus','close','hold')),5:turn('Hold on the liar while he chooses the story of the wreck.',actor('odysseus','close','push')),6:turn('Stay with the survivors recoiling from an off-screen attack.',actor('crew','medium','pull'),actor('odysseus','close','hold')),7:turn('Withdraw from the men toward the exit they cannot use.',cam([2,2,6],[0,1.6,0],[5,3,11]))},
 stake:{0:turn('Show the timber between the two men before the plan begins.',actor('shared-stake','wide','push')),2:turn('The promise is heard off screen; Odysseus checks his accomplice, then the weapon.',actor('odysseus','close','hold'),actor('crew','close','push'),actor('shared-stake','medium','track')),3:turn('Follow both men to the timber; close on their preparation.',wide(),actor('shared-stake','medium','push')),4:turn('Concentrate on the timber and the men leaning into the turn.',actor('shared-stake','medium','track')),5:turn('A recoil and abrupt backward camera move answer the roar.',actor('crew','medium','pull')),7:turn('Cut between the empty mouth and the concealed survivors as calls pass outside.',cam([6,2,7],[0,1,-2],[5,2,5]),actor('odysseus','close','hold'),actor('crew','close','hold')),8:turn('The survivors cross away from the entrance and disappear behind the wall.',wide())},
 boat:{0:turn('Establish the entire hull and the shore it must escape.',cam([23,13,29],[0,2,0],[19,10,24])),2:turn('Advance to the helmsman for the boast, then the oars that must keep working.',cam([6,4,-12],[0,2,-7],[4,3,-10]),cam([8,3,2],[0,1.5,0],[8,3,-3])),3:turn('Drop toward the waterline as the crew braces for the wave.',cam([10,3,6],[0,1,0],[8,2,5])),4:turn('The second boast belongs to Odysseus; finish on the exposed hull.',cam([5,3,-11],[0,2,-7],[3,3,-10]),cam([15,7,17],[0,2,0],[18,9,20])),6:turn('The curse is heard over the oars, the helmsman and the narrowing escape route.',cam([8,3,3],[0,1.5,0],[8,3,-3]),cam([4,3,-11],[0,2,-7],[5,3,-10]),cam([-21,12,-25],[0,2,0],[-25,14,-29])),7:turn('Release the boat into a widening frame at the end of the escape.',cam([-18,9,-22],[0,2,0],[-25,13,-30]))},
 circe:{0:turn('Establish the threshold, the host and the watcher outside.',wide()),1:turn('Approach Circe, then discover Eurylochus refusing the invitation.',actor('circe','medium','push'),actor('witness','close','hold')),2:turn('Track the scouts crossing while the witness stays at his mark.',actor('scout-0','medium','track')),3:turn('The wand gesture starts in the host’s face and ends on her victims.',actor('circe','close','push'),actor('scout-0','medium','hold')),4:turn('Match the scouts’ marks to the native pigs; hold for recognition.',cam([7,3,6],[0,1,0],[5,2.5,5])),5:turn('Look across the pen and back to the unchanged human witness.',cam([6,3,4],[0,.8,0],[3,3,4]),actor('witness','close','hold')),7:turn('Eurylochus backs away, then tells the story in a tight frame.',actor('witness','medium','pull'),actor('witness','close','hold'))},
 argos:{0:turn('The lane places the dog outside the gate and the men on their approach.',wide()),1:turn('Odysseus stops; his eyeline motivates the first dog insert.',actor('odysseus','medium','track'),actor('argos-standing-proxy','medium','push')),2:turn('Stay low with Argos, then reveal the recognition in Odysseus.',actor('argos-standing-proxy','medium','hold'),actor('odysseus','close','push')),3:turn('Let Odysseus turn away and wipe the tear; Eumaeus keeps moving toward the gate.',actor('odysseus','close','hold'),actor('eumaeus','medium','track')),4:turn('Return to the dog and end wide on the distance opening between them.',actor('argos-standing-proxy','medium','hold'),wide())},
 axes:{0:turn('Show the axes as a line the arrow must traverse.',cam([1,2,12],[0,1,0],[1,2,9])),1:turn('Move from Odysseus preparing the bow to his concentration.',actor('odysseus','medium','push'),actor('odysseus','close','hold')),3:turn('Hold his face for the short line, without moving over it.',actor('odysseus','close','hold')),5:turn('The thunder is answered by a still reaction, not a camera searching for Zeus.',actor('odysseus','close','hold')),6:turn('Telemachus crosses into his father’s frame and takes his side.',actor('telemachus','medium','track')),7:turn('Read the aim in profile, then look directly along the axes.',actor('odysseus','medium','hold','e'),cam([0,1.2,9],[0,1.2,-4],[0,1.2,7])),8:turn('Odysseus gives the signal; widen to show father and son together.',actor('odysseus','close','hold'),cam([8,4,10],[-1,1.5,2],[10,5,12]))},
 bed:{0:turn('The rooted bed holds the space between husband and wife.',wide()),2:turn('Penelope tests him; cut to the man receiving the impossible request.',actor('penelope','close','hold'),actor('odysseus','close','push')),3:turn('His protest leads us to the rooted object, then her listening face.',actor('odysseus','close','push'),actor('rooted-bed','medium','track'),actor('penelope','close','hold')),4:turn('The proof is read in Penelope, not explained by another wide shot.',actor('penelope','close','push')),5:turn('Track Penelope closing the gap; keep both bodies in frame.',cam([7,3,8],[0,1.5,2],[5,3,7])),7:turn('Hold Penelope’s confession, with Odysseus listening just beyond her.',actor('penelope','close','hold')),8:turn('Allow the reunion to settle, then pull away toward the bed and dawn.',cam([5,3,7],[0,1.5,2],[10,6,13]))}
 };
 function direct(shot,seg,{key,j,x,z,prefix}){
  const plan=plans[key]?.[j];if(!plan)throw Error('Undirected turn '+key+'/'+j);
  const speak=shot.events.find(e=>e.what==='SPEAK'),count=plan.coverage.length,span=seg.for/count;
  return plan.coverage.map((view,n)=>{
   const s={...shot,...view,name:shot.name+' · '+(n+1)+'/'+count,events:n===0?shot.events.filter(e=>e.what!=='SPEAK'):[],acts:[],direction:plan.why};
   delete s.pos;delete s.tgt;delete s.cameraEnd;delete s.on;s.move=view.move||'hold';
   if(view.pos){s.pos=[view.pos[0]+x,view.pos[1],view.pos[2]+z];s.tgt=[view.tgt[0]+x,view.tgt[1],view.tgt[2]+z];if(view.cameraEnd)s.cameraEnd={pos:[view.cameraEnd.pos[0]+x,view.cameraEnd.pos[1],view.cameraEnd.pos[2]+z],tgt:s.tgt.slice()};}
   else s.on=prefix+view.on;
   s.sec=+(span+(n===count-1?shot.sec-seg.for:0)).toFixed(4);s.score=n===0?shot.score:undefined;
   s.events.push({...speak,at:n===0?.15:0,from:seg.from+n*span,for:span});
   // Keep the audio within each cut; the first .15s lead is removed from the final pause.
   if(n===0&&count>1)s.sec+=.15;if(n===count-1&&count>1)s.sec-=.15;
   const move=(who,to,at=0,run=false)=>s.acts.push({who:prefix+who,to:[x+to[0],z+to[1]],at,run});
   if(n===0){
    if(key==='cave'&&j===2)move('odysseus',[-1,2]);
    if(key==='cave'&&j===6){move('crew',[4,6],.4,true);move('odysseus',[-4,5],.8,true);s.events.push({what:'SHAKE',at:.3});}
    if(key==='stake'&&j===3){move('odysseus',[-1,1]);move('crew',[1,1],.4);}
    if(key==='stake'&&j===8){move('odysseus',[-4,-3],.3);move('crew',[-3,-4],1);}
    if(key==='circe'&&j===2)for(let k=0;k<3;k++)move('scout-'+k,[k*2-2,0],k*.4);
    if(key==='circe'&&j===7)move('witness',[5,7],0,true);
    if(key==='argos'&&j===1)move('odysseus',[-2,2]);
    if(key==='argos'&&j===3){move('odysseus',[0,3]);move('eumaeus',[2,-3],1);}
    if(key==='axes'&&j===6)move('telemachus',[-.5,3]);
    if(key==='bed'&&j===5){move('penelope',[-1,2]);move('odysseus',[-2,2]);}
   }
   s.sec=+s.sec.toFixed(4);return s;
  });
 }
 return {direct,plans};
})();
