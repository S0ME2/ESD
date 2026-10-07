import { test, expect } from '@playwright/test';

test('Shared section links retain the full chapter and reading position after reload',async({page})=>{
 await page.setViewportSize({width:390,height:1000});
 await page.goto('/#lesson/05?topic=4');
 const target=page.locator('#note-5-4');
 await expect(target).toBeInViewport();
 const heading=await target.locator('h2').textContent();
 await page.reload();await expect(target).toBeInViewport();
 await expect(target.locator('h2')).toHaveText(heading!);
 await expect(page.locator('.study-note').first()).toBeVisible();
 await expect(page.getByRole('tablist')).toHaveCount(0);
});

test('Mobile section selector reaches the last note while earlier notes stay open',async({page})=>{
 await page.setViewportSize({width:320,height:1000});await page.goto('/#lesson/19');
 const notes=page.locator('.study-note');await expect(notes).toHaveCount(30);
 await page.getByRole('combobox',{name:'Jump to a section',exact:true}).selectOption('note-19-29');
 await expect(notes.last()).toBeInViewport();await expect(notes.first()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Related experiments and hardware inspection remain usable beside the chapter',async({page})=>{
 await page.goto('/#lesson/05');
 await page.getByRole('button',{name:'Try a related example in the lab',exact:true}).click();
 await expect(page.locator('#lesson-experiments')).toBeInViewport();
 const machine=page.locator('.machine-world').last();
 await machine.getByRole('button',{name:'Explore SRAM',exact:true}).click();
 await expect(machine.locator('.machine-caption strong')).toHaveText('SRAM');
 await expect(page.locator('.study-note').first()).toBeVisible();
});
