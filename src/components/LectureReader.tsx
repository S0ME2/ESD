import { useEffect, useState } from 'react';
import manifest from '../course/manifest.json';
import { CourseMarkdown } from './CourseMarkdown';

// Only split headings outside code fences: code and SVG must stay intact.
export function lectureSections(text:string) {
 const sections:{title:string;text:string}[]=[];
 let lines:string[]=[],title='Introduction',fence='';
 for(const line of text.split('\n')) {
  const marker=line.match(/^\s*(`{3,}|~{3,})/);
  if(marker) {if(!fence)fence=marker[1][0];else if(marker[1][0]===fence)fence='';}
  if(!fence&&/^## (?!#)/.test(line)) {
   if(lines.some(l=>l.trim()))sections.push({title,text:lines.join('\n')});
   title=line.slice(3).replace(/`/g,'');lines=[];
  }
  lines.push(line);
 }
 if(lines.some(l=>l.trim()))sections.push({title,text:lines.join('\n')});
 return sections;
}

export function LectureReader({id,onReady}:{id:number;onReady?:(ready:boolean)=>void}) {
 const entry=manifest.lessons[id];
 const docs=entry.files.filter(f=>f.endsWith('.md'));
 if(id===6)docs.push(entry.directory+'/Main.c');
 const [file,setFile]=useState(entry.directory+'/Slide.md');
 const [text,setText]=useState(''),[error,setError]=useState('');
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{onReady?.(!!text||!!error);},[text,error,onReady]);
 useEffect(()=>{
  const abort=new AbortController();setText('');setError('');
  fetch('/source/'+file,{signal:abort.signal}).then(r=>{if(!r.ok)throw Error('The reading could not load. Please retry.');return r.text();}).then(setText).catch(e=>{if(e.name!=='AbortError')setError(e.message);});
  return()=>abort.abort();
 },[file,attempt]);
 const reading=file.endsWith('/Main.c')?text.slice(text.indexOf('LAB CHECK'),text.indexOf('*/')).replace(/^\s*\* ?/gm,''):text;
 const sections=lectureSections(reading);
 function jump(index:number) {document.getElementById(`lecture-${id}-${index}`)?.scrollIntoView({block:'start',behavior:'instant'});}
 return <section className="lecture-reader" aria-label="Complete professor lecture">
  <span className="section-kicker">THE COMPLETE COURSE READING</span>
  <h2>Read the full lesson</h2>
  <p>The explanation above introduces the ideas. This reading contains the professor’s complete lecture: every section, equation, register diagram, code example, measurement and stated limitation. Study it before answering the questions below.</p>
  <label className="field">Course reading<select aria-label="Course reading" value={file} onChange={e=>setFile(e.target.value)}>{docs.map(f=><option key={f} value={f}>{f.endsWith('/Main.c')?'Instructor lab check: T1–T10':f.endsWith('/Slide.md')?'Full lecture':f.endsWith('/Lab.md')?'Professor’s lab and exercises':f.slice(entry.directory.length+1)}</option>)}</select></label>
  {error?<p role="alert">{error} <button onClick={()=>setAttempt(n=>n+1)}>Retry reading</button></p>:!text?<p role="status">Loading the complete reading…</p>:<>
   <label className="field lecture-jump">Jump to a section<select aria-label="Lecture section" defaultValue="" key={file} onChange={e=>{if(e.target.value!=='')jump(+e.target.value);}}><option value="">Choose a lecture section…</option>{sections.map((s,i)=><option key={i} value={i}>{s.title}</option>)}</select></label>
   <p className="reading-coverage">{sections.length} sections · Full original text · <a href={'https://gnoejh.github.io/soc3050code/'+entry.directory+'.html'} target="_blank" rel="noreferrer">Professor’s published lesson</a></p>
   <div className="markdown lecture-text">{sections.map((s,i)=><section className="lecture-section" id={`lecture-${id}-${i}`} key={file+i}><CourseMarkdown text={s.text} file={file}/></section>)}</div>
  </>}
 </section>;
}
