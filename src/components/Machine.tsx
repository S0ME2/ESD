import { useContext, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Play, Pause, ArrowClockwise } from '@phosphor-icons/react';
import {usePlayback} from './usePlayback';
import {FramePlayback} from './FramePlayback';

const parts = [
  {name:'CPU', x:45,y:52,w:200,h:105,label:'Cortex-M0+',detail:'The CPU carries out your program, one instruction at a time. Registers are its small working storage. PC tracks the next instruction; SP tracks saved values on the stack.'},
  {name:'Flash',x:275,y:52,w:130,h:105,label:'32 KiB · firmware',detail:'Flash keeps the program even when power is off. The CPU reads instructions here. Program bytes use 0x08000000–0x08007FFF. Separate Flash controller registers, including ACR at 0x40022000, configure access timing; writing ACR changes a setting, not program bytes.'},
  {name:'SRAM',x:435,y:52,w:130,h:105,label:'12 KiB · working data',detail:'SRAM holds changing values while the program runs, including variables and saved task state. Startup prepares it before C code runs. Addresses: 0x20000000–0x20002FFF.'},
  {name:'GPIO',x:45,y:240,w:112,h:73,label:'pins',detail:'GPIO lets software read or drive pins. Writing a control register can change a pin voltage. PA5 connects to the board LED called LD4; GPIOA starts at 0x50000000.'},
  {name:'EXTI',x:175,y:240,w:112,h:73,label:'edge detection',detail:'EXTI detects a chosen change on a pin, such as low to high. It records that attention is needed. Software must clear the recorded event after handling it.'},
  {name:'NVIC',x:305,y:240,w:112,h:73,label:'interrupt routing',detail:'The NVIC decides which hardware request can ask for CPU attention. When a request is enabled and allowed, the CPU saves its place and runs the handler for that event.'},
  {name:'Timer',x:435,y:240,w:130,h:73,label:'clock → count',detail:'A timer counts clock ticks without asking the CPU to count them. It can signal a delay, capture when an edge arrived, or switch an output at a chosen count.'},
  {name:'UART',x:45,y:337,w:112,h:73,label:'serial bytes',detail:'UART sends one byte as a timed pattern of bits on TX, the transmit pin. RX receives that pattern and reconstructs the byte. Buffers hold bytes until software is ready.'},
  {name:'ADC',x:175,y:337,w:112,h:73,label:'voltage → number',detail:'An ADC, or analog-to-digital converter, turns a measured voltage into a number. That number tells software where the voltage lies between zero and a reference voltage.'},
  {name:'DMA',x:305,y:337,w:112,h:73,label:'data movement',detail:'DMA is a separate data mover. After the CPU configures it, DMA can copy each new sensor sample into RAM while the CPU does other work. This is a teaching model.'},
  {name:'Stacks',x:435,y:337,w:130,h:73,label:'MSP / PSP',detail:'A stack is RAM used to save values so execution can return later. MSP tracks the main stack used by interrupt handlers. PSP can track the current task’s own stack.'},
];
const traceSteps=[
 {part:'CPU',title:'1 · The CPU runs a store',detail:'Your C line asks to change a hardware setting. The compiler turns it into a store instruction: send a value to a numbered address.'},
 {part:'CPU',title:'2 · The address travels',detail:'The CPU puts the address and value onto the bus. Every connected block can see the request; only the block that owns that address responds.'},
 {part:'GPIO',title:'3 · GPIO accepts the write',detail:'Address 0x50000018 belongs to GPIOA BSRR. Bit 5 tells the pin logic to set PA5 high. BSRR changes the output latch without a read-modify-write.'},
 {part:'GPIO',title:'4 · The pin changes',detail:'PA5 now drives a high output. On this Nucleo board, PA5 connects to the green LD4 LED, so the LED turns on.'},
];
export function Machine({active,onSelect,trace=false,explore}:{active?:string;onSelect?:(name:string)=>void;trace?:boolean;explore?:{address:number;component:string;detail:string}}) {
  const event=useContext(FramePlayback);
  const [selected,setSelected] = useState(active || 'CPU');
  const [traceStarted,setTraceStarted]=useState(false);
  const {position,setPosition,playing,setPlaying,root}=usePlayback(5,1500);
  const traceStep=traceStarted?Math.min(3,Math.floor(position)):-1;
  const phase=position>=4?1:position%1;
  const highlighted = explore?.component || active || selected;
  const part = parts.find(p=>p.name===selected) || parts[0];
  useEffect(()=>{if(active)setSelected(active);},[active]);
  useEffect(()=>{if(explore){setTraceStarted(false);setPlaying(false);setSelected(explore.component);}},[explore?.address,explore?.component]);
  const select=(name:string)=>{setTraceStarted(false);setPlaying(false);setSelected(name);onSelect?.(name);};
  const flow=traceStep>=0?traceSteps[traceStep]:null;
  const transfer=event?.frame.transfer;
  const start=parts.find(p=>p.name===transfer?.from),end=parts.find(p=>p.name===(transfer?.to||explore?.component));
  const addressStart=parts[0];
  const routeStart=transfer?start:explore?addressStart:undefined;
  const points=routeStart&&end?(routeStart===end?[[routeStart.x+25,routeStart.y+routeStart.h-12],[routeStart.x+routeStart.w-25,routeStart.y+routeStart.h-12]]:[[routeStart.x+routeStart.w/2,routeStart.y<204?routeStart.y+routeStart.h:routeStart.y],[routeStart.x+routeStart.w/2,204],[end.x+end.w/2,204],[end.x+end.w/2,end.y<204?end.y+end.h:end.y]]):[];
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  let distance=(event?.progress||0)*lengths.reduce((a,b)=>a+b,0),moving=points[0]||[0,0];
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const fraction=lengths[i]?distance/lengths[i]:0;moving=[points[i][0]+(points[i+1][0]-points[i][0])*fraction,points[i][1]+(points[i+1][1]-points[i][1])*fraction];break;}distance-=lengths[i];moving=points[i+1];}
  function step(next:number){const n=Math.max(0,Math.min(traceSteps.length-1,next));setTraceStarted(true);setPosition(n);setPlaying(false);setSelected(traceSteps[n].part);onSelect?.(traceSteps[n].part);}
  const packetX=phase<.36?145:phase<.7?145-(phase-.36)/.34*44:101;
  const packetY=phase<.36?158+phase/.36*46:phase<.7?204:204+(phase-.7)/.3*36;
  return <div className={`machine-world ${flow?'is-tracing':''}`} ref={root}>
    {trace&&<div className="machine-trace-controls"><div><span className="section-kicker">Example: write 32 to GPIOA at 0x50000018</span><strong>{flow?.title||'A C line can reach a real pin'}</strong></div><div className="trace-buttons"><button aria-label="Previous write step" disabled={traceStep<=0} onClick={()=>step(traceStep-1)}><ArrowLeft size={17}/></button><button className="primary" onClick={()=>{if(traceStep<0){step(0);setPlaying(true);}else step((traceStep+1)%traceSteps.length);}}><ArrowRight size={16}/>{traceStep<0?'Start trace':traceStep===traceSteps.length-1?'Replay trace':'Next step'}</button>{traceStarted&&<button aria-label={playing?'Pause write animation':'Play write animation'} onClick={()=>{if(position>=4)setPosition(0);setPlaying(!playing);}}>{playing?<Pause size={16}/>:<Play size={16}/>}</button>}<button aria-label="Replay write trace" onClick={()=>step(0)}><ArrowClockwise size={17}/></button></div></div>}
    <div className="machine-readout"><span>{explore?'Address selects':active?'This event uses':'Selected part'}: <strong>{flow?.part||highlighted}</strong>{explore&&!flow&&<> · address {Number.isFinite(explore.address)?'0x'+explore.address.toString(16).toUpperCase():'invalid'}</>}</span><span>{flow?'Step '+(traceStep+1)+' of '+traceSteps.length:'Choose a part to read what it does.'}</span></div>
    <svg className="machine diagram" viewBox="0 0 610 444" role="group" aria-label={`STM32C031 machine. Highlighted component: ${flow?.part||highlighted}.`}>
      <rect className="silicon" x="16" y="17" width="578" height="411" rx="14"/>
      <text x="34" y="39" className="svg-caption">STM32C031C6 · educational system map</text>
      <path className="bus-line" d="M145 158 V204 H500 V158 M55 204 H553 M101 204 V240 M231 204 V240 M361 204 V240 M500 204 V240 M101 313 V337 M231 313 V337 M361 313 V337 M500 313 V337"/>
      {traceStep>=1&&<path className="trace-route" d="M145 158 V204 H101 V240"/>}
      {traceStep===2&&<rect className="pipeline-progress" x={55} y={300} width={92*phase} height={4}/>}
      {traceStep===0&&<rect className="pipeline-progress" x={65} y={145} width={160*phase} height={4}/>}
      {traceStep===1&&<g className="moving-object" transform={`translate(${packetX.toFixed(3)} ${packetY.toFixed(3)})`}><rect className="write-packet" x={-17} y={-9} width={34} height={18} rx={3}/><text className="write-packet-value" x={0} y={4} textAnchor="middle">0x20</text></g>}
      <text x="245" y="188" className="svg-caption">ADDRESS + DATA BUS</text>
      {!flow&&points.length>0&&<path className="data-route" d={points.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ')}/>}
      {parts.map(p=><g key={p.name} className={`machine-part ${(flow?.part||highlighted)===p.name?'selected':''} ${selected===p.name?'inspected':''}`} role="button" tabIndex={0} aria-label={`Explore ${p.name}`} onClick={()=>select(p.name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.name);}}}>
        <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="6"/>
        <text x={p.x+p.w/2} y={p.y+31} textAnchor="middle" className="component-name">{p.name}</text>
        <text x={p.x+p.w/2} y={p.y+52} textAnchor="middle" className="component-detail">{p.label}</text>
        {p.name==='CPU'&&<text x={p.x+100} y={p.y+81} textAnchor="middle" className="component-detail">registers · instructions · flags</text>}
      </g>)}
      {!flow&&transfer&&points.length>0&&<g className="data-packet moving-object" data-from={transfer.from} data-to={transfer.to} transform={`translate(${moving[0].toFixed(3)} ${moving[1].toFixed(3)})`} aria-label={transfer.what}><rect x={-60} y={-11} width={120} height={22} rx={4}/><text x={0} y={4} textAnchor="middle">{transfer.what.length>18?transfer.what.slice(0,16)+'…':transfer.what}</text></g>}
      {traceStep===3&&<circle className="diagram-led on" cx={143} cy={268} r={8}/>}
    </svg>
    <div className="machine-caption" aria-live="polite"><strong>{flow?'CAUSE → EFFECT':transfer?'WHAT MOVES':explore?'WHY THIS ADDRESS':part.name}</strong><p>{flow?.detail||transfer&&<><b>{transfer.from} → {transfer.to}: {transfer.what}.</b> {transfer.why}</>||explore&&<><b>The program supplies the address; fixed hardware decoding selects its range.</b> {explore.detail} {end?'The highlighted route shows that match; this lookup does not execute a read or write.':'No implemented destination matches here, so no device route is highlighted.'}</>||part.detail}</p>{transfer&&<p><b>{part.name}:</b> {part.detail}</p>}</div>
  </div>;
}
