export const P=(role,file,description,extra={})=>({role,file,description,exact:true,...extra});

export const SKINS=[
 {code:14,name:'Classic Yellow',hex:'#FAC80A'},
 {code:78,name:'Light Nougat',hex:'#FFC995'},
 {code:84,name:'Medium Nougat',hex:'#AA7D55'},
 {code:92,name:'Nougat',hex:'#BB805A'},
 {code:128,name:'Dark Nougat',hex:'#AD6140'},
 {code:70,name:'Reddish Brown',hex:'#5F3109'},
 {code:308,name:'Dark Brown',hex:'#352100'}
];

export const PAINTS=[
 {code:0,name:'Black',hex:'#1B2A34'},{code:15,name:'White',hex:'#F4F4F4'},
 {code:4,name:'Red',hex:'#B40000'},{code:1,name:'Blue',hex:'#1E5AA8'},
 {code:2,name:'Green',hex:'#00852B'},{code:14,name:'Yellow',hex:'#FAC80A'},
 {code:25,name:'Orange',hex:'#D67923'},{code:19,name:'Tan',hex:'#D7BA8C'},
 {code:70,name:'Reddish Brown',hex:'#5F3109'},{code:71,name:'Light Bluish Grey',hex:'#969696'},
 {code:72,name:'Dark Bluish Grey',hex:'#646464'},{code:272,name:'Dark Blue',hex:'#19325A'}
];

export const WORLDS=[
 {id:'simpsons',label:'The Simpsons'},{id:'star-wars',label:'Star Wars'},
 {id:'gremlins',label:'Gremlins'},{id:'scooby-doo',label:'Scooby-Doo'},
 {id:'back-to-future',label:'Back to the Future'},{id:'stranger-things',label:'Stranger Things'}
];

export const FIGURES=[
 {id:'homer',world:'simpsons',name:'Homer Simpson',skin:14,note:'prosthetic sculpt + printed upper',parts:[P('HEAD','15527p02.dat','Homer Simpson head',{mountY:-64}),P('UPPER','16360p87.dat','Homer Simpson shirt / tie / ID upper'),P('LOWER','3815c01.dat','blue hips + legs',{exact:false,color:1})]},
 {id:'marge',world:'simpsons',name:'Marge Simpson',skin:14,note:'prosthetic sculpt + formed skirt',parts:[P('HEAD','15522p02.dat','Marge Simpson head',{mountY:-64}),P('UPPER','76382pd13.dat','Marge Simpson dress upper'),P('LOWER','3815c01.dat','green hips + legs under skirt',{exact:false,color:2}),P('OVERLAY','u9209c01.dat','Marge formed skirt')]},
 {id:'bart',world:'simpsons',name:'Bart Simpson',skin:14,note:'prosthetic sculpt + short legs',parts:[P('HEAD','15523p02.dat','Bart Simpson head',{mountY:-64}),P('TORSO','973pd12.dat','Bart slingshot torso',{color:4}),P('LOWER','16709p02.dat','Bart short hips + legs')]},
 {id:'lisa',world:'simpsons',name:'Lisa Simpson',skin:14,note:'prosthetic sculpt + beads upper',parts:[P('HEAD','15524p02.dat','Lisa Simpson head',{mountY:-64}),P('UPPER','76382pd14.dat','Lisa Simpson beads upper'),P('LOWER','3815c01.dat','red hips + legs',{exact:false,color:4})]},
 {id:'maggie',world:'simpsons',name:'Maggie Simpson',skin:14,body:'baby',note:'baby rig',parts:[P('BABY','15526.dat','Maggie baby body',{color:1}),P('BABY_HEAD','15525p02.dat','Maggie Simpson head',{mountY:-58})]},
 {id:'ned',world:'simpsons',name:'Ned Flanders',skin:14,note:'prosthetic sculpt + apron body',parts:[P('HEAD','15529p01.dat','Ned Flanders head',{mountY:-64}),P('UPPER','76382p89.dat','Ned apron upper'),P('LOWER','73200p89.dat','Ned apron hips + legs')]},
 {id:'vader',world:'star-wars',name:'Darth Vader',skin:14,note:'standard rig + Vader helmet',parts:[P('HEAD','3626b.dat','head under helmet',{exact:false,color:0,mountY:-84}),P('TORSO','973.dat','black torso base',{exact:false,color:0}),P('LOWER','3815c01.dat','black lower',{exact:false,color:0}),P('HEADGEAR','30368.dat','Darth Vader helmet',{color:0})]},
 {id:'yoda',world:'star-wars',name:'Yoda',skin:84,note:'prosthetic sculpt',parts:[P('HEAD','13195p01.dat','Yoda patterned head',{mountY:-64}),P('TORSO','973.dat','tan robe torso',{exact:false,color:19}),P('LOWER','3815c01.dat','tan robe lower',{exact:false,color:19})]},
 {id:'luke',world:'star-wars',name:'Luke Skywalker',skin:78,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','standard film head',{exact:false,mountY:-84}),P('TORSO','973.dat','light tunic base',{exact:false,color:15}),P('LOWER','3815c01.dat','tan lower',{exact:false,color:19})]},
 {id:'leia',world:'star-wars',name:'Leia Organa',skin:78,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','standard film head',{exact:false,mountY:-84}),P('TORSO','973.dat','white torso base',{exact:false,color:15}),P('LOWER','3815c01.dat','white lower',{exact:false,color:15})]},
 {id:'han',world:'star-wars',name:'Han Solo',skin:78,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','standard film head',{exact:false,mountY:-84}),P('TORSO','973.dat','shirt base',{exact:false,color:15}),P('LOWER','3815c01.dat','dark lower',{exact:false,color:0})]},
 {id:'chewie',world:'star-wars',name:'Chewbacca',skin:70,note:'Word-to-Mento cast base; prosthetic pending',parts:[P('HEAD','3626b.dat','temporary standard head',{exact:false,color:70,mountY:-84}),P('TORSO','973.dat','brown torso base',{exact:false,color:70}),P('LOWER','3815c01.dat','brown lower',{exact:false,color:70})]},
 {id:'c3po',world:'star-wars',name:'C-3PO',skin:14,note:'Word-to-Mento cast base; droid sculpt pending',parts:[P('HEAD','3626b.dat','temporary droid head',{exact:false,color:14,mountY:-84}),P('TORSO','973.dat','droid torso base',{exact:false,color:14}),P('LOWER','3815c01.dat','droid lower',{exact:false,color:14})]},
 {id:'storm',world:'star-wars',name:'Stormtrooper',skin:14,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','head base',{exact:false,color:0,mountY:-84}),P('TORSO','973.dat','white armor base',{exact:false,color:15}),P('LOWER','3815c01.dat','white armor lower',{exact:false,color:15})]},
 {id:'pilot',world:'star-wars',name:'Rebel Pilot',skin:78,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','pilot head',{exact:false,mountY:-84}),P('TORSO','973.dat','orange flight torso',{exact:false,color:25}),P('LOWER','3815c01.dat','orange flight lower',{exact:false,color:25})]},
 {id:'rebel',world:'star-wars',name:'Rebel Trooper',skin:78,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','trooper head',{exact:false,mountY:-84}),P('TORSO','973.dat','rebel torso base',{exact:false,color:19}),P('LOWER','3815c01.dat','rebel lower',{exact:false,color:19})]},
 {id:'rey',world:'star-wars',name:'Rey',skin:78,note:'Word-to-Mento cast base',parts:[P('HEAD','3626b.dat','standard film head',{exact:false,mountY:-84}),P('TORSO','973.dat','sand torso base',{exact:false,color:19}),P('LOWER','3815c01.dat','sand lower',{exact:false,color:19})]},
 {id:'gremlin',world:'gremlins',name:'Gremlin',skin:78,note:'patterned prosthetic',parts:[P('HEAD','26056px0.dat','patterned Gremlin / Mogwai head',{mountY:-64}),P('TORSO','973.dat','neutral torso',{exact:false,color:0}),P('LOWER','3815c01.dat','neutral lower',{exact:false,color:0})]},
 {id:'fred',world:'scooby-doo',name:'Fred',skin:14,note:'standard head + exact ascot torso',parts:[P('HEAD','3626b.dat','standard head',{exact:false,mountY:-84}),P('TORSO','973px3.dat','Fred sweater + orange ascot',{color:15}),P('LOWER','3815c01.dat','blue lower',{exact:false,color:1})]},
 {id:'shaggy',world:'scooby-doo',name:'Shaggy',skin:14,note:'standard head + compatible hair',parts:[P('HEAD','3626b.dat','standard head',{exact:false,mountY:-84}),P('TORSO','973.dat','green torso base',{exact:false,color:2}),P('LOWER','3815c01.dat','brown lower',{exact:false,color:70}),P('HEADGEAR','21787.dat','Shaggy Rogers hair',{color:70})]},
 {id:'marty',world:'back-to-future',name:'Marty McFly',skin:78,note:'film base',parts:[P('HEAD','3626b.dat','standard head',{exact:false,mountY:-84}),P('TORSO','973.dat','red torso base',{exact:false,color:4}),P('LOWER','3815c01.dat','blue lower',{exact:false,color:1})]},
 {id:'doc',world:'back-to-future',name:'Doc Brown',skin:78,note:'film base',parts:[P('HEAD','3626b.dat','standard head',{exact:false,mountY:-84}),P('TORSO','973.dat','white torso base',{exact:false,color:15}),P('LOWER','3815c01.dat','white lower',{exact:false,color:15})]},
 {id:'lucas',world:'stranger-things',name:'Lucas Sinclair',skin:92,note:'film base',parts:[P('HEAD','3626b.dat','standard head',{exact:false,mountY:-84}),P('TORSO','973.dat','red torso base',{exact:false,color:4}),P('LOWER','3815c01.dat','blue lower',{exact:false,color:1})]}
];

export const PROSTHETICS=[
 {filename:'15527p02.dat',description:'Homer Simpson prosthetic head',mountY:-64},
 {filename:'15522p02.dat',description:'Marge Simpson prosthetic head',mountY:-64},
 {filename:'15523p02.dat',description:'Bart Simpson prosthetic head',mountY:-64},
 {filename:'15524p02.dat',description:'Lisa Simpson prosthetic head',mountY:-64},
 {filename:'15529p01.dat',description:'Ned Flanders prosthetic head',mountY:-64},
 {filename:'13195p01.dat',description:'Yoda prosthetic head',mountY:-64},
 {filename:'26056px0.dat',description:'Patterned Gremlin / Mogwai prosthetic',mountY:-64}
];