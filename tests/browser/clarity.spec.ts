import {test,expect} from '@playwright/test';
for(const width of [1920,390])test(`Practice setup is organized and reading uses its column at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1080});await page.goto('/#exam?lesson=0');
 await expect(page.locator('.practice-filter-columns fieldset')).toHaveCount(2);
 await expect(page.locator('.practice-scope')).toContainText('1 of 20 lessons selected');await expect(page.locator('.practice-scope')).toContainText('Scroll');
 await page.getByRole('button',{name:'Select all',exact:true}).click();await expect(page.locator('.practice-scope')).toContainText('All 20 lessons selected (full course)');
 const topicsInOrder=await page.locator('.practice-topics label').allTextContents();expect(topicsInOrder.map(t=>Number(t.trim().slice(0,2)))).toEqual(topicsInOrder.map(t=>Number(t.trim().slice(0,2))).sort((a,b)=>a-b));
 const lessons=await page.locator('.practice-filter-columns fieldset').first().boundingBox(),topics=await page.locator('.practice-filter-columns fieldset').last().boundingBox();
 if(width===1920)expect(topics!.x).toBeGreaterThan(lessons!.x+lessons!.width);else expect(topics!.y).toBeGreaterThan(lessons!.y);
 await expect(page.getByRole('button',{name:'Start random run',exact:true})).toBeInViewport();
 await page.screenshot({path:`.codex/clarity-revision/setup-${width}.png`,fullPage:true});
 await page.goto('/#lesson/00');await expect(page.locator('.lesson-explanation')).toBeVisible();
 const column=await page.locator('.reading-main').boundingBox(),paragraph=await page.locator('.lesson-explanation>p').last().boundingBox();
 expect(paragraph!.width).toBeGreaterThan(column!.width*.98);
 await expect(page.locator('.lesson-explanation strong')).not.toHaveCount(0);
 await page.screenshot({path:`.codex/clarity-revision/lesson-${width}.png`,fullPage:false});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('All lesson animations present four informative stage pairs without raw markup',async({page})=>{
 for(let id=0;id<20;id++){
  await page.goto(`/#lesson/${String(id).padStart(2,'0')}`);await expect(page.locator('.lesson-animation')).toBeVisible();
  for(let stage=0;stage<4;stage++){
   await page.getByRole('button',{name:`Explanation stage ${stage+1}`,exact:true}).click();
   await expect(page.locator('.animation-explanation')).toContainText(`${id>=13&&id<=18?'Focus':'Step'} ${stage+1} · What happens`);
   expect((await page.locator('.animation-explanation').innerText()).length).toBeGreaterThan(45);
   expect((await page.locator('.animation-learning>p').first().innerText()).length).toBeGreaterThan(35);
   await expect(page.locator('.animation-explanation')).not.toContainText('**');
  }
 }
});
