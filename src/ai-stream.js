const jobs=new Map();
export function summaryJob(payload,retry=false){
 const key=JSON.stringify(payload);if(jobs.has(key)&&(!retry||jobs.get(key).state.loading))return jobs.get(key);
 const listeners=new Set();let state={text:'',loading:true,error:'',result:null};
 const update=patch=>{state={...state,...patch};listeners.forEach(fn=>fn(state))};
 const job={subscribe(fn){listeners.add(fn);fn(state);return()=>listeners.delete(fn)},get state(){return state}};jobs.set(key,job);
 if(jobs.size>10)for(const [k,v] of jobs)if(!v.state.loading&&k!==key){jobs.delete(k);break;}
 (async()=>{try{
 const response=await fetch('/api/summary',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/x-ndjson'},body:JSON.stringify(payload)});
 if(!response.ok){const data=await response.json();throw Error(data.error||'Ringkasan belum tersedia.');}
 if(!response.headers.get('content-type')?.includes('application/x-ndjson'))throw Error('Backend AI belum diperbarui. Mulai ulang npm run dev.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',complete=false;
 function line(raw){if(!raw.trim())return;const event=JSON.parse(raw);if(event.type==='delta')update({text:state.text+event.text});if(event.type==='error')throw Error(event.error);if(event.type==='done'){complete=true;update({result:event,text:event.text})}}
 try{while(true){const {done,value}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});const lines=buffer.split('\n');buffer=lines.pop();for(const raw of lines)line(raw);if(done){if(buffer.trim())line(buffer);break;}}}finally{reader.releaseLock()}
 if(!complete)throw Error('Koneksi terputus sebelum ringkasan selesai.');
 }catch(e){update({error:e.message})}finally{update({loading:false})}})();return job;
}
