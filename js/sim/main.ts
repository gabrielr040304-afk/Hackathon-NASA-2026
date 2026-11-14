import * as THREE from 'three';
import * as C from '../config.js';
import { parseTerrain, heightAt, slopeAt, lonLatToLocal } from './terrain.js';
import { effort, walkSpeedKmh, airTempAt } from '../calc.js';
import { assessMission, clockTime } from '../mission.js';
import { consumption, projectUsage, renderedHeight, drapeRoute, type Usage } from './model.js';
const $ = (id: string): any => document.getElementById(id);
const usage: Usage = { seconds: 0, effortSeconds: 0, distance: 0 };
let active = false, ended = false, yaw = 0, pitch = 0, mapOpen = false, nextPoint = 1;
const keys = new Set<string>();
let terrain: any, scene: any, camera: any, renderer: any, site: any, route: any, prep: any, weather: any, points: any[] = [], targets: any[] = [];
let x = 0, z = 0, y = 0, baseHeight = 0, last = performance.now(), message = '';
let image: HTMLImageElement;
let lastScan = 0, scanKey = "";
const fmt = (n: number, d = 1) => n.toFixed(d);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
async function json(path: string) { const r = await fetch(path); if (!r.ok) throw Error(`Missing ${path}`); return r.json(); }
function telemetry(u: Usage) { const c = consumption(u); return `<div class="metrics"><span>Elapsed [S]: ${fmt(u.seconds / 3600,2)} h</span><span>Distance [S]: ${fmt(u.distance)} m</span><span>Oxygen used [S]: ${fmt(c.oxygenUsed)}%</span><span>Cooling water used [S]: ${fmt(c.waterUsed)}%</span><span>Battery used [S]: ${fmt(c.batteryUsed)}%</span><span>Reserve [S]: ${fmt(c.reserve)}%</span><span>Reference dose [S]: ${fmt(c.dose,3)} mSv</span></div>`; }
function pause() { active = false; keys.clear(); if (!ended && !mapOpen && !$('science').open) $('pause').hidden = false; }
async function enter() { if (ended) return; try { await $('world').requestPointerLock(); } catch { $('loading').textContent = 'Mouse capture was denied. Click Enter again.'; $('overlay').hidden = false; } }
function finish(reason = 'Session ended by the traveler.') { ended = true; active = false; document.exitPointerLock(); $('pause').hidden = true; $('summary').hidden = false; $('actual').innerHTML = `<p>${reason}</p>${telemetry(usage)}<p>Preparation investment [H]: $${fmt(prep.investmentMillion,1)}M. Incremental EVA cost: not priced.</p><p>Science targets visited: ${targets.filter((t) => t.visited).length} / ${targets.length} [S]. Route completed: ${nextPoint >= points.length ? 'yes' : 'no'}.</p>`; forecast(); }
function forecast() { const hours = clamp(Number($('projection').value) || 0, 0, C.SIM.projectionMaxHours); $('forecast').innerHTML = telemetry(projectUsage(usage,hours)); }
function miniMap() { const ctx = $('mini').getContext('2d'); ctx.drawImage(image,0,0,500,500); const px=(v:number)=> (v / ((terrain.width-1)*terrain.m_per_px_x)+.5)*500; const py=(v:number)=> (v / ((terrain.height-1)*terrain.m_per_px_y)+.5)*500; ctx.strokeStyle='#ffe2a3'; ctx.lineWidth=3; ctx.beginPath(); points.forEach((p,i)=> i ? ctx.lineTo(px(p.x),py(p.z)) : ctx.moveTo(px(p.x),py(p.z))); ctx.stroke(); ctx.fillStyle='#72e5ff'; ctx.beginPath(); ctx.arc(px(x),py(z),6,0,Math.PI*2); ctx.fill(); }
function inspect() { const target=targets.find((p)=> Math.hypot(p.x-x,p.z-z)<C.ARRIVAL_RADIUS_M); if(!target){message='Approach a science marker before inspecting.';return;} target.visited=true; active=false; document.exitPointerLock(); $('science-content').innerHTML=`<h2>${target.target.name}</h2><p>${target.target.why}</p>${target.target.photo ? `<img src="${target.target.photo}" alt="${target.target.name}"><p>${target.target.credit}</p>` : ''}<p>Science observation [R]; proximity/visit [S]. No extra radiation protection is inferred.</p>`; $('science').showModal(); }
async function boot() {
  const raw=sessionStorage.getItem('mars-eva-preparation'); if(!raw) throw Error('No prepared mission found. Complete the planner first.'); prep=JSON.parse(raw);
  const sites=await json('data/sites.json'); site=sites.find((s:any)=>s.id==='jezero'); route=site.routes.find((r:any)=>r.id===prep.route);
  if(prep.route==='neretva-short'){const original=site.routes.find((r:any)=>r.id==='neretva-encosta'); const index=original.waypoints.findIndex((p:any)=>p.target?.name==='Neretva Vallis channel floor'); const out=original.waypoints.slice(0,index+1); route={...original,id:'neretva-short',name:'Neretva channel floor - short',waypoints:[...out,...out.slice(0,-1).reverse().map(({target,...p}:any)=>p)]};}
  if(!route || prep.site!=='jezero') throw Error('This simulator supports only the three prepared Jezero routes.');
  const essentials=new Set<string>(prep.essentials); if(C.ESSENTIALS.some((e:any)=>!essentials.has(e.id))) throw Error('Essential life-support systems are missing. Return to preparation.');
  prep.loadKg=C.EQUIPMENT.filter((e:any)=>prep.equipment.includes(e.id)).reduce((sum:number,e:any)=>sum+e.kg,0);
  weather=(await json(site.weather)).find((w:any)=>w.sol===prep.sol);
  const plan=assessMission(site,route,{crew:prep.crew,rover:prep.rover,loadKg:prep.loadKg,start:prep.start},weather,essentials); if(!plan.go) throw Error('This mission is blocked by planner checks. Return to preparation.');
  const meta=await json('data/jezero/terrain.json'); const r=await fetch('data/jezero/terrain.bin'); if(!r.ok)throw Error('Terrain unavailable'); terrain=parseTerrain(meta,await r.arrayBuffer());
  points=[site.habitat,...route.waypoints,site.habitat].map((p:any)=>({...p,...lonLatToLocal(terrain,p.lat,p.lon)}));
  const halfX=(terrain.width-1)*terrain.m_per_px_x/2, halfZ=(terrain.height-1)*terrain.m_per_px_y/2;
  if(points.some((p)=>Math.abs(p.x)>halfX||Math.abs(p.z)>halfZ))throw Error('Route exceeds the available elevation grid.');
  targets=points.filter((p)=>p.target).map((p)=>({...p,visited:false})); x=points[0].x; z=points[0].z; baseHeight=terrain.elev_min;
  scene=new THREE.Scene(); scene.background=new THREE.Color('#b67b52'); scene.fog=new THREE.FogExp2('#bd8159',.0004);
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
  camera=new THREE.PerspectiveCamera(C.SIM.fov,innerWidth/innerHeight,.1,C.SIM.far); camera.rotation.order='YXZ';
  scene.add(new THREE.HemisphereLight('#ffe6bc','#533c32',2)); const sun=new THREE.DirectionalLight('#fff0cf',2.5); sun.position.set(-400,800,100); scene.add(sun);
  const geometry=new THREE.PlaneGeometry(halfX*2,halfZ*2,C.SIM.meshSegments,C.SIM.meshSegments); geometry.rotateX(-Math.PI/2);
  const pos=geometry.attributes.position; for(let i=0;i<pos.count;i++)pos.setY(i,heightAt(terrain,pos.getX(i),pos.getZ(i))-baseHeight); geometry.computeVertexNormals();
  const texture=await new THREE.TextureLoader().loadAsync('data/jezero/texture.jpg'); texture.colorSpace=THREE.SRGBColorSpace; image=texture.image;
  scene.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,color:'#d7a47d',roughness:1})));
  const ribbon = new THREE.BufferGeometry(); const positions = drapeRoute(terrain,points); for(let i=1;i<positions.length;i+=3) positions[i]-=baseHeight;
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  scene.add(new THREE.Mesh(ribbon,new THREE.MeshBasicMaterial({color:'#ffe5a0',side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1})));

  for(const p of [points[0],...targets]){ const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,9,8),new THREE.MeshBasicMaterial({color:p.target?'#ffda82':'#9ce8ff'})); beacon.position.set(p.x,heightAt(terrain,p.x,p.z)-baseHeight+4.5,p.z); scene.add(beacon); }
  yaw=Math.atan2(-(points[1].x-x),-(points[1].z-z)); $('mission-name').textContent=route.name; $('hud').hidden=false; $('loading').textContent='Terrain ready. All route points are inside the shared Jezero grid.'; $('controls').hidden=false; requestAnimationFrame(frame);
}
function frame(now:number) {
  const dt=Math.min((now-last)/1000,C.SIM.maxFrameSeconds); last=now;
  if(active&&!ended){ const scale=Number($('speed').value), seconds=dt*scale; const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0); const side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0); const length=Math.hypot(forward,side); let multiplier=1; message='';
    if(length){ const localSlope=slopeAt(terrain,x,z); const riding=prep.rover&&localSlope<=C.ROVER_MAX_SLOPE_DEG; const speed=walkSpeedKmh(localSlope,prep.loadKg,riding)/3.6; const step=speed*seconds; const nx=x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/length*step, nz=z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/length*step;
      const hx=(terrain.width-1)*terrain.m_per_px_x/2, hz=(terrain.height-1)*terrain.m_per_px_y/2;
      if(Math.abs(nx)>hx||Math.abs(nz)>hz)message='Terrain boundary: no elevation data beyond this point.';
      else if(slopeAt(terrain,nx,nz)>C.SLOPE_NOGO_DEG)message='Movement blocked: sampled slope exceeds the project limit [S].';
      else{ const oldY=heightAt(terrain,x,z),newY=heightAt(terrain,nx,nz); const slope=Math.atan2(newY-oldY,step)*180/Math.PI; multiplier=riding?1:effort(slope,prep.loadKg); usage.distance+=Math.hypot(nx-x,nz-z); x=nx; z=nz; }
    } usage.seconds+=seconds; usage.effortSeconds+=seconds*multiplier;
    while(nextPoint<points.length&&Math.hypot(points[nextPoint].x-x,points[nextPoint].z-z)<C.SIM.waypointRadius)nextPoint++;
    const c=consumption(usage); if(c.reserve<=0)finish('Modeled suit resources exhausted.'); else if(nextPoint>=points.length)finish('Returned to base along the route.');
  }
  y=renderedHeight(terrain,x,z); camera.position.set(x,y-baseHeight+C.SIM.eyeHeight,z); camera.rotation.set(pitch,yaw,0);
  const c=consumption(usage); const start=prep.start.split(':').map(Number); const time=clockTime((start[0]*60+start[1]+usage.seconds/60)%1440);
  $('clock').textContent=`${time} local [S]`; const readings=[['Oxygen',100-c.oxygenUsed],['Cooling water',100-c.waterUsed],['Battery',100-c.batteryUsed]];
  $('readouts').innerHTML=readings.map(([name,value])=>`<div class="reading">${name} ${fmt(Math.max(0,Number(value)))}% [S]<meter min="0" max="100" value="${Math.max(0,Number(value))}"></meter></div>`).join('')+`<div class="reading">${fmt(airTempAt(weather,time))} C air [S]<br>RAD reference dose: ${fmt(c.dose,3)} mSv [S]<br>Extra load: ${prep.loadKg} kg [S]</div>`;
  const lat=terrain.center_lat-z/C.MARS_RADIUS_M*180/Math.PI, lon=terrain.center_lon+x/(C.MARS_RADIUS_M*Math.cos(terrain.center_lat*Math.PI/180))*180/Math.PI;
  const target=points[Math.min(nextPoint,points.length-1)]; $('navigation').textContent=`${fmt(lat,5)}, ${fmt(lon,5)} [S] | Next waypoint ${Math.min(nextPoint,points.length-1)}/${points.length-1}: ${fmt(Math.hypot(target.x-x,target.z-z))} m [S] | ${prep.rover?'Support rover model':'On foot'} | Tools: ${C.EQUIPMENT.filter((e:any)=>prep.equipment.includes(e.id)).map((e:any)=>e.name).join(', ')}`;
  const sunset=weather.sunset.split(':').map(Number); const late=start[0]*60+start[1]+usage.seconds/60>sunset[0]*60+sunset[1]-C.DAYLIGHT_MARGIN_MIN;
  $('notice').textContent=message||(late?'Return daylight margin exceeded [S].':c.reserve<C.RESERVE_PCT?'Reserve below the project return margin [S].':targets.some(p=>Math.hypot(p.x-x,p.z-z)<C.ARRIVAL_RADIUS_M)?'Press E to inspect this science target.':'Follow the amber route. Radiation is a Gale reference, not a local forecast.'); if(now-lastScan>C.SIM_GUIDANCE.scanIntervalMs){scanAhead();lastScan=now;} renderer.render(scene,camera); requestAnimationFrame(frame);
}
function scanAhead() {
  const panel=$('scan-detection');
  if(!active){panel.hidden=true;return;}
  camera.updateMatrixWorld();
  let detected:any=null;
  // Directional terrain scan: derived from the height map, not radiation telemetry.
  const hx=(terrain.width-1)*terrain.m_per_px_x/2,hz=(terrain.height-1)*terrain.m_per_px_y/2;
  for(let distance=C.SIM_GUIDANCE.scanStepM;distance<=C.SIM_GUIDANCE.scanRangeM;distance+=C.SIM_GUIDANCE.scanStepM){
    const tx=x-Math.sin(yaw)*distance,tz=z-Math.cos(yaw)*distance;
    if(Math.abs(tx)>hx||Math.abs(tz)>hz)break;
    const slope=slopeAt(terrain,tx,tz);
    if(slope>C.SLOPE_WARN_DEG){detected={x:tx,z:tz,name:slope>C.SLOPE_NOGO_DEG?'STEEP TERRAIN AHEAD':'SLOPE CAUTION',detail:`${fmt(slope)} degrees [D] ? ${distance} m [S]. ${slope>C.SLOPE_NOGO_DEG?'Avoid this slope; stay on the planned corridor.':'Slow down and inspect footing.'}`,key:'slope',kind:'hazard'};break;}
  }
  if(!detected){
    const direction=new THREE.Vector3();camera.getWorldDirection(direction);
    for(const target of targets){
      const delta=new THREE.Vector3(target.x-x,renderedHeight(terrain,target.x,target.z)-y,target.z-z);
      const distance=delta.length();
      if(distance<C.SIM_GUIDANCE.targetRangeM&&direction.dot(delta.normalize())>.8){detected={...target,name:target.target.name,detail:`Science target [R] ? ${fmt(distance)} m [S]. Follow the route; press E within ${C.ARRIVAL_RADIUS_M} m to inspect.`,key:target.target.name,kind:'science'};break;}
    }
  }
  if(!detected){panel.hidden=true;scanKey='';return;}
  const targetHeight=renderedHeight(terrain,detected.x,detected.z)+1;
  const distance=Math.hypot(detected.x-x,detected.z-z);
  for(let along=C.SIM_GUIDANCE.scanStepM;along<distance;along+=C.SIM_GUIDANCE.scanStepM){
    const ratio=along/distance, tx=x+(detected.x-x)*ratio, tz=z+(detected.z-z)*ratio;
    const sightHeight=y+C.SIM.eyeHeight+(targetHeight-y-C.SIM.eyeHeight)*ratio;
    if(renderedHeight(terrain,tx,tz)>sightHeight){panel.hidden=true;return;}
  }
  const projected=new THREE.Vector3(detected.x,targetHeight-baseHeight,detected.z).project(camera);
  // Suppress detections outside the actual view; do not suggest an invisible location.
  if(projected.z>1||projected.z< -1||Math.abs(projected.x)>.95||Math.abs(projected.y)>.85){panel.hidden=true;return;}
  panel.hidden=false;panel.style.left=`${(projected.x*.5+.5)*100}%`;panel.style.top=`${(-projected.y*.5+.5)*100}%`;
  panel.className=detected.kind;
  panel.innerHTML=`<b>${detected.name}</b><p>${detected.detail}</p><small>${detected.kind==='hazard'?'Height-map inference, not a live sensor.':'Orbital/rover science context; not a resource extraction guarantee.'}</small>`;
  if(scanKey!==detected.key){panel.classList.remove('acquired');void panel.offsetWidth;panel.classList.add('acquired');scanKey=detected.key;}
}

document.addEventListener('pointerlockchange',()=>{ if(document.pointerLockElement===$('world')){active=true; $('overlay').hidden=true; $('pause').hidden=true;}else pause(); });
document.addEventListener('mousemove',(e)=>{if(active){yaw-=e.movementX*C.SIM.mouseSensitivity;pitch=clamp(pitch-e.movementY*C.SIM.mouseSensitivity,-Math.PI/2+.01,Math.PI/2-.01);}});
document.addEventListener('keydown',(e)=>{if(e.code==='KeyM'&&!ended&&terrain&&!$('science').open){mapOpen=!mapOpen; $('map-panel').hidden=!mapOpen; if(mapOpen){active=false;document.exitPointerLock();$('pause').hidden=true;miniMap();}else $('pause').hidden=false;return;}if(active){keys.add(e.code);if(e.code==='KeyE')inspect();if(e.code.startsWith('Arrow'))e.preventDefault();}});
document.addEventListener('keyup',(e)=>keys.delete(e.code)); window.addEventListener('blur',()=>{active=false;document.exitPointerLock();pause();});
$('start').onclick=enter; $('resume').onclick=enter; $('finish').onclick=()=>finish(); $('projection').oninput=forecast; $('close-science').onclick=()=>$('science').close(); $('science').addEventListener('close',()=>{if(!ended)$('pause').hidden=false;});
window.addEventListener('resize',()=>{if(renderer){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}});
window.addEventListener('error',()=>{ if(!terrain) $('loading').textContent='The 3D module could not start. Check WebGL support and CDN connectivity, then reload.'; });
boot().catch((e)=>{$('loading').textContent=`Simulator unavailable: ${e.message}`; $('controls').hidden=true;});
