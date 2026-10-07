import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import manifest from '../../src/course/manifest.json';
import { lectureSections } from '../../src/components/LectureReader';
import { sampleState } from '../../src/components/usePlayback';
import { attitudeRun, navigationFrames, lineRun } from '../../src/models/applications';

describe('Complete reading preserves the professor’s material',()=>{
 for(const lesson of manifest.lessons)it(`retains every character of lecture ${lesson.id} when making navigable sections`,()=>{
  const original=readFileSync(`public/source/${lesson.directory}/Slide.md`,'utf8');
  expect(lectureSections(original).map(s=>s.text).join('\n')).toBe(original);
 });
 it('does not treat headings inside code fences as lecture sections',()=>{
  const text='## First\n```c\n## This is code\n```\n## Second\n~~~txt\n## More code\n~~~\n';
  const sections=lectureSections(text);
  expect(sections.map(s=>s.title)).toEqual(['First','Second']);
  expect(sections.map(s=>s.text).join('\n')).toBe(text);
 });
});
describe('Physical motion moves between simulation samples',()=>{
 it('uses the forward sensor bar so the default follower retains the line',()=>{
  const states=lineRun();
  expect(states.filter(s=>s.lost)).toHaveLength(0);
  expect(states.at(-1)!.y).toBeGreaterThan(2000);
  // At reset the bar already sees the tape ahead, rather than sampling at the axle.
  expect(states[0].error).toBeGreaterThan(0);
  expect(states[0].right).toBeGreaterThan(states[0].left);
 });
 it('interpolates real drone angle and motor values without mutating simulator output',()=>{
  const states=attitudeRun(),before=structuredClone(states);
  const halfway=sampleState(states,.5);
  expect(halfway.angle).toBeCloseTo((states[0].angle+states[1].angle)/2,10);
  expect(halfway.motors[0]).toBeCloseTo((states[0].motors[0]+states[1].motors[0])/2,10);
  expect(halfway.angle).not.toBe(states[0].angle);
  expect(states).toEqual(before);
  expect(sampleState(states,0)).toEqual(states[0]);
  expect(sampleState(states,states.length-1)).toEqual(states.at(-1));
 });
 it('keeps belief and planning discrete while moving a robot continuously',()=>{
  const states=navigationFrames();const i=states.findIndex(s=>s.found);
  const between=sampleState(states,i-.5);
  expect(between.belief).toBe(states[i-1].belief);
  expect(between.plan).toBe(states[i-1].plan);
  expect(between.found).toBe(states[i-1].found);
  expect(between.pose[0]).toBe((states[i-1].pose[0]+states[i].pose[0])/2);
  expect(sampleState(states,i).belief).toBe(states[i].belief);
 });
});
