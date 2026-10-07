import { useEffect, useRef, useState } from 'react';

export function usePlayback(count:number,milliseconds:number,autoplay=false,loop=false) {
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const [position,setPosition]=useState(0);
 const [playing,setPlaying]=useState(()=>autoplay&&!reduced());
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const pause=()=>{if(document.hidden)setPlaying(false);};
  const motion=()=>{if(media.matches)setPlaying(false);};
  const observer=new IntersectionObserver(entries=>{if(!entries[0]?.isIntersecting)setPlaying(false);});
  if(root.current)observer.observe(root.current);
  document.addEventListener('visibilitychange',pause);media.addEventListener('change',motion);
  return()=>{observer.disconnect();document.removeEventListener('visibilitychange',pause);media.removeEventListener('change',motion);};
 },[]);
 useEffect(()=>{
  if(!playing||count<2)return;
  let handle=0,last:number|undefined;
  const tick=(now:number)=>{
   const delta=last===undefined?0:Math.min(100,now-last);last=now;
   setPosition(p=>{
    const next=p+delta/milliseconds;
    return loop?next%(count-1):Math.min(count-1,next);
   });
   handle=requestAnimationFrame(tick);
  };
  handle=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(handle);
 },[playing,count,milliseconds,loop]);
 useEffect(()=>{if(!loop&&position>=count-1)setPlaying(false);},[position,count,loop]);
 return {position,setPosition,playing,setPlaying,root};
}

// Interpolate physical values; discrete decisions and targets retain their event state.
export function sampleState<T extends object>(states:T[],position:number):T {
 const i=Math.min(Math.floor(position),states.length-1),a=states[i],b=states[Math.min(i+1,states.length-1)];
 const fraction=position-i;
 const blend=(left:unknown,right:unknown,key=''):unknown=>{
  if(['target','wp','state','mode','commands','views','winner','truth','belief','plan','previous','found','lost','fallen','armed'].includes(key))return left;
  if(typeof left==='number'&&typeof right==='number')return left+(right-left)*fraction;
  if(Array.isArray(left)&&Array.isArray(right)&&left.length===right.length)return left.map((value,j)=>blend(value,right[j]));
  if(left&&right&&typeof left==='object'&&typeof right==='object'&&Object.getPrototypeOf(left)===Object.prototype)return Object.fromEntries(Object.entries(left).map(([k,v])=>[k,blend(v,(right as Record<string,unknown>)[k],k)]));
  return left;
 };
 return blend(a,b) as T;
}
