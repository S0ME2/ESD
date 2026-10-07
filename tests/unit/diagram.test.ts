import {describe,it,expect} from 'vitest';
import {parseAddress,addressOwner,startupFrames,interruptFrames,raceFrames,thumbFrames,bsrrWrite} from '../../src/models/foundations';
describe('Diagram state matches the action shown',()=>{
 it('rejects blank, signed, fractional, overflowing and malformed explorer input',()=>{
  for(const input of ['', '-1','1.5','0x100000000','0x','Infinity'])expect(addressOwner(parseAddress(input)).component).toBe('Invalid');
  expect(addressOwner(parseAddress('0x20002FFF')).component).toBe('SRAM');expect(addressOwner(parseAddress('0x20003000')).component).not.toBe('SRAM');
  expect(addressOwner(parseAddress('0x50000018')).detail).toContain('offset 0x00000018');
 });
 it('skipped startup actions do not claim to execute a copy or zero',()=>{
  const frames=startupFrames(false,false,true);for(const f of frames.filter(f=>f.title.startsWith('Skip'))){expect(f.code).toMatch(/^\/\/ .*omitted: no store executes$/);expect(f.transfer).toBeUndefined();}
  expect(frames.at(-1)?.values).toMatchObject({data:'0xAAAAAAAA',bss:'0x55555555'});
 });
 it('an uncleared interrupt shows no clearing write and keeps requesting service',()=>{
  const frames=interruptFrames(true,false,true);const handler=frames.find(f=>f.title==='Handler services source')!;expect(handler.code).not.toContain('EXTI->');expect(handler.values?.FPR1).toBe('0x00000002');expect(frames.at(-1)?.transfer).toMatchObject({from:'EXTI',to:'NVIC'});
 });
 it('every interrupt-arrival position preserves both increments when protected',()=>{
  for(let arrival=0;arrival<=3;arrival++){const frames=raceFrames(arrival,true);expect(frames.at(-1)?.values?.counter).toBe(12);expect(frames.find(f=>f.title==='Restore prior interrupt mask')?.values?.PRIMASK).toBe(0);}
  const frames=raceFrames(2,false);expect(frames.find(f=>f.title==='ISR increments')?.values).toMatchObject({counter:11,r0:11});expect(frames.at(-1)?.values?.counter).toBe(11);
 });
 it('bit clear and bit set change CPU copies before the peripheral store',()=>{
  const frames=thumbFrames(0xa5);expect(frames[5].values).toMatchObject({R1:'0x000000A0',ACR:'0x000000A5'});expect(frames[6].values).toMatchObject({R3:'0x000000A1',ACR:'0x000000A5'});expect(frames[7].values?.ACR).toBe('0x000000A1');expect(frames[7].transfer).toMatchObject({from:'CPU',to:'Flash'});
 });
 it('32-bit BSRR reset commands clear the selected output without changing others',()=>{expect(bsrrWrite(0x21,1<<(5+16))).toBe(1);});
});
