import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
env.allowLocalModels=false;
env.backends.onnx.wasm.numThreads=1;
let recognizer=null;
self.onmessage=async({data})=>{
 const {id,type,audio}=data;
 try{
  if(!recognizer)recognizer=await pipeline('automatic-speech-recognition','Xenova/whisper-tiny.en',{device:'wasm',dtype:'q8',progress_callback:p=>self.postMessage({id,type:'progress',file:p.file,status:p.status,progress:p.progress})});
  if(type==='load'){self.postMessage({id,type:'ready'});return;}
  const result=await recognizer(audio,{chunk_length_s:30,stride_length_s:5,return_timestamps:false,max_new_tokens:128});
  self.postMessage({id,type:'result',text:result.text});
 }catch(e){self.postMessage({id,type:'error',message:e.message||String(e)});}
};
