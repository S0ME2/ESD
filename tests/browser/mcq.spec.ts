import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {buildSync} from 'esbuild';
import {runInNewContext} from 'node:vm';
const questions=['foundations','systems','applications'].flatMap(g=>JSON.parse(readFileSync(`src/course/quiz/${g}.json`,'utf8')));
const original=runInNewContext(buildSync({entryPoints:['src/course/mcq.ts'],bundle:true,write:false,format:'iife',globalName:'Bank',platform:'node'}).outputFiles[0].text+';Bank;').mcq;
questions.push(...original.map((q:any,i:number)=>({...q,id:`mixed-${i}`})));
const byId=new Map(questions.map(q=>[q.id,q]));
for(const width of [1440,390])test(`Random topic run, scoring and restore at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/#exam?lesson=6');
 await expect(page.getByRole('spinbutton',{name:'Number of questions'})).toHaveValue('33');
 await page.getByRole('searchbox',{name:'Find a practice topic'}).fill('Timer map');
 const topic=page.locator('.practice-topics label').filter({hasText:'Timer map, fields and frequency'});await topic.locator('input').check();
 await page.getByRole('spinbutton',{name:'Number of questions'}).fill('3');await page.getByRole('button',{name:'Start random run',exact:true}).click();
 await expect(page.locator('.mcq-question')).toHaveCount(1);await expect(page.locator('.mcq-reasoning')).toHaveCount(0);
 const session=await page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-practice-v2')!));
 expect(new Set(session.questions.map((q:any)=>q.id)).size).toBe(1);
 for(const item of session.questions)expect(byId.get(item.id).topic).toBe('note-6-1');
 for(let i=0;i<session.questions.length;i++){
  const item=session.questions[i],q=byId.get(item.id);
  await page.locator(`input[name="mcq-${item.id}"][value="${q.correct}"]`).check();
  if(i<session.questions.length-1)await page.getByRole('button',{name:'Next question',exact:true}).click();
 }
 await page.reload();await expect(page.locator('.mcq-progress')).toContainText('1 / 1 answered');
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 await expect(page.getByRole('region',{name:'Practice result'})).toContainText('1 / 1 correct · 100%');await expect(page.locator('.mcq-reasoning')).toHaveCount(1);
 await page.reload();await expect(page.getByRole('region',{name:'Practice result'})).toContainText('1 / 1 correct');
 await page.getByRole('button',{name:'New random run',exact:true}).click();await expect(page.locator('.mcq-progress')).toContainText('0 / 1 answered');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Finish reports incorrect and skipped separately and links to the studied section',async({page})=>{
 await page.goto('/#exam?lesson=6');await page.getByRole('spinbutton',{name:'Number of questions'}).fill('3');await page.getByRole('button',{name:'Start random run',exact:true}).click();
 const item=await page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-practice-v2')!).questions[0]);const q=byId.get(item.id);
 if(q)await page.locator(`input[value="${(q.correct+1)%q.options.length}"]`).check();else await page.locator('.mcq-question input').first().check();
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 const result=page.getByRole('region',{name:'Practice result'});await expect(result).toContainText('1 incorrect · 2 unanswered');
 await expect(page.locator('.mcq-reasoning')).toHaveCount(1);
 await expect(page.locator('.review-table tbody tr')).toHaveCount(3);
 await expect(page.locator('.review-table .review-incorrect')).toHaveCount(1);
 await expect(page.locator('.review-table .review-unanswered')).toHaveCount(2);
 await expect(page.locator('.answer-incorrect')).toHaveCount(1);
 await expect(page.locator('.answer-correct')).toHaveCount(1);
 await page.locator('.review-table tbody tr').nth(1).getByRole('button').click();
 await expect(page.locator('.mcq-question legend')).toContainText('QUESTION 2 OF 3');
 await expect(page.locator('.answer-incorrect')).toHaveCount(0);
 await expect(page.locator('.mcq-reasoning')).toContainText('Unanswered');
 await page.locator('.mcq-reasoning a').first().click();await expect(page).toHaveURL(/#lesson\/06\?topic=/);
 await expect(page.locator('.note-questions,.exam-practice,.prediction')).toHaveCount(0);
});

test('Empty selection cannot start and the full random run defaults to33',async({page})=>{
 await page.goto('/#course');await page.getByRole('link',{name:'Set up a practice run',exact:true}).click();
await page.getByRole('button',{name:'Clear selection',exact:true}).click();await expect(page.getByRole('button',{name:'Start random run',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Select all',exact:true}).click();await page.getByRole('button',{name:'Start random run',exact:true}).click();
 await expect(page.locator('.mcq-progress')).toContainText('0 / 33 answered');
 await page.getByRole('button',{name:'Finish',exact:true}).click();await expect(page.getByRole('region',{name:'Practice result'})).toContainText('33 unanswered');
});

test('Starting-primer questions also live in practice',async({page})=>{
 await page.goto('/#start');await page.getByRole('link',{name:'Practice the building blocks',exact:true}).click();
 await expect(page.locator('.practice-setup')).toContainText('6 questions available');await page.getByRole('button',{name:'Start random run',exact:true}).click();
 await expect(page.locator('.mcq-progress')).toContainText('0 / 6 answered');
});

for(const width of [1440,390])test(`Review table shows one selected question and answer colors at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/#exam?lesson=6');
 await page.getByRole('spinbutton',{name:'Number of questions'}).fill('3');await page.getByRole('button',{name:'Start random run',exact:true}).click();
 const session=await page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-practice-v2')!));
 const first=byId.get(session.questions[0].id),second=byId.get(session.questions[1].id);
 await page.locator(`input[value="${first.correct}"]`).check();
 await expect(page.locator('.question-jumps .question-answered')).toHaveCount(1);
 await expect(page.locator('.question-jumps')).not.toContainText('✓');
 await page.getByRole('button',{name:'Next question',exact:true}).click();await page.locator(`input[value="${(second.correct+1)%second.options.length}"]`).check();
 await page.getByRole('button',{name:'Finish',exact:true}).click();
 await expect(page.locator('.review-table .review-correct')).toHaveCount(1);await expect(page.locator('.review-table .review-incorrect')).toHaveCount(1);await expect(page.locator('.review-table .review-unanswered')).toHaveCount(1);
 await expect(page.locator('.mcq-question')).toHaveCount(1);
 await page.locator('.review-table .review-incorrect button').click();await expect(page.locator('.mcq-question legend')).toContainText(second.question);await expect(page.locator('.answer-incorrect')).toHaveCount(1);
 expect(await page.locator('.answer-incorrect').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 240, 238)');
 await page.locator('.review-table .review-correct button').click();await expect(page.locator('.mcq-question legend')).toContainText(first.question);await expect(page.locator('.answer-incorrect')).toHaveCount(0);
 await page.reload();await expect(page.locator('.mcq-question legend')).toContainText(first.question);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(width===1440){const index=await page.locator('.review-index').boundingBox(),detail=await page.locator('.review-detail').boundingBox();expect(detail!.x).toBeGreaterThan(index!.x+index!.width);expect(await page.locator('.mcq-result').evaluate(el=>el.getBoundingClientRect().bottom)).toBeLessThan(400);}
 await page.screenshot({path:`.codex/practice-rework/review-${width}.png`,fullPage:true});
});

test('Only all correct lesson questions award a tick; wrong answers remove it; hover retains status',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('soc3050-progress','[6]'));await page.goto('/#exam?lesson=6');
 const tick=page.locator('.lesson-nav a[href="#lesson/06"] [aria-label="All lesson questions correct"]');await expect(tick).toHaveCount(0);
 await page.getByRole('spinbutton',{name:'Number of questions'}).fill('1');await page.getByRole('button',{name:'Start random run',exact:true}).click();
 let session=await page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-practice-v2')!));await page.locator(`input[value="${byId.get(session.questions[0].id).correct}"]`).check();await page.getByRole('button',{name:'Finish',exact:true}).click();await expect(tick).toHaveCount(0);
 await page.getByRole('button',{name:'Choose another run',exact:true}).click();await page.getByRole('spinbutton',{name:'Number of questions'}).fill('999');await page.getByRole('button',{name:'Start random run',exact:true}).click();
 session=await page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-practice-v2')!));
 for(let i=0;i<session.questions.length;i++){const q=byId.get(session.questions[i].id);await page.locator(`input[value="${q.correct}"]`).check();if(i<session.questions.length-1)await page.getByRole('button',{name:'Next question',exact:true}).click();}
 await page.getByRole('button',{name:'Finish',exact:true}).click();await expect(tick).toHaveCount(1);await page.reload();await expect(tick).toHaveCount(1);
 await page.getByRole('button',{name:'New random run',exact:true}).click();session=await page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-practice-v2')!));const q=byId.get(session.questions[0].id);await page.locator(`input[value="${(q.correct+1)%q.options.length}"]`).check();await page.getByRole('button',{name:'Finish',exact:true}).click();await expect(tick).toHaveCount(0);
 const row=page.locator('.review-table .review-incorrect');await row.getByRole('button').click();await row.getByRole('button').hover();expect(await row.getByRole('button').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');expect(await row.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 240, 238)');
});
