import React,{useId,useState} from 'react';
import {base} from './numerology.js';
import './life-core-chart.css';

// Stable colors identify components, independently of their numeric value.
const colors=['#23594b','#a64b31','#355f99','#806321'];
const descriptions=['Kesempatan dan arah hidup','Kemampuan dan talenta','Motivasi dan kebutuhan batin','Kesempatan kedua'];
const point=(r,a)=>[160+r*Math.cos(a*Math.PI/180),160+r*Math.sin(a*Math.PI/180)];
function sector(start,end){
 const [a,b]=[point(128,start),point(128,end)], [c,d]=[point(83,end),point(83,start)];
 const large=end-start>180?1:0;
 return `M${a} A128 128 0 ${large} 1 ${b} L${c} A83 83 0 ${large} 0 ${d} Z`;
}
export default function LifeCoreChart({items}){
 const [mode,setMode]=useState('components'),[selected,setSelected]=useState(null);
 const titleId=useId(),detailId=useId();
 const components=items.map((v,i)=>({...v,color:v.value==='—'?'#65716a':colors[i],description:descriptions[i],members:[`${v.label} ${v.weight}%`]}));
 const groups=[];
 components.forEach(v=>{
   const number=v.value==='—'?null:base(Number(String(v.value).split('/')[0]));
   const key=number===null?'unavailable':String(number);
   let g=groups.find(g=>g.key===key);
   if(!g){g={key,label:number===null?'Tidak tersedia':`Angka ${number}`,value:number===null?'—':String(number),weight:0,color:v.color,members:[],description:'Gabungan bobot komponen dengan angka dasar yang sama'};groups.push(g);}
   g.weight+=v.weight;g.members.push(...v.members);
 });
 const data=mode==='components'?components:groups;
 let angle=-90;
 const slices=data.map((v,i)=>{const start=angle;angle+=v.weight*3.6;return {...v,index:i,start,end:angle};});
 const active=selected===null?null:slices[selected];
 const total=items.reduce((s,v)=>s+v.weight,0);
 return <div className="lc-chart">
   <div className="lc-toolbar"><span id={titleId}>Peta komposisi</span><div className="lc-switch" role="group" aria-label="Tampilan komposisi">{[['components','Komponen'],['numbers','Angka serumpun']].map(([key,label])=><button type="button" key={key} aria-pressed={mode===key} onClick={()=>{setMode(key);setSelected(null)}}>{label}</button>)}</div></div>
   <div className="lc-layout">
     <div className="lc-visual">
       <svg viewBox="0 0 320 320" aria-labelledby={titleId} className="lc-svg">
         <title>Komposisi Life Core: pilih irisan untuk melihat rinciannya</title>
         {slices.map(v=>{
           const midpoint=(v.start+v.end)/2, xy=point(105,midpoint);
           // Split a full circle to avoid coincident SVG arc endpoints.
           const path=v.end-v.start>=359.99?sector(v.start,v.start+180)+' '+sector(v.start+180,v.end):sector(v.start,v.end);
           return <g key={v.index} className={active&&selected!==v.index?'lc-muted':''}>
             <path d={path} fill={v.color} stroke="#fafbf6" strokeWidth="4" role="button" tabIndex="0" aria-pressed={selected===v.index} aria-describedby={detailId} aria-label={`${v.label}, angka ${v.value}, bobot ${v.weight} persen`} onClick={()=>setSelected(v.index)} onFocus={()=>setSelected(v.index)} onMouseEnter={()=>setSelected(v.index)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(v.index)}if(e.key==='Escape')setSelected(null)}}/>
             <text x={xy[0]} y={xy[1]+4} textAnchor="middle" className="lc-slice-label" aria-hidden="true">{v.weight}%</text>
           </g>;
         })}
         <g aria-hidden="true" className="lc-center"><text x="160" y="137">{active?active.label:'LIFE CORE'}</text><text x="160" y="179" className="lc-center-number">{active?active.value:`${total}%`}</text><text x="160" y="202">{active?`${active.weight}% bobot`:'Komposisi keseluruhan'}</text></g>
       </svg>
       <p className="lc-hint">Sentuh irisan atau pilih komponen di samping.</p>
     </div>
     <div className="lc-legend" aria-label="Rincian komposisi">{slices.map(v=><button type="button" key={v.index} className={selected===v.index?'is-selected':''} aria-pressed={selected===v.index} onClick={()=>setSelected(v.index)} onFocus={()=>setSelected(v.index)} onMouseEnter={()=>setSelected(v.index)}><span className="lc-swatch" style={{background:v.color}}/><span className="lc-legend-copy"><strong>{v.label}</strong><span>{mode==='components'?v.description:v.members.join(' + ')}</span></span><span className="lc-legend-value"><b>{v.value}</b><small>{v.weight}% bobot</small></span></button>)}</div>
   </div>
   <div className="lc-detail" id={detailId} aria-live="polite">{active?<><span className="lc-detail-label">{active.label} · {active.weight}%</span><p>{active.value==='—'?'Komponen ini belum menghasilkan angka. Bobotnya tetap ditandai, tanpa dialihkan ke komponen lain.':mode==='components'?`Angka ${active.value} mewakili ${active.description.toLowerCase()}. Porsinya ${active.weight}% dari empat komponen Life Core.`:`Angka dasar ${active.value} menggabungkan ${active.members.join(' + ')}. Total bobotnya ${active.weight}%.`}</p></>:<><span className="lc-detail-label">Empat komponen, satu komposisi</span><p>Angka besar adalah hasil perhitungan. Persentase menunjukkan bobotnya. Pilih “Angka serumpun” untuk melihat angka yang sama digabungkan.</p></>}</div>
   {active&&<button type="button" className="lc-reset" onClick={()=>setSelected(null)}>Tampilkan keseluruhan</button>}
 </div>;
}
