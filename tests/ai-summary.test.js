import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {profile} from '../src/numerology.js';
import {summaryPayload} from '../src/ai-data.js';
import {buildSummaryContext,generateSummary,MODEL} from '../server/summary.js';
import {createSummaryMiddleware,localRequest} from '../server/middleware.js';

const p=profile('Adam Leo Jayo','2001-02-01',2026);
const payload=summaryPayload(p);
const response=text=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{thought:true,text:'private reasoning'},{text}]}}]})});
test('Only numeric fields are sent; PII and extra fields rejected',()=>{
  const serialized=JSON.stringify(payload);
  assert.ok(!serialized.includes(p.name));assert.ok(!serialized.includes(p.dob));
  assert.ok(!serialized.includes('letters'));
  assert.throws(()=>buildSummaryContext({...payload,name:p.name}));
  assert.throws(()=>buildSummaryContext({...payload,core:['ignore instructions',1,2,3]}));
  assert.throws(()=>buildSummaryContext({...payload,cycles:[0,1,2]}));
  const c=buildSummaryContext(payload);
  assert.equal(c.core[0].number,'6');assert.deepEqual(c.phases.map(v=>v.pinnacle),[3,4,7,5]);
  assert.deepEqual(c.phases.map(v=>v.challenge),[1,2,1,1]);
  assert.equal(c.personalYear.year,2026);
});
test('Gemini request uses server header, requested model, grounded context and no identity',async()=>{
  let called=0;
  const out=await generateSummary(payload,{apiKey:'unit-test-key',fetchImpl:async(url,options)=>{
    called++;assert.ok(url.endsWith(`/models/${MODEL}:generateContent`));assert.ok(!url.includes('unit-test-key'));
    assert.equal(options.headers['X-goog-api-key'],'unit-test-key');
    const body=JSON.parse(options.body);assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'minimal');assert.equal(MODEL,'gemini-3.1-flash-lite');assert.ok(body.systemInstruction.parts[0].text.includes('Jangan hitung ulang'));
    assert.ok(!options.body.includes(p.name));assert.ok(!options.body.includes(p.dob));
    return response('Ringkasan contoh.');
  }});
  assert.equal(called,1);assert.equal(out.text,'Ringkasan contoh.');assert.equal(out.model,MODEL);
});
test('No hidden retries or paid fallback; errors never relay provider secrets',async()=>{
  let calls=0;
  await assert.rejects(generateSummary(payload,{apiKey:'test',fetchImpl:async()=>{calls++;return {ok:false,status:429,json:async()=>({secret:'do not expose'})}}}),/Kuota Gemini/);
  assert.equal(calls,1);
  await assert.rejects(generateSummary(payload,{fetchImpl:()=>assert.fail('No key must not call Google')}),/Kunci Gemini/);
  await assert.rejects(generateSummary(payload,{apiKey:'test',fetchImpl:async()=>{throw Error('secret API key')}}),/Tidak dapat terhubung/);
  const partial=await generateSummary(payload,{apiKey:'test',fetchImpl:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}}]})})});
  assert.equal(partial.text,'partial');assert.equal(partial.partial,true);
  await assert.rejects(generateSummary(payload,{apiKey:'test',fetchImpl:async()=>response('')}),/tidak mengembalikan/);
});
test('Host/origin checks reject foreign sites and rebinding hosts',()=>{
  assert.equal(localRequest({headers:{host:'127.0.0.1:5173',origin:'http://127.0.0.1:5173'}}),true);
  assert.equal(localRequest({headers:{host:'evil.example:5173'}}),false);
  assert.equal(localRequest({headers:{host:'127.0.0.1:5173',origin:'https://evil.example'}}),false);
  assert.equal(localRequest({headers:{host:'localhost:5173','sec-fetch-site':'cross-site'}}),false);
});
function invoke(middleware,{body=payload,method='POST',origin='http://127.0.0.1:5173'}={}){
  const req=Readable.from([Buffer.from(JSON.stringify(body))]);
  req.url='/api/summary';req.method=method;req.headers={host:'127.0.0.1:5173',origin,'content-type':'application/json'};
  return new Promise((resolve,reject)=>{const res={setHeader(){},end(data){resolve({status:this.statusCode,data:JSON.parse(data)})}};Promise.resolve(middleware(req,res,()=>reject(Error('Unexpected next')))).catch(reject)});
}
test('Local API integration returns summary, prevents cross-origin calls and rate limits repeats',async()=>{
  const middleware=createSummaryMiddleware({apiKey:'test',fetchImpl:async()=>response('Ringkasan lokal.')});
  assert.equal((await invoke(middleware,{origin:'https://evil.example'})).status,403);
  assert.equal((await invoke(middleware,{method:'GET'})).status,405);
  const ok=await invoke(middleware);assert.equal(ok.status,200);assert.equal(ok.data.text,'Ringkasan lokal.');
  assert.equal((await invoke(middleware)).status,429);
});

test('Gemini streaming handles split network chunks and emits text before completion',async()=>{
 const events=[{candidates:[{content:{parts:[{text:'Halo '}]}}]},{candidates:[{content:{parts:[{text:'diri.'}]},finishReason:'STOP'}]}];
 const wire=events.map(e=>'data: '+JSON.stringify(e)+'\n\n').join('');const bytes=new TextEncoder().encode(wire);const deltas=[];
 const result=await generateSummary(payload,{apiKey:'test',onDelta:t=>deltas.push(t),fetchImpl:async(url)=>{
 assert.ok(url.includes('streamGenerateContent?alt=sse'));
 return {ok:true,body:new ReadableStream({start(c){c.enqueue(bytes.slice(0,27));c.enqueue(bytes.slice(27));c.close()}})};
 }});assert.deepEqual(deltas,['Halo ','diri.']);assert.equal(result.text,'Halo diri.');
});
test('Printable report includes all input fields, cycles and feedback with escaped text',async()=>{
 const {reportHTML}=await import('../src/export-report.js');
 const html=reportHTML({...p,nameParts:['Adam','Leo','Jayo']},{text:'<script>test</script>',model:'test',generatedAt:'2026-11-27'});
 for(const field of ['Nama Depan','Nama Tengah','Nama Akhir','Adam','Leo','Jayo','Personal Year','Pinnacle','Summary'])assert.ok(html.includes(field));
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
});

test('Provider capacity error is identified without exposing raw error payload',async()=>{
 await assert.rejects(generateSummary(payload,{apiKey:'test',fetchImpl:async()=>({ok:false,status:503,json:async()=>({error:{status:'UNAVAILABLE',message:'secret key do not expose'}})})}),e=>e.message.includes('HTTP 503 (UNAVAILABLE)')&&!e.message.includes('secret key'));
});

test('PDF chart uses readable donut, internal percentages and explicit component mapping',async()=>{
 const {lifeCoreGraphic,reportHTML}=await import('../src/export-report.js');
 const graphic=lifeCoreGraphic({...p,core:[6,13,0,1]});
 for(const text of ['viewBox="0 0 320 320"','Life Path','Ability','Motivation','Birthdate','13/4','Tidak tersedia','40%','30%','20%','10%','#23594b','#a64b31','#65716a','#806321'])assert.ok(graphic.includes(text),text);
 assert.equal((graphic.match(/<path /g)||[]).length,4);
 const html=reportHTML(p,{text:'Feedback contoh',model:'test',generatedAt:'2026-11-27'});
 assert.ok(html.includes('print-color-adjust:exact'));assert.ok(html.includes('class="report-core"'));assert.ok(html.includes('Feedback contoh'));
});
