import test from 'node:test';
import assert from 'node:assert/strict';
import {profile,nameNumber,display,harmony,compare,base} from '../src/numerology.js';
test('Booklet Life Path cases and first-generation Master rule',()=>{
 for(const [dob,n] of [['2001-02-01',6],['2000-04-03',9],['1950-04-17',9],['2007-10-01',11],['1998-04-20',6],['1971-01-22',5],['2011-11-01',16],['1984-03-16',5],['1999-05-06',3]])assert.equal(profile('Adam Leo Jayo',dob).core[0],n,dob);
 assert.equal(profile('Test','1993-06-29').core[3],2);
 assert.equal(profile('Test','1990-12-14').core[3],14);
});
test('Booklet name examples, segmented reduction and vowels',()=>{
 for(const [name,n] of [['Adam Leo Jayo',3],['Joko Widodo',13],['Jelita Sempurna',11],['Ayu Damai',3]])assert.equal(nameNumber(name),n,name);
 assert.equal(nameNumber('Adam Leo Endi','vowels'),9);
 assert.equal(nameNumber('Adam Leo Jayo','consonants'),19);
 assert.equal(display(19),'19/1');
});
test('Cycles, Personal Year and symbolic phase formulas',()=>{
 const p=profile('Reinhard','2001-02-01',2021);
 assert.deepEqual(p.cycles,[2,1,3]);assert.equal(p.end,30);
 assert.deepEqual(p.pinnacles,[3,4,7,5]);assert.deepEqual(p.challenges,[1,2,1,1]);
 assert.equal(p.personalYear,8);assert.equal(profile('Reinhard','2001-02-01',2023).personalYear,1);
});
test('Harmony matrix, weights and matching base family',()=>{
 assert.equal(harmony.length,9);for(let i=0;i<9;i++){assert.equal(harmony[i][i],25);for(let j=0;j<9;j++)assert.equal(harmony[i][j],harmony[j][i]);}
 assert.equal(harmony[0][2],100);assert.equal(harmony[3][4],50);
 const p=profile('Adam Leo Jayo','2001-02-01');assert.equal(p.distribution.reduce((s,n)=>s+n.weight,0),100);
 assert.ok(compare(p,p).every(r=>r.score===25));
 for(const i of p.indicators)assert.equal(i.positive,p.core.map(base).includes(base(i.number)));
});
test('Validation rejects invalid inputs and handles absent vowels',()=>{
 for(const dob of ['2025-02-29','2001-13-01','2099-01-01',''])assert.throws(()=>profile('Adam',dob));
 assert.throws(()=>profile('123','2001-01-01'));assert.throws(()=>profile('Adam','2001-01-01',0));
 const p=profile('Rhythm','2001-01-01');assert.equal(p.core[2],0);assert.equal(p.indicators[0].positive,p.basic.includes(base(p.indicators[0].number)));
});
