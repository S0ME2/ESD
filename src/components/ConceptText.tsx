/** Only authored emphasis is interpreted; all other text stays literal. */
export function ConceptText({text}:{text:string}) {
 return <>{text.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')&&part.endsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part)}</>;
}
