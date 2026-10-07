/// <reference types="vite/client" />

export interface StudyNote { title:string; sourceHeadings:string[]; body:string }
export interface CompleteNotes { sections:StudyNote[] }

const groups=import.meta.glob<Record<string,CompleteNotes>>('./notes/*.json',{import:'default'});
const cache=new Map<string,Promise<Record<string,CompleteNotes>>>();
export async function loadNotes(id:number):Promise<StudyNote[]> {
 const group=id<7?'foundations':id<13?'systems':'applications';
 const path=`./notes/${group}.json`;
 const loader=groups[path];
 if(!loader)throw Error('The study chapter is unavailable.');
 if(!cache.has(path))cache.set(path,loader());
 try{return (await cache.get(path))?.[id]?.sections||[];}
 catch(error){cache.delete(path);throw error;}
}
export const noteId=(lesson:number,index:number)=>`note-${lesson}-${index}`;
