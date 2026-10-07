import type { Frame } from '../course/types';
export const hex = (n:number,width=2) => '0x'+(n>>>0).toString(16).toUpperCase().padStart(width,'0');
export function uartBits(byte:number):number[] { return [1,0,...Array.from({length:8},(_,i)=>(byte>>i)&1),1,1]; }
export function checksum(body:string):number { return Array.from(body).reduce((x,c)=>x^c.charCodeAt(0),0)&255; }
export function makeFrame(body:string):string { return '$'+body+'*'+checksum(body).toString(16).toUpperCase().padStart(2,'0'); }
export function checkFrame(line:string):{ok:boolean;reason:string;body:string} {
 const bad=(reason:string)=>({ok:false,reason,body:''});
 if (!line.startsWith('$')) return bad('NODOLLAR');
 const star=line.indexOf('*');if(star<0)return bad('NOSTAR');
 const cs=line.slice(star+1,star+3);if(!/^[0-9a-f]{2}$/i.test(cs))return bad('BADHEX');
 const body=line.slice(1,star);if(checksum(body)!==parseInt(cs,16))return bad('CHECKSUM');
 return {ok:true,reason:'ACK',body};
}
export function receiveBurst(text:string,capacity:number) { const bytes=Array.from(text); return {queue:bytes.slice(0,capacity),dropped:Math.max(0,bytes.length-capacity)}; }
export function adcCode(volts:number,reference=3.3):number {if(reference<=0||!Number.isFinite(volts))throw Error('Invalid ADC input');return Math.min(4095,Math.max(0,Math.floor(volts/reference*4096)));}
export function qRaw(value:number,fraction=15):number {const lo=fraction===15?-32768:-2147483648,hi=fraction===15?32767:2147483647;return Math.max(lo,Math.min(hi,Math.round(value*2**fraction)));}
export function q15Mul(a:number,b:number):number { return Math.max(-32768,Math.min(32767,Math.floor((a*b+16384)/32768))); }
export function q15Add(a:number,b:number,saturate=true):number { const sum=a+b;return saturate?Math.max(-32768,Math.min(32767,sum)):((sum+32768)&65535)-32768; }
export function iwdgMs(pr:number,rlr:number,lsi=32000):number { if(pr<0||pr>6||rlr<0||rlr>4095||lsi<=0)throw Error('Invalid watchdog configuration');return (rlr+1)*(4*2**pr)/lsi*1000; }
export type TaskState='ready'|'blocked'|'sleeping';
export interface Task {name:string;priority:number;state:TaskState;}
export function pickTask(tasks:Task[],current:number):number { let best=-1;for(let i=1;i<=tasks.length;i++){const k=(current+i)%tasks.length;if(tasks[k].state==='ready'&&(best<0||tasks[k].priority>tasks[best].priority))best=k;}return best; }
export function inversion(inherit:boolean,mediumWork=8,lowWork=3) {
 const result:{runner:string;lowPriority:number;high:string;owner:string;detail:string}[]=[];
 result.push({runner:'Low',lowPriority:1,high:'sleeping',owner:'Low',detail:'Low acquired the mutex before High woke.'});
 result.push({runner:'High',lowPriority:inherit?3:1,high:'blocked',owner:'Low',detail:'High tries to lock; it blocks. '+(inherit?'Low borrows priority 3.':'Low stays at priority 1.')});
 const run=(runner:string,count:number)=>{for(let i=0;i<count;i++)result.push({runner,lowPriority:inherit?3:1,high:'blocked',owner:'Low',detail:runner==='Medium'?'Medium never needs the mutex, but delays its owner.':'Low completes one unit of its remaining critical work.'});};
 if(!inherit)run('Medium',mediumWork);run('Low',lowWork);
 result.push({runner:'Low',lowPriority:1,high:'ready',owner:'none',detail:'Unlock releases mutex, restores base priority, and wakes High.'});
 result.push({runner:'High',lowPriority:1,high:'running',owner:'High',detail:'High acquires the now-free mutex and makes progress.'});
 return result;
}
export function contextFrames():Frame[] {return [
 {title:'Task A running',detail:'Thread mode uses A’s PSP. PC and registers belong to A.',active:'CPU',values:{CPU:'A',PSP:'A top',MSP:'handler stack',R4:41,PC:'A loop'}},
 {title:'SysTick arrives',detail:'Hardware saves r0–r3, r12, LR, PC, xPSR on A’s process stack; handler executes on MSP.',active:'NVIC',transfer:{from:'CPU',to:'Stacks',what:'A: r0–r3, r12, LR, PC, xPSR',why:'Exception entry preserves the interrupted task before handler execution.'},values:{CPU:'SysTick',PSP:'A top − 32',MSP:'handler stack',R4:41,PC:'SysTick_Handler'}},
 {title:'Scheduler chooses B',detail:'Sleeping B is now ready and has higher priority. ICSR.PENDSVSET requests a switch; a request is not yet a switch.',active:'NVIC',code:'SCB->ICSR = SCB_ICSR_PENDSVSET_Msk;',values:{CPU:'SysTick',PSP:'A hardware frame',R4:41,PC:'schedule()'}},
 {title:'PendSV saves the rest',detail:'After SysTick completes, lowest-priority PendSV stores A’s r4–r11. High registers move through r4–r7 on Thumb-1.',active:'SRAM',transfer:{from:'CPU',to:'Stacks',what:'A: r4–r11',why:'PendSV saves the remaining task registers before selecting B.'},code:'mrs r0, psp\nsubs r0, #32\nstmia r0!, {r4-r7}',values:{CPU:'PendSV',PSP:'A hardware frame',saved:'A: 16 words',R4:41}},
 {title:'Choose B’s stack',detail:'B’s saved stack pointer replaces A’s. B’s r4–r11 are restored; PSP points to B’s hardware frame.',active:'SRAM',transfer:{from:'Stacks',to:'CPU',what:'B: r4–r11 = saved context',why:'Selecting B’s saved stack restores its software-saved working registers.'},code:'ldr r0, [r1]\nmsr psp, r0',values:{CPU:'PendSV',PSP:'B hardware frame',saved:'A preserved',R4:92}},
 {title:'Exception return',detail:'0xFFFFFFFD means return to Thread mode using PSP. Hardware restores B’s remaining eight words, including B’s PC.',active:'CPU',transfer:{from:'Stacks',to:'CPU',what:'B: hardware frame + PC',why:'Exception return resumes B using its saved process stack.'},code:'ldr r0, =0xFFFFFFFD\nbx r0',values:{CPU:'B',PSP:'B top',MSP:'handler stack',R4:92,PC:'B resumes'}}];}
export function i2cFrames(ack=true):Frame[]{const f:Frame[]=[{title:'START',detail:'SDA falls while SCL is high: a transaction begins.',active:'CPU'},{title:'Address + write',detail:'7-bit address 0x68 becomes byte 0xD0 with R/W = 0.',values:{byte:'0xD0'},active:'GPIO'},{title:ack?'ACK':'NACK',detail:ack?'MPU6050 pulls SDA low for the ninth clock.':'No device acknowledges. Abort, STOP, report an error; do not wait forever.',active:'GPIO'}];if(!ack)return [...f,{title:'STOP',detail:'SDA rises while SCL is high; bus released.'}];return [...f,{title:'Register pointer',detail:'Write 0x75 to select WHO_AM_I. Device acknowledges.',values:{byte:'0x75'}},{title:'Repeated START',detail:'Change direction without releasing bus ownership.'},{title:'Address + read',detail:'Address 0x68 shifted left plus R/W = 1 gives 0xD1.',values:{byte:'0xD1'}},{title:'Device ACK',detail:'The addressed device agrees to send.'},{title:'Read data',detail:'Device shifts WHO_AM_I = 0x68 into I2C1 RXDR.',values:{RXDR:'0x68'}},{title:'Controller NACK',detail:'After the last byte the controller signals no more data needed.'},{title:'STOP',detail:'Release bus. Software now has a verified identity byte.'}];}
export function dmaFrames(enabled:boolean,requested=enabled):Frame[]{
 const samples=[500,2100,3900],channels=[0,1,4];
 const frames:Frame[]=requested&&!enabled?[{title:'DMA probe times out',detail:'The sentinel 0xFFFF remains unchanged through the bounded wait. Disable the unresponsive DMA path before falling back to CPU polling.',active:'DMA',values:{CPU:'bounded probe → polling',RAM:'[0xFFFF, 0xFFFF, 0xFFFF]',CNDTR:'3 · inactive'}}]:[];
 for(let ch=0;ch<3;ch++){
 const before=samples.map((n,i)=>i<ch?n:'0xFFFF').join(', '),after=samples.map((n,i)=>i<=ch?n:'0xFFFF').join(', ');
 frames.push({title:'ADC converts channel '+channels[ch],detail:`Channel ${channels[ch]} conversion completes: ${samples[ch]} enters DR. The buffer still contains only earlier samples. EOC is end of conversion.`,active:'ADC',values:{CPU:enabled?'control iteration '+ch:'waiting for EOC',DR:samples[ch],RAM:'['+before+']',CNDTR:enabled?3-ch:'inactive'}});
 frames.push({title:enabled?'DMA writes RAM':'CPU reads and stores',detail:enabled?`Request 5 routes through DMAMUX channel 0 to DMA1 channel 1. A halfword ${samples[ch]} moves from ADC DR to scan_buf[${ch}]; CNDTR decrements after that write. CPU continues its calculation.`:`CPU loads ADC DR=${samples[ch]} and stores it into scan_buf[${ch}]. No DMA counter changes; the CPU does this copy instead of independent calculation.`,active:enabled?'DMA':'CPU',transfer:{from:'ADC',to:enabled?'SRAM':'CPU',what:`sample ${samples[ch]} → scan_buf[${ch}]`,why:enabled?'The ADC request triggers a configured halfword transfer.':'Polling sees EOC and software reads the new conversion.'},values:{CPU:enabled?'control iteration '+(ch+1):'copy sample',RAM:'['+after+']',CNDTR:enabled?2-ch:'inactive'}});
 }
 return frames;
}
export function pixelAddress(x:number,y:number){if(x<0||x>=128||y<0||y>=64)throw Error('Pixel outside display');return {page:y>>3,column:x,bit:y&7,index:(y>>3)*128+x,mask:1<<(y&7)};}
export function displayBudget(pages:number,clock=400000){const bytes=138*pages;return {bytes,ms:bytes*9/clock*1000,maxFps:clock/(bytes*9)};}
export function xorshift(seed:number){let x=seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
export function faultFrames(kind:string):Frame[]{const hang=kind==='hang'||kind==='overflow';return [{title:'Normal execution',detail:'Main uses SRAM and services jobs.',active:'CPU'},{title:kind==='hang'?'Useful progress stops':kind==='overflow'?'Stack overwrites nearby RAM':'Faulting instruction',detail:kind==='hang'?'The CPU keeps branching, but a job never completes. No exception is required.':kind==='overflow'?'Without a guard, valid SRAM stores may damage another variable without a HardFault.':'An unaligned word load, unmapped access or undefined instruction cannot complete normally.',active:'CPU'},{title:hang?'Diagnostic symptom':'Exception frame',detail:hang?'A heartbeat goes missing; recovery must detect lost progress.':'Hardware stacks r0–r3, r12, LR, PC and xPSR. Handler uses MSP; frame may be on MSP or PSP.',active:'SRAM',...(hang?{}:{transfer:{from:'CPU',to:'Stacks',what:'r0–r3, r12, LR, PC, xPSR',why:'Fault exception entry records interrupted execution for diagnosis.'}})},{title:hang?'Watchdog expires':'Preserve evidence',detail:hang?'An independently counting watchdog can reset a hung system. SysTick software watchdog cannot run with interrupts masked.':'Course .noinit flight recorder stores frame and magic/checksum before reset. Cortex-M0+ has no CFSR/BFAR fault-cause registers.',active:'SRAM'},{title:'Reset and report',detail:'.data and .bss initialize; .noinit is deliberately preserved through software reset. RCC reset flags and retained record are two different witnesses. Power loss does not promise retained RAM.',active:'Flash'}];}

export interface TxRing { data:(number|null)[];head:number;tail:number;irq:boolean;sent:number[]; }
export function txCreate(size=8):TxRing {if(size<2)throw Error('Ring needs reserved slot');return {data:Array(size).fill(null),head:0,tail:0,irq:false,sent:[]};}
export function txPut(r:TxRing,byte:number):TxRing {const next=(r.head+1)%r.data.length;if(next===r.tail)return r;const data=[...r.data];data[r.head]=byte&255;return {...r,data,head:next,irq:true};}
export function txInterrupt(r:TxRing):TxRing {if(!r.irq)return r;if(r.head===r.tail)return {...r,irq:false};const data=[...r.data],byte=data[r.tail]!;data[r.tail]=null;return {...r,data,tail:(r.tail+1)%r.data.length,sent:[...r.sent,byte]};}
export function wwdgWindow(counter:number,window:number,feed:boolean):string {if(counter<64)return 'expired reset';if(feed&&counter>window)return 'early-feed reset';return feed?'valid refresh':'counting';}
