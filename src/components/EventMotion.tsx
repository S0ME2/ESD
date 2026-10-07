import type { Frame } from '../course/types';

export function EventMotion({frames,position}:{frames:Frame[];position:number}) {
 const index=Math.min(Math.floor(position),frames.length-1);
 const source=frames[index],target=frames[Math.min(index+1,frames.length-1)];
 const fraction=position-index,x=147+fraction*326;
 const code=target.code||source.code;
 return <figure className="event-motion">
  <svg viewBox="0 0 620 140" role="img" aria-label={`Follow ${source.title} to ${target.title}`} data-motion-position={position.toFixed(3)}>
   <rect x="12" y="15" width="135" height="60" rx="8"/><rect x="473" y="15" width="135" height="60" rx="8"/>
   <text x="79" y="41" textAnchor="middle">{source.active||'Current state'}</text><text x="540" y="41" textAnchor="middle">{target.active||'Next state'}</text>
   <path d="M147 45H473" className="motion-wire"/>
   <circle cx={Math.max(147,Math.min(473,x))} cy="45" r="8" className="motion-token"/>
   <text x="310" y="92" textAnchor="middle">{code?code.split('\n')[0].slice(0,65):'Follow the causal order below'}</text>
   <text x="310" y="123" textAnchor="middle" className="svg-caption">{target.title.slice(0,74)}</text>
  </svg>
  <figcaption>Motion follows the teaching sequence. Each completed event retains its exact state below.</figcaption>
 </figure>;
}
