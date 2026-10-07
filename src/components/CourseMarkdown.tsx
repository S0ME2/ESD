import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import manifest from '../course/manifest.json';
import registerDiagrams from '../course/register-diagrams.json';
const github='https://github.com/gnoejh/soc3050code/blob/'+manifest.revision+'/projects2026_arm/';
const svgTags=new Set(['svg','g','rect','text','tspan','path','line','circle','ellipse','polyline','polygon','defs','marker','title','desc']);
const svgAttrs=new Set(['viewBox','x','y','x1','x2','y1','y2','cx','cy','r','rx','ry','width','height','d','points','fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','stroke-linecap','stroke-linejoin','marker-end','opacity','text-anchor','font-size','font-weight','class','id','markerWidth','markerHeight','refX','refY','orient','markerUnits','role','aria-label','xmlns','xml:space','transform']);
function renderSvgPreview(source:string):{url:string;label:string;width:number;height:number}|null {
 try {
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');const svg=doc.documentElement;
  if(svg.localName!=='svg'||doc.querySelector('parsererror'))return null;
  const nodes=[svg,...Array.from(svg.querySelectorAll('*'))];
  for(const node of nodes){
   if(!svgTags.has(node.localName)){node.remove();continue;}
   for(const attr of Array.from(node.attributes)){
    const localMarker=attr.name==='marker-end'&&/^url\(#[A-Za-z0-9_-]+\)$/.test(attr.value);
    const safeTransform=attr.name==='transform'&&/^(?:(?:translate|scale|rotate|matrix|skewX|skewY)\(\s*[-+0-9.eE,\s]+\)\s*)+$/.test(attr.value);
    if(!svgAttrs.has(attr.name)||/^on/i.test(attr.name)||(/url\s*\(|javascript:/i.test(attr.value)&&!localMarker)||attr.name==='transform'&&!safeTransform)node.removeAttribute(attr.name);
   }
  }
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','100%');
  const style=doc.createElementNS('http://www.w3.org/2000/svg','style');
  style.textContent='.reg,.box{fill:#fff;stroke:#aabbd4;stroke-width:1.4}.hifill{fill:#b8d6fa;stroke:#0066cc}.hi{fill:none;stroke:#0066cc;stroke-width:2}.dash{fill:none;stroke:#8996a8;stroke-dasharray:5 4}.wire{fill:none;stroke:#68778d;stroke-width:1.5}.lbl{font:11px sans-serif;fill:#1d1d1f}.mono{font-family:monospace}text{fill:#1d1d1f}';
  svg.insertBefore(style,svg.firstChild);
  const dimensions=(svg.getAttribute('viewBox')||'').trim().split(/[ ,]+/).map(Number);const width=Number.isFinite(dimensions[2])&&dimensions[2]>0?dimensions[2]:560;const height=Number.isFinite(dimensions[3])&&dimensions[3]>0?dimensions[3]:220;
  return {url:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`,label:svg.getAttribute('aria-label')||'Course vector diagram',width,height};
 } catch {return null;}
}

export function CourseMarkdown({text,file}:{text:string;file:string}) {
 return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{h1:({children})=><h2>{children}</h2>,pre:({children})=>{
  const child=Children.only(children) as ReactNode;
  if(isValidElement<{className?:string;children?:ReactNode}>(child)&&child.props.className?.includes('language-regs')){
   const definition=String(child.props.children??'').trim();
   const url=(registerDiagrams as Record<string,string>)[definition];
   if(url){const label=definition.split('\n').filter(line=>line.startsWith('#')).map(line=>line.replace(/^#+\s*/,'')).join('; ')||'Register fields drawn to scale';return <figure className="register-diagram"><div className="register-viewport" tabIndex={0} role="region" aria-label="Register diagram; scroll horizontally to inspect fields"><img src={url} alt={label} loading="lazy"/></div><figcaption>{label}</figcaption></figure>;}
  }
  if(isValidElement<{className?:string;children?:ReactNode}>(child)&&child.props.className?.includes('language-svg')){
   const preview=renderSvgPreview(String(child.props.children??''));
   if(preview)return <figure className="source-diagram"><div className="source-illustration-viewport" tabIndex={0} role="region" aria-label="Lecture illustration; scroll horizontally to inspect details"><img src={preview.url} alt={preview.label} style={{width:preview.width,height:'auto'}} width={preview.width} height={preview.height} loading="lazy"/></div><figcaption>{preview.label}</figcaption></figure>;
  }
  return <pre tabIndex={0} role="region" aria-label="Scrollable course code">{children}</pre>;
 },table:({children})=><table tabIndex={0} aria-label="Scrollable course table">{children}</table>,a:({href,children})=><a href={href?.startsWith('http')?href:href?.startsWith('#')?href:new URL(href||'',github+file).href} target={href?.startsWith('#')?undefined:'_blank'} rel="noreferrer">{children}</a>}}>{text}</ReactMarkdown>;
}
