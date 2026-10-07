import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowClockwise } from '@phosphor-icons/react';

export function MechanismStepper({steps}:{steps:string[]}) {
  const [active,setActive]=useState(0);
  const select=(next:number)=>setActive(Math.max(0,Math.min(steps.length-1,next)));
  return <section className="mechanism-stepper" aria-label="Step through what the machine does">
    <div className="mechanism-stepper-heading"><div><span className="section-kicker">FOLLOW THE CAUSE AND EFFECT</span><strong>One machine change at a time</strong></div><span className="model-label">Teaching sequence · not to scale in time</span></div>
    <div className="mechanism-track" role="group" aria-label="Choose a mechanism step">
      {steps.map((_,i)=><span className="mechanism-track-item" key={i}>
        <button aria-label={`Show step ${i+1}`} aria-current={i===active?'step':undefined} onClick={()=>select(i)}>{i+1}</button>
        {i<steps.length-1&&<i aria-hidden="true"/>}
      </span>)}
    </div>
    <div className="mechanism-current" key={active} aria-live="polite">
      <div><span>STEP {active+1} / {steps.length}</span><span>WHAT CHANGED?</span></div>
      <p>{steps[active]}</p>
    </div>
    <div className="mechanism-controls"><button disabled={active===0} onClick={()=>select(active-1)}><ArrowLeft size={16}/> Previous</button><div><button aria-label="Replay from first step" onClick={()=>select(0)}><ArrowClockwise size={16}/> Replay</button><button className="primary" disabled={active===steps.length-1} onClick={()=>select(active+1)}>Next change <ArrowRight size={16}/></button></div></div>
  </section>;
}
