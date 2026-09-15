/* A generated image is scenery, not geometry. Preview before placing. */
(() => {
  'use strict';
  const panel=document.createElement('details');
  panel.id='backdropPanel';
  panel.innerHTML=`<summary>Backdrop</summary><div class="bdBody">
    <label>Describe the scenery<textarea id="bdPrompt" rows="3" placeholder="Distant cliffs above a moonlit Aegean sea, no foreground figures"></textarea></label>
    <label>Projection<select id="bdProjection"><option value="surface">Flat scene surface</option><option value="sky">Sky panorama</option></select></label>
    <label>Image model<input id="bdModel" value="gpt-image-2.5-sunburst" autocomplete="off"></label>
    <button id="bdGenerate">Generate image (uses API credit)</button>
    <label>Or upload an image<input id="bdFile" type="file" accept="image/png,image/jpeg,image/webp"></label>
    <p id="bdStatus" role="status">Uses your OpenAI key from the word bar. Generated scenery is not saved in the film yet; download it to keep it.</p>
    <img id="bdPreview" alt="Backdrop preview" hidden>
    <div><button id="bdPlace" disabled>Place</button> <button id="bdRemove" disabled>Remove</button> <a id="bdDownload" hidden download="cinerium-backdrop.png">Download</a></div>
  </div>`;
  const style=document.createElement('style');
  style.textContent='#backdropPanel{position:fixed;right:12px;top:108px;z-index:8;width:min(310px,calc(100vw - 24px));background:#f5f4ef;color:#171717;border:1px solid #555;border-radius:10px;font:12px system-ui;box-shadow:0 4px 20px #0003}#backdropPanel summary{padding:10px;cursor:pointer;font-weight:700}.bdBody{padding:0 10px 10px;max-height:65vh;overflow:auto}.bdBody label{display:block;margin:8px 0}.bdBody textarea,.bdBody select,.bdBody input:not([type=file]){display:block;width:100%;font:14px system-ui;padding:6px}.bdBody button{padding:8px;cursor:pointer}.bdBody img{width:100%;margin:6px 0}.bdBody p{line-height:1.4}.bdBody a{color:#12619b}';
  document.head.append(style);document.body.append(panel);
  const $=id=>document.getElementById(id), status=s=>{$('bdStatus').textContent=s;};
  let url=null,texture=null,surface=null,dome=null,oldMaterial=null,busy=false,projection='surface';
  function remove(){
    if(surface){surface.parent?.remove(surface);surface.geometry.dispose();surface.material.dispose();surface=null;}
    if(dome&&oldMaterial){dome.material.dispose();dome.material=oldMaterial;dome=null;oldMaterial=null;}
    $('bdRemove').disabled=true;
  }
  async function preview(src,mode){
    const next=await new THREE.TextureLoader().loadAsync(src);
    next.encoding=THREE.sRGBEncoding;
    remove();if(texture)texture.dispose();texture=next;projection=mode;url=src;
    $('bdPreview').src=src;$('bdPreview').hidden=false;$('bdPlace').disabled=false;
    $('bdDownload').href=src;$('bdDownload').hidden=false;
    status('Preview ready. Place applies it to the scene. Download keeps a copy.');
  }
  $('bdGenerate').onclick=async()=>{
    if(busy)return;
    const key=window.Ai?.key(),words=$('bdPrompt').value.trim(),model=$('bdModel').value.trim(),mode=$('bdProjection').value;
    if(!key){status('Open the word bar’s Key control and add your own OpenAI API key.');return;}
    if(!words||!model){status('Enter a scenery description and image model.');return;}
    busy=true;$('bdGenerate').disabled=true;status('Generating scenery. This can take a few minutes…');
    try{
      const prompt=(mode==='sky'?'Create a seamless equirectangular 360-degree panoramic environment, horizontal horizon at image mid-height, matching left and right edges. ':'Create a cinematic matte painting for a flat backdrop behind a practical LEGO miniature set. ')+words+'. No captions, interface, typography, or foreground characters. Match miniature-film lighting; keep the actors and foreground as real 3D LEGO.';
      const res=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model,prompt,n:1,size:mode==='sky'?'2048x1024':'1536x1024',quality:'medium',output_format:'png'})});
      const j=await res.json();if(!res.ok)throw new Error(j.error?.message||'Image request failed: '+res.status);
      if(!j.data?.[0]?.b64_json)throw new Error('The API returned no image.');
      await preview('data:image/png;base64,'+j.data[0].b64_json,mode);
    }catch(e){status(e.message);}finally{busy=false;$('bdGenerate').disabled=false;}
  };
  $('bdFile').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    if(file.size>20*1024*1024){status('Choose an image under 20 MB.');return;}
    const reader=new FileReader();reader.onload=()=>preview(reader.result,$('bdProjection').value).catch(e=>status(e.message));reader.readAsDataURL(file);
  };
  $('bdPlace').onclick=()=>{
    const W=window.__world;
    if(!texture||!W?.ready){status('Wait for the world to finish loading.');return;}
    remove();
    if(projection==='sky'){
      dome=W.sky?.dome;if(!dome){status('This scene has no sky dome.');return;}
      oldMaterial=dome.material;dome.material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false});
    }else{
      const direction=new THREE.Vector3();W.camera.getWorldDirection(direction);
      const aspect=texture.image.width/texture.image.height;
      surface=new THREE.Mesh(new THREE.PlaneGeometry(60*40,60*40/aspect),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,fog:false}));
      surface.name='generated-backdrop';surface.position.copy(W.camera.position).addScaledVector(direction,80*40);surface.quaternion.copy(W.camera.quaternion);W.scene.add(surface);
    }
    $('bdRemove').disabled=false;status('Placed in the rendered scene. Remove restores the previous sky or removes the surface.');
  };
  $('bdRemove').onclick=()=>{remove();status('Backdrop removed.');};
  window.CineriumBackdrop={remove,preview};
})();
