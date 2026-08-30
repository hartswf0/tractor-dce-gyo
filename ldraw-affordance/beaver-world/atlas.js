export const PARTS=[
{id:'u9310c01',file:'u9310c01.dat',name:'Fabuland House Block Complete',class:'BUILDING_MODULE',aff:['ENCLOSE','DOOR','WINDOW','ROOM','HOST'],op:['ENCLOSE','ACCESS','DAYLIGHT'],q:5,a:5,c:5},
{id:'721',file:'721.dat',name:'Garage 4 x 8 x 3',class:'BUILDING_MODULE',aff:['ENCLOSE','DOOR_INTERFACE','BAY','HOST'],op:['ENCLOSE','ACCESS'],q:5,a:5,c:5},
{id:'722',file:'722.dat',name:'Garage Door',class:'OPENING_SYSTEM',aff:['DOOR','ACCESS','CLOSE','MATE_721'],op:['OPEN','CLOSE'],requires:['721'],q:5,a:5,c:4},
{id:'2048',file:'2048.dat',name:'Roof Block with Dormer',class:'ROOF_SHELL',aff:['ROOF','DORMER','OPENING','SHED_WATER'],op:['WEATHER','DAYLIGHT'],q:5,a:5,c:5},
{id:'54095',file:'54095.dat',name:'Curved Roof Shell 8 x 8',class:'ROOF_SHELL',aff:['CURVE','ROOF','PANEL','COVER','SPAN'],op:['WEATHER','SPAN'],q:5,a:5,c:5},
{id:'958',file:'958.dat',name:'Umbrella Canopy 8 x 8',class:'CANOPY',aff:['CANOPY','SHADE','CURVE','COVER'],op:['SHADE','WEATHER'],q:5,a:5,c:5},
{id:'4474',file:'4474.dat',name:'Windscreen Canopy 6 x 4 x 2',class:'GLAZED_SHELL',aff:['GLAZE','CANOPY','SHELL','DAYLIGHT'],op:['ENCLOSE','DAYLIGHT'],q:5,a:5,c:4},
{id:'30619',file:'30619.dat',name:'Cockpit Pod with Click Hinge',class:'POD_SHELL',aff:['CABIN','HINGE','SHELL','HOST','OPEN'],op:['ENCLOSE','HINGE'],q:5,a:5,c:5},
{id:'30296',file:'30296.dat',name:'Arch 2 x 14 x 2.333',class:'BRIDGE_SPAN',aff:['ARCH','SPAN','PORTAL','BRIDGE'],op:['SPAN','OPENING'],q:5,a:5,c:5},
{id:'55767',file:'55767.dat',name:'Technic Bridge Side 31 x 13',class:'BRIDGE_STRUCTURE',aff:['BRIDGE','TRUSS','SPAN','HOLES','FRAME'],op:['SPAN','TRUSS'],q:5,a:5,c:5},
{id:'30646',file:'30646.dat',name:'Girder 2 x 2 x 8',class:'STRUCTURE_FRAME',aff:['GIRDER','I_BEAM','PILLAR','TRUSS','FRAME'],op:['SPAN','SUPPORT'],q:5,a:5,c:5},
{id:'32532b',file:'32532b.dat',name:'Technic Open Frame 6 x 8',class:'STRUCTURE_FRAME',aff:['OPEN_FRAME','MOUNT','SPAN','HOST'],op:['FRAME','MOUNT'],q:5,a:5,c:5},
{id:'4444',file:'4444.dat',name:'Wall Panel 2 x 5 x 6',class:'WALL_PANEL',aff:['WALL','PANEL','ENCLOSE','HOST'],op:['ENCLOSE','DIVIDE'],q:5,a:5,c:5},
{id:'606',file:'606.dat',name:'Road Baseplate Straight',class:'SITE_CIRCULATION',aff:['ROAD','STRAIGHT','ROUTE','DATUM'],op:['ROUTE'],q:5,a:5,c:5},
{id:'607',file:'607.dat',name:'Road Baseplate Crossroads',class:'SITE_CIRCULATION',aff:['ROAD','CROSS','ROUTE','NODE'],op:['ROUTE','INTERSECT'],q:5,a:5,c:5},
{id:'608',file:'608.dat',name:'Road Baseplate T-Junction',class:'SITE_CIRCULATION',aff:['ROAD','TEE','ROUTE','BRANCH'],op:['ROUTE','BRANCH'],q:5,a:5,c:5},
{id:'609',file:'609.dat',name:'Road Baseplate Curve',class:'SITE_CIRCULATION',aff:['ROAD','CURVE','ROUTE'],op:['ROUTE','CURVE'],q:5,a:5,c:5},
{id:'6092',file:'6092.dat',name:'Raised Baseplate Ramp Pit Stairs',class:'SITE_CORE',aff:['RAMP','PIT','STAIR','GRADE','PLATFORM'],op:['GRADE','CLIMB','CONTAIN'],q:5,a:5,c:5},
{id:'4000',file:'4000.dat',name:'Ladder 4 x 15.6 Pivot',class:'LADDER_RAIL',aff:['LADDER','PIVOT','CLIMB','INDEX','ROUTE'],op:['CLIMB','PIVOT'],q:5,a:5,c:5},
{id:'40243',file:'40243.dat',name:'Spiral Stair Riser',class:'VERTICAL_CIRCULATION',aff:['STAIR','SPIRAL','STEP','CIRCULATION'],op:['CLIMB','ROTATE'],q:5,a:5,c:5},
{id:'30110',file:'30110.dat',name:'Fence 2 x 12 x 6',class:'LATTICE_PANEL',aff:['FENCE','LATTICE','GUARD','DIVIDE','VENT'],op:['GUARD','DIVIDE'],q:5,a:5,c:5},
{id:'51858',file:'51858.dat',name:'Crane Basket Click Lock',class:'CAGE_PLATFORM',aff:['CAGE','HINGE','LOCK','MAN_LIFT','GUARD'],op:['GUARD','LOCK','SUSPEND'],q:5,a:5,c:5},
{id:'4082',file:'4082.dat',name:'Container Box 6 x 8',class:'BIN_CONTAINER',aff:['BOX','TRAY','CONTAIN','STACK'],op:['CONTAIN','STAGE'],q:5,a:5,c:5},
{id:'33031',file:'33031.dat',name:'Hinged Transit Case',class:'TRANSIT_CASE',aff:['BOX','HINGE','LID','CLOSE','STACK'],op:['CONTAIN','HINGE','CLOSE'],q:5,a:5,c:5},
{id:'2042',file:'2042.dat',name:'Cupboard 2 x 6 x 7',class:'STORAGE_MODULE',aff:['CUPBOARD','DOOR','SHELF','CABINET'],op:['STORE','DOOR'],q:5,a:5,c:5},
{id:'6940',file:'6940.dat',name:'Scala Bed 8 x 24',class:'FURNITURE',aff:['BED','SLEEP','PLATFORM','HUMAN'],op:['SLEEP','SUPPORT_HUMAN'],q:5,a:5,c:5},
{id:'6965',file:'6965.dat',name:'Scala Table 7 x 7',class:'FURNITURE',aff:['TABLE','WORK','SUPPORT','STAGE'],op:['WORK','SUPPORT'],q:5,a:5,c:5},
{id:'46564',file:'46564.dat',name:'Forklift Complete',class:'MATERIAL_HANDLING',aff:['FORKLIFT','LIFT','MOVE','DOCK','PALLET'],op:['LIFT','MOVE','DOCK'],q:5,a:5,c:5},
{id:'4003',file:'4003.dat',name:'Wheelbarrow',class:'MATERIAL_HANDLING',aff:['WHEELBARROW','ROLL','TIP','CARRY'],op:['MOVE','TIP','CARRY'],q:5,a:5,c:5},
{id:'4424',file:'4424.dat',name:'Barrel 4.5 x 4.5',class:'BULK_CONTAINER',aff:['BARREL','DRUM','CONTAIN','ROLL'],op:['CONTAIN','ROLL'],q:5,a:5,c:5},
{id:'30018',file:'30018.dat',name:'Bathtub 6 x 12',class:'WET_FIXTURE',aff:['BATHTUB','BASIN','WET','CONTAIN','WATER'],op:['CONTAIN_WATER','WASH'],q:5,a:5,c:5},
{id:'4599b',file:'4599b.dat',name:'Tap / Faucet',class:'FLUID_CONTROL',aff:['TAP','FAUCET','VALVE','PIPE','WATER'],op:['CONTROL_FLUID','DISPENSE'],q:5,a:4,c:3},
{id:'2371',file:'2371.dat',name:'Boat Hull Deck Stern',class:'HULL_SHELL',aff:['HULL','DECK','SHELL','CURVE','HOST'],op:['FLOAT','FLOOR','SHELL'],q:5,a:5,c:5},
{id:'49736',file:'49736.dat',name:'Tube Slide Straight',class:'TUBE_PATH',aff:['TUBE','SLIDE','ROUTE','GRAVITY','ENCLOSE_PATH'],op:['ROUTE','CONTAIN_PATH'],q:5,a:5,c:5},
{id:'3228a',file:'3228a.dat',name:'Train Track Rail Straight',class:'RAIL_PATH',aff:['RAIL','STRAIGHT','GUIDE','ROUTE'],op:['GUIDE','ROUTE'],q:5,a:5,c:4}
];

export const TOKENS=p=>new Set([...(p.aff||[]),...(p.op||[])]);

export const CHALLENGES={
  flood_depot:{name:'FLOOD DEPOT',signals:[
    ['CROSS WATER',10,['BRIDGE','SPAN']],['DRY SHELTER',10,['ENCLOSE','WEATHER']],['ENTER SHELTER',9,['ACCESS','DOOR']],['DAYLIGHT',5,['DAYLIGHT','WINDOW','GLAZE']],['SITE ROUTE',8,['ROAD','ROUTE']],['VERTICAL ACCESS',7,['CLIMB','LADDER','STAIR']],['EDGE SAFETY',6,['GUARD']],['STORE TOOLS',5,['STORE','CABINET','CONTAIN']],['MOVE CARGO',5,['LIFT','CARRY','MOVE']],['CONTROL WATER',7,['CONTROL_FLUID','VALVE']],['CATCH WATER',4,['CONTAIN_WATER','BASIN','WATER']]]},
  bridge_works:{name:'BRIDGE WORKS',signals:[
    ['SPAN GAP',12,['BRIDGE','SPAN']],['TRUSS',9,['TRUSS','FRAME']],['ROUTE ACROSS',8,['ROUTE','ROAD']],['CLIMB TO DECK',7,['CLIMB']],['GUARD EDGE',8,['GUARD']],['MATERIAL STAGING',5,['STAGE','CONTAIN']],['LIFT MATERIAL',7,['LIFT']],['WORK SURFACE',4,['WORK','TABLE','SUPPORT']]]},
  habitat:{name:'HABITAT',signals:[
    ['ROOM',12,['ROOM','ENCLOSE','SHELL']],['WEATHER COVER',10,['WEATHER','ROOF','COVER']],['ACCESS',9,['ACCESS','DOOR']],['DAYLIGHT',7,['DAYLIGHT','WINDOW','GLAZE']],['SLEEP',6,['SLEEP','BED']],['WORK',5,['WORK','TABLE']],['STORE',5,['STORE','CABINET']],['WATER',6,['WATER','CONTROL_FLUID']],['SHADE',3,['SHADE','CANOPY']]]},
  logistics_yard:{name:'LOGISTICS YARD',signals:[
    ['ROUTE',10,['ROAD','ROUTE']],['BRANCH ROUTE',7,['BRANCH','TEE','NODE']],['LIFT',9,['LIFT','FORKLIFT']],['DOCK',7,['DOCK']],['CONTAIN',7,['CONTAIN','BOX','BARREL']],['CLOSE CARGO',5,['CLOSE','LID']],['GUARD',6,['GUARD','FENCE']],['CLIMB',4,['CLIMB']]]}
};
