export const masters = [11,22,33];
export const karmics = [13,14,16,19];
export const sum = ns => ns.reduce((a,b)=>a+b,0);
export const digits = n => sum(String(n).split('').map(Number));
export function base(n){while(n>9)n=digits(n);return n;}
// Only a directly obtained special number is retained; later reductions are basic.
export const intermediate = n => masters.includes(n)?n:base(n);
export const finish = n => [...masters,...karmics].includes(n)?n:base(n);
export const display = n => n>9?`${n}/${base(n)}`:String(n);
export const letterValue = c => (c.charCodeAt(0)-65)%9+1;
export function words(name){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().match(/[A-Z]+/g)||[];}
export function nameNumber(name, mode='all'){
  const parts=words(name).map(w=>{const letters=[...w].filter(c=>mode==='all'||(mode==='vowels'?/[AEIOU]/.test(c):!/[AEIOU]/.test(c)));return intermediate(sum(letters.map(letterValue)));});
  return finish(sum(parts));
}
export const harmony = [
 [25,50,100,100,75,50,100,100,50], [50,25,75,75,50,100,50,75,100],
 [100,75,25,50,100,100,50,75,100], [100,75,50,25,50,75,100,50,50],
 [75,50,100,50,25,50,75,100,75], [50,100,100,75,50,25,50,50,100],
 [100,50,50,100,75,50,25,50,75], [100,75,75,50,100,50,50,25,75],
 [50,100,100,50,75,100,75,75,25]
];
export const coreLabels=['Life Path','Ability','Motivation','Birthdate'];
export const weights=[40,30,20,10];
export const todayISO = () => {const t=new Date();return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;};
export function profile(name,dob,year=new Date().getFullYear()){
 const normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(!words(name).length||/[^a-z\s.'’\-]/i.test(normalized))throw Error('Gunakan nama dengan huruf Latin, spasi, apostrof, atau tanda hubung.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw Error('Lengkapi tanggal lahir.');
 const [y,m,d]=dob.split('-').map(Number),dt=new Date(`${dob}T12:00:00`);
 if(!Number.isFinite(dt.getTime())||dt.getFullYear()!==y||dt.getMonth()+1!==m||dt.getDate()!==d||y<1000||dob>todayISO())throw Error('Masukkan tanggal lahir yang valid dan tidak melewati hari ini.');
 if(!Number.isInteger(+year)||year<1000||year>9999)throw Error('Tahun analisis harus antara 1000 dan 9999.');
 const md=intermediate(m),dd=intermediate(d),yd=intermediate(digits(y));
 const core=[finish(md+dd+yd),nameNumber(name),nameNumber(name,'vowels'),finish(d)];
 const basic=core.map(base),distribution=Array.from({length:9},(_,i)=>({number:i+1,weight:sum(basic.map((n,j)=>n===i+1?weights[j]:0)),count:basic.filter(n=>n===i+1).length})).sort((a,b)=>b.weight-a.weight||a.number-b.number);
 const present=new Set(words(name).join('').split('').map(letterValue));
 const indicators=[['Personality',nameNumber(name,'consonants'),'Jumlah konsonan per kata'],['Attitude',finish(md+dd),'Tanggal + bulan lahir'],['Growth',nameNumber(words(name)[0]),'Jumlah huruf nama depan'],['Maturity',finish(core[0]+core[1]),'Life Path + Ability']].map(([label,number,formula])=>({label,number,formula,positive:number!==0&&basic.includes(base(number))}));
 const missing=Array.from({length:9},(_,i)=>i+1).filter(n=>!present.has(n)).map(number=>({number,moderate:basic.includes(number)}));
 const cycles=[base(m),base(d),base(y)],end=36-basic[0];
 const [a,b,c]=cycles,p1=base(a+b),p2=base(b+c),c1=Math.abs(a-b),c2=Math.abs(b-c);
 const pinnacles=[p1,p2,base(p1+p2),base(a+c)],challenges=[c1,c2,Math.abs(c1-c2),Math.abs(a-c)];
 return {name,dob,core,basic,distribution,indicators,missing,present:[...present].sort(),cycles,end,pinnacles,challenges,year:+year,personalYear:base(base(d)+base(m)+base(+year)),letters:words(name).map(w=>({word:w,values:[...w].map(letterValue)})),specialStrong:[...masters,...karmics].filter(n=>core.filter(v=>v===n).length>1)};
}
export function compare(a,b){return a.basic.map((n,i)=>({label:coreLabels[i],a:a.core[i],b:b.core[i],score:n&&b.basic[i]?harmony[n-1][b.basic[i]-1]:null,same:n!==0&&n===b.basic[i]}));}
