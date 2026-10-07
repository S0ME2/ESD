import {describe,it,expect,vi,afterEach} from 'vitest';
import {eligibleQuestions,masteredLessons,recordPracticeMastery,loadPracticeBank,practiceResult,readPracticeSession,savePracticeSession,startPractice,type PracticeQuestion} from '../../src/course/practice';
const bank:PracticeQuestion[]=Array.from({length:6},(_,i)=>({id:`q${i}`,lesson:i%2,topic:`topic-${i%3}`,topicTitle:'A topic',question:`Question ${i}`,options:['Right','Mistake','Another mistake'],correct:0,explanations:['Reason for the right answer','Reason for the mistake','Reason for the other mistake']}));
const config={lessons:[0,1],topics:[],count:3};
afterEach(()=>vi.unstubAllGlobals());
describe('Random practice',()=>{
 it('filters both lessons and topics',()=>{expect(eligibleQuestions(bank,{lessons:[0],topics:['topic-0'],count:33}).map(q=>q.id)).toEqual(['q0']);});
 it('samples without replacement and caps a large request to the available pool',()=>{
  const session=startPractice(bank,{...config,count:99},()=>.3);
  expect(session.questions).toHaveLength(6);expect(new Set(session.questions.map(q=>q.id)).size).toBe(6);
  for(const q of session.questions)expect([...q.order].sort()).toEqual([0,1,2]);
 });
 it('changes question and option ordering across random draws',()=>{expect(startPractice(bank,config,()=>0).questions).not.toEqual(startPractice(bank,config,()=>.99).questions);});
 it('does not repeat a prompt reused by another lesson',()=>{
  const repeated=[...bank,{...bank[0],id:'copy',lesson:1}];
  expect(eligibleQuestions(repeated,config)).toHaveLength(6);
  const session=startPractice(repeated,{...config,count:99},()=>.2);
  expect(session.questions).toHaveLength(6);
  const selected=session.questions.map(q=>repeated.find(v=>v.id===q.id)!.question);
  expect(new Set(selected).size).toBe(6);
 });
 it('counts correct, wrong and skipped independently when finishing early',()=>{
  const session=startPractice(bank,config,()=>.5);session.answers[session.questions[0].id]=0;session.answers[session.questions[1].id]=1;
  expect(practiceResult(bank,session)).toEqual({correct:1,answered:2,total:3,unanswered:1,incorrect:1});
 });
 it('restores the same shuffled run, configuration and valid answers',()=>{
  const session=startPractice(bank,config,()=>.5);session.position=1;session.answers[session.questions[0].id]=0;
  vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(session)});expect(readPracticeSession(bank)).toEqual(session);
 });
 it('rejects duplicated question IDs, malformed ordering, missing bank IDs and invalid JSON',()=>{
  const good=startPractice(bank,config,()=>.5);
  for(const value of ['{broken',JSON.stringify({...good,questions:[good.questions[0],good.questions[0]]}),JSON.stringify({...good,questions:[{id:'q0',order:[0,0,2]}]}),JSON.stringify({...good,questions:[{id:'unknown',order:[0,1,2]}]}),JSON.stringify({...good,config:{...config,topics:['unknown']}})]){
   vi.stubGlobal('localStorage',{getItem:()=>value});expect(readPracticeSession(bank)).toBeNull();
  }
 });
 it('continues when storage is unavailable',()=>{vi.stubGlobal('localStorage',{getItem:()=>{throw Error();},setItem:()=>{throw Error();},removeItem:()=>{throw Error();}});expect(readPracticeSession(bank)).toBeNull();expect(()=>savePracticeSession(startPractice(bank,config))).not.toThrow();});
 it('loads every migrated question and original practice entry',async()=>{
  const full=await loadPracticeBank();expect(full).toHaveLength(585);expect(new Set(full.map(q=>q.id)).size).toBe(585);
  for(const q of full){expect(q.options.length).toBeGreaterThanOrEqual(3);expect(q.explanations).toHaveLength(q.options.length);expect(q.correct).toBeLessThan(q.options.length);}
  for(const [lo,hi] of [[0,6],[7,12],[13,19]]){const chapter=full.filter(q=>q.id.startsWith('note-')&&q.lesson>=lo&&q.lesson<=hi);const longest=chapter.filter(q=>q.options[q.correct].length>Math.max(...q.options.filter((_,i)=>i!==q.correct).map(o=>o.length)));expect(longest.length/chapter.length).toBeLessThan(.9);}
 });
});

describe('Lesson mastery',()=>{
 function storage(){const values=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>values.set(key,value)});return values;}
 it('requires every lesson prompt correct and accumulates finished partial runs',()=>{
  storage();const first=startPractice(bank,{lessons:[0],topics:[],count:1},()=>.5);first.finished=true;first.answers[first.questions[0].id]=0;
  expect(recordPracticeMastery(bank,first)).toEqual([]);
  const all=startPractice(bank,{lessons:[0],topics:[],count:99},()=>.5);all.finished=true;for(const q of all.questions)all.answers[q.id]=0;
  expect(recordPracticeMastery(bank,all)).toEqual([0]);expect(masteredLessons(bank)).toEqual([0]);
  first.answers[first.questions[0].id]=1;expect(recordPracticeMastery(bank,first)).toEqual([]);
  first.answers[first.questions[0].id]=0;expect(recordPracticeMastery(bank,first)).toEqual([0]);
  delete first.answers[first.questions[0].id];expect(recordPracticeMastery(bank,first)).toEqual([]);
 });
 it('ignores unfinished attempts and invalidates proof after question changes',()=>{
  storage();const all=startPractice(bank,{lessons:[0],topics:[],count:99});for(const q of all.questions)all.answers[q.id]=0;
  expect(recordPracticeMastery(bank,all)).toEqual([]);all.finished=true;expect(recordPracticeMastery(bank,all)).toEqual([0]);
  expect(masteredLessons([{...bank[0],question:'Changed question'},...bank.slice(1)])).toEqual([]);
 });
 it('does not use legacy practiced flags or malformed mastery storage as proof',()=>{
  const values=storage();values.set('soc3050-progress','[0,1]');expect(masteredLessons(bank)).toEqual([]);values.set('soc3050-mastery-v1','{broken');expect(masteredLessons(bank)).toEqual([]);
 });
});
