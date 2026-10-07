import {primer} from '../course/primer';
import {ArrowRight} from '@phosphor-icons/react';
import type {Lesson} from '../course/types';
import {studyStages} from '../course/beginner';
import {emptyChecks,ready,type LessonChecks,type StudyCheck,type StudyProgress} from '../course/progress';

const checks:[StudyCheck,string][]=[
 ['reading','I can explain the main idea in my own words.'],
 ['worked','I worked through an example and explained each step without copying.'],
 ['recall','I completed practice for this lesson and reviewed the explanations.']
];
export function StudyChecklist({id,value,onChange}:{id:number;value?:LessonChecks;onChange:(check:StudyCheck,value:boolean)=>void}){
 const current=value||emptyChecks;
 return <section className="study-checklist" aria-label="Study checkpoint"><span className="section-kicker">BEFORE MOVING ON</span><h2>Can you explain it on your own?</h2><p>Use these as honest self-checks. Watching the animation or guessing one answer is a start; being able to explain the result is the goal.</p>{checks.map(([key,label])=><label key={key}><input id={`study-${id}-${key}`} type="checkbox" checked={current[key]} onChange={e=>onChange(key,e.target.checked)}/>{label}</label>)}<p className="microcopy" role="status">{ready(current)?'All three self-checks recorded. Revisit this lesson if you cannot explain it later.':'Check each item after doing the work. Your study checklist is saved on this device.'}</p><a className="text-link" href="#course">See your study roadmap <ArrowRight size={16}/></a></section>;
}

export function LearningRoadmap({lessons,progress}:{lessons:Lesson[];progress:StudyProgress}){
 const count=lessons.filter(l=>ready(progress.lessons[l.id])).length;
 const next=lessons.find(l=>!ready(progress.lessons[l.id]));
 return <section className="learning-roadmap" aria-label="Study roadmap"><div className="roadmap-heading"><div><span className="section-kicker">FROM ZERO TO EXAM PREPARATION</span><h2>Your route through the course</h2></div><span>{count} / 20 study checkpoints</span></div><p>Follow the order below. For each lesson: understand the ideas, work through an example, then answer the practice questions without notes. Use a diagram or experiment when you need to see what happens.</p><p className="microcopy">These checkpoints are your self-assessment, separate from practice scores. They are not exam scores.</p><ol className="roadmap-stages"><li><div className="roadmap-number">0</div><div><h3>Start with the building blocks</h3><p>Bits, hexadecimal numbers, addresses, simple C, and time units. No embedded-systems experience needed.</p><a className="text-link" href="#start">{progress.primer?'Review the starting primer':'Open the starting primer'} <ArrowRight size={16}/></a></div></li>{studyStages.map((stage,i)=>{
  const group=lessons.filter(l=>l.id>=stage.range[0]&&l.id<=stage.range[1]),done=group.filter(l=>ready(progress.lessons[l.id])).length;
  return <li key={stage.title}><div className="roadmap-number">{i+1}</div><div><div className="roadmap-stage-heading"><h3>{stage.title}</h3><span>Lessons {String(stage.range[0]).padStart(2,'0')}–{String(stage.range[1]).padStart(2,'0')} · {done}/{group.length}</span></div><p>{stage.goal}</p><p className="roadmap-check"><strong>Before moving on:</strong> {stage.check}</p><div className="roadmap-links">{group.map(l=><a href={`#lesson/${String(l.id).padStart(2,'0')}`} key={l.id} aria-label={`Lesson ${String(l.id).padStart(2,'0')}: ${l.shortTitle}, ${ready(progress.lessons[l.id])?'self-checks complete':'to study'}`}>{String(l.id).padStart(2,'0')} {l.shortTitle.split(':')[0].replace(/^The /,'')} {ready(progress.lessons[l.id])&&<span>✓</span>}</a>)}</div></div></li>;
 })}</ol>{next&&<a className="primary" href={`#lesson/${String(next.id).padStart(2,'0')}`}>Continue with lesson {String(next.id).padStart(2,'0')} <ArrowRight size={17}/></a>}<section className="exam-revision"><h2>Prepare with multiple-choice practice</h2><p>Practice choosing one answer and explaining why the others are wrong. First learn the mechanism; then recognize it in a mixed question set without the animation.</p><a className="primary" href="#exam">Set up a practice run <ArrowRight size={17}/></a><p className="microcopy">Practice covers course concepts; it does not predict the exam questions or replace the professor’s requirements.</p></section></section>;
}

export function StartingPrimer({onFinish}:{onFinish:(checked:boolean)=>void}){
 return <section className="starting-primer"><span className="section-kicker">BEFORE LESSON 00</span><h1>Start with the building blocks.</h1><p className="hero-description">Embedded systems are computers that read inputs and control things. These six ideas explain the notation used in the course.</p>{primer.map((p,i)=><article key={p.title}><span className="section-kicker">BUILDING BLOCK {i+1}</span><h2>{p.title}</h2><p>{p.text}</p><pre><code>{p.code}</code></pre><p className="primer-worked"><strong>What this example means:</strong> {p.reason}</p></article>)}<button className="primary" onClick={()=>onFinish(true)}>Start lesson 00 <ArrowRight size={17}/></button><a className="text-link" href="#exam?lesson=0&topic=primer">Practice the building blocks <ArrowRight size={16}/></a></section>;
}
