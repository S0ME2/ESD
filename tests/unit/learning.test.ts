import {afterEach,describe,expect,it,vi} from 'vitest';
import {beginner,studyStages} from '../../src/course/beginner';
import {lessons as foundations} from '../../src/course/foundations';
import {lessons as systems} from '../../src/course/systems';
import {lessons as applications} from '../../src/course/applications';
import {readStudyProgress,saveStudyProgress,ready} from '../../src/course/progress';
const lessons=[...foundations,...systems,...applications];
afterEach(()=>vi.unstubAllGlobals());
describe('Beginner teaching coverage',()=>{
 it('provides explanations, bounded analogies, vocabulary and valid connections for all lessons',()=>{
  expect(beginner).toHaveLength(20);
  for(const lesson of lessons){
   const guide=beginner[lesson.id];
   expect(guide.explanation.length).toBeGreaterThanOrEqual(3);expect(guide.analogy).toHaveLength(2);
   expect(guide.words.length).toBeGreaterThanOrEqual(4);expect(guide.stages).toHaveLength(4);
   expect(guide.topicStages).toHaveLength(lesson.topics.length);
   for(const stage of [...guide.topicStages,guide.exampleStage])expect(stage===null||(Number.isInteger(stage)&&stage>=0&&stage<=3)).toBe(true);
   expect(guide.exampleTopic).toBeGreaterThanOrEqual(0);expect(guide.exampleTopic).toBeLessThan(lesson.topics.length);
   for(const text of [guide.intro,...guide.explanation,...guide.analogy,...guide.words.flat(),...guide.stages.flat()])expect(text.trim().length).toBeGreaterThan(0);
  }
 });
 it('covers lessons 0 through 19 once in study order',()=>{
  expect(studyStages.flatMap(s=>Array.from({length:s.range[1]-s.range[0]+1},(_,i)=>i+s.range[0]))).toEqual(Array.from({length:20},(_,i)=>i));
 });
});
describe('Study progress',()=>{
 it('normalizes only true booleans and valid lesson IDs',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({primer:'true',lessons:{0:{reading:true,worked:1,recall:'true'},19:{reading:true,worked:true,recall:true},20:{reading:true}}})});
  const progress=readStudyProgress();expect(progress.primer).toBe(false);
  expect(progress.lessons[0]).toEqual({reading:true,worked:false,recall:false});
  expect(ready(progress.lessons[0])).toBe(false);expect(ready(progress.lessons[19])).toBe(true);
  expect(progress.lessons[20]).toBeUndefined();expect(ready()).toBe(false);
 });
 it('recovers from corrupt JSON and blocked storage',()=>{
  vi.stubGlobal('localStorage',{getItem:()=>'{broken'});expect(readStudyProgress()).toEqual({primer:false,lessons:{}});
  vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}});
  expect(readStudyProgress()).toEqual({primer:false,lessons:{}});expect(()=>saveStudyProgress({primer:true,lessons:{}})).not.toThrow();
 });
 it('writes only its own versioned key',()=>{
  const setItem=vi.fn();vi.stubGlobal('localStorage',{setItem});
  saveStudyProgress({primer:true,lessons:{}});
  expect(setItem).toHaveBeenCalledExactlyOnceWith('soc3050-study-v1',JSON.stringify({primer:true,lessons:{}}));
 });
});
