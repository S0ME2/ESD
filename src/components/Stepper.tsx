import { useEffect, useId, useState, type ReactNode } from 'react';
import { ArrowCounterClockwise, CaretLeft, CaretRight, Pause, Play } from '@phosphor-icons/react';
import type { Frame } from '../course/types';
import { usePlayback } from './usePlayback';
import {FramePlayback} from './FramePlayback';

export function Stepper({ frames, children }: { frames: Frame[]; children?: (frame: Frame, index: number, position:number) => ReactNode }) {
  const [speed, setSpeed] = useState(frames.length>40?100:1000);
  const {position,setPosition:setIndex,playing,setPlaying,root}=usePlayback(frames.length,speed);
  const sliderId = useId();
  const current = Math.min(Math.floor(position), Math.max(0, frames.length - 1));
  useEffect(() => { setIndex(0); setPlaying(false); }, [frames]);
  if (!frames.length) return null;
  const frame = frames[current];
  return <div className="stepper" ref={root}>
    <div className="event-head"><span className="eyebrow">EVENT {String(current + 1).padStart(2, '0')} / {String(frames.length).padStart(2, '0')}</span><span className="model-label">Event time · not CPU cycles</span></div>
    <div className="transport-dock">
    <div className="timeline"><label className="sr-only" htmlFor={sliderId}>Event position</label><input id={sliderId} aria-label="Event position" type="range" min="0" max={frames.length - 1} step=".01" value={position} onChange={e => { setPlaying(false); setIndex(+e.target.value); }}/></div>
    <div className="controls transport">
      <button aria-label="Replay" onClick={() => { setPlaying(false); setIndex(0); }}><ArrowCounterClockwise size={18}/> Replay</button>
      <button aria-label="Previous event" disabled={current === 0} onClick={() => { setPlaying(false); setIndex(current-1); }}><CaretLeft size={18}/> Back</button>
      <button className="primary" aria-label={playing ? 'Pause' : 'Run slowly'} onClick={() => { if (current === frames.length-1) setIndex(0); setPlaying(!playing); }}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? 'Pause' : 'Run'}</button>
      <button aria-label="Next event" disabled={current === frames.length-1} onClick={() => { setPlaying(false); setIndex(current+1); }}>Next <CaretRight size={18}/></button>
      <label className="speed">Speed <select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(+e.target.value)}><option value={10000}>10 s / event</option><option value={1000}>1 s / event</option><option value={100}>0.1 s / event</option></select></label>
    </div>
    </div>
    <FramePlayback.Provider value={{frame,progress:current===frames.length-1?1:Math.min(1,position-current)}}>{children?.(frame,current,position)}</FramePlayback.Provider>
    <div className="event-explanation" aria-live={playing?'off':'polite'}><h3>{frame.title}</h3><p>{frame.detail}</p></div>
    {frame.code && <pre className="active-code"><code>{frame.code}</code></pre>}
    {frame.values && <dl className="metric-grid">{Object.entries(frame.values).filter(([,value])=>value!==undefined).map(([name,value]) => <div className="metric" key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>}
    <p className="microcopy">Playback speed slows the explanation, not the hardware clock. Values show the selected event’s result; moving labels illustrate the transfer.</p>
  </div>;
}
