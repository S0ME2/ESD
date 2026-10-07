/// <reference types="vite/client" />
import {mcq} from './mcq';
import {primer} from './primer';

export interface PracticeQuestion {
 id:string;lesson:number;topic:string;topicTitle:string;question:string;code?:string;
 options:string[];correct:number;explanations:string[];
}
export interface PracticeConfig {lessons:number[];topics:string[];count:number}
export interface PracticeSession {
 bankVersion:string;config:PracticeConfig;questions:{id:string;order:number[]}[];answers:Record<string,number>;position:number;finished:boolean;
}
function bankVersion(bank:PracticeQuestion[]) {
 let hash=2166136261;
 for(const q of bank)for(const char of JSON.stringify([q.id,q.question,q.code,q.options,q.correct]))hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return (hash>>>0).toString(16);
}
const groups=import.meta.glob<PracticeQuestion[]>('./quiz/*.json',{import:'default'});
export async function loadPracticeBank():Promise<PracticeQuestion[]> {
 const chapters=(await Promise.all(Object.values(groups).map(load=>load()))).flat();
 const original=mcq.map((q,i)=>({...q,id:`mixed-${i}`,topic:`fundamentals-${q.lesson}`,topicTitle:'Core ideas'}));
 const extraOptions=['200, because 0x adds two zeros','The address stored in p','Five adjacent bits, because the shift is five','2, because if only checks the condition','0.05 Hz','2°, because the rate is 2°/s'];
 const wrongReasons=[
  ['20 treats the hexadecimal digits as decimal. Hexadecimal uses groups of sixteen.','The 0x prefix marks hexadecimal notation. It does not multiply the number or add zeros.'],
  ['The write through *p changes value itself. It does not only change the pointer.','The address is where the value lives. Writing 7 through the pointer puts 7 into that storage.'],
  ['Bit numbering starts at zero; shifting by five selects bit 5, not bit 6.','Shifting one bit changes its position. It still selects only one bit, not five bits.'],
  ['The if body runs once, adding one to 2. It is not a loop that keeps adding.','The condition is true, so the assignment in the body runs and changes count from 2 to 3.'],
  ['Period and frequency differ: convert 20 ms to 0.020 seconds and take its reciprocal.','Taking the reciprocal of 20 milliseconds without converting units gives the wrong rate in hertz.'],
  ['A change in angle is rate times elapsed time; dividing by the half-second gives the wrong result.','2°/s is the rate. Over half a second, the change is half of two degrees: one degree.']
 ];
 const starting=primer.map((p,i)=>({...p,code:i===1||i===3?p.code:undefined,id:`primer-${i}`,lesson:0,topic:'primer',topicTitle:'Starting building blocks',options:[...p.options,extraOptions[i]],explanations:p.options.map((_,j)=>j===p.correct?p.reason:wrongReasons[i][0]).concat(wrongReasons[i][1])}));
 return [...starting,...chapters,...original];
}
export function shuffle<T>(values:readonly T[],random= Math.random):T[] {
 const result=[...values];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
function selectedQuestions(bank:PracticeQuestion[],config:PracticeConfig) {
 return bank.filter(q=>config.lessons.includes(q.lesson)&&(!config.topics.length||config.topics.includes(q.topic)));
}
function uniquePrompts(questions:PracticeQuestion[]) {
 const seen=new Set<string>();
 return questions.filter(q=>{const prompt=q.question.trim().toLowerCase();if(seen.has(prompt))return false;seen.add(prompt);return true;});
}
export function eligibleQuestions(bank:PracticeQuestion[],config:PracticeConfig) {
 return uniquePrompts(selectedQuestions(bank,config));
}
export function startPractice(bank:PracticeQuestion[],config:PracticeConfig,random= Math.random):PracticeSession {
 // Repeated course introductions can ask the same thing in several lessons.
 // Shuffle first so any eligible lesson version can represent that prompt.
 const eligible=uniquePrompts(shuffle(selectedQuestions(bank,config),random));
 const count=Math.min(eligible.length,Math.max(1,Math.floor(config.count)||1));
 return {bankVersion:bankVersion(bank),config:{...config,lessons:[...config.lessons],topics:[...config.topics]},questions:eligible.slice(0,count).map(q=>({id:q.id,order:shuffle(q.options.map((_,i)=>i),random)})),answers:{},position:0,finished:false};
}
export function practiceResult(bank:PracticeQuestion[],session:PracticeSession) {
 const byId=new Map(bank.map(q=>[q.id,q]));let correct=0,answered=0;
 for(const {id} of session.questions){const answer=session.answers[id];if(answer!==undefined){answered++;if(answer===byId.get(id)?.correct)correct++;}}
 return {correct,answered,total:session.questions.length,unanswered:session.questions.length-answered,incorrect:answered-correct};
}
const storageKey='soc3050-practice-v2';
export function readPracticeSession(bank:PracticeQuestion[]):PracticeSession|null {
 try {
  const value=JSON.parse(localStorage.getItem(storageKey)||'null');
  if(!value||!Array.isArray(value.questions)||!value.questions.length||value.questions.length>bank.length)return null;
  if(value.bankVersion!==bankVersion(bank))return null;
  const config=value.config;
  const topics=new Set(bank.map(q=>q.topic));
  if(!config||!Array.isArray(config.lessons)||!config.lessons.length||config.lessons.some((id:unknown)=>!Number.isInteger(id)||Number(id)<0||Number(id)>=20)||!Array.isArray(config.topics)||config.topics.some((id:unknown)=>typeof id!=='string'||!topics.has(id))||!Number.isInteger(config.count)||config.count<1)return null;
  const byId=new Map(bank.map(q=>[q.id,q])),seen=new Set<string>();
  for(const item of value.questions){
   const q=byId.get(item?.id);if(!q||seen.has(q.id)||!Array.isArray(item.order)||item.order.length!==q.options.length)return null;
   if(!config.lessons.includes(q.lesson)||(config.topics.length&&!config.topics.includes(q.topic)))return null;
   if(new Set(item.order).size!==q.options.length||item.order.some((i:unknown)=>!Number.isInteger(i)||Number(i)<0||Number(i)>=q.options.length))return null;
   seen.add(q.id);
  }
  const answers:Record<string,number>={};
  for(const {id} of value.questions){const answer=value.answers?.[id];if(Number.isInteger(answer)&&answer>=0&&answer<byId.get(id)!.options.length)answers[id]=answer;}
  const position=Number.isInteger(value.position)?Math.max(0,Math.min(value.questions.length-1,value.position)):0;
  return {bankVersion:value.bankVersion,config,questions:value.questions,answers,position,finished:value.finished===true};
 }catch{return null;}
}
export function savePracticeSession(session:PracticeSession|null) {
 try{if(session)localStorage.setItem(storageKey,JSON.stringify(session));else localStorage.removeItem(storageKey);}catch{/* Session still works when storage is unavailable. */}
}

const masteryKey='soc3050-mastery-v1';
type Mastery=Record<string,boolean>;
function masteryPrompt(q:PracticeQuestion){return `${q.lesson}:${q.question.trim().toLowerCase()}`;}
function readMastery(bank:PracticeQuestion[]):Mastery {
 try{const value=JSON.parse(localStorage.getItem(masteryKey)||'null');if(value?.bankVersion!==bankVersion(bank)||!value.answers||typeof value.answers!=='object'||Array.isArray(value.answers))return {};const answers:Mastery={};for(const [key,answer] of Object.entries(value.answers))if(typeof answer==='boolean')answers[key]=answer;return answers;}catch{return {};}
}
export function masteredLessons(bank:PracticeQuestion[],answers=readMastery(bank)):number[] {
 return [...new Set(bank.map(q=>q.lesson))].filter(id=>bank.filter(q=>q.lesson===id).every(q=>answers[masteryPrompt(q)]===true));
}
export function recordPracticeMastery(bank:PracticeQuestion[],session:PracticeSession):number[] {
 const answers=readMastery(bank),byId=new Map(bank.map(q=>[q.id,q]));
 if(session.finished)for(const {id} of session.questions){const q=byId.get(id);if(q)answers[masteryPrompt(q)]=session.answers[id]===q.correct;}
 try{localStorage.setItem(masteryKey,JSON.stringify({bankVersion:bankVersion(bank),answers}));}catch{/* Progress still updates for this page. */}
 return masteredLessons(bank,answers);
}
