import {generateSummary,SummaryError,buildSummaryContext} from './summary.js';

export function localRequest(req){
  const host=req.headers.host||'';
  if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host))return false;
  if(req.headers.origin&&req.headers.origin!==`http://${host}`)return false;
  if(req.headers['sec-fetch-site']==='cross-site')return false;
  return true;
}
export function createSummaryMiddleware({apiKey,fetchImpl}={}){
  let busy=false,lastStarted=0;
  return async (req,res,next)=>{
    if(req.url?.split('?')[0]!=='/api/summary')return next();
    res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
    const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
    if(!localRequest(req))return send(403,{error:'Endpoint hanya menerima permintaan dari aplikasi lokal ini.'});
    if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'Gunakan POST.'});}
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return send(415,{error:'Gunakan data JSON.'});
    if(busy||Date.now()-lastStarted<10000)return send(429,{error:'Tunggu beberapa detik sebelum membuat ringkasan berikutnya.'});
    let raw='',size=0;
    try{
      for await(const chunk of req){size+=chunk.length;if(size>8192)throw new SummaryError('Data terlalu besar.',413);raw+=chunk;}
      let input;try{input=JSON.parse(raw)}catch{throw new SummaryError('Data JSON tidak valid.');}
      // Recheck after awaiting the request body so simultaneous requests cannot race.
      if(busy||Date.now()-lastStarted<10000)return send(429,{error:'Permintaan lain sedang diproses. Tunggu sebentar.'});
      busy=true;lastStarted=Date.now();
      try{
        if(req.headers.accept==='application/x-ndjson'){
          // Validate before committing streaming headers.
          buildSummaryContext(input);
          if(!apiKey)throw new SummaryError('Kunci Gemini belum diatur di .env.local.',503);
          res.setHeader('Content-Type','application/x-ndjson; charset=utf-8');
          res.setHeader('X-Content-Type-Options','nosniff');res.flushHeaders?.();
          const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),180000);
          const close=()=>{if(!res.writableEnded)abort.abort()};res.on?.('close',close);
          const emit=event=>{if(!res.destroyed)res.write(JSON.stringify(event)+'\n')};
          try{const result=await generateSummary(input,{apiKey,fetchImpl,signal:abort.signal,onDelta:text=>emit({type:'delta',text})});emit({type:'done',...result});}
          catch(e){emit({type:'error',error:e instanceof SummaryError?e.message:'Ringkasan terputus. Coba lagi.'});}
          finally{clearTimeout(timer);res.off?.('close',close);res.end();}
        }else send(200,await generateSummary(input,{apiKey,fetchImpl}));
      }finally{busy=false;}
    }catch(e){send(e instanceof SummaryError?e.status:500,{error:e instanceof SummaryError?e.message:'Ringkasan belum dapat diproses. Coba lagi nanti.'});}
  };
}
