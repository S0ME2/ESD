import {afterEach,expect,it,vi} from 'vitest';
import {mcq,readMcqAttempt,saveMcqAttempt} from '../../src/course/mcq';
afterEach(()=>vi.unstubAllGlobals());
it('provides 33 MCQs with complete reasoning, all lessons and balanced answer positions',()=>{
 expect(mcq).toHaveLength(33);expect(new Set(mcq.map(q=>q.question)).size).toBe(33);
 expect([...new Set(mcq.map(q=>q.lesson))].sort((a,b)=>a-b)).toEqual(Array.from({length:20},(_,i)=>i));
 for(const q of mcq){expect(q.options).toHaveLength(3);expect(q.explanations).toHaveLength(3);expect(new Set(q.options).size).toBe(3);expect(q.correct).toBeGreaterThanOrEqual(0);expect(q.correct).toBeLessThan(3);for(const text of [q.question,...q.options,...q.explanations])expect(text.length).toBeGreaterThan(0);}
 expect([0,1,2].map(i=>mcq.filter(q=>q.correct===i).length)).toEqual([11,11,11]);
});
it('keeps correct numerical options and explanations together when mixing',()=>{
 for(const [needle,answer,reason] of [['48 MHz','20 ms','19999+1'],['16384 represents','8192','0.25'],['128 × 64 monochrome','1024 bytes','8192 bits'],['quantization step','0.806 mV','4096'],['8N1 UART byte','About 86.8 µs','10/115200']]){
  const q=mcq.find(q=>q.question.includes(needle))!;expect(q.options[q.correct]).toBe(answer);expect(q.explanations[q.correct]).toContain(reason);
 }
});
it('normalizes persisted attempts and rejects impossible submitted state',()=>{
 vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({answers:{0:1,1:3,2:'1',33:0},submitted:true})});
 expect(readMcqAttempt()).toEqual({answers:{0:1},submitted:false});
 vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({answers:Object.fromEntries(mcq.map((q,i)=>[i,q.correct])),submitted:true})});expect(readMcqAttempt().submitted).toBe(true);
});
it('handles unavailable or corrupt storage and isolates its key',()=>{
 vi.stubGlobal('localStorage',{getItem:()=>'{invalid'});expect(readMcqAttempt()).toEqual({answers:{},submitted:false});
 vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});expect(readMcqAttempt().answers).toEqual({});expect(()=>saveMcqAttempt({answers:{},submitted:false})).not.toThrow();
 const setItem=vi.fn();vi.stubGlobal('localStorage',{setItem});saveMcqAttempt({answers:{},submitted:false});expect(setItem).toHaveBeenCalledExactlyOnceWith('soc3050-mcq-v1','{"answers":{},"submitted":false}');
});
