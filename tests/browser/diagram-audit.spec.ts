import {test,expect} from '@playwright/test';

test('Address lookup changes the actual route, rejects invalid input and interrupts the example trace',async({page})=>{
 await page.goto('/#lesson/00');const machine=page.locator('.machine-world').first();const address=page.getByRole('textbox',{name:'Unsigned address in hex or decimal'});
 for(const [value,owner] of [['0x08000000','Flash'],['0x20000000','SRAM'],['0x50000018','GPIO'],['0x4002180C','EXTI'],['0xE000E100','NVIC'],['0xE000E010','Timer']]){
  await address.fill(value);await expect(machine.locator('svg.machine')).toHaveAttribute('aria-label',`STM32C031 machine. Highlighted component: ${owner}.`);await expect(machine.locator('.machine-part.selected')).toHaveAttribute('aria-label',`Explore ${owner}`);await expect(machine.locator('.data-route')).toHaveCount(1);await expect(machine.locator('.machine-caption')).toContainText('fixed hardware decoding');
 }
 await machine.getByRole('button',{name:'Start trace',exact:true}).click();await address.fill('0x20000000');await expect(machine).not.toHaveClass(/is-tracing/);await expect(machine.locator('.machine-part.selected')).toHaveAttribute('aria-label','Explore SRAM');
 for(const value of ['','-1','0x100000000','not an address']){await address.fill(value);await expect(machine.locator('.machine-part.selected')).toHaveCount(0);await expect(machine.locator('.data-route')).toHaveCount(0);await expect(machine.locator('.machine-caption')).toContainText('No implemented destination');}
 await address.fill('0x20003000');await expect(machine.locator('.data-route')).toHaveCount(0);
});

test('Interrupt overview moves a labelled saved context along its SRAM route and pauses',async({page})=>{
 await page.goto('/#lesson/00');const s=page.locator('.stepper').last();await s.getByRole('slider',{name:'Event position'}).fill('1.2');const packet=s.locator('.data-packet');await expect(packet).toHaveAttribute('data-from','CPU');await expect(packet).toHaveAttribute('data-to',/SRAM|Stacks/);
 const before=await packet.getAttribute('transform');await s.getByRole('slider',{name:'Event position'}).fill('1.6');await expect(packet).not.toHaveAttribute('transform',before!);
 await s.getByRole('combobox',{name:'Playback speed'}).selectOption('10000');await s.getByRole('button',{name:'Run slowly',exact:true}).click();const prior=await packet.getAttribute('transform');await expect.poll(()=>packet.getAttribute('transform')).not.toBe(prior);await s.getByRole('button',{name:'Pause',exact:true}).click();const stopped=await packet.getAttribute('transform');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await expect(packet).toHaveAttribute('transform',stopped!);
 await expect(s.locator('.transport-dock')).toHaveCSS('position','static');
});

for(let id=0;id<20;id++)test(`Lesson ${id}: every animation stage changes meaningful SVG geometry`,async({page})=>{
 await page.goto(`/#lesson/${String(id).padStart(2,'0')}`);const animation=page.locator('.lesson-animation');const slider=animation.getByRole('slider',{name:'Animation position'});const svg=animation.locator('.mechanism-animation');
 for(let stage=0;stage<4;stage++){
  await animation.getByRole('button',{name:`Explanation stage ${stage+1}`,exact:true}).click();await expect(svg).toHaveAttribute('data-stage',String(stage));
  const geometry=()=>svg.locator('rect,path,circle,g.moving-object').evaluateAll(nodes=>nodes.map(n=>({x:n.getAttribute('x'),y:n.getAttribute('y'),w:n.getAttribute('width'),h:n.getAttribute('height'),d:n.getAttribute('d'),t:n.getAttribute('transform'),dash:n.getAttribute('stroke-dasharray'),cls:n.getAttribute('class'),r:n.getAttribute('r'),cx:n.getAttribute('cx'),cy:n.getAttribute('cy')})));
  await slider.fill(String(stage*25+3));const before=await geometry();await slider.fill(String(stage*25+23));expect(await geometry()).not.toEqual(before);
 }
});

test('Mask and race pictures explain operands and separate stored values',async({page})=>{
 await page.goto('/#lesson/01');let animation=page.locator('.lesson-animation');await animation.getByRole('slider',{name:'Animation position'}).fill('48');await expect(animation.locator('svg.mechanism-animation')).toContainText('NOT 00000111 = 11111000');await expect(animation.locator('[data-cpu-value]')).toHaveAttribute('data-cpu-value','160');
 await page.goto('/#lesson/03');animation=page.locator('.lesson-animation');await animation.getByRole('slider',{name:'Animation position'}).fill('72');await expect(animation.locator('svg.mechanism-animation')).toContainText('Handler STORE: 11');await animation.getByRole('slider',{name:'Animation position'}).fill('98');await expect(animation.locator('svg.mechanism-animation')).toContainText('expected 12 · actual 11');
});

test('Phone stage labels and vocabulary do not overlap their explanations',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const id of [1,3,13,14,15,16,17,18]){
  await page.goto(`/#lesson/${String(id).padStart(2,'0')}`);const a=page.locator('.lesson-animation');await a.getByRole('button',{name:'Explanation stage 2',exact:true}).click();
  const bottom=await a.locator('.named-stages').evaluate(e=>Math.max(e.getBoundingClientRect().bottom,...[...e.querySelectorAll('span')].map(n=>n.getBoundingClientRect().bottom)));const text=await a.locator('.animation-explanation').boundingBox();expect(bottom).toBeLessThanOrEqual(text!.y);
  for(const pair of await a.locator('.learning-vocabulary dl>div').evaluateAll(nodes=>nodes.map(n=>({term:n.querySelector('dt')!.getBoundingClientRect().bottom,definition:n.querySelector('dd')!.getBoundingClientRect().top}))))expect(pair.term).toBeLessThanOrEqual(pair.definition+1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
});

test('Plot sample marker shows calculated values and responds to sample selection',async({page})=>{
 await page.goto('/#lesson/17');const plot=page.locator('.plot-wrap').first();const marker=plot.locator('.diagram-cursor');const old=await marker.getAttribute('d');await plot.getByRole('slider').fill('50');await expect(marker).not.toHaveAttribute('d',old!);await expect(plot).toContainText('PID tilt:');await expect(plot).toContainText('LQR:');
});

test('All twenty concept nodes support keyboard selection and open the selected lesson',async({page})=>{
 await page.goto('/#map');const nodes=page.locator('.graph-node');await expect(nodes).toHaveCount(20);
 for(let id=0;id<20;id++){const node=nodes.nth(id);await node.focus();await page.keyboard.press(id%2?' ':'Enter');await expect(node).toHaveAttribute('aria-pressed','true');await expect(page.locator('.graph-inspector-heading')).toContainText(`LESSON ${String(id).padStart(2,'0')}`);}
 await page.getByRole('button',{name:'Open this lesson'}).click();await expect(page).toHaveURL(/#lesson\/19$/);
});

test('DMA source provenance and small motor differences remain visible',async({page})=>{
 await page.goto('/#lesson/10');const dma=page.locator('.lesson-animation');await dma.getByRole('slider',{name:'Animation position'}).fill('60');await expect(dma.locator('.mechanism-animation')).toContainText('Injected test sequence');await expect(dma).toContainText('not voltage-derived');
 await page.goto('/#lesson/13');const motors=page.locator('.lesson-animation');await motors.getByRole('slider',{name:'Animation position'}).fill('65');const readout=await motors.locator('.physical-readouts').textContent();expect(readout).toMatch(/0\.\d{5}/);expect(readout).toContain('Δ');
});
