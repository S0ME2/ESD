import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const screenshots=process.env.SCREENSHOT_DIR||'.codex/qa/screenshots';
mkdirSync(screenshots,{recursive:true});
for(const width of [1440,390])for(let id=0;id<20;id++){
 test(`Lesson ${String(id).padStart(2,'0')} interactions at ${width}px`,async({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.setViewportSize({width,height:1000});
  await page.goto('/#lesson/'+String(id).padStart(2,'0')+'?view=lab');
  await expect(page.locator('.lab-panel').first()).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page horizontal overflow').toBe(true);
  const panels=page.locator('#lesson-experiments');
  const tabs=panels.locator('.experiment-tabs button');
  const tabCount=await tabs.count();
  for(let tab=0;tab<Math.max(1,tabCount);tab++){
   if(tabCount)await tabs.nth(tab).click();
   const stepper=panels.locator('.stepper').first();
   if(await stepper.count()){
    const before=await stepper.locator('.event-head .eyebrow').textContent();
    const next=stepper.getByRole('button',{name:'Next event',exact:true});
    if(await next.isEnabled()){
     await next.click();
     await expect(stepper.locator('.event-head .eyebrow')).not.toHaveText(before!);
     await stepper.getByRole('button',{name:'Previous event',exact:true}).click();
     await expect(stepper.locator('.event-head .eyebrow')).toHaveText(before!);
    }
    const slider=stepper.getByRole('slider',{name:'Event position'});
    const max=await slider.getAttribute('max');
    await slider.fill(max!);
    await expect(next).toBeDisabled();
    await stepper.getByRole('button',{name:'Replay',exact:true}).click();
    await expect(slider).toHaveValue('0');
   }
   // Exercise native parameter controls for every experiment, excluding timeline/speed.
   const inputs=panels.locator('input[type=range]:not([aria-label="Event position"])');
   for(let i=0;i<await inputs.count();i++){
    const input=inputs.nth(i);const max=+(await input.getAttribute('max')||'100'),min=+(await input.getAttribute('min')||'0');
    const step=+(await input.getAttribute('step')||'1');const value=min+Math.round((max-min)/2/step)*step;await input.fill(String(Number(value.toFixed(8))));
   }
   const checks=panels.locator('input[type=checkbox]');
   for(let i=0;i<await checks.count();i++){await checks.nth(i).click();await checks.nth(i).click();}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow in lab ${tab}`).toBe(true);
  }
  if(id===0){if(tabCount)await tabs.first().click();const execute=page.getByRole('button',{name:'Execute store',exact:true});await execute.click();await expect(panels).toContainText('HIGH · LED ON');const startTrace=page.getByRole('button',{name:'Start trace',exact:true});await expect(startTrace).toBeVisible();await startTrace.click();const traceCaption=page.locator('.machine-world.is-tracing .machine-caption');await expect(traceCaption).toContainText('compiler turns it into a store instruction');await page.getByRole('button',{name:'Next step',exact:true}).click();await expect(traceCaption).toContainText('puts the address and value onto the bus');await page.locator('.machine-world.is-tracing').screenshot({path:`${screenshots}/machine-cause-trace.png`});}
  if(id===19){const goal=page.getByRole('textbox',{name:'Project goal / why it exists'});await goal.fill('QA: obstacle-aware robot');await page.reload();await expect(goal).toHaveValue('QA: obstacle-aware robot');}
  if(tabCount)await tabs.first().click();
  await page.locator('.lab-intro').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${screenshots}/${String(id).padStart(2,'0')}-${width}.png`});
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.locator('.study-note').first()).toBeVisible();
  await expect(page.locator('.source-browser,.lecture-reader')).toHaveCount(0);
  expect(errors).toEqual([]);
 });
}

test('Course navigation, glossary, prerequisite replay and keyboard',async({page})=>{
 await page.goto('/#course');
 await expect(page.locator('.course-list>a')).toHaveCount(20);
 await page.getByRole('button',{name:'Go to lesson 00',exact:true}).click();
 await expect(page).toHaveURL(/lesson\/00/);
 await page.keyboard.press('/');
 await expect(page.getByRole('textbox',{name:'Search lessons and concepts'})).toBeFocused();
 await page.goto('/#glossary');
 await page.getByRole('textbox',{name:'Search glossary',exact:true}).fill('interrupt');
 await expect(page.locator('.glossary-list article').first()).toBeVisible();
 await page.locator('.glossary-list button').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.goto('/#lesson/07');
 await page.locator('.refresher-links button').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'Close refresher'}).click();
 await page.goto('/#map');
 await expect(page.locator('.graph-node')).toHaveCount(20);
 await page.getByRole('button',{name:/Lesson 07/}).click();
 await expect(page.locator('.graph-inspector')).toContainText('Sharing the CPU between tasks');
 await page.screenshot({path:`${screenshots}/concept-dependency-graph.png`,fullPage:true});
});


test('Flagship playback advances, pauses and stops when scrolled away',async({page})=>{
 for(const id of ['00','05','07']){
  await page.goto('/#lesson/'+id+'?view=lab');
  const stepper=page.locator('.stepper').first();
  await expect(stepper).toBeVisible();
  await stepper.getByRole('combobox',{name:'Playback speed'}).selectOption('1000');
  await stepper.getByRole('button',{name:'Run slowly',exact:true}).click();
  const slider=stepper.getByRole('slider',{name:'Event position'});
  await expect(slider).not.toHaveValue('0');
  await stepper.getByRole('button',{name:'Pause',exact:true}).click();
  const paused=await slider.inputValue();
  await page.waitForTimeout(350);
  await expect(slider).toHaveValue(paused);
  await stepper.getByRole('button',{name:'Run slowly',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await expect(stepper.getByRole('button',{name:'Run slowly',exact:true})).toBeAttached();
  const offscreen=await slider.inputValue();
  await page.waitForTimeout(1100);
  await expect(slider).toHaveValue(offscreen);
 }
});
