export type StudyCheck='reading'|'worked'|'recall';
export type LessonChecks=Record<StudyCheck,boolean>;
export interface StudyProgress {primer:boolean;lessons:Record<number,LessonChecks>}
export const emptyChecks:LessonChecks={reading:false,worked:false,recall:false};
export function ready(checks?:LessonChecks){return !!checks&&checks.reading&&checks.worked&&checks.recall;}
export function readStudyProgress():StudyProgress {
 const clean:StudyProgress={primer:false,lessons:{}};
 try{
  const data=JSON.parse(localStorage.getItem('soc3050-study-v1')||'null');
  if(!data||typeof data!=='object')return clean;
  clean.primer=data.primer===true;
  for(let id=0;id<20;id++){
   const entry=data.lessons?.[id];
   if(entry&&typeof entry==='object')clean.lessons[id]={reading:entry.reading===true,worked:entry.worked===true,recall:entry.recall===true};
  }
 }catch{/* Learning stays available without storage. */}
 return clean;
}
export function saveStudyProgress(progress:StudyProgress){
 try{localStorage.setItem('soc3050-study-v1',JSON.stringify(progress));}catch{/* Keep current-session progress when storage is unavailable. */}
}
