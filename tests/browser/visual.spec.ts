import {test,expect} from '@playwright/test';

test('Timer caption, counter and pin agree throughout the explanation',async({page})=>{
 await page.goto('/#lesson/06');const animation=page.locator('.lesson-animation');
 const positions=[{p:'35',output:'ON (HIGH)',caption:'CNT rises from 0 to 1499'},{p:'65',output:'OFF (LOW)',caption:'PA6 reads OFF (LOW)'},{p:'95',output:'ON (HIGH)',caption:'CNT restarts at zero'}];
 for(const state of positions){await animation.getByRole('slider',{name:'Animation position'}).fill(state.p);await expect(animation.locator('.diagram-block').last()).toContainText(state.output);await expect(animation.locator('.animation-explanation')).toContainText(state.caption);}
});

test('Balancing lab interpolates physical motion inside a saved event',async({page})=>{
 await page.goto('/#lesson/17?view=lab');const stepper=page.locator('.stepper');await stepper.scrollIntoViewIfNeeded();
 await stepper.getByRole('combobox',{name:'Playback speed'}).selectOption('10000');
 const body=stepper.locator('.balance-glyph > g').first();const before=await body.getAttribute('transform');const event=await stepper.locator('.event-head .eyebrow').textContent();
 await stepper.getByRole('button',{name:'Run slowly',exact:true}).click();
 await expect.poll(()=>body.getAttribute('transform')).not.toBe(before);
 await expect(stepper.locator('.event-head .eyebrow')).toHaveText(event!);
 await stepper.getByRole('button',{name:'Pause',exact:true}).click();
 const stopped=await body.getAttribute('transform');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await expect(body).toHaveAttribute('transform',stopped!);
});

test('The same drone drawing is used in the explanation and experiment',async({page})=>{
 await page.goto('/#lesson/13');await expect(page.locator('.lesson-animation .drone-glyph')).toHaveCount(1);
 await page.locator('#lesson-experiments').scrollIntoViewIfNeeded();await expect(page.locator('#lesson-experiments .stepper .drone-glyph')).toHaveCount(1);
 await expect(page.locator('.event-motion')).toHaveCount(0);
});

test('I2C final byte is followed by a NACK, not an ACK',async({page})=>{
 await page.goto('/#lesson/09');const a=page.locator('.lesson-animation');await a.getByRole('slider',{name:'Animation position'}).fill('95');
 await expect(a.getByRole('img',{name:'Read an I²C sensor register'})).toContainText('9: NACK');await expect(a.locator('.animation-explanation')).toContainText('NACK → STOP');
});

test('UART waveform cursor moves continuously within a bit and pauses',async({page})=>{
 await page.goto('/#lesson/08?view=lab');const s=page.locator('.stepper');await s.scrollIntoViewIfNeeded();
 await s.getByRole('combobox',{name:'Playback speed'}).selectOption('10000');const cursor=s.locator('.waveform-cursor');const before=await cursor.getAttribute('transform');const event=await s.locator('.event-head .eyebrow').textContent();
 await s.getByRole('button',{name:'Run slowly',exact:true}).click();await expect.poll(()=>cursor.getAttribute('transform')).not.toBe(before);await expect(s.locator('.event-head .eyebrow')).toHaveText(event!);
 await s.getByRole('button',{name:'Pause',exact:true}).click();const stopped=await cursor.getAttribute('transform');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await expect(cursor).toHaveAttribute('transform',stopped!);
});

test('GPIO trace transfers a labelled value and stops on pause',async({page})=>{
 await page.goto('/#lesson/00?view=lab');const start=page.getByRole('button',{name:'Start trace',exact:true});await start.click();const machine=page.locator('.machine-world.is-tracing');
 await machine.getByRole('button',{name:'Next step',exact:true}).click();await machine.getByRole('button',{name:'Play write animation'}).click();
 const packet=machine.locator('.word-packet,.moving-object').first();await expect(packet).toContainText('0x20');const before=await packet.getAttribute('transform');await expect.poll(()=>packet.getAttribute('transform')).not.toBe(before);
 await machine.getByRole('button',{name:'Pause write animation'}).click();const stopped=await packet.getAttribute('transform');await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await expect(packet).toHaveAttribute('transform',stopped!);
});

test('Physical scenes stack readings below the drawing on phones',async({page})=>{
 await page.setViewportSize({width:375,height:1000});
 for(let id=13;id<19;id++){
  await page.goto(`/#lesson/${id}`);const viewport=page.locator('.lesson-animation .animation-viewport');
  await expect(viewport.locator('.compact-scene')).toHaveCount(1);
  expect(await viewport.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);
  const svg=await viewport.locator('svg').boundingBox();const readings=await viewport.locator('.physical-readouts').boundingBox();
  expect(readings!.x).toBeGreaterThanOrEqual(svg!.x);expect(readings!.x+readings!.width).toBeLessThanOrEqual(svg!.x+svg!.width+1);
 }
});


test('Application diagram labels remain inside their drawing',async({page})=>{
 for(let id=13;id<19;id++){
  await page.goto(`/#lesson/${id}?view=lab`);const s=page.locator('.stepper');await s.scrollIntoViewIfNeeded();
  const slider=s.locator('.timeline input'),max=+(await slider.getAttribute('max'))!;
  await slider.fill(String(Math.floor(max*.35)));await page.evaluate(()=>document.fonts.ready);
  const layout=await s.locator('svg.diagram').evaluate(svg=>{
   const bounds=svg.getBoundingClientRect(),texts=[...svg.querySelectorAll('text')].map(e=>({text:e.textContent,...e.getBoundingClientRect().toJSON()}));
   return {clipped:texts.filter(r=>r.left<bounds.left-1||r.right>bounds.right+1||r.top<bounds.top-1||r.bottom>bounds.bottom+1).map(r=>r.text),overlaps:texts.flatMap((a,i)=>texts.slice(i+1).filter(b=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2).map(b=>[a.text,b.text]))};
  });expect(layout,`Lesson ${id} label layout`).toEqual({clipped:[],overlaps:[]});
 }
});

test('Context switching includes R12 in the saved hardware frame',async({page})=>{
 await page.goto('/#lesson/07');await expect(page.locator('.lesson-animation svg.mechanism-animation')).toContainText('R12 / LR / PC / xPSR');
});
