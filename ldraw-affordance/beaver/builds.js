const seed={partId:'3020',color:71,label:'GROUND / EXISTING SUBSTRATE'};
const stud=(id,severity,label,p,operatorHint='',completion={kind:'port'})=>({id,severity,label,prerequisite:{kind:'port',type:'stud',gender:'male',p,n:[0,-1,0],tolerance:.05,cry:label.toUpperCase(),operatorHint},completion});
const socket=(id,severity,label,p)=>({id,severity,label,prerequisite:{kind:'port',type:'pin',gender:'female',p,n:[0,0,-1],tolerance:.05,cry:'TECHNIC SOCKET NEEDED HERE',operatorHint:'BRIDGE_SYSTEM_TECHNIC'},completion:{kind:'port'}});
const pinMale=(id,severity,label,p)=>({id,severity,label,prerequisite:{kind:'port',type:'pin',gender:'male',p,n:[0,0,-1],tolerance:.05,cry:'A REAL INSERTED PIN END IS NEEDED HERE',operatorHint:'JOIN_PIN / INSERTION_DEPTH'},completion:{kind:'port'}});
const build=(id,name,category,description,features,expect={full:'quiet'})=>({id,name,category,description,principle:'One real part at a time. The field asks; Beaver may only answer through a verified physical handshake.',seed,features,expect});

const tower=(prefix,x,z,levels,startSeverity=150)=>Array.from({length:levels},(_,i)=>stud(`${prefix}-${i+1}`,startSeverity-i,`${prefix.toUpperCase()} LEVEL ${i+1}`,[x,-24*(i+1),z],'EXTEND'));

export const BUILDS=[
  build('service-node','SERVICE NODE','operators','Original base benchmark: side-facing stud, half-stud center, and System→Technic socket.',[
    {id:'side-panel',severity:180,label:'SIDE PANEL',prerequisite:{kind:'port',type:'stud',gender:'male',p:[-30,-14,-16],n:[0,0,-1],tolerance:.05,cry:'SIDE-FACING STUD NEEDED HERE',operatorHint:'TURN_PLANE_90 / EXPOSE_SIDE_STUD'},completion:{kind:'mate',preferFamily:'resolution',label:'SEAT A SMALL PANEL ON THAT STUD'}},
    stud('centered-mast',160,'CENTERED MAST',[0,-8,-10],'OFFSET_HALF_STUD / CENTER',{kind:'mate',preferFamily:'matter',label:'GROW THE MAST FROM THE CENTERED STUD'}),
    socket('technic-socket',140,'TECHNIC SERVICE SOCKET',[20,-14,0])
  ],{full:'quiet','no-snot':'blocked','no-offset':'blocked','no-technic':'blocked','matter-only':'blocked'}),

  build('brick-tower','BRICK TOWER','structure','Repeated vertical extension and accumulated-joint re-audit.',tower('tower',-30,-10,6),{full:'quiet'}),

  build('plate-tower','PLATE GAUGE','resolution','Six plate-height increments: tests thin resolution instead of brick-height assumption.',Array.from({length:6},(_,i)=>stud(`plate-${i+1}`,150-i,`PLATE LEVEL ${i+1}`,[-10,-8*(i+1),10],'THIN / RESOLVE_HEIGHT')),{full:'quiet'}),

  build('stair','ONE-STUD STAIR','offset/span','A diagonal run made by overlapping 1×2 plates one stud at a time.',[
    stud('step-1',160,'STEP 1',[-10,-8,-10],'THIN / SPAN'),
    stud('step-2',159,'STEP 2',[10,-16,-10],'THIN / SPAN'),
    stud('step-3',158,'STEP 3',[30,-24,-10],'THIN / SPAN'),
    stud('step-4',157,'STEP 4',[50,-32,-10],'THIN / SPAN'),
    stud('step-5',156,'STEP 5',[70,-40,-10],'THIN / SPAN')
  ]),

  build('plate-span','FOUR-STUD SPAN','span','A 1×4 plate must bridge from one seed stud to the far seed stud; secondary seating should create more than one click.',[
    stud('span',180,'SPAN TO FAR SUPPORT',[30,-8,-10],'SPAN')
  ]),

  build('brick-span','BRICK BEAM','span','Same span at brick height; forces a long matter beam and tests secondary contacts.',[
    stud('beam',180,'BRICK BEAM TO FAR SUPPORT',[30,-24,-10],'SPAN / EXTEND')
  ]),

  build('portal','PORTAL / LINTEL','architecture','Two independently built jambs followed by a lintel that can seat on both.',[
    ...tower('left-jamb',-30,-10,2,190),
    ...tower('right-jamb',30,-10,2,180),
    stud('lintel',170,'LINTEL ACROSS BOTH JAMBS',[30,-56,-10],'SPAN')
  ]),

  build('twin-snot','TWIN SIDE PANELS','orientation','Two independent side-facing studs and two real panel mates.',[
    {id:'left-side',severity:190,label:'LEFT SIDE PANEL',prerequisite:{kind:'port',type:'stud',gender:'male',p:[-30,-14,-16],n:[0,0,-1],tolerance:.05,cry:'LEFT SIDE-FACING STUD NEEDED',operatorHint:'TURN_PLANE_90 / EXPOSE_SIDE_STUD'},completion:{kind:'mate',preferFamily:'resolution',label:'CLIP PANEL TO LEFT SIDE STUD'}},
    {id:'right-side',severity:180,label:'RIGHT SIDE PANEL',prerequisite:{kind:'port',type:'stud',gender:'male',p:[30,-14,-16],n:[0,0,-1],tolerance:.05,cry:'RIGHT SIDE-FACING STUD NEEDED',operatorHint:'TURN_PLANE_90 / EXPOSE_SIDE_STUD'},completion:{kind:'mate',preferFamily:'resolution',label:'CLIP PANEL TO RIGHT SIDE STUD'}}
  ],{full:'quiet','no-snot':'blocked','matter-only':'blocked'}),

  build('centerline-mast','CENTERLINE MAST','offset','The half-stud operator creates a datum unavailable on the original stud grid, then ordinary bricks continue from it.',[
    stud('center',190,'CREATE CENTER DATUM',[0,-8,-10],'OFFSET_HALF_STUD / CENTER',{kind:'mate',preferFamily:'matter',label:'SEAT FIRST CENTERLINE BRICK'}),
    stud('center-2',180,'CENTERLINE LEVEL 2',[0,-32,-10],'EXTEND'),
    stud('center-3',170,'CENTERLINE LEVEL 3',[0,-56,-10],'EXTEND'),
    stud('center-4',160,'CENTERLINE LEVEL 4',[0,-80,-10],'EXTEND')
  ],{full:'quiet','no-offset':'blocked','matter-only':'blocked'}),

  build('technic-bay','TWIN TECHNIC BAY','system/technic','Two calibrated System→Technic adapters expose real pin sockets without pretending a pin has been inserted.',[
    socket('socket-r',190,'RIGHT PIN SOCKET',[20,-14,0]),
    socket('socket-l',180,'LEFT PIN SOCKET',[-20,-14,0])
  ],{full:'quiet','no-technic':'blocked','matter-only':'blocked'}),

  build('technic-insertion','PIN INSERTION: MUST FAIL','negative','Intentional red benchmark. Mouth coincidence is not insertion depth, so the second signal must remain audible.',[
    socket('socket',190,'CALIBRATED PIN SOCKET',[20,-14,0]),
    pinMale('inserted-pin',180,'INSERTED PIN END',[20,-14,0])
  ],{full:'blocked','no-technic':'blocked','matter-only':'blocked'}),

  build('branch-diagonal','DIAGONAL BRANCH','branch','2×2 plates repeatedly turn one supported stud into a two-axis diagonal branch.',[
    stud('branch-1',190,'BRANCH 1',[-10,-8,10],'BRANCH / THIN'),
    stud('branch-2',180,'BRANCH 2',[10,-16,30],'BRANCH / THIN'),
    stud('branch-3',170,'BRANCH 3',[30,-24,50],'BRANCH / THIN')
  ]),

  build('cantilever','CANTILEVER BOOM','span','A long boom grows beyond the substrate with no invented second support.',[
    stud('boom-1',190,'BOOM OUTBOARD 1',[90,-8,-10],'SPAN / THIN'),
    stud('boom-2',180,'BOOM OUTBOARD 2',[150,-16,-10],'SPAN / THIN'),
    stud('boom-3',170,'BOOM OUTBOARD 3',[210,-24,-10],'SPAN / THIN')
  ]),

  build('house-section','HOUSE SECTION','architecture','Reduced house essence: two bearing jambs, a real lintel, then a multi-contact roof/deck layer.',[
    ...tower('wall-l',-30,-10,3,210),
    ...tower('wall-r',30,-10,3,200),
    stud('door-lintel',190,'DOOR LINTEL',[30,-80,-10],'SPAN'),
    stud('roof',180,'ROOF / DIAPHRAGM',[30,-88,-10],'THIN / SPAN')
  ]),

  build('courtyard-frame','COURTYARD FRAME','architecture','Four columns, two lintels, then two cross ties. A tiny piece-level ancestor of the courtyard house.',[
    ...tower('front-l',-30,-10,2,240),...tower('front-r',30,-10,2,230),
    ...tower('back-l',-30,10,2,220),...tower('back-r',30,10,2,210),
    stud('front-lintel',200,'FRONT LINTEL',[30,-56,-10],'SPAN'),
    stud('back-lintel',190,'BACK LINTEL',[30,-56,10],'SPAN'),
    stud('left-cross',180,'LEFT CROSS TIE',[-30,-64,10],'BRANCH / THIN'),
    stud('right-cross',170,'RIGHT CROSS TIE',[30,-64,10],'BRANCH / THIN')
  ]),

  build('starship-spine','STARSHIP SPINE','vehicle/space','Reduced spaceship genome inside the base loop: fore/aft booms, side hardpoints, and twin Technic service sockets.',[
    stud('fore-boom',220,'FORE BOOM',[90,-8,-10],'SPAN / THIN'),
    stud('aft-boom',210,'AFT BOOM',[-90,-8,-10],'SPAN / THIN'),
    {id:'port-hardpoint',severity:200,label:'PORT HARDPOINT',prerequisite:{kind:'port',type:'stud',gender:'male',p:[-30,-14,-16],n:[0,0,-1],tolerance:.05,cry:'PORT SIDE HARDPOINT NEEDED',operatorHint:'TURN_PLANE_90'},completion:{kind:'mate',preferFamily:'resolution',label:'SEAT PORT PANEL'}},
    {id:'starboard-hardpoint',severity:190,label:'STARBOARD HARDPOINT',prerequisite:{kind:'port',type:'stud',gender:'male',p:[30,-14,-16],n:[0,0,-1],tolerance:.05,cry:'STARBOARD SIDE HARDPOINT NEEDED',operatorHint:'TURN_PLANE_90'},completion:{kind:'mate',preferFamily:'resolution',label:'SEAT STARBOARD PANEL'}},
    socket('ship-socket-r',180,'RIGHT SERVICE SOCKET',[20,-14,0]),
    socket('ship-socket-l',170,'LEFT SERVICE SOCKET',[-20,-14,0])
  ],{full:'quiet','no-snot':'blocked','no-technic':'blocked','matter-only':'blocked'}),

  build('beaver-dam','BEAVER DAM / LATTICE','lattice','Dense little lattice combining spans, branching and repeated height resolution.',[
    stud('front-span',240,'FRONT SPAN',[30,-8,-10],'SPAN / THIN'),
    stud('back-span',230,'BACK SPAN',[30,-8,10],'SPAN / THIN'),
    stud('left-branch',220,'LEFT BRANCH',[-10,-16,10],'BRANCH / THIN'),
    stud('right-branch',210,'RIGHT BRANCH',[10,-16,10],'BRANCH / THIN'),
    stud('crest',200,'CREST',[10,-24,10],'THIN / RESOLVE_HEIGHT')
  ]),

  build('all-operators','ALL OPERATORS / CAPSTONE','capstone','One field asks for nearly every capability the calibrated base currently has: extend, thin, span, branch, SNOT, half-stud offset and Technic bridge.',[
    stud('cap-span',300,'LONG SPAN',[30,-8,-10],'SPAN / THIN'),
    stud('cap-branch',290,'TWO-AXIS BRANCH',[-10,-8,10],'BRANCH / THIN'),
    {id:'cap-snot',severity:280,label:'SIDE STUD',prerequisite:{kind:'port',type:'stud',gender:'male',p:[-30,-14,-16],n:[0,0,-1],tolerance:.05,cry:'SIDE STUD NEEDED',operatorHint:'TURN_PLANE_90'},completion:{kind:'mate',preferFamily:'resolution',label:'SEAT SIDE PANEL'}},
    stud('cap-center',270,'HALF-STUD CENTER',[0,-8,-10],'OFFSET_HALF_STUD / CENTER',{kind:'mate',preferFamily:'matter',label:'SEAT CENTERED BRICK'}),
    socket('cap-tech',260,'TECHNIC SOCKET',[20,-14,0]),
    stud('cap-mast',250,'VERTICAL EXTENSION',[30,-32,10],'EXTEND')
  ],{full:'quiet','no-snot':'blocked','no-offset':'blocked','no-technic':'blocked','matter-only':'blocked'})
];

export const BUILD_MAP=new Map(BUILDS.map(b=>[b.id,b]));
export const VOCAB_MODES=[
  {id:'full',name:'FULL 19-PART VOCAB'},
  {id:'no-snot',name:'ABLATE SNOT / TURN PLANE'},
  {id:'no-offset',name:'ABLATE HALF-STUD OFFSET'},
  {id:'no-technic',name:'ABLATE TECHNIC'},
  {id:'matter-only',name:'ONLY MATTER + PLATES'}
];
