import {test,expect} from '@playwright/test';
for(const width of [1920,390])test(`Replay header and timeline controls work after scrolling at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/#lesson/06');
 const opener=page.locator('.refresher-links button').first();await opener.click();
 const dialog=page.getByRole('dialog'),body=dialog.locator('.refresher-body');await body.evaluate(e=>e.scrollTop=e.scrollHeight);
 await expect(dialog.getByRole('button',{name:'Close refresher',exact:true})).toBeInViewport();
 const stepper=dialog.locator('.stepper').first();await stepper.locator('.transport-dock').scrollIntoViewIfNeeded();
 const before=await stepper.locator('.event-head .eyebrow').textContent();await stepper.getByRole('button',{name:'Next event',exact:true}).click();
 await expect(stepper.locator('.event-head .eyebrow')).not.toHaveText(before!);
 await stepper.getByRole('button',{name:'Replay',exact:true}).click();await expect(stepper.getByRole('slider',{name:'Event position'})).toHaveValue('0');
 await expect(stepper.locator('.transport-dock')).toHaveCSS('position','static');
 await body.evaluate(e=>e.scrollTop=e.scrollHeight);await dialog.getByRole('button',{name:'Close refresher',exact:true}).click();
 await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Timer walkthrough defines the pulse and counter keeps moving in the restart step',async({page})=>{
 await page.goto('/#lesson/06');const animation=page.locator('.lesson-animation');
 await expect(animation.locator('.timer-walkthrough')).toContainText('ON for the first 1.5 milliseconds');
 await expect(animation.locator('.named-stages button')).toHaveText(['1Set the tick','2Pin ON','3Pin OFF','4Next pulse']);
 const slider=animation.getByRole('slider',{name:'Animation position'});
 await slider.fill('0');await expect(animation.locator('.diagram-block').last()).toContainText('ON (HIGH)');
 await slider.fill('80');const before=await animation.locator('.diagram-block').nth(1).textContent();
 await slider.fill('90');await expect(animation.locator('.diagram-block').nth(1)).not.toHaveText(before!);
 await expect(animation.locator('.mechanism-animation')).toContainText('Next pulse');
 const labels=await animation.locator('svg text').evaluateAll(nodes=>nodes.map(n=>({text:n.textContent,...n.getBoundingClientRect().toJSON()})));
 for(let i=0;i<labels.length;i++)for(const b of labels.slice(i+1)){const a=labels[i];expect(a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom-2&&a.bottom>b.top+2,`${a.text}/${b.text}`).toBe(false);}
});
