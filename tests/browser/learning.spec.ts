import {test,expect} from '@playwright/test';
import {beginner,studyStages} from '../../src/course/beginner';
const plain=(text:string)=>text.replace(/\*\*/g,'');

for(let id=0;id<20;id++)test(`Visible teaching and diagrams in lesson ${id}`,async({page})=>{
 await page.goto(`/#lesson/${String(id).padStart(2,'0')}`);
 const animation=page.locator('.lesson-animation');
 await expect(animation.locator('.animation-intro')).toHaveText(plain(beginner[id].intro));
 await expect(animation.locator('.learning-vocabulary')).toHaveAttribute('open','');
 for(let stage=0;stage<4;stage++){
  await animation.getByRole('button',{name:`Explanation stage ${stage+1}`,exact:true}).click();
  await expect(animation.locator('.animation-explanation')).toContainText(plain(beginner[id].stages[stage][0]));
  await expect(animation.locator('.animation-learning>p')).toHaveText(plain(beginner[id].stages[stage][1]));
  await expect(animation.getByRole('button',{name:'Play animation',exact:true})).toBeVisible();
 }
 await expect(page.locator('.learning-analogy')).toContainText(plain(beginner[id].analogy[0]));
 await expect(page.locator('.deeper-explanation p').first()).toBeVisible();
 await page.getByRole('button',{name:'Return to the idea',exact:true}).click();
 await expect(page.locator('.lesson-explanation')).toBeInViewport();
 if(beginner[id].exampleStage!==null){
  await page.getByRole('button',{name:'Watch the related animation step',exact:true}).click();
  await expect(animation.getByRole('slider',{name:'Animation position'})).toHaveValue(String(beginner[id].exampleStage!*25+1));
 }
 await page.getByRole('button',{name:'Try a related example in the lab',exact:true}).click();
 await expect(page.locator('.lab-panel').first()).toBeVisible();
});

test('Primer teaches six examples and sends questions to practice',async({page})=>{
 await page.goto('/#start');await expect(page.locator('.starting-primer article')).toHaveCount(6);
 await expect(page.locator('.starting-primer fieldset')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Practice the building blocks',exact:true})).toHaveAttribute('href','#exam?lesson=0&topic=primer');
 await page.getByRole('button',{name:'Start lesson 00',exact:true}).click();await expect(page).toHaveURL(/#lesson\/00/);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('soc3050-study-v1')!).primer)).toBe(true);
});

test('Checkpoints persist independently of prediction marks',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('soc3050-progress','[4]'));await page.goto('/#lesson/00?section=practice');
 for(const key of ['reading','worked','recall'])await page.locator(`#study-0-${key}`).check();
 await page.reload();for(const key of ['reading','worked','recall'])await expect(page.locator(`#study-0-${key}`)).toBeChecked();
 expect(await page.evaluate(()=>localStorage.getItem('soc3050-progress'))).toBe('[4]');
});

test('Practice and example links scroll within a complete chapter',async({page})=>{
 await page.goto('/#lesson/00?section=example');await expect(page.locator('.worked-example')).toBeInViewport();
 await page.evaluate(()=>{location.hash='lesson/00?section=practice';});await expect(page.locator('#lesson-practice')).toBeInViewport();
 await expect(page.locator('.lesson-explanation')).toBeVisible();await expect(page.locator('.worked-example')).toBeVisible();
 await expect(page.getByRole('tablist')).toHaveCount(0);
});

for(const width of [1440,375,320])test(`Chapter navigation keeps content open at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/#lesson/00');
 await expect(page.locator('.study-note').first()).toBeVisible();
 if(width<768)await page.getByRole('combobox',{name:'Jump to a section',exact:true}).selectOption('lesson-example');
 else await page.getByRole('navigation',{name:'Page contents'}).getByRole('button',{name:'Worked example',exact:true}).click();
 await expect(page.locator('.worked-example')).toBeInViewport();await expect(page.locator('.lesson-explanation')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});

test('Roadmap covers each lesson once',()=>{
 expect(studyStages.flatMap(stage=>Array.from({length:stage.range[1]-stage.range[0]+1},(_,i)=>i+stage.range[0]))).toEqual(Array.from({length:20},(_,i)=>i));
});
