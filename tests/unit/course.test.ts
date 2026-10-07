import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import manifest from '../../src/course/manifest.json';
import { lessons as foundations } from '../../src/course/foundations';
import { lessons as systems } from '../../src/course/systems';
import { lessons as applications } from '../../src/course/applications';

const lessons=[...foundations,...systems,...applications];
describe('The pinned course remains one connected system',()=>{
 it('matches every published lesson in order, excluding archived architectures',()=>{
  expect(lessons.map(l=>l.id)).toEqual(Array.from({length:20},(_,i)=>i));
  expect(manifest.lessons.map(l=>l.id)).toEqual(lessons.map(l=>l.id));
  const live=readFileSync(new URL('../fixtures/live-index.html', import.meta.url),'utf8');
  for(const source of manifest.lessons)expect(live).toContain('href="'+source.directory+'.html"');
 });
 it('has resolvable prerequisites, technical source links and predictions',()=>{
  for(const lesson of lessons){
   for(const prerequisite of lesson.prerequisites)expect(prerequisite).toBeLessThan(lesson.id);
   expect(lesson.prediction.correct).toBeGreaterThanOrEqual(0);
   expect(lesson.prediction.correct).toBeLessThan(lesson.prediction.options.length);
   expect(lesson.prediction.explanations.length).toBe(lesson.prediction.options.length);
   for(const topic of lesson.topics){
    expect(topic.simple.length).toBeGreaterThan(30);
    expect(topic.why.length).toBeGreaterThan(30);
    expect(topic.mechanism.length).toBeGreaterThan(30);
    expect(topic.technical.length).toBeGreaterThan(30);
    expect(topic.experiment.length).toBeGreaterThan(20);
    if(topic.source)expect(existsSync('public/source/'+topic.source),topic.source).toBe(true);
   }
   for(const source of lesson.sources.filter(s=>!s.startsWith('http')))expect(existsSync('public/source/'+source),source).toBe(true);
  }
 });
 it('provides a concrete beginning, causal sequence and memory anchor for every lesson and topic',()=>{
  for(const lesson of lessons){
   expect(lesson.start?.problem.length).toBeGreaterThan(60);
   expect(lesson.start?.outcome.length).toBeGreaterThan(40);
   expect(lesson.start?.firstExperiment).toHaveLength(3);
   for(const action of lesson.start!.firstExperiment)expect(action.length).toBeGreaterThan(20);
   for(const topic of lesson.topics){
    expect(topic.simple.length).toBeGreaterThan(120);
    expect(topic.steps!.length).toBeGreaterThanOrEqual(3);
    expect(topic.steps!.length).toBeLessThanOrEqual(6);
    expect(topic.remember!.length).toBeGreaterThan(30);
   }
  }
 });
 it('keeps each preserved source byte-identical to its pinned inventory',()=>{
  const inventory=JSON.parse(readFileSync('public/source/inventory.json','utf8')) as {path:string;sha256:string}[];
  for(const entry of inventory){
   expect(createHash('sha256').update(readFileSync('public/source/'+entry.path)).digest('hex'),entry.path).toBe(entry.sha256);
  }
 });
});
