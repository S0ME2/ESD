/** Deterministic educational models. Numbers are simulation results, never hardware measurements. */
export const clamp = (v:number, lo:number, hi:number) => Math.max(lo,Math.min(hi,v));
export function complementary(previous:number,gyro:number,accel:number,dt:number,alpha:number){return alpha*(previous+gyro*dt)+(1-alpha)*accel;}
export function mixer(throttle:number,roll:number,pitch=0,yaw=0){return [throttle+roll+pitch-yaw,throttle-roll+pitch+yaw,throttle-roll-pitch-yaw,throttle+roll-pitch+yaw].map(x=>clamp(x,0,1));}
export interface Attitude {t:number;angle:number;rate:number;estimate:number;accel:number;gyro:number;error:number;p:number;i:number;d:number;u:number;motors:number[];armed:boolean;}
export function attitudeRun(kp=4,alpha=.98,wrongSign=false,kick=20,target=0):Attitude[]{
 let angle=kick,rate=0,estimate=kick,integral=0,torque=0; const out:Attitude[]=[];const dt=.02;
 for(let k=0;k<181;k++){const accel=angle+2*Math.sin(k*1.7),gyro=rate+.8;estimate=complementary(estimate,gyro,accel,dt,alpha);const error=target-estimate;
 integral=clamp(integral+error*dt,-20,20);const p=kp*error,i=.3*integral,d=-1.8*gyro;const armed=Math.abs(estimate)<60;const u=armed?clamp(p+i+d,-100,100):0;
 const motors=armed?mixer(.35,(wrongSign?-1:1)*u/400):[0,0,0,0];out.push({t:k*dt,angle,rate,estimate,accel,gyro,error,p,i,d,u,motors,armed});
 torque+=( (motors[0]+motors[3]-motors[1]-motors[2])*300-torque)*dt/.05;rate+=(torque-.8*rate)*dt;angle=clamp(angle+rate*dt,-90,90);
 }return out;
}
export type FlightMode='MISSION'|'RTL'|'LAND'|'DISARMED';
export function flightSafety(battery:number,radius:number):{mode:FlightMode;reason:string}{if(battery<10)return{mode:'LAND',reason:'BATCRIT: land here; critical battery outranks return'};if(battery<25)return{mode:'RTL',reason:'BAT: return home'};if(radius>50)return{mode:'RTL',reason:'FENCE: outside 50 m'};return{mode:'MISSION',reason:'Valid mission; aircraft controls locally'};}
export function missionRun(battery=80,wind=0){
 let x=0,y=0,vx=0,vy=0,wp=0;const waypoints=[[12,0],[12,10],[0,10],[0,0]];const out=[];
 for(let k=0;k<121;k++){
  const safety=flightSafety(battery,Math.hypot(x,y));
  if(safety.mode==='MISSION'&&Math.hypot(waypoints[wp][0]-x,waypoints[wp][1]-y)<1.5)wp=Math.min(3,wp+1);
  const target=safety.mode==='RTL'?[0,0]:safety.mode==='LAND'?[x,y]:waypoints[wp];const ex=target[0]-x,ey=target[1]-y;
  const vsp=[clamp(ex*.8,-3,3),clamp(ey*.8,-3,3)];const ax=clamp((vsp[0]-vx)*2,-3,3),ay=clamp((vsp[1]-vy)*2,-3,3);
  out.push({t:k*.2,x,y,wp,target:[...target],mode:safety.mode,reason:safety.reason,vsp,acc:[ax,ay],tilt:Math.atan2(Math.hypot(ax,ay),9.81)*180/Math.PI,battery});
  if(safety.mode!=='LAND'){vx+=(ax+wind*.2-.1*vx)*.2;vy+=(ay-.1*vy)*.2;x+=vx*.2;y+=vy*.2;}else{vx=0;vy=0;}
 }return out;
}
export function linePosition(readings:number[],threshold=300){let weight=0,sum=0;readings.forEach((v,i)=>{const w=Math.max(0,v-threshold);weight+=w;sum+=w*(i-3)*13;});return weight<60?null:sum/weight;}
export function lineRun(kp=20,kd=1,speed=650,noise=0){let x=20,y=0,heading=0,previous=0,df=0,l=0,r=0;const trace=[];for(let k=0;k<201;k++){const track=45*Math.sin(y/140);const readings=Array.from({length:7},(_,i)=>{const lateral=(i-3)*13,sensorX=x+70*Math.sin(heading)+lateral*Math.cos(heading),sensorY=y+70*Math.cos(heading)-lateral*Math.sin(heading),distance=sensorX-45*Math.sin(sensorY/140);return clamp(100+850*Math.exp(-(distance**2)/130)+noise*Math.sin(k*1.9+i*2.2),0,1000);});const e=linePosition(readings);let turn=0;if(e!==null){df+=.5*((k===0?0:(e-previous)/.02)-df);turn=kp*e+kd*df;previous=e;}else turn=previous>=0?500:-500;const base=e===null?0:speed*(1-.5*Math.abs(e)/39);const leftCommand=clamp(base-turn,-2000,2000),rightCommand=clamp(base+turn,-2000,2000);l+=(leftCommand-l)*.02/.08;r+=(rightCommand-r)*.02/.08;trace.push({t:k*.02,x,y,heading,track,readings,error:e,p:e===null?0:kp*e,d:e===null?0:kd*df,turn,base,leftCommand,rightCommand,left:l,right:r,lost:e===null});heading+=(r-l)/120*.02;x+=(l+r)/2*Math.sin(heading)*.02;y+=(l+r)/2*Math.cos(heading)*.02;}return trace;}
export type Cell=[number,number];
export function astar(width:number,height:number,blocked:Set<string>,start:Cell,goal:Cell):Cell[]{const key=(c:Cell)=>c.join(',');const open=[start];const parent=new Map<string,string>();const cost=new Map([[key(start),0]]);const done=new Set<string>();while(open.length){open.sort((a,b)=>(cost.get(key(a))!+Math.abs(a[0]-goal[0])+Math.abs(a[1]-goal[1]))-(cost.get(key(b))!+Math.abs(b[0]-goal[0])+Math.abs(b[1]-goal[1])));const p=open.shift()!,pk=key(p);if(done.has(pk))continue;if(pk===key(goal)){const path:Cell[]=[goal];let q=pk;while(parent.has(q)){q=parent.get(q)!;path.unshift(q.split(',').map(Number) as Cell);}return path;}done.add(pk);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n:Cell=[p[0]+dx,p[1]+dy],nk=key(n);if(n[0]<0||n[1]<0||n[0]>=width||n[1]>=height||blocked.has(nk))continue;const g=cost.get(pk)!+1;if(g<(cost.get(nk)??Infinity)){cost.set(nk,g);parent.set(nk,pk);open.push(n);}}}return[];}
export function navigationFrames(obstacle=true){const truth=new Set<string>(obstacle?['5,3','5,2','5,4']:[]),belief=new Set<string>();let pose:Cell=[1,3];const goal:Cell=[10,3];const frames=[];for(let i=0;i<25;i++){const before=astar(12,7,belief,pose,goal);let found=false;for(const wall of truth){const c=wall.split(',').map(Number);if(Math.abs(c[0]-pose[0])+Math.abs(c[1]-pose[1])<=2&&!belief.has(wall)){belief.add(wall);found=true;}}const plan=astar(12,7,belief,pose,goal);frames.push({pose:[...pose] as Cell,truth:new Set(truth),belief:new Set(belief),plan,previous:before,found,detail:found?'Range observation marks occupied cells. Old route invalid; A* searches again.':'Follow next planned cell. Unknown cells are optimistically traversable.'});if(plan.length>1)pose=plan[1];else break;}return frames;}
export type BalanceMode='PID tilt'|'cascade'|'LQR';
/** Course params.h/world.c equations and control.c gains, perfect-state sensing omitted noise/estimator. */
export function balanceRun(mode:BalanceMode,kick=.08,payload=0){let x=0,v=0,th=.04,w=0,integ=0,u=0,fallen=false;const m=.8+payload,l=(.08+payload*.2)/m,I=.0045+.8*(.1-l)**2+payload*(.2-l)**2;const out=[];for(let k=0;k<3001;k++){if(k%5===0){integ=clamp(integ+th*.005,-.1,.1);const ref=clamp(-.2*x-.6*v,-.3,.3);u=mode==='PID tilt'?150*th+50*integ+4*w:mode==='cascade'?25*(th-ref)+2*w:5.1239*x+15.255*v+21.262*th+2.4627*w;u=clamp(u,-7.4,7.4);if(Math.abs(th)>.87)u=0;}
 if(k%20===0)out.push({t:k*.001,x,v,angle:th*180/Math.PI,rate:w,estimate:th*180/Math.PI,volts:fallen?0:u,fallen});if(fallen)continue;
 const tau=2*(.2*(u-.2*(v/.035-w))/4-.002*(v/.035-w));const F=k>=200&&k<220?kick/.02:0;const a=m+.15,b=m*l*Math.cos(th),c=I+m*l*l,b1=tau/.035+m*l*Math.sin(th)*w*w-.05*v+F,b2=m*9.81*l*Math.sin(th)-tau+F*l*Math.cos(th),det=a*c-b*b;v+=(c*b1-b*b2)/det*.001;w+=(a*b2-b*b1)/det*.001;x+=v*.001;th+=w*.001;if(Math.abs(th)>.785){fallen=true;v=w=0;}
 }return out;}
export interface SumoBody{x:number;y:number;heading:number;}
export interface SumoView{distance:number|null;edge:boolean;edgeBits?:number;bump:boolean;}
export function sumoSense(me:SumoBody,other:SumoBody):SumoView{const dx=other.x-me.x,dy=other.y-me.y,d=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)-me.heading;const wrapped=Math.atan2(Math.sin(angle),Math.cos(angle));let edgeBits=0;[[.04,.04],[.04,-.04],[-.04,.04],[-.04,-.04]].forEach(([f,l],i)=>{const sx=me.x+f*Math.cos(me.heading)-l*Math.sin(me.heading),sy=me.y+f*Math.sin(me.heading)+l*Math.cos(me.heading);if(Math.hypot(sx,sy)>.36)edgeBits|=1<<i;});return{distance:Math.abs(wrapped)<Math.PI/6&&d<.6?Math.max(0,d-.11):null,edge:edgeBits!==0,edgeBits,bump:d<.115};}
export function sumoStrategy(view:SumoView,safe=true){if(view.edge&&safe){const bits=view.edgeBits??3,front=(bits&3)!==0,back=(bits&12)!==0;return{left:front&&back?.3:front?-.6:.6,right:front&&back?-.3:front?-.3:.3,state:'ESCAPE',why:front&&back?'Front and rear see white on a side: pivot to face inward.':front?'Front edge sensors see white; reverse and turn before attacking.':'Rear edge sensors see white; drive forward to leave the boundary.'};}if(view.distance!==null||view.bump)return{left:1,right:1,state:'ATTACK',why:'Forward range or contact sensor sees opponent; drive forward.'};return{left:.45,right:.1,state:'SEARCH',why:'No opponent in forward cone; drive a scanning arc. No truth coordinates used.'};}
export function sumoRun(safe=true,edgeTrial=false){
 const bodies:SumoBody[]=edgeTrial?[{x:.33,y:0,heading:0},{x:-.15,y:-.15,heading:Math.PI/2}]:[{x:-.17,y:0,heading:0},{x:.2,y:.025,heading:Math.PI}];const frames=[];let winner='';
 for(let k=0;k<251;k++){
  const views=bodies.map((b,i)=>sumoSense(b,bodies[1-i]));const commands=views.map((v,i)=>sumoStrategy(v,i===0?safe:true));
  if(k===250&&!winner)winner='5 s teaching round limit: draw. Neither centre left ring.';
  frames.push({t:k*.02,bodies:bodies.map(b=>({...b})),views,commands,winner});if(winner)break;
  const velocities=bodies.map((b,i)=>{const c=commands[i];b.heading+=(c.right-c.left)*.8/.09*.02;const speed=(c.left+c.right)*.4;return{x:speed*Math.cos(b.heading),y:speed*Math.sin(b.heading)};});
  let dx=bodies[1].x-bodies[0].x,dy=bodies[1].y-bodies[0].y,d=Math.hypot(dx,dy);if(d<.115){const nx=d?dx/d:1,ny=d?dy/d:0,closing=(velocities[0].x-velocities[1].x)*nx+(velocities[0].y-velocities[1].y)*ny;if(closing>0){velocities[0].x-=closing*nx/2;velocities[0].y-=closing*ny/2;velocities[1].x+=closing*nx/2;velocities[1].y+=closing*ny/2;}}
  for(let i=0;i<2;i++){bodies[i].x+=velocities[i].x*.02;bodies[i].y+=velocities[i].y*.02;if(Math.hypot(bodies[i].x,bodies[i].y)>.385)winner=`Robot ${i+1} centre left ring. Robot ${2-i} wins.`;}
  dx=bodies[1].x-bodies[0].x;dy=bodies[1].y-bodies[0].y;d=Math.hypot(dx,dy);if(d<.11){const correction=(.11-d)/2,nx=d?dx/d:1,ny=d?dy/d:0;bodies[0].x-=correction*nx;bodies[0].y-=correction*ny;bodies[1].x+=correction*nx;bodies[1].y+=correction*ny;}
 }return frames;
}
export interface ProjectTask{name:string;period:number;deadline:number;budget:number;owner:string;shared:string;recovery:string;}
export function projectWarnings(tasks:ProjectTask[]){const messages:string[]=[];for(const t of tasks){if(!t.name.trim())messages.push('Every task needs a name.');if(!Number.isFinite(t.period)||!Number.isFinite(t.deadline)||!Number.isFinite(t.budget)||t.period<=0||t.deadline<=0||t.budget<0)messages.push(`${t.name}: times must be positive; budget may be zero.`);if(t.deadline>t.period)messages.push(`${t.name}: deadline exceeds period; successive jobs may overlap.`);if(t.budget>t.deadline)messages.push(`${t.name}: estimated work exceeds deadline.`);if(!t.recovery.trim())messages.push(`${t.name}: define failure recovery.`);}const load=tasks.reduce((a,t)=>a+(Number.isFinite(t.period)&&Number.isFinite(t.budget)&&t.period>0?t.budget/t.period:0),0);if(load>=1)messages.push('Estimated CPU demand reaches/exceeds 100%; reduce work or rate.');return{load,messages};}
