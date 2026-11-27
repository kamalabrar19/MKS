import {readFile} from 'node:fs/promises';
import {base,display,weights,coreLabels,masters,karmics} from '../src/numerology.js';
import {meanings,yearTitles,yearPrompts} from '../src/content.js';

export const MODEL='gemini-3.1-flash-lite';
export class SummaryError extends Error {
  constructor(message,status=400){super(message);this.status=status;}
}
const validNumbers=new Set([0,1,2,3,4,5,6,7,8,9,...masters,...karmics]);
function numbers(value,length,max=33){
  if(!Array.isArray(value)||(length!==null&&value.length!==length)||value.length>9||value.some(n=>!Number.isInteger(n)||n<0||n>max||!validNumbers.has(n)))throw new SummaryError('Data angka tidak valid. Hitung ulang profil terlebih dahulu.');
  return [...value];
}
export function buildSummaryContext(input){
  if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['core','indicators','present','cycles','year','personalYear'].includes(k)))throw new SummaryError('Hanya hasil angka tanpa identitas yang dapat diringkas.');
  const core=numbers(input.core,4),indicators=numbers(input.indicators,4),present=numbers(input.present,null,9),cycles=numbers(input.cycles,3,9);
  if(core.some((n,i)=>n===0&&i!==2)||cycles.includes(0)||present.includes(0)||!present.length||new Set(present).size!==present.length||!Number.isInteger(input.year)||input.year<1000||input.year>9999||!Number.isInteger(input.personalYear)||input.personalYear<1||input.personalYear>9)throw new SummaryError('Data profil belum lengkap. Hitung ulang profil terlebih dahulu.');
  const roots=core.map(base),end=36-roots[0];
  const composition=Array.from({length:9},(_,i)=>({number:i+1,weight:roots.reduce((s,n,j)=>s+(n===i+1?weights[j]:0),0),count:roots.filter(n=>n===i+1).length})).filter(i=>i.weight).sort((a,b)=>b.weight-a.weight||a.number-b.number);
  const [a,b,c]=cycles,p1=base(a+b),p2=base(b+c),c1=Math.abs(a-b),c2=Math.abs(b-c);
  const pn=[p1,p2,base(p1+p2),base(a+c)],cn=[c1,c2,Math.abs(c1-c2),Math.abs(a-c)];
  return {
    source:'Ringkasan metode Workshop Numerology Pythagoras, Rudy Gunawan, booklet 101 halaman. Bukan teks lengkap PDF.',
    core:core.map((n,i)=>({label:coreLabels[i],number:n?display(n):null,weight:weights[i],theme:n?meanings[base(n)].words:null})),
    composition,dominant:composition.filter(v=>v.weight===composition[0].weight).map(v=>v.number),
    strong:composition.filter(v=>v.count>1).map(v=>({...v,balance:v.number===9?[1,8,9]:[base(v.number*2)]})),
    repeatedSpecial:[...masters,...karmics].filter(n=>core.filter(v=>v===n).length>1).map(display),
    indicators:indicators.map((n,i)=>({label:['Personality','Attitude','Growth','Maturity'][i],number:n?display(n):null,positive:n!==0&&roots.includes(base(n))})),
    karmicLessons:Array.from({length:9},(_,i)=>i+1).filter(n=>!present.includes(n)).map(n=>({number:n,type:roots.includes(n)?'Moderat':'Ganas'})),
    cycles:cycles.map((n,i)=>({label:['Dini','Kedewasaan','Pemenuhan'][i],number:n,ages:i===0?`0–${end}`:i===1?`${end+1}–${end+28}`:`${end+29}+`})),
    phases:pn.map((n,i)=>({phase:i+1,pinnacle:n,pinnacleAges:`${end+1+i*9}–${end+9+i*9}`,challenge:cn[i],challengeAges:i===3?`${end+27}+`:`${end+i*9}–${end+8+i*9}`})),
    personalYear:{year:input.year,number:input.personalYear,theme:yearTitles[input.personalYear],prompt:yearPrompts[input.personalYear]},
    vocation:core.slice(0,3).map((n,i)=>({label:coreLabels[i],ideas:n?meanings[base(n)].jobs:[]})),
    methodNotes:[
      'Bobot Life Core 40/30/20/10 bukan ukuran akurasi. Kelompokkan angka serumpun. Jika ada bobot tertinggi sama, jelaskan seluruh angka yang seri.',
      'Master 11/2: komunikasi; 22/4: membangun dan perencanaan; 33/6: mengajar, inspirasi dan kepedulian.',
      'Karmic 19/1: refleksi ego dan kemandirian; 13/4: keteraturan; 14/5: pengendalian impuls; 16/7: pembawaan diri dan hubungan. Jangan melabeli seseorang buruk atau berbahaya.',
      'Strong: angka dasar muncul setidaknya dua kali. Pengulangan Master/Karmic identik menggantikan tafsir angka khusus tunggal, bukan menggandakannya.',
      'Personality: interaksi dan kesan; Attitude: penyaluran potensi; Growth: belajar dari pengalaman; Maturity: tema kehidupan lanjut. (+) berarti rumpun hadir pada Life Core, bukan baik secara moral.',
      'Karmic Lesson adalah nilai huruf yang tidak ada. Moderat jika rumpun hadir di Life Core; Ganas jika tidak hadir. Ini istilah booklet, bukan risiko nyata.',
      'Periode Life Cycle memakai tabel halaman cetak 76. Pinnacle memakai tabel 80–81, Challenge tabel 86–87. Keduanya berbeda satu tahun. Jangan mengubah rentang data.',
      'Contoh tertulis PDF tidak selalu konsisten. Rumus simbolik diprioritaskan: Pinnacle 4 = bulan + tahun dasar; Challenge 3 = selisih Challenge 1 dan 2; Challenge 4 = selisih bulan dan tahun dasar.',
      'Motivation null berarti nama tidak mengandung vokal A/I/U/E/O. Jangan menafsirkan sebagai angka 0; bobot 20% tidak dialihkan.',
      'Profesi hanya pemantik eksplorasi. Personal Year berlaku 1 Januari–31 Desember; tidak memprediksi kejadian. Jangan mengarang halaman, kutipan, atau tafsir detail fase yang tidak disediakan.'
    ]
  };
}
export async function generateSummary(input,{apiKey,fetchImpl=fetch,onDelta,signal}={}){
  const full=buildSummaryContext(input);
  const {source,methodNotes,...data}=full;
  const context={...data,rules:'Bobot bukan akurasi. Angka serumpun digabung. Master 11=komunikasi,22=membangun,33=mengajar. Karmic 19=ego,13=keteraturan,14=impuls,16=hubungan. Strong khusus menggantikan tafsir tunggal. Indikator positif berarti rumpun hadir di Life Core. Karmic Lesson Moderat=hadir di Life Core; Ganas=tidak hadir. Gunakan usia dan angka yang diberikan tanpa mengubahnya.'};
  if(!apiKey)throw new SummaryError('Kunci Gemini belum diatur di .env.local. Isi GEMINI_API_KEY lalu jalankan ulang aplikasi.',503);
  let instruction;
  try{instruction=await readFile(new URL('../prompt_rules.txt',import.meta.url),'utf8');}
  catch{throw new SummaryError('File prompt_rules.txt tidak dapat dibaca. Periksa file pada folder proyek.',503);}
  if(!instruction.trim())throw new SummaryError('File prompt_rules.txt kosong. Isi panduan ringkasan terlebih dahulu.',503);
  let response;
  try{
    response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:${onDelta?'streamGenerateContent?alt=sse':'generateContent'}`,{
      method:'POST',headers:{'Content-Type':'application/json','X-goog-api-key':apiKey},
      body:JSON.stringify({systemInstruction:{parts:[{text:instruction}]},contents:[{role:'user',parts:[{text:JSON.stringify(context)}]}],generationConfig:{temperature:0.35,maxOutputTokens:768,thinkingConfig:{thinkingLevel:'minimal'}}}),
      signal:signal||AbortSignal.timeout(180000)
    });
  }catch(e){throw new SummaryError(e.name==='TimeoutError'?'Permintaan Gemini belum selesai dalam 3 menit. Respons dapat tertunda oleh jaringan atau layanan. Coba lagi nanti.':'Tidak dapat terhubung ke Gemini. Periksa koneksi internet atau pembatasan jaringan.',502);}
  if(!response.ok){
    const messages={400:'Permintaan ditolak Gemini. Periksa validitas kunci API dan akses model.',401:'Kunci Gemini tidak diterima. Periksa GEMINI_API_KEY di .env.local.',403:'Akses Gemini ditolak. Periksa izin, status kunci, dan proyek Google AI Studio.',404:'Model gemini-3.1-flash-lite tidak tersedia untuk proyek ini.',429:'Kuota Gemini habis atau batas permintaan tercapai. Tunggu lalu coba lagi; aplikasi tidak berpindah ke model berbayar.'};
    let upstream;try{upstream=await response.json()}catch{}
    const allowed=['UNAVAILABLE','INTERNAL','RESOURCE_EXHAUSTED','PERMISSION_DENIED','UNAUTHENTICATED','INVALID_ARGUMENT','NOT_FOUND','DEADLINE_EXCEEDED'];
    const code=allowed.includes(upstream?.error?.status)?upstream.error.status:'UNKNOWN';
    const specific={500:'Google mengalami error internal saat memproses ringkasan.',502:'Gateway Google gagal menerima respons model.',503:'Model Gemini sedang sibuk atau kapasitas layanan Google belum tersedia.',504:'Google melewati batas waktu pemrosesan model.'};
    const detail=messages[response.status]||specific[response.status]||'Google menolak permintaan dengan status yang belum dikenal.';
    // Expose only HTTP status and a known enum, never raw provider payloads or keys.
    console.warn(`[Gemini] HTTP ${response.status} ${code}; model=${MODEL}`);
    throw new SummaryError(`Gemini HTTP ${response.status} (${code}): ${detail}`,response.status===429?429:502);
  }
  if(onDelta){
    let text='',buffer='',finishReason;
    const reader=response.body.getReader(),decoder=new TextDecoder();
    function line(value){
      if(!value.startsWith('data:'))return;
      const raw=value.slice(5).trim();if(!raw||raw==='[DONE]')return;
      const event=JSON.parse(raw);if(event.error)throw new SummaryError('Gemini menghentikan aliran respons.',502);
      const candidate=event.candidates?.[0];if(candidate?.finishReason)finishReason=candidate.finishReason;
      const delta=candidate?.content?.parts?.filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('')||'';
      if(delta){text+=delta;onDelta(delta);}
    }
    try{while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value||new Uint8Array(),{stream:!done});const lines=buffer.split('\n');buffer=lines.pop();for(const value of lines)line(value.trim());if(done){if(buffer.trim())line(buffer.trim());break;}}}
    catch(e){throw new SummaryError('Aliran Gemini terputus. Teks yang sudah diterima tetap tersedia; silakan coba ulang.',502);}
    finally{reader.releaseLock();}
    if(!text.trim())throw new SummaryError('Gemini tidak mengembalikan teks ringkasan.',502);
    if(finishReason&&!['STOP','MAX_TOKENS'].includes(finishReason))throw new SummaryError('Gemini tidak menyelesaikan ringkasan.',502);
    return {text,partial:finishReason==='MAX_TOKENS',model:MODEL,generatedAt:new Date().toISOString()};
  }
  let result;try{result=await response.json()}catch(e){throw new SummaryError(e.name==='TimeoutError'?'Respons Gemini belum selesai diterima dalam 3 menit. Coba lagi nanti.':'Respons Gemini tidak dapat dibaca. Coba lagi nanti.',502)}
  const candidate=result.candidates?.[0];
  if(candidate?.finishReason&&!['STOP','MAX_TOKENS'].includes(candidate.finishReason))throw new SummaryError(candidate.finishReason==='MAX_TOKENS'?'Ringkasan Gemini terpotong. Coba buat ulang.':'Gemini tidak menyelesaikan ringkasan ini. Coba lagi nanti.',502);
  const text=candidate?.content?.parts?.filter(p=>!p.thought&&typeof p.text==='string').map(p=>p.text).join('\n').trim();
  if(!text)throw new SummaryError('Gemini tidak mengembalikan ringkasan. Coba lagi nanti.',502);
  return {text,partial:candidate.finishReason==='MAX_TOKENS',model:MODEL,generatedAt:new Date().toISOString()};
}
