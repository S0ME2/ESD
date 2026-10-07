import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const manifest=JSON.parse(readFileSync('src/course/manifest.json','utf8')) as {lessons:{id:number;directory:string}[]};

for(const width of [1440,390])for(const lesson of manifest.lessons) {
 test(`Complete visible chapter for lesson ${lesson.id} at ${width}px`,async({page})=>{
  const errors:string[]=[],requests:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/Slide.md'))requests.push(r.url());});
  const group=lesson.id<7?'foundations':lesson.id<13?'systems':'applications';
  const notes=JSON.parse(readFileSync(`src/course/notes/${group}.json`,'utf8'))[lesson.id].sections as {title:string}[];
  await page.setViewportSize({width,height:1000});await page.goto(`/#lesson/${String(lesson.id).padStart(2,'0')}`);
  await expect(page.locator('.study-note')).toHaveCount(notes.length);
  await expect(page.getByRole('tablist')).toHaveCount(0);
  await expect(page.locator('.study-note-heading h2')).toHaveText(notes.map(n=>n.title));
  await expect(page.locator('.study-note-body')).toHaveCount(notes.length);
  expect(await page.locator('.study-note-body').evaluateAll(nodes=>nodes.every(n=>!n.closest('details')))).toBe(true);
  await expect(page.locator('.lecture-reader,.source-browser')).toHaveCount(0);
  await expect(page.locator('.lesson-animation')).toBeVisible();
  await expect(page.getByRole('region',{name:'Worked example'})).toBeVisible();
  await expect(page.locator('.note-questions,.exam-practice,.prediction')).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Practice this lesson',exact:true})).toHaveAttribute('href',`#exam?lesson=${lesson.id}`);
  await expect(page.locator('.lesson-key-idea strong')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(requests).toEqual([]);expect(errors).toEqual([]);
 });
}

for(const id of [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]) {
 test(`Lesson ${id} has continuous movement and working pause`,async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(`/#lesson/${String(id).padStart(2,'0')}`);
  const animation=page.locator('.lesson-animation');
  await animation.scrollIntoViewIfNeeded();
  const pause=animation.getByRole('button',{name:'Pause animation'});
  if(await pause.count())await pause.click();
  await animation.getByRole('slider',{name:'Animation position'}).fill('30');
  const moving=animation.locator('.moving-object').first();
  // Timer and watchdog scenes use moving width/cursor instead of a transform.
  const before=await animation.locator('.mechanism-animation').innerHTML();
  await animation.getByRole('button',{name:'Play animation'}).click();
  await expect.poll(()=>animation.locator('.mechanism-animation').getAttribute('data-motion-position')).not.toBe('30.000');
  await expect.poll(()=>animation.locator('.mechanism-animation').innerHTML()).not.toBe(before);
  if(await moving.count())await expect.poll(()=>moving.getAttribute('transform')).not.toBeNull();
  await pause.click();const stopped=await animation.locator('.mechanism-animation').innerHTML();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await animation.locator('.mechanism-animation').innerHTML()).toBe(stopped);
 });
}

test('Reduced motion starts paused and explicit playback remains available',async({page})=>{
 await page.goto('/#lesson/08');const animation=page.locator('.lesson-animation');await animation.scrollIntoViewIfNeeded();
 await expect(animation.getByRole('button',{name:'Play animation'})).toBeVisible();
 await expect(animation.locator('.mechanism-animation')).toHaveAttribute('data-motion-position','0.000');
 await animation.getByRole('slider',{name:'Animation position'}).fill('65');
 await expect(animation.locator('.mechanism-animation')).toHaveAttribute('data-motion-position','65.000');
});

test('Original sources are external references outside learning',async({page})=>{
 await page.goto('/#about');
 const references=page.locator('.course-reference-list a');await expect(references).toHaveCount(20);
 for(const link of await references.all()){
  await expect(link).toHaveAttribute('target','_blank');
  await expect(link).toHaveAttribute('href',/^https:\/\/github\.com\/gnoejh\/soc3050code\/tree\//);
 }
});

test('Blocked original slides do not affect learning or practice',async({page})=>{
 const requests:string[]=[];
 await page.route('**/source/**/Slide.md',route=>{requests.push(route.request().url());return route.fulfill({status:503,body:'unavailable'});});
 await page.goto('/#lesson/00?view=learn&section=practice');
 await expect(page.getByRole('link',{name:'Practice this lesson',exact:true})).toBeVisible();
 await expect(page.locator('.study-note').first()).toBeVisible();expect(requests).toEqual([]);
});

test('Drone experiments move within an event rather than jumping between saved frames',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/#lesson/13?view=lab');
 const stepper=page.locator('.stepper');await stepper.scrollIntoViewIfNeeded();
 await stepper.getByRole('combobox',{name:'Playback speed'}).selectOption('10000');
 const body=stepper.locator('.drone-glyph');const before=await body.getAttribute('transform');
 const event=await stepper.locator('.event-head .eyebrow').textContent();
 await stepper.getByRole('button',{name:'Run slowly'}).click();
 await expect.poll(()=>body.getAttribute('transform')).not.toBe(before);
 await expect(stepper.locator('.event-head .eyebrow')).toHaveText(event!);
 await stepper.getByRole('button',{name:'Pause',exact:true}).click();
});
