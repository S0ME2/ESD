import type {ReactNode} from 'react';

export function DiagramBlock({x,y,w=176,h=84,title,value,active=false,children}:{x:number;y:number;w?:number;h?:number;title:string;value?:string;active?:boolean;children?:ReactNode}){
 return <g className={`diagram-block ${active?'is-active':''}`}><rect x={x} y={y} width={w} height={h} rx={8}/><text className="diagram-label" x={x+16} y={y+28}>{title}</text>{value&&<text className="diagram-value" x={x+16} y={y+53}>{value}</text>}{children}</g>;
}
export function Signal({d,progress=0,active=true}:{d:string;progress?:number;active?:boolean}){
 return <g><path d={d} className="diagram-wire"/><path d={d} className={`diagram-signal ${active?'is-active':''}`} pathLength={1} strokeDasharray={`${Math.max(.001,progress)} 1`}/></g>;
}
export function DiagramGrid({x=32,y=32,w=440,h=300,step=40}:{x?:number;y?:number;w?:number;h?:number;step?:number}){
 return <g className="diagram-grid">{Array.from({length:Math.floor(w/step)+1},(_,i)=><path key={'x'+i} d={`M${x+i*step} ${y}v${h}`}/>)}{Array.from({length:Math.floor(h/step)+1},(_,i)=><path key={'y'+i} d={`M${x} ${y+i*step}h${w}`}/>)}</g>;
}
export function RobotGlyph({x,y,angle=0,scale=1,secondary=false,label,highlightWheel}:{x:number;y:number;angle?:number;scale?:number;secondary?:boolean;label?:string;highlightWheel?:'left'|'right'}){
 return <g className={`robot-glyph moving-object ${secondary?'secondary':''}`} transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${angle.toFixed(3)}) scale(${scale})`}>
  <rect className={`robot-wheel ${highlightWheel==='left'?'highlighted':''}`} x={-30} y={-24} width={9} height={45} rx={3}/><rect className={`robot-wheel ${highlightWheel==='right'?'highlighted':''}`} x={21} y={-24} width={9} height={45} rx={3}/>
  <rect className="robot-body" x={-22} y={-30} width={44} height={62} rx={9}/><rect className="robot-board" x={-13} y={-13} width={26} height={29} rx={3}/>
  <rect className="robot-chip" x={-6} y={-6} width={12} height={12} rx={2}/><path className="robot-circuit" d="M-10 10H10M0 8v6M-10 -17H10"/>
  <path className="robot-sensor-bar" d="M-29 -37H29"/>{[-24,-16,-8,0,8,16,24].map(i=><circle key={i} className="robot-sensor" cx={i} cy={-37} r={2.4}/>)}
  <path className="robot-direction" d="M-4 -23L0 -28l4 5"/>{label&&<text className="robot-number" x={0} y={25} textAnchor="middle">{label}</text>}
 </g>;
}
export function DroneGlyph({angle=0,spin=0,x=240,y=175,scale=1}:{angle?:number;spin?:number;x?:number;y?:number;scale?:number}){
 return <g className="drone-glyph moving-object" transform={`translate(${x} ${y}) rotate(${angle.toFixed(3)}) scale(${scale})`}>
  <path className="drone-arm" d="M-118 0H118M-104 -8v18M104 -8v18"/><path className="drone-brace" d="M-65 0L-28 28H28L65 0"/>
  <rect className="drone-body" x={-31} y={-15} width={62} height={33} rx={9}/><rect className="drone-board" x={-19} y={-21} width={38} height={9} rx={3}/>
  {[-112,112].map((cx,i)=><g key={cx}><ellipse className="rotor-disc" cx={cx} cy={-15} rx={42} ry={9}/><path className="rotor-blade" d="M-39 0H39" transform={`translate(${cx} -15) scale(${Math.cos(spin*(i?1:-1))} 1)`}/><circle className="rotor-hub" cx={cx} cy={-15} r={4}/></g>)}
  <path className="drone-landing" d="M-24 18v17h-13M24 18v17h13"/>
 </g>;
}
export function DroneTopGlyph({x,y,spin=0,scale=1}:{x:number;y:number;spin?:number;scale?:number}){
 return <g className="drone-top moving-object" transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale})`}><path className="drone-arm" d="M-27 -27L27 27M27 -27L-27 27"/>{[[-27,-27],[27,-27],[-27,27],[27,27]].map(([cx,cy],i)=><g key={i}><circle className="rotor-disc" cx={cx} cy={cy} r={15}/><path className="rotor-blade" d="M-12 0H12" transform={`translate(${cx} ${cy}) rotate(${spin*(i%2?1:-1)})`}/></g>)}<rect className="drone-body" x={-12} y={-18} width={24} height={36} rx={6}/><path className="robot-direction" d="M-4 -10L0 -14l4 4"/></g>;
}
export function BalanceGlyph({x,y,angle=0,spin=0}:{x:number;y:number;angle?:number;spin?:number}){
 return <g className="balance-glyph moving-object" transform={`translate(${x.toFixed(3)} ${y})`}>
  <g transform={`rotate(${angle.toFixed(3)})`}><path className="balance-stem" d="M0 0V-125"/><rect className="robot-body" x={-30} y={-157} width={60} height={63} rx={8}/><rect className="robot-board" x={-19} y={-146} width={38} height={29} rx={3}/><circle className="robot-chip" cx={0} cy={-132} r={7}/></g>
  <circle className="balance-tire" r={23}/><circle className="balance-rim" r={14}/><g transform={`rotate(${spin})`}><path className="balance-spoke" d="M-11 0H11M0 -11V11"/></g><circle className="balance-hub" r={4}/>
 </g>;
}
export function ScopeTrace({values,x=40,y=240,w=420,h=95,estimate=false,label}:{values:number[];x?:number;y?:number;w?:number;h?:number;estimate?:boolean;label?:string}){
 const max=Math.max(1,...values.map(Math.abs));
 const d=values.map((v,i)=>`${i?'L':'M'}${x+i*w/Math.max(1,values.length-1)},${y+h/2-v/max*h*.42}`).join(' ');
 return <g><path className="diagram-wire" d={`M${x} ${y+h/2}h${w}`}/><path className={estimate?'diagram-estimate':'diagram-trace'} d={d}/>{label&&<text className="diagram-small" x={x} y={y+h+22}>{label}</text>}</g>;
}
