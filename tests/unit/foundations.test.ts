
import { describe, it, expect } from 'vitest';
import { addressOwner, fieldWrite, bsrrWrite, timerRate, hex, elapsed32, captureWidth, pwmBits, raceFrames, startupFrames, interruptFrames, thumbFrames, callFrames, debounceLevels, shiftDemo } from '../../src/models/foundations';
import { lessons } from '../../src/course/foundations';
describe('implemented STM32C031 map',()=>{
 it('distinguishes capacity ends from architectural regions',()=>{expect(addressOwner(0x08007fff).component).toBe('Flash');expect(addressOwner(0x08008000).component).toBe('Unmapped / reserved');expect(addressOwner(0x20002fff).component).toBe('SRAM');expect(addressOwner(0x20003000).component).toBe('Unmapped / reserved');});
 it('routes documented register and core addresses',()=>{expect(addressOwner(0x50000018).component).toBe('GPIO');expect(addressOwner(0x4002180c).component).toBe('EXTI');expect(addressOwner(0xe000e100).component).toBe('NVIC');expect(addressOwner(0xe000e010).component).toBe('Timer');expect(addressOwner(NaN).component).toBe('Invalid');expect(addressOwner(-1).component).toBe('Invalid');});
});
describe('register operations',()=>{
 it('writes PA5 two-bit field without disturbing other pins',()=>{const result=fieldWrite(0xebffffff,5,1);expect((result>>>10)&3).toBe(1);expect((result&~(3<<10))>>>0).toBe((0xebffffff&~(3<<10))>>>0);expect(()=>fieldWrite(0,16,0)).toThrow();});
 it('BSRR preserves unrelated outputs and prioritizes simultaneous set',()=>{expect(bsrrWrite(0x1000,32)).toBe(0x1020);expect(bsrrWrite(0x1020,1<<21)).toBe(0x1000);expect(bsrrWrite(0,32|(1<<21))).toBe(32);});
 it('formats unsigned words',()=>expect(hex(-1)).toBe('0xFFFFFFFF'));
});
describe('causal timeline models',()=>{
 it('shows destructive interrupt windows and intact protected result',()=>{for(let arrival=0;arrival<4;arrival++){expect(raceFrames(arrival,false).at(-1)?.values?.counter).toBe(arrival===1||arrival===2?11:12);expect(raceFrames(arrival,true).at(-1)?.values?.counter).toBe(12);}});
 it('startup separately honors data and zero promises',()=>{expect(startupFrames(true,true,true).at(-1)?.values).toEqual({data:'0x00C0FFEE',bss:'0x00000000'});expect(startupFrames(false,true,true).at(-1)?.values?.data).toBe('0xAAAAAAAA');expect(startupFrames(true,false,true).at(-1)?.values?.bss).toBe('0x55555555');expect(startupFrames(true,true,false)).toHaveLength(1);});
 it('distinguishes delivery gate, bad vector and uncleared source',()=>{expect(interruptFrames(false,true,true)).toHaveLength(3);expect(interruptFrames(true,true,false).at(-1)?.title).toBe('Look up vector 21');expect(interruptFrames(true,false,true).at(-1)?.title).toBe('Interrupt storm');expect(interruptFrames(true,true,true).at(-1)?.values?.['main resumes']).toBe('yes');});
 it('actual Thumb fragment preserves unrelated ACR bits',()=>{const frames=thumbFrames(0x107);expect(frames[3].values?.R2).toBe('0x40022000');expect(frames[6].values?.ACR).toBe('0x00000107');expect(frames[7].values?.ACR).toBe('0x00000101');expect(frames[7].values?.PC).toBe('0x0800023A');});
 it('call stack returns to original SP',()=>expect(callFrames().at(-1)?.values?.SP).toBe('0x20003000'));
});
describe('hardware time arithmetic',()=>{
 it('uses N-1 dividers and exposes off-by-one',()=>{expect(timerRate(48000000,47,19999)).toBe(50);expect(timerRate(48000000,48,19999)).toBeCloseTo(48.9795918);expect(()=>timerRate(0,47,19999)).toThrow();});
 it('uses modular arithmetic for bounded elapsed intervals',()=>{expect(elapsed32(0x10,0xfffffff0)).toBe(32);expect(captureWidth(5264,65000)).toBe(5800);});
 it('models PWM compare with duty extremes',()=>{expect(pwmBits(99,0).every(b=>b===0)).toBe(true);expect(pwmBits(99,100).every(b=>b===1)).toBe(true);expect(pwmBits(99,50).filter(Boolean)).toHaveLength(40);});
});
it('covers every foundation lesson with teaching and linked sources',()=>{expect(lessons.map(l=>l.id)).toEqual([0,1,2,3,4,5,6]);for(const lesson of lessons){expect(lesson.topics.length).toBeGreaterThanOrEqual(5);expect(lesson.sources.length).toBeGreaterThan(0);expect(lesson.prediction.explanations).toHaveLength(lesson.prediction.options.length);for(const topic of lesson.topics){expect(topic.simple.length).toBeGreaterThan(40);expect(topic.why.length).toBeGreaterThan(40);expect(topic.mechanism.length).toBeGreaterThan(40);expect(topic.technical.length).toBeGreaterThan(40);}}});

it('debouncing counts only sustained levels',()=>{expect(debounceLevels([1,0,1,0,1,0,0,0,0],2).presses).toBe(1);expect(debounceLevels([1,0,0,1],3).presses).toBe(0);expect(()=>debounceLevels([1],0)).toThrow();});
it('distinguishes arithmetic from logical shifts',()=>{expect(shiftDemo(0xfffffff8,3).arithmeticRight).toBe(-1);expect(shiftDemo(0xfffffff8,3).logicalRight).toBe(0x1fffffff);expect(shiftDemo(1,5).left).toBe(32);});
