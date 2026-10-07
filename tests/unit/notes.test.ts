import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import manifest from '../../src/course/manifest.json';
import type {CompleteNotes} from '../../src/course/notes';
const notes:Record<number,CompleteNotes>={};
for(const group of ['foundations','systems','applications'])Object.assign(notes,JSON.parse(readFileSync(`src/course/notes/${group}.json`,'utf8')));
function headings(text:string){
 let fence='';const titles:string[]=[];
 for(const line of text.split('\n')){
  const marker=line.match(/^\s*(`{3,}|~{3,})/);
  if(marker){if(!fence)fence=marker[1][0];else if(marker[1][0]===fence)fence='';}
  if(!fence&&line.startsWith('## ')&&!line.startsWith('## SOC3050'))titles.push(line.slice(3));
 }
 return titles;
}
describe('Complete rewritten study chapters',()=>{
 it('covers every instructional heading in all twenty pinned decks',()=>{
  expect(Object.keys(notes).map(Number).sort((a,b)=>a-b)).toEqual(Array.from({length:20},(_,i)=>i));
  for(const lesson of manifest.lessons){
   const expected=headings(readFileSync(`public/source/${lesson.directory}/Slide.md`,'utf8'));
   const actual=[...new Set(notes[lesson.id].sections.flatMap(s=>s.sourceHeadings))];
   expect(actual.sort(),`lesson ${lesson.id} source coverage`).toEqual(expected.sort());
  }
 });
 it('contains explanations without question blocks or source diagram syntax',()=>{
  for(const [id,chapter] of Object.entries(notes))for(const section of chapter.sections){
   expect(section.title,`${id}: section title`).not.toMatch(/^Slide \d/);
   expect(section.body.length).toBeGreaterThan(80);expect(section.body).not.toMatch(/```(?:svg|regs)\b/);
   expect(section).not.toHaveProperty('questions');
  }
 });
});
