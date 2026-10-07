import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Play } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lesson } from '../course/types';
import { LessonExplanation, WorkedExample } from './StudySupport';
import { LessonAnimation, type AnimationFocus } from './LessonAnimation';
import { loadNotes, noteId, type StudyNote } from '../course/notes';
import type { LessonChecks, StudyCheck } from '../course/progress';
import { StudyChecklist } from './LearningPath';

export function GuidedLesson({lesson,onExperiment,onRefresh,checks,onStudyCheck}:{lesson:Lesson;onExperiment:(index:number)=>void;onRefresh:(id:number)=>void;checks?:LessonChecks;onStudyCheck:(check:StudyCheck,value:boolean)=>void}) {
 const [notes,setNotes]=useState<StudyNote[]>([]);
 const [notesError,setNotesError]=useState('');
 const [attempt,setAttempt]=useState(0);
 const [focus,setFocus]=useState<AnimationFocus>();
 const content=useRef<HTMLDivElement>(null);
 function jump(id:string){document.getElementById(id)?.scrollIntoView({block:'start'});}
 function visualize(stage:number){setFocus(previous=>({stage,request:(previous?.request||0)+1}));jump('lesson-diagram');}
 useEffect(()=>{
  let active=true;setNotesError('');
  loadNotes(lesson.id).then(value=>{if(active)setNotes(value);}).catch(error=>{if(active)setNotesError(error.message);});
  return()=>{active=false;};
 },[lesson.id,attempt]);
 useEffect(()=>{
  const sync=()=>{
   const query=new URLSearchParams(location.hash.split('?')[1]);
   const section=query.get('section');
   const topic=Number(query.get('topic'));
   const target=query.get('view')==='lab'?'lesson-experiments':section==='example'?'lesson-example':section==='practice'?'lesson-practice':query.has('topic')&&Number.isInteger(topic)&&topic>=0&&topic<notes.length?noteId(lesson.id,topic):null;
   if(target)requestAnimationFrame(()=>jump(target));
  };
  sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);
 },[lesson.id,notes.length]);
 return <section className="teaching continuous-lesson" ref={content}>
  {lesson.id===0&&<p className="beginner-link">Need help with bits, addresses, or C? <a href="#start">Review the building blocks.</a></p>}
  <div className="reading-layout">
   <div className="reading-main">
    <section id="lesson-understand" className="lesson-opening"><LessonExplanation id={lesson.id}/></section>
    <section id="lesson-diagram"><LessonAnimation id={lesson.id} focus={focus} onExplain={()=>jump('lesson-understand')}/></section>
    <div className="study-notes" aria-label="Complete study notes">
     {notesError&&<p role="alert">{notesError} <button onClick={()=>setAttempt(value=>value+1)}>Retry chapter</button></p>}
     {notes.map((note,index)=><article className="study-note" id={noteId(lesson.id,index)} key={index} data-source-sections={note.sourceHeadings.length}>
      <div className="study-note-heading"><span className="section-kicker">{String(index+1).padStart(2,'0')}</span><h2>{note.title}</h2></div>
      <div className="markdown study-note-body"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{h1:({children})=><h3>{children}</h3>,h2:({children})=><h3>{children}</h3>,table:({children})=><div className="study-table" role="region" aria-label={`${note.title} table`} tabIndex={0}><table>{children}</table></div>}}>{note.body}</ReactMarkdown></div>
     </article>)}
     {!notes.length&&!notesError&&<p role="status">Loading the study chapter…</p>}
    </div>
    <section id="lesson-example"><WorkedExample id={lesson.id} onVisualize={visualize} onExperiment={onExperiment}/></section>
    <section id="lesson-practice"><StudyChecklist id={lesson.id} value={checks} onChange={onStudyCheck}/><a className="text-link" href={`#exam?lesson=${lesson.id}`}>Practice this lesson <ArrowRight size={17}/></a></section>
    <section className="terms lesson-vocabulary"><h2>Words used in this lesson</h2><dl>{lesson.terms.map(t=><div key={t.term}><dt>{t.term}</dt><dd>{t.meaning}</dd></div>)}</dl><a className="text-link" href="#glossary">Search the glossary <BookOpen size={16}/></a></section>
   </div>
   <aside className="reading-rail" aria-label="On this page"><div className="topic-menu"><h3>On this page</h3><label className="topic-select">Jump to a section<select defaultValue="" onChange={e=>{if(e.target.value)jump(e.target.value);}}><option value="">Choose a section…</option><option value="lesson-understand">The main idea</option><option value="lesson-diagram">Diagram</option>{notes.map((note,i)=><option key={i} value={noteId(lesson.id,i)}>{i+1}. {note.title}</option>)}<option value="lesson-example">Worked example</option><option value="lesson-practice">Practice</option><option value="lesson-experiments">Experiments</option></select></label><nav aria-label="Page contents"><button onClick={()=>jump('lesson-understand')}>The main idea</button><button onClick={()=>jump('lesson-diagram')}>Diagram</button>{notes.map((note,i)=><button key={i} onClick={()=>jump(noteId(lesson.id,i))}><span>{i+1}</span>{note.title}</button>)}<button onClick={()=>jump('lesson-example')}>Worked example</button><button onClick={()=>jump('lesson-practice')}>Practice</button><button onClick={()=>onExperiment(0)}><Play size={15}/> Experiments</button></nav></div>{lesson.prerequisites.length>0&&<div className="rail-refresher"><h3>Need a reminder?</h3>{lesson.prerequisites.map(id=><button key={id} className="text-link" onClick={()=>onRefresh(id)}>Review lesson {String(id).padStart(2,'0')} <ArrowRight size={15}/></button>)}</div>}</aside>
  </div>
 </section>;
}
