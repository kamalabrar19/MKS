import React,{useEffect,useState} from 'react';
import {summaryPayload} from './ai-data.js';
import {summaryJob} from './ai-stream.js';
import {exportReport} from './export-report.js';
export default function AiSummary({profile}){
 const payload=summaryPayload(profile),key=JSON.stringify(payload);
 const [attempt,setAttempt]=useState(0),[state,setState]=useState({loading:true,text:'',result:null,error:''});
 useEffect(()=>summaryJob(payload).subscribe(setState),[key,attempt]);
 return <section className="panel ai-panel" aria-busy={state.loading}>
 <div className="section-heading"><span className="eyebrow">Summary dalam diri kamu</span><h2>Memahami cerita di balik angkamu.</h2></div>
 <p className="note">Summary untuk mengenal dirimu lebih dalam lagi!</p>
 <p className="ai-status" role="status"><span className={state.loading?'pulse-dot':''}/>{state.loading?(state.text?'Sedang menulis penjelasan…':'Angka siap. Menghubungkan ke Gemini…'):state.error?'Ringkasan belum selesai':'Ringkasan selesai'}</p>
 {state.text&&<div className="ai-result"><div className="ai-text">{state.text}</div></div>}
 {state.error&&<p role="alert" className="error ai-error">{state.error}</p>}
 {state.result?.partial&&<p className="note">Keluaran terpotong. Buat ulang untuk ringkasan lengkap sebelum export.</p>}
 <div className="ai-actions">{!state.loading&&<button className="text-btn" onClick={()=>{summaryJob(payload,true);setAttempt(n=>n+1)}}>Buat ulang ringkasan</button>}{state.result&&!state.result.partial&&!state.loading&&!state.error&&<button className="primary" onClick={()=>exportReport(profile,state.result)}>Export PDF ↓</button>}</div>
 {state.result&&!state.result.partial&&<p className="note">Pada dialog cetak, pilih Simpan sebagai PDF.</p>}
 </section>;
}
