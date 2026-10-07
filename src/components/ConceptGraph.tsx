import { useMemo, useState } from 'react';
import { ArrowRight, Check } from '@phosphor-icons/react';
import type { Lesson } from '../course/types';

type Point = { x:number; y:number };
const pad=(n:number)=>String(n).padStart(2,'0');
const title=(lesson:Lesson)=>lesson.shortTitle.split(':')[0].replace(/^The /,'');

export function ConceptGraph({lessons,completed,onOpen}:{lessons:Lesson[];completed:number[];onOpen:(id:number)=>void}) {
  const [selected,setSelected]=useState(0);
  const positions=useMemo(()=>{
    const groups=[[0,1,2,3],[4,5,6],[7,8,9,10,11],[12,13,14,15,16,17,18,19]];
    const x=[112,384,656,928];
    const points=new Map<number,Point>();
    groups.forEach((ids,g)=>ids.forEach((id,row)=>points.set(id,{x:x[g],y:104+row*(ids.length>5?72:104)})));
    return points;
  },[]);
  const active=lessons.find(l=>l.id===selected)??lessons[0];
  const related=new Set([selected,...active.prerequisites,...lessons.filter(l=>l.prerequisites.includes(selected)).map(l=>l.id)]);
  const edges=lessons.flatMap(l=>l.prerequisites.map(id=>({from:id,to:l.id}))).filter(e=>positions.has(e.from)&&positions.has(e.to));
  return <section className="connections-page">
    <div className="section-kicker">ONE MACHINE · TWENTY CONNECTED IDEAS</div>
    <h1>See how each idea connects.</h1>
    <p className="hero-description">Choose a lesson. Highlighted lines connect its prerequisites and the lessons that build on it. Follow a connection back to review an earlier idea.</p>
    <div className="graph-legend" aria-label="Map legend"><span><i className="legend-dot current"/> Selected idea</span><span><i className="legend-dot learned"/> All practice answers correct</span><span><i className="legend-line"/> Builds on</span></div>
    <div className="concept-graph-scroll" tabIndex={0} aria-label="Scrollable concept dependency graph">
      <svg className="concept-graph" viewBox="0 0 1080 760" role="group" aria-label="Twenty lesson dependency graph">
        <defs><marker id="graph-arrow" markerWidth="7" markerHeight="7" refX="5.8" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7z" fill="context-stroke"/></marker></defs>
        {[['THE MACHINE',112],['HARDWARE',384],['SYSTEMS',656],['APPLICATIONS',928]].map(([name,x])=><text className="graph-group" key={name} x={Number(x)} y="29" textAnchor="middle">{name}</text>)}
        {edges.map((e,i)=>{
          const a=positions.get(e.from)!,b=positions.get(e.to)!;
          const mid=(a.x+b.x)/2;
          const relevant=related.has(e.from)&&related.has(e.to);
          const path=a.x===b.x?`M${a.x} ${a.y+25} C${a.x+46} ${a.y+42},${b.x+46} ${b.y-42},${b.x} ${b.y-25}`:`M${a.x+102} ${a.y} C${mid} ${a.y}, ${mid} ${b.y}, ${b.x-102} ${b.y}`;
          return <path key={`${e.from}-${e.to}-${i}`} className={`graph-edge ${relevant?'related':''}`} d={path} markerEnd="url(#graph-arrow)"/>;
        })}
        {lessons.map(l=>{
          const p=positions.get(l.id)!; const chosen=l.id===selected; const linked=related.has(l.id);
          return <g key={l.id} className={`graph-node ${chosen?'selected':''} ${completed.includes(l.id)?'learned':''} ${linked?'related':''}`} transform={`translate(${p.x-102} ${p.y-25})`} role="button" tabIndex={0} aria-label={`Lesson ${pad(l.id)} ${title(l)}`} aria-pressed={chosen} onClick={()=>setSelected(l.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(l.id);}}}>
            <rect width="204" height="50" rx="14"/><text className="node-number" x="13" y="30">{pad(l.id)}</text><text className="node-title" x="43" y="30" textLength={Math.min(140,title(l).length*7.1)} lengthAdjust="spacingAndGlyphs">{title(l).length>21?title(l).slice(0,20)+'…':title(l)}</text>{completed.includes(l.id)&&<text className="node-check" x="188" y="18">✓</text>}
          </g>;
        })}
      </svg>
    </div>
    <aside className="graph-inspector" aria-live="polite">
      <div className="graph-inspector-heading"><span>LESSON {pad(active.id)}</span>{completed.includes(active.id)&&<span className="learned-label"><Check size={14}/> All answers correct</span>}</div>
      <h2>{title(active)}</h2><p>{active.subtitle}</p>
      <div className="graph-detail"><strong>First, remember</strong><span>{active.youKnow[0]||'Basic programming'}</span></div>
      <div className="graph-detail"><strong>This adds</strong><span>{active.adds.slice(0,2).join(' · ')}</span></div>
      <button className="primary" onClick={()=>onOpen(active.id)}>Open this lesson <ArrowRight size={17}/></button>
    </aside>
  </section>;
}
