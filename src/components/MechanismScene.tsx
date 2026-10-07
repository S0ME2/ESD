import {useMemo} from 'react';
import {attitudeRun,balanceRun,lineRun,missionRun,navigationFrames,sumoRun} from '../models/applications';
import {sampleState} from './usePlayback';
import {BalanceGlyph,DiagramBlock as Block,DiagramGrid,DroneGlyph,DroneTopGlyph,RobotGlyph,ScopeTrace,Signal} from './TeachingDiagram';

const lerp=(a:number,b:number,p:number)=>a+(b-a)*p;
export function timerAt(t:number){
 const stage=Math.min(3,Math.floor(t*4)),p=t*4-stage;
 const count=stage===0?0:stage===2?Math.min(19999,1500+Math.floor(p*18500)):Math.min(1499,Math.floor(p*1500));
 return {count,high:count<1500,stage};
}
function Bits({value,x=40,y=215,mask=0}:{value:number;x?:number;y?:number;mask?:number}){
 return <g>{Array.from({length:8},(_,i)=><g key={i}><text className="diagram-small" x={x+i*46+19} y={y-12} textAnchor="middle">{7-i}</text><rect className={(mask>>(7-i))&1?'bit-cell selected':'bit-cell'} x={x+i*46} y={y} width={38} height={42} rx={4}/><text className="diagram-bit" x={x+i*46+19} y={y+27} textAnchor="middle">{(value>>(7-i))&1}</text></g>)}</g>;
}
function Meter({x,y,label,value,max=1,estimate=false}:{x:number;y:number;label:string;value:number;max?:number;estimate?:boolean}){
 return <g><text className="diagram-small" x={x} y={y-13}>{label}</text><rect className="meter-track" x={x} y={y} width={160} height={12} rx={3}/><rect className={estimate?'meter-fill estimate':'meter-fill'} x={x} y={y} width={Math.max(0,Math.min(160,value/max*160))} height={12} rx={3}/><text className="diagram-value" x={x+174} y={y+11}>{value.toFixed(5)}</text></g>;
}
function Note({title,value,y=62}:{title:string;value:string;y?:number}){return <g className="diagram-note"><text className="diagram-small" x={532} y={y}>{title}</text><text className="diagram-readout" x={532} y={y+31}>{value}</text></g>;}
function WordPacket({x,y,text,w=64}:{x:number;y:number;text:string;w?:number}){return <g className="word-packet moving-object" transform={`translate(${x.toFixed(3)} ${y.toFixed(3)})`}><rect x={-w/2} y={-14} width={w} height={28} rx={4}/><text x={0} y={4} textAnchor="middle">{text}</text></g>;}

export function MechanismScene({id,t,compact=false}:{id:number;t:number;compact?:boolean}){
 const stage=Math.min(3,Math.floor(t*4)),p=t*4-stage;
 const data=useMemo(()=>id===13?attitudeRun():id===14?missionRun():id===15?lineRun():id===16?navigationFrames():id===17?balanceRun('LQR'):id===18?sumoRun(true,true):null,[id]);
 if(id===0)return <>
  <Block x={40} y={70} w={220} h={118} title="Cortex-M0+" value="STR r0, [r1]" active={stage===0}><text className="diagram-small" x={56} y={161}>r0 = 0x20 · r1 = 0x50000018</text></Block>
  <Block x={480} y={38} w={270} title="SRAM" value="0x20000000"/><Block x={480} y={144} w={270} title="GPIOA · BSRR" value="0x50000018" active={stage>=1}/><Block x={480} y={250} w={270} title="Flash" value="0x08000000"/>
  <path className="diagram-wire" d="M260 129H355V80H480M355 129V292H480"/><Signal d="M260 129H355V186H480" progress={stage===0?p:1}/>
  <text className="diagram-small" x={286} y={350}>Address decoding selects GPIOA; bit 5 requests PA5 HIGH.</text>{stage===1&&<WordPacket x={lerp(367,442,p)} y={186} text="0x20"/>}{stage===3&&<WordPacket x={lerp(200,113,p)} y={lerp(366,326,p)} text="bit 5 = 1" w={90}/>}
  <g transform="translate(113 281)"><circle className={stage===3?'led-halo on':'led-halo'} r={38}/><circle className={stage===3?'diagram-led on':'diagram-led'} r={18}/><path className="diagram-wire" d="M-5 18v27M5 18v27"/></g><text className="diagram-label" x={154} y={278}>LD4</text><text className="diagram-small" x={154} y={300}>PA5 {stage===3?'HIGH':'LOW'}</text><Signal d="M750 186H780V366H113V326" progress={stage>=2?stage===2?p:1:0} active={stage>=2}/>
 </>;
 if(id===1){const committed=p>=.72,value=stage===0?0xA5:stage===1?(committed?0xA0:0xA5):stage===2?(committed?0xA1:0xA0):0xA1;return <g data-cpu-value={value} data-peripheral-value={stage===3&&committed?0xA1:0xA5}>
  <Block x={40} y={30} w={345} title="CPU working register · R0" value={['LDR: read 0xA5','BIC R0, mask 0x07','ORR R0, mask 0x01','STR: write 0xA1'][stage]} active/>
  <Block x={465} y={30} w={295} title="Peripheral · FLASH ACR" value={stage===3&&committed?'0xA1':'0xA5'}/><text className="diagram-small" x={481} y={136}>Address 0x40022000 · 32 bits</text>
  {(stage===0||stage===3)&&<><Signal d={stage===0?'M465 84H385':'M385 84H465'} progress={p}/><WordPacket x={stage===0?lerp(450,395,p):lerp(395,450,p)} y={84} text={stage===0?'0xA5':'0xA1'}/></>}
  <text className="diagram-label" x={40} y={169}>Target bits 2:0 → mask 00000111 = 0x07 = 7</text>
  <text className="diagram-small" x={40} y={195}>Low 8-bit window of a 32-bit register; bits 31:8 also preserved.</text>
  <Bits value={value} mask={7} x={40} y={230}/><text className="diagram-value" x={465} y={247}>R0 = 0x{value.toString(16).toUpperCase()}</text>
  <text className="diagram-small" x={465} y={275}>{stage===1?'BIC = AND with NOT mask':stage===2?'OR sets the selected 1 bit':'Peripheral stays 0xA5 until STR'}</text>
  {stage===1&&<><text className="diagram-value" x={40} y={309}>NOT 00000111 = 11111000</text><text className="diagram-small" x={40} y={335}>AND: 1 keeps an input bit; 0 clears it.</text><text className="diagram-value" x={40} y={359}>10100101 AND 11111000 = 10100000</text><WordPacket x={lerp(672,437,p)} y={309} text="~0x07" w={86}/></>}
  {stage===2&&<><text className="diagram-value" x={40} y={309}>10100000 OR 00000001 = 10100001</text><text className="diagram-small" x={40} y={335}>OR: 1 sets a bit; 0 keeps it. 0xA0 → 0xA1.</text><WordPacket x={lerp(672,437,p)} y={359} text="0x01" w={72}/></>}
  {(stage===0||stage===3)&&<text className="diagram-small" x={40} y={332}>{stage===0?'LDR copies the value into R0; it does not edit FLASH ACR.':'STR commits the CPU copy to the peripheral at the end of the transfer.'}</text>}
  <text className="diagram-small" x={40} y={386}>{stage===1||stage===2?(committed?'Instruction committed: bits changed together.':'Operand moves to CPU; bits change together when instruction commits.'):'Arrow carries a value between two distinct stores.'}</text>
 </g>;}
 if(id===2){const names=['Preprocess','Compile + assemble','Link','Load + startup'];return <>
  {names.map((name,i)=><Block key={name} x={32+i*193} y={62} w={174} h={140} title={name} value={['main.c','main.o','firmware.elf','main()'][i]} active={stage===i}><text className="diagram-small" x={48+i*193} y={164}>{['include + macros','instructions + symbols','resolve + place','initialize RAM'][i]}</text><rect className="pipeline-track" x={48+i*193} y={180} width={142} height={4}/><rect className="pipeline-progress" x={48+i*193} y={180} width={142*(i<stage?1:i===stage?p:0)} height={4}/></Block>)}
  <WordPacket x={32+stage*193+lerp(35,139,p)} y={226} text={["expanded C","object bytes","linked image","RAM ready"][stage]} w={128}/><text className="diagram-label" x={40} y={263}>One program, two memory destinations</text><Block x={40} y={278} w={344} title="Flash · executable + constants" value=".text    .rodata    .data load image"/><Block x={416} y={278} w={344} title="SRAM · working state" value=".data    .bss    stack"/>
 </>;}
 if(id===3){const main=stage===0?(p>=.7?'10':'—'):stage===1?(p>=.7?'11':'10'):'11',handler=stage===2?(p<.33?'10':p<.67?'11':'11 (saved)'):'—',ram=stage>2||stage===2&&p>=.67?11:10;return <g data-main-copy={main} data-handler-copy={handler} data-ram-value={ram}>
  <text className="diagram-label" x={40} y={38}>counter++ = READ → ADD 1 → STORE</text>
  <text className="diagram-small" x={40} y={64}>Interrupt window: after main reads 10, before main stores its result.</text>
  <Block x={40} y={100} w={215} title="Main · saved CPU copy" value={`R0 = ${main}`} active={stage!==2}/>
  <Block x={292} y={100} w={218} title="Shared RAM · counter" value={String(ram)} active={stage===0||stage>=2}/>
  <Block x={545} y={100} w={215} title="Handler · CPU copy" value={handler} active={stage===2}/>
  <Signal d={stage===0?'M292 142H255':stage===2?(p<.67?'M510 142H545':'M545 142H510'):'M255 142H292'} progress={stage===2?(p*3)%1:p} active={stage!==1}/>
  {stage===0&&<WordPacket x={lerp(281,265,p)} y={142} text="10" w={40}/>}
  {stage===1&&<WordPacket x={lerp(147,147,p)} y={lerp(254,197,p)} text="+1" w={40}/>}
  {stage===2&&<WordPacket x={p<.33?lerp(522,532,p*3):p<.67?650:lerp(532,522,(p-.67)*3)} y={p<.33||p>=.67?142:lerp(251,194,(p-.33)*3)} text={p<.33?'10':p<.67?'+1':'11'} w={40}/>}
  {stage===3&&<WordPacket x={lerp(265,281,p)} y={142} text="11" w={40}/>}

  <text className="diagram-label" x={40} y={248}>{['Main READ: RAM 10 → private R0 10','Main ADD: private 10 + 1 → 11; RAM still 10',p<.33?'Handler READ: RAM is still 10':p<.67?'Handler ADD: its own 10 + 1 → 11':'Handler STORE: 11 → RAM; main copy still 11','Main STORE: saved 11 replaces RAM 11'][stage]}</text>
  <text className="diagram-small" x={40} y={282}>{stage===2?'Main is paused. Exception entry preserves its registers; the handler cannot update main’s saved copy.':stage===3?'Both increments started from 10. Neither computed 11 + 1, so RAM never becomes 12.':'Changing a CPU copy does not change RAM. The uncommitted update can be interrupted.'}</text>
  <text className="diagram-value" x={40} y={324}>{stage===3?'Two increments: expected 12 · actual 11 · one update lost':'RAM and private copies are separate values'}</text>
  <text className="diagram-small" x={40} y={368}>Protect the whole READ–ADD–STORE sequence. volatile does not make it atomic.</text>
 </g>;}
 if(id===4){const copied=stage>1?4:stage===1?Math.floor(p*4):0,zeroed=stage>2?4:stage===2?Math.floor(p*4):0;return <>
  <text className="diagram-label" x={40} y={48}>Reset_Handler prepares the C runtime</text>
  <Block x={40} y={80} w={260} title="Flash · initial state" value="Vectors + .data load image"/>
  {[12,34,56,78].map((value,i)=><g key={i}><rect className="memory-cell valid" x={40+i*65} y={184} width={56} height={48} rx={4}/><text className="diagram-value" x={68+i*65} y={214} textAnchor="middle">{value}</text></g>)}
  <Signal d="M300 123H450" progress={stage===1?p:stage>1?1:0} active={stage>=1}/>
  {stage===1&&<WordPacket x={lerp(326,424,(p*4)%1)} y={123} text={String([12,34,56,78][Math.min(3,Math.floor(p*4))])} w={44}/>}
  <Block x={450} y={80} w={310} title="SRAM · .data" value="Initialized C variables" active={stage===1}/>
  {[12,34,56,78].map((value,i)=><g key={i}><rect className={i<copied?'memory-cell valid':'memory-cell'} x={450+i*78} y={184} width={68} height={48} rx={4}/><text className="diagram-value" x={484+i*78} y={214} textAnchor="middle">{i<copied?value:'?'}</text></g>)}
  {stage===2&&<WordPacket x={450+Math.min(3,Math.floor(p*4))*78+34} y={lerp(252,288,(p*4)%1)} text="0" w={30}/>}<text className="diagram-label" x={450} y={272}>SRAM · .bss</text>{[0,1,2,3].map(i=><g key={i}><rect className={i<zeroed?'memory-cell valid':'memory-cell'} x={450+i*78} y={292} width={68} height={48} rx={4}/><text className="diagram-value" x={484+i*78} y={322} textAnchor="middle">{i<zeroed?'0':'?'}</text></g>)}
  <text className="diagram-small" x={40} y={264}>Vector fetch supplies the initial MSP and PC.</text><text className="diagram-value" x={40} y={295}>MSP = 0x20003000</text><text className="diagram-label" x={40} y={331}>{stage===3?'Runtime ready → main()':'PC → Reset_Handler'}</text>{stage===0&&<WordPacket x={lerp(92,245,p)} y={370} text="vector words" w={108}/>} {stage===3&&<WordPacket x={lerp(240,356,p)} y={370} text="enter main()" w={112}/>}
 </>;}
 if(id===5)return <>
  <text className="diagram-label" x={40} y={40}>A falling edge requests CPU attention</text><text className="diagram-small" x={45} y={85}>3.3 V</text><path className="diagram-wire" d="M70 95v20l-7 5 14 10-14 10 14 10-7 5v36H210"/>
  <circle className="wire-junction" cx={70} cy={191} r={4}/><path className="diagram-switch" d={`M70 191L${stage===0?lerp(94,70,p):70} 232M70 239v31M52 270h36M59 277h22M65 284h10`}/><text className="diagram-small" x={35} y={325}>Active-low button</text>
  <Block x={210} y={140} w={165} title="EXTI" value={stage===3&&p>=.7?'FPR1 bit 1 = 0':stage>=1?'FPR1 bit 1 = 1':'PA1 falling edge'} active={stage===1}/><Block x={417} y={140} w={165} title="NVIC" value="IRQ 5 enabled" active={stage===2}/><Block x={624} y={140} w={142} title="CPU" value={stage===3&&p>=.7?'Clear + return':'Vector 21'} active={stage===3}/>
  <Signal d="M375 182H417" progress={stage>=1?stage===1?p:1:0}/><Signal d="M582 182H624" progress={stage>=2?stage===2?p:1:0}/>
  {stage===3&&<WordPacket x={lerp(700,308,p)} y={370} text={p<.7?"clear FPR1":"resume main"} w={105}/>}<path className="diagram-wire" d="M220 306H760"/><path className="diagram-trace" d={`M220 264H${stage===0?220+p*130:350}V306H${stage===0?350:350+(stage-1+p)*136}`}/><text className="diagram-small" x={220} y={344}>PA1: high → low. Clear the source before returning.</text>
 </>;
 if(id===6){const {count,high}=timerAt(t),cursor=58+count/20000*684;return <>
  <Block x={40} y={32} w={220} title="One tick = 1 microsecond" value="48 MHz ÷ (47 + 1)"><path className="diagram-wire" d="M56 105H244"/><g className="moving-object" transform={`translate(${(56+t*8%1*188).toFixed(3)} 105)`}><circle className="diagram-sample" r={3}/></g></Block><Block x={290} y={32} w={220} title="Counter (CNT) · ticks so far" value={count.toLocaleString('en-US')} active/><Block x={540} y={32} w={220} title="Output pin PA6" value={high?'ON (HIGH)':'OFF (LOW)'} active={high}/>
  <DiagramGrid x={58} y={171} w={684} h={142} step={57}/><path className="diagram-axis" d="M58 169V314H742"/><text className="diagram-small" x={32} y={201}>1</text><text className="diagram-small" x={32} y={296}>0</text>
  <path className="diagram-wave-fill" d="M58 290V194H109.3V290Z"/><path className="diagram-wave" d="M58 290V194H109.3V290H742"/><g className="moving-object" transform={`translate(${cursor.toFixed(3)} 0)`}><path className="diagram-cursor" d="M0 165V317"/><circle className="diagram-sample" cx={0} cy={high?194:290} r={5}/></g>
  <text className="diagram-small" x={117} y={185}>ON for 1.5 ms</text><text className="diagram-small" x={340} y={280}>OFF for the remaining 18.5 ms</text><text className="diagram-value" x={58} y={344}>0</text><text className="diagram-value" x={112} y={344}>1.5 ms</text><text className="diagram-value" x={686} y={344}>20 ms</text><text className="diagram-small" x={220} y={378}>{stage===3?'Next pulse · counter started again':`Time into this period: ${(count/1000).toFixed(3)} ms`}</text>
 </>;}
 if(id===7){const registers=['R4–R7','R8–R11','R0–R3','R12 / LR / PC / xPSR'];return <>
  <Block x={295} y={35} w={210} h={134} title="Cortex-M0+" value={stage===0?'Task A executing':stage===3?'Task B executing':'PendSV handler'} active>{(stage===0||stage===3)&&<WordPacket x={lerp(329,471,p)} y={138} text="PC" w={40}/>}</Block>
  <text className="diagram-label" x={40} y={57}>Task A · PSP</text><text className="diagram-label" x={565} y={57}>Task B · PSP</text>
  {registers.map((r,i)=><g key={r}><rect className={stage>1||stage===1&&p>i/4?'stack-cell saved':'stack-cell'} x={40} y={83+i*48} width={198} height={41} rx={4}/><text className="diagram-value" x={56} y={110+i*48}>{r}</text><rect className={stage===3||stage===2&&p>i/4?'stack-cell restored':'stack-cell saved'} x={565} y={83+i*48} width={198} height={41} rx={4}/><text className="diagram-value" x={581} y={110+i*48}>{r}</text></g>)}
  <Signal d="M295 78H265V170H238" progress={stage===1?p:stage>1?1:0}/><Signal d="M565 170H534V78H505" progress={stage===2?p:stage===3?1:0}/>
  <Block x={295} y={218} w={210} title="Handler stack · MSP" value="Handler uses MSP"/><text className="diagram-small" x={40} y={357}>Save A → select B → restore B. Only one task executes at a time.</text>
 </>;}
 if(id===8){const bits=[0,1,0,0,0,0,0,1,0,1],bit=stage===0?0:stage===1?Math.min(8,1+Math.floor(p*8)):9,cursor=40+(stage===0?p:stage===1?1+p*8:stage===2?9+p:10)*72;return <>
  <text className="diagram-label" x={40} y={42}>TX sends 0x41, least-significant bit first</text><text className="diagram-small" x={40} y={69}>115200 baud · 8N1 · 8.68 μs per bit</text>
  {bits.map((value,i)=><g key={i}><rect className={i===bit?'uart-slot active':'uart-slot'} x={40+i*72} y={99} width={72} height={140}/><text className="diagram-small" x={76+i*72} y={267} textAnchor="middle">{i===0?'START':i===9?'STOP':'b'+(i-1)}</text><text className="diagram-value" x={76+i*72} y={292} textAnchor="middle">{value}</text></g>)}
  <path className="diagram-wave" d={bits.map((v,i)=>`${i?'L':'M'}${40+i*72} ${v?125:217}H${40+(i+1)*72}`).join(' ')}/><g className="moving-object" transform={`translate(${Math.min(759,cursor).toFixed(3)} 0)`}><path className="diagram-cursor" d="M0 99V239"/></g>
  {stage===3&&<><Signal d="M72 319H465" progress={p}/><WordPacket x={lerp(100,426,p)} y={319} text="0x41"/><text className="diagram-small" x={40} y={315}>UART receive register → bounded RAM buffer</text></>}<text className="diagram-label" x={40} y={353}>{stage===3?'RX buffer holds 0x41 for the parser':`Receiver has sampled ${Math.min(8,Math.max(0,bit-1))} data bits`}</text><text className="diagram-value" x={565} y={353}>01000001 = 0x41</text>
 </>;}
 if(id===9){const labels=['0xD0 · write','0x75 · register','0xD1 · read','0x68 · result'];return <>
  <Block x={40} y={30} w={285} title="I²C controller" value="Open drain + pull-ups"/><Block x={475} y={30} w={285} title="MPU6050" value="7-bit address 0x68"/>
  <text className="diagram-label" x={40} y={157}>{labels[stage]}</text><text className="diagram-small" x={540} y={157}>{stage===3?'NACK → STOP':'ACK: SDA low on clock 9'}</text>
  <text className="diagram-small" x={40} y={207}>SCL</text><text className="diagram-small" x={40} y={282}>SDA</text><DiagramGrid x={98} y={176} w={648} h={132} step={36}/>
  <path className="diagram-wave" d={Array.from({length:18},(_,i)=>`${i?'L':'M'}${98+i*36} ${i%2?182:221}H${134+i*36}`).join(' ')}/><path className="diagram-estimate" d={Array.from({length:9},(_,i)=>`${i?'L':'M'}${98+i*72} ${(i===8?stage===3:((stage===0?0xD0:stage===1?0x75:stage===2?0xD1:0x68)>>(7-i))&1)?261:300}H${170+i*72}`).join(' ')}/>
  <g className="moving-object" transform={`translate(${(98+p*648).toFixed(3)} 0)`}><path className="diagram-cursor" d="M0 169V314"/></g><text className="diagram-small" x={98} y={348}>8 data clocks</text><text className="diagram-small" x={681} y={348}>{stage===3?'9: NACK':'9: ACK'}</text>
 </>;}
 if(id===10){const completed=stage===3?8:stage===2?Math.floor(p*8):0,sample=1023+Math.min(7,Math.floor(p*8));return <g data-completed-items={completed} data-adc-value={stage===3?1030:stage===2?sample:stage>0?1023:undefined}>
  <Block x={40} y={42} w={200} title="ADC data register" value={stage===3?'Last test sample: 1030':stage===2?`Sample ${sample}`:stage>0?'Test sample: 1023':'Waiting for conversion'} active={stage===1}/><Block x={300} y={42} w={200} title="DMA channel" value="Source → destination" active={stage===2}/><Block x={560} y={42} w={200} title="CPU" value={stage===3?'Consume finished buffer':'Independent work'} active={stage===3}/>
  <Signal d="M240 84H300" progress={stage===1?p:stage>1?1:0}/><Signal d="M500 84H529V218H480" progress={stage===2?p:stage>2?1:0}/>
  {stage===0&&<WordPacket x={lerp(660,399,p)} y={27} text="configure 8 items" w={141}/>}{stage===1&&<WordPacket x={lerp(253,284,p)} y={84} text="1023" w={44}/>}{stage===2&&<WordPacket x={40+Math.min(7,Math.floor(p*8))*91+39} y={lerp(184,208,(p*8)%1)} text={String(sample)} w={48}/>}{stage===3&&<WordPacket x={lerp(404,660,p)} y={184} text="completed region" w={145}/>}<text className="diagram-small" x={40} y={146}>Injected test sequence: 1023…1030, not voltage-derived. DMA only copies.</text><text className="diagram-label" x={40} y={166}>SRAM · destination buffer</text>{Array.from({length:8},(_,i)=><g key={i}><rect className={i<completed?'memory-cell valid':'memory-cell'} x={40+i*91} y={214} width={79} height={61} rx={5}/><text className="diagram-value" x={79+i*91} y={250} textAnchor="middle">{i<completed?1023+i:'?'}</text><text className="diagram-small" x={79+i*91} y={299} textAnchor="middle">[{i}]</text></g>)}
  <text className="diagram-small" x={40} y={328}>Only a completed region is ready for software consumption.</text><text className="diagram-small" x={40} y={361}>8 injected samples → 8 transfers; CPU reads only after completion.</text>
 </g>;}
 if(id===11){const remaining=stage<2?1-(p*.6):stage===2?1-p:0;return <>
  <Block x={40} y={42} w={220} title="Sensor task" value="heartbeat advances" active={stage<2}/><Block x={290} y={42} w={220} title="Control task" value={stage<2?'heartbeat advances':'STALE · no progress'} active={stage<2}/><Block x={540} y={42} w={220} title="Supervisor" value={stage<2?'refresh permitted':'refresh withheld'} active={stage===1}/>
  <text className="diagram-label" x={40} y={190}>Independent watchdog · time remaining</text><rect className="watchdog-track" x={40} y={214} width={720} height={48} rx={6}/><rect className={stage>=2?'watchdog-fill stalled':'watchdog-fill'} x={40} y={214} width={720*remaining} height={48} rx={6}/>
  <text className="diagram-value" x={40} y={310}>{stage===3?'RESET → inspect reset-cause flags':stage===2?'Essential task stalled. Counter continues toward zero.':'Fresh heartbeats authorize refresh.'}</text><Signal d="M400 126V145H650V126" progress={p} active={stage<2}/>{stage===3&&<WordPacket x={lerp(730,65,p)} y={368} text="reset → startup" w={145}/>}
 </>;}
 if(id===12){const written=stage>1?8:stage===1?Math.floor(p*8):0,shown=stage===3&&p>=.72;return <>
  {[0,1].map(n=><g key={n}><text className="diagram-label" x={40+n*416} y={49}>{n?'OLED · display RAM':'SRAM · framebuffer'}</text><rect className="oled-bezel" x={40+n*416} y={77} width={304} height={191} rx={12}/><rect className="oled-screen" x={53+n*416} y={90} width={278} height={164} rx={4}/>{Array.from({length:96},(_,i)=><rect key={i} className="oled-pixel" x={67+n*416+i%12*21} y={106+Math.floor(i/12)*17} width={2} height={2}/>)}
  {Array.from({length:8},(_,i)=><rect key={'sprite'+i} className="oled-sprite" x={78+n*416+(n?(shown?7:0):i<written?7:0)*27} y={164+i*2.5} width={19} height={2}/>)}
  <text className="diagram-small" x={40+n*416} y={298}>{n?'Received bytes update visible pixels':'Drawing replaces whole pixel bytes'}</text></g>)}
  {stage===1&&<WordPacket x={lerp(388,276,(p*8)%1)} y={164+Math.min(7,Math.floor(p*8))*2.5} text="byte" w={45}/>}
  <Signal d="M344 173H456" progress={stage===2?p:stage>2?1:0} active={stage>=2}/>{stage===2&&<WordPacket x={lerp(374,426,p)} y={173} text="pixel bytes" w={90}/>}<text className="diagram-value" x={356} y={143}>I²C</text>
  {stage===3&&<WordPacket x={lerp(490,681,p)} y={232} text="final byte" w={85}/>}
  <path className="diagram-wire" d="M50 329H340"/><g className="moving-object" transform={`translate(${stage===0?lerp(60,330,p):330} 329)`}><rect className="sensor-bar" x={-6} y={-6} width={12} height={12} rx={2}/></g><text className="diagram-small" x={382} y={334}>Position → pixel bytes → transfer → display</text><text className="diagram-small" x={40} y={378}>128 × 64 monochrome pixels = 1024 bytes. Whole bytes commit at discrete times.</text>
 </>;}
 if(id===13&&data){const states=data as ReturnType<typeof attitudeRun>,s=sampleState(states,t*(states.length-1)),i=Math.floor(t*(states.length-1));return <>
  <DiagramGrid x={40} y={45} w={440} h={240}/><path className="diagram-zero" d="M40 176H480"/><text className="diagram-small" x={40} y={31}>PHYSICAL ROLL</text><DroneGlyph angle={s.angle} spin={t*150} x={260} y={167}/><path className="diagram-estimate" d={`M145 ${compact?215:246}H375`} transform={`rotate(${s.estimate.toFixed(3)} 260 ${compact?215:246})`}/><text className="diagram-small" x={40} y={285}>Solid body: truth · dashed: estimate</text>
  <g className="physical-readouts" transform={compact?'translate(-492 370)':undefined}><Note title="Truth / estimated roll" value={`${s.angle.toFixed(1)}° / ${s.estimate.toFixed(1)}°`}/><Note title="Feedback correction" value={s.u.toFixed(2)} y={139}/>{s.motors.map((v,j)=><Meter key={j} x={532} y={230+j*(compact?56:44)} label={`M${j} · Δ ${v-.35>=0?'+':''}${(v-.35).toFixed(5)}`} value={v}/>)}</g>
  <ScopeTrace values={states.slice(0,i+1).map(v=>v.angle)} x={40} y={307} w={440} h={52} label="True roll over simulated time"/>
 </>;}
 if(id===14&&data){const states=data as ReturnType<typeof missionRun>,s=sampleState(states,t*(states.length-1)),i=Math.floor(t*(states.length-1));return <>
  <DiagramGrid x={50} y={50} w={420} h={270} step={30}/><path className="diagram-axis" d="M50 50V320H470"/>{[[0,0],[12,0],[12,10],[0,10]].map(([x,y],j)=><g key={j}><circle className="waypoint" cx={70+x*30} cy={305-y*24} r={6}/><text className="diagram-small" x={80+x*30} y={294-y*24}>{j?'WP'+j:'HOME'}</text></g>)}
  <polyline className="diagram-trace" points={[...states.slice(0,i+1),s].map(v=>`${70+v.x*30},${305-v.y*24}`).join(' ')}/><circle className="target-ring" cx={70+s.target[0]*30} cy={305-s.target[1]*24} r={17}/><DroneTopGlyph x={70+s.x*30} y={305-s.y*24} spin={t*1000} scale={.6}/>
  <g className="physical-readouts" transform={compact?'translate(-492 370)':undefined}><Note title="Mission state" value={s.mode}/><Note title="Position · m" value={`${s.x.toFixed(1)}, ${s.y.toFixed(1)}`} y={149}/><Note title="Requested tilt" value={`${s.tilt.toFixed(1)}°`} y={238}/></g><text className="diagram-small" x={50} y={368}>{compact?'Trail: motion · ring: target':'Trail: actual motion · ring: current target'}</text>
 </>;}
 if(id===15&&data){const states=data as ReturnType<typeof lineRun>,s=sampleState(states,t*(states.length-1)),i=Math.floor(t*(states.length-1)),dy=270/Math.max(1200,...states.map(v=>v.y)),dx=90/Math.max(65,...states.map(v=>Math.abs(v.x)));return <>
  <DiagramGrid x={40} y={40} w={420} h={290} step={35}/><path className="line-tape" d={Array.from({length:120},(_,j)=>`${j?'L':'M'}${240-45*Math.sin(j/dy*2.25/140)*dx},${325-j*2.25}`).join(' ')}/><polyline className="diagram-trace" points={[...states.slice(0,i+1),s].map(v=>`${240-v.x*dx},${325-v.y*dy}`).join(' ')}/><RobotGlyph x={240-s.x*dx} y={325-s.y*dy} angle={-s.heading*180/Math.PI} scale={.7}/>
  <g className="physical-readouts" transform={compact?'translate(-465 370)':undefined}><text className="diagram-label" x={505} y={47}>Sensor darkness</text>{s.readings.map((v,j)=><g key={j}><rect className="sensor-track" x={509+j*35} y={91} width={23} height={125} rx={3}/><rect className="sensor-bar" x={509+j*35} y={216-v*.125} width={23} height={v*.125} rx={3}/><text className="diagram-value" x={520+j*35} y={241} textAnchor="middle">{j}</text></g>)}
  <text className="diagram-small" x={505} y={273}>Error: {s.error===null?'unknown':s.error.toFixed(1)+' mm'}</text><text className="diagram-value" x={505} y={310}>L {s.left.toFixed(0)} / R {s.right.toFixed(0)}</text><text className="diagram-small" x={505} y={337}>Wheel speeds · mm/s</text></g><text className="diagram-small" x={40} y={373}>{compact?'Tape → sensors → steering':'Tape → sensors → steering → motion'}</text>
 </>;}
 if(id===16&&data){const states=data as ReturnType<typeof navigationFrames>,s=sampleState(states,t*(states.length-1)),next=s.plan[1]||s.pose,angle=Math.atan2(next[1]-s.pose[1],next[0]-s.pose[0])*180/Math.PI+90;return <>
  <text className="diagram-small" x={40} y={32}>ROBOT BELIEF · unknown begins traversable</text>{Array.from({length:84},(_,i)=><rect className={s.belief.has(`${i%12},${Math.floor(i/12)}`)?'map-cell wall':'map-cell'} key={i} x={40+i%12*36} y={60+Math.floor(i/12)*38} width={35} height={37} rx={2}/>)}
  <polyline className="diagram-route" points={s.plan.map(([x,y])=>`${58+x*36},${79+y*38}`).join(' ')}/><RobotGlyph x={58+s.pose[0]*36} y={79+s.pose[1]*38} angle={angle} scale={.55}/><g className="physical-readouts" transform={compact?'translate(-492 370)':undefined}><Note title="Known occupied cells" value={String(s.belief.size)}/><Note title="Current route" value={`${s.plan.length} cells`} y={163}/><text className="diagram-small" x={532} y={269}>New observations</text><text className="diagram-small" x={532} y={compact?302:292}>can invalidate a route.</text></g><text className="diagram-small" x={40} y={370}>{compact?'Map: observed evidence':'The map represents evidence, not the complete world.'}</text>
 </>;}
 if(id===17&&data){const states=data as ReturnType<typeof balanceRun>,s=sampleState(states,t*(states.length-1)),i=Math.floor(t*(states.length-1)),x=Math.max(100,Math.min(455,270+s.x*180));return <>
  <DiagramGrid x={40} y={50} w={440} h={236}/><path className="diagram-ground" d="M40 287H480"/><path className="diagram-estimate" d="M270 50V286"/><BalanceGlyph x={x} y={264} angle={s.angle} spin={s.x*700}/><g className="physical-readouts" transform={compact?'translate(-492 370)':undefined}><Note title="Body angle" value={`${s.angle.toFixed(2)}°`}/><Note title="Axle position" value={`${s.x.toFixed(3)} m`} y={157}/><Note title="Motor voltage" value={`${s.volts.toFixed(2)} V`} y={252}/></g><ScopeTrace values={states.slice(0,i+1).map(v=>v.angle)} x={40} y={310} h={43} w={440} label="LQR · angle response"/>
 </>;}
 if(id===18&&data){const states=data as ReturnType<typeof sumoRun>,s=sampleState(states,t*(states.length-1));return <>
  <circle className="sumo-outside" cx={253} cy={190} r={160}/><circle className="sumo-boundary" cx={253} cy={190} r={148}/><circle className="sumo-floor" cx={253} cy={190} r={134}/><path className="sumo-center" d="M240 190H266M253 177V203"/>
  {s.bodies.map((b,j)=><g key={j}><path className="sensor-cone" d="M0 0L95 -45A105 105 0 0 1 95 45Z" transform={`translate(${253+b.x*340} ${190-b.y*340}) rotate(${-b.heading*180/Math.PI})`}/><RobotGlyph x={253+b.x*340} y={190-b.y*340} angle={90-b.heading*180/Math.PI} scale={.63} secondary={j===1} label={String(j+1)}/></g>)}
  <g className="physical-readouts" transform={compact?'translate(-492 370)':undefined}><Note title="Robot 1" value={s.commands[0].state}/><Note title="Robot 2" value={s.commands[1].state} y={161}/><text className="diagram-small" x={532} y={261}>Range · edge · contact</text><text className="diagram-small" x={532} y={288}>Cones show sensor reach.</text></g><text className="diagram-small" x={40} y={381}>{compact?'Robots act on sensor evidence.':'Strategies receive sensor snapshots, not opponent coordinates.'}</text>
 </>;}
 return <>
  <Block x={40} y={48} w={260} title="Sensor owner" value="Publish coherent snapshot" active={stage===0}/><Block x={500} y={48} w={260} title="Control task" value="Check age + validity" active={stage===1}/><Block x={500} y={255} w={260} title="Actuator owner" value="Apply permitted command" active={stage===2}/><Block x={40} y={255} w={260} title="Supervisor" value="Require independent progress" active={stage===3}/>
  <Signal d="M300 90H500" progress={stage===0?p:stage>0?1:0}/><Signal d="M630 132V255" progress={stage===1?p:stage>1?1:0}/><Signal d="M500 296H300" progress={stage===2?p:stage>2?1:0}/><Signal d="M170 255V132" progress={stage===3?p:0}/><text className="diagram-small" x={330} y={76}>input snapshot</text><text className="diagram-small" x={649} y={195}>output request</text><text className="diagram-small" x={335} y={323}>heartbeat</text><text className="diagram-small" x={186} y={195}>health check</text>
 </>;
}
