import {ConceptText} from './ConceptText';
import { study } from '../course/study';
import {beginner} from '../course/beginner';
import {keyIdeas} from '../course/keyIdeas';

export function LessonExplanation({id,onVisualize,onExample}:{id:number;onVisualize?:(stage:number)=>void;onExample?:()=>void}) {
 const guide=beginner[id];
 return <section className="lesson-explanation" aria-label="Lesson explanation"><span className="section-kicker">THE IDEA IN PLAIN LANGUAGE</span><h2>How the ideas fit together</h2><p className="lesson-key-idea"><span>KEY IDEA</span><strong>{keyIdeas[id]}</strong></p>{guide.explanation.map(p=><p key={p}><ConceptText text={p}/></p>)}<aside className="learning-analogy"><h3>Picture it this way</h3><p><ConceptText text={guide.analogy[0]}/></p><p className="analogy-boundary"><strong>Where the comparison stops:</strong> <ConceptText text={guide.analogy[1]}/></p></aside><div className="learning-actions">{onVisualize&&<button className="text-link" onClick={()=>onVisualize(guide.exampleStage??0)}>Return to the picture</button>}{onExample&&<button className="text-link" onClick={onExample}>Work through a concrete example</button>}</div><section className="deeper-explanation"><h3>Hardware rule</h3>{study[id].explanation.slice(1).map(p=><p key={p}><ConceptText text={p}/></p>)}</section></section>;
}
export function WorkedExample({id,onVisualize,onExperiment}:{id:number;onVisualize?:(stage:number)=>void;onExperiment?:(topic:number)=>void}) {
 const example=study[id].example;
 const guide=beginner[id];
 return <section className="worked-example" aria-label="Worked example"><span className="section-kicker">WORKED EXAMPLE</span><h2>{example.question}</h2><p>Follow each step, then check the result.</p><ol>{example.steps.map(s=><li key={s}>{s}</li>)}</ol><p className="example-conclusion">{example.conclusion}</p><div className="example-links">{guide.exampleStage!==null&&onVisualize&&<button onClick={()=>onVisualize(guide.exampleStage!)}>Watch the related animation step</button>}{onExperiment&&<button onClick={()=>onExperiment(guide.exampleTopic)}>Try a related example in the lab</button>}</div><p className="microcopy">Use the same reasoning with the experiment’s numbers.</p></section>;
}
