import { moneyMillions } from '../money.js';
import { terrainExposure } from '../radiation.js';
import { preparedSites } from '../routes.js';
import { marsMinutes } from '../mars-time.js';
import { scienceFor, investigationTools, POSITION_NOTE } from '../science.js';
import { addFieldObjects } from './props.js';
﻿import * as THREE from 'three';
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
let lastScan = 0, scanKey = "", lastHud = -Infinity, lastRadiation = -Infinity;
let currentScience: any = null, fieldSpecimens: any[] = [], habitat: any = null;
const fmt = (n: number, d = 1) => n.toFixed(d);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
async function json(path: string) { const r = await fetch(path); if (!r.ok) throw Error(`Missing ${path}`); return r.json(); }
const escapeHTML = (value: any) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
function telemetry(u: Usage) {
  const c = consumption(u);
  return `<dl class="session-stats"><div><dt>Elapsed [S]</dt><dd>${fmt(u.seconds / 3600,2)} <small>h</small></dd></div><div><dt>Distance [S]</dt><dd>${fmt(u.distance)} <small>m</small></dd></div><div><dt>Minimum reserve [S]</dt><dd>${fmt(c.reserve)}<small>%</small></dd></div></dl><table class="resource-table"><caption>Suit capacity used [S]</caption><thead><tr><th scope="col">System</th><th scope="col">Used</th><th scope="col">Remaining</th></tr></thead><tbody>${[['Oxygen',c.oxygenUsed],['Cooling water',c.waterUsed],['Battery',c.batteryUsed]].map(([label,v])=>`<tr><th scope="row">${label}</th><td>${fmt(Math.min(100,Number(v)))}%</td><td><meter min="0" max="100" value="${Math.max(0,100-Number(v))}"></meter> ${fmt(Math.max(0,100-Number(v)))}%</td></tr>`).join('')}</tbody></table><p class="dose-note">Gale reference dose x elapsed time [S] <strong>${fmt(c.dose,3)} mSv</strong></p>${c.reserve<C.RESERVE_PCT?'<p class="return-warning">Below the modeled return reserve. This projection is not a survivable-duration estimate.</p>':''}`;
}
function manifest() {
  const list=(catalog:any[],ids:string[])=>catalog.filter(item=>(ids??[]).includes(item.id)).map(item=>`<li>${item.name}</li>`).join('')||'<li>None selected</li>';
  const shelter=C.SHELTERS.find((item:any)=>item.id===prep.shelter);
  $('manifest').innerHTML=`<h3>Your mission manifest</h3><dl class="manifest-meta"><dt>Science objective</dt><dd>${route.objective==='vida-antiga'?'Potential signs of ancient life':route.objective==='boxwork'?'Boxwork ridges and ancient groundwater':'Ancient water and sediments'}</dd><dt>Crew / mobility [H/S]</dt><dd>${prep.crew} crew | ${prep.rover?'Support rover':'On foot'} | ${prep.loadKg} kg extra load per astronaut [S]</dd><dt>Recorded weather [R]</dt><dd>Sol ${weather.sol} | ${weather.terrestrial_date} | ${weather.min_temp} to ${weather.max_temp} C | ${weather.pressure} Pa</dd><dt>Departure / sunset</dt><dd>${escapeHTML(prep.start)} [H] / ${weather.sunset} [R]</dd><dt>Habitat [H]</dt><dd>${shelter?.name ?? 'Unspecified'}; remains at base. No outdoor shielding credit.</dd><dt>Propulsion [H]</dt><dd>${prep.propulsion==='nuclear'?'Nuclear thermal research concept':'Chemical propulsion concept'}; no surface-speed effect.</dd><dt>Crew capabilities [H]</dt><dd>${(prep.roles??[]).map((id:string)=>({medical:'Medical and health',engineering:'Engineering and maintenance',science:'Science and field geology'}[id])).filter(Boolean).join(', ')||'None selected'}</dd></dl><div class="manifest-columns"><section><h4>Carried tools [S]</h4><ul>${list(C.EQUIPMENT,prep.equipment)}</ul></section><section><h4>Life support [H]</h4><ul>${list(C.ESSENTIALS,prep.essentials)}</ul></section><section><h4>Preparation procedures [H]</h4><ul>${list([...C.PREPARATION_EXTRAS,...C.OPTIONAL_PREPARATION],[...(prep.extras??[]),...(prep.optional??[])])}</ul></section></div><p>Only load and mobility affect the surface model. Procedures, roles and shielding concepts are recorded, not simulated capabilities.</p>`;
}
function pause() { active = false; keys.clear(); if (!ended && !mapOpen && !$('science').open) $('pause').hidden = false; }
async function enter() { if (ended) return; try { await $('world').requestPointerLock(); } catch { $('loading').textContent = 'Mouse capture was denied. Click Enter again.'; $('overlay').hidden = false; } }
function finish(reason = 'Session ended by the traveler.') {
  ended=true; active=false; keys.clear(); document.exitPointerLock(); $('pause').hidden=true; $('science').close(); $('summary').hidden=false;
  const visited=targets.filter(t=>t.visited).length;
  $('actual').innerHTML=`<p class="session-outcome">${reason}</p><h2>Recorded session</h2>${telemetry(usage)}<div class="science-result"><h3>Field investigation</h3><p>${visited} / ${targets.length} stops investigated [S] | ${nextPoint>=points.length?'Returned along the planned route':'Route incomplete'}</p><ul>${targets.map(t=>`<li>${t.visited?'Investigated':'Not investigated'}: ${t.target.name}${t.visited?` | ${t.observations.join(', ')}`:''}</li>`).join('')}</ul><p>Optional field specimens investigated: ${fieldSpecimens.filter(p=>p.visited).length} [S].</p><p>Investigations record simulated field work, not new discoveries.</p></div><details><summary>Cost evidence</summary><p>Selected surface-planning allowance [H]: ${moneyMillions(prep.investmentMillion)} per mission. Hypothetical allocations use published analog budget scales; not a NASA quote. Transport and mission operations excluded. Incremental EVA cost is not priced.</p></details>`;
  forecast();
}
function forecast() { const hours = clamp(Number($('projection').value) || 0, 0, C.SIM.projectionMaxHours); $('forecast').innerHTML = telemetry(projectUsage(usage,hours)); }
function miniMap() { const ctx = $('mini').getContext('2d'); ctx.drawImage(image,0,0,500,500); const px=(v:number)=> (v / ((terrain.width-1)*terrain.m_per_px_x)+.5)*500; const py=(v:number)=> (v / ((terrain.height-1)*terrain.m_per_px_y)+.5)*500; ctx.strokeStyle='#ffe2a3'; ctx.lineWidth=3; ctx.beginPath(); points.forEach((p,i)=> i ? ctx.lineTo(px(p.x),py(p.z)) : ctx.moveTo(px(p.x),py(p.z))); ctx.stroke();
  ctx.font='bold 13px system-ui'; ctx.textBaseline='bottom';
  for(const [i,t] of targets.entries()) { ctx.fillStyle=t.visited?'#99e8c2':'#ffe2a3'; ctx.beginPath(); ctx.arc(px(t.x),py(t.z),5,0,Math.PI*2);ctx.fill(); ctx.lineWidth=4;ctx.strokeStyle='#14212e';ctx.strokeText(`${i+1}. ${t.target.name}`,Math.min(300,Math.max(8,px(t.x)+9)),py(t.z)-8);ctx.fillText(`${i+1}. ${t.target.name}`,Math.min(300,Math.max(8,px(t.x)+9)),py(t.z)-8); }
  ctx.fillStyle='#72e5ff'; ctx.beginPath(); ctx.arc(px(x),py(z),6,0,Math.PI*2); ctx.fill(); }
function nearbyScience() {
  return [...targets,...fieldSpecimens].filter(p=>Math.hypot(p.x-x,p.z-z)<(p.optional?C.FIELD_VISUAL.inspectionRadiusM:C.ARRIVAL_RADIUS_M)).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
}
function inspectHabitat() {
  active=false;keys.clear();currentScience=null;document.exitPointerLock();$('record-science').hidden=true;
  const shelter=C.SHELTERS.find((entry:any)=>entry.id===prep.shelter);
  $('science-content').innerHTML=`<h2>Surface habitat concept [H]</h2><p>This is a surface base, not a landed spacecraft. NASA studies pressure habitats, airlocks, logistics and surface mobility; no crewed Mars habitat has landed.</p><h3>Your selected configuration</h3><p>${shelter?.name}: ${shelter?.protection}</p><p>The scene includes a pressure barrel, transfer airlock, hatch, support legs and access porch. Selected power and cooling systems add solar arrays and radiators; communications add antennas. Selected tools appear in service cases. Emergency oxygen, maintenance and dust-control procedures add corresponding service equipment. ${prep.rover?'A conceptual pressurized six-wheel rover is parked beside the base.':'No support rover was selected.'}</p><p>Geometry, hardware layout and dimensions are illustrative [H], not a certified NASA design. Interplanetary propulsion does not turn the surface habitat into a launch vehicle. Crew count is recorded on the module; the scene does not validate accommodation capacity.</p><a href="https://ntrs.nasa.gov/citations/20230014593" target="_blank" rel="noopener">NASA Mars Surface Habitat concept study</a><h3>Where is the water?</h3><p>These routes investigate evidence of ancient water in rocks. A topographic low or dry channel is not a present lake. Water tanks in the habitat, when selected, are mission-supplied shielding concepts [H], not water extracted from Mars.</p>`;
  $('science').showModal();
}
function inspect() {
  const target=nearbyScience();
  if(!target && habitat && Math.hypot(habitat.inspectX-x,habitat.inspectZ-z)<C.HABITAT_VISUAL.inspectionRadiusM){inspectHabitat();return;}
  $('record-science').hidden=false;
  if(!target){message='Approach a science marker before inspecting.';return;}
  currentScience=target; active=false; keys.clear(); document.exitPointerLock();
  const science=scienceFor(target.target), tools=investigationTools(target.target,prep.equipment);
  $('science-content').innerHTML=`<h2>${target.target.name}</h2><p>${science?.evidence ?? target.target.why} [R]</p><p><b>What to look for</b><br>${science?.look ?? ''}</p>${target.target.photo?`<a href="${target.target.photo}" target="_blank" rel="noopener"><img src="${target.target.photo}" alt="Rover reference: ${target.target.name}"></a><small>${target.target.credit} ? Rover image [R]; not the simulated camera.</small>`:''}<p class="position-note">${target.optional?'Illustrative field specimen [H]. Regional evidence is real; this object and position are not a recorded NASA discovery. Optional investigation adds time beyond the planned stops.':POSITION_NOTE}</p><h3>Your investigation tools</h3><p>${tools.length?C.EQUIPMENT.filter((e:any)=>tools.includes(e.id)).map((e:any)=>e.name).join(', '):'Visual observation only; no matching science tools selected.'}</p><p>A field stop adds ${target.optional?C.OPTIONAL_FIELD_MIN:C.SCIENCE_MIN_PER_TARGET} minutes of stationary life-support use [S]. No instrument measurement is fabricated.</p>${science?`<a href="${science.source}" target="_blank" rel="noopener">Read the NASA evidence</a>`:''}`;
  $('record-science').disabled=target.visited; $('record-science').textContent=target.visited?'Investigation already recorded':'Record field investigation';
  $('science').showModal();
}
function recordScience() {
  if(!currentScience||currentScience.visited)return;
  const seconds=(currentScience.optional?C.OPTIONAL_FIELD_MIN:C.SCIENCE_MIN_PER_TARGET)*60;
  usage.seconds+=seconds; usage.effortSeconds+=seconds;
  currentScience.visited=true;
  currentScience.observations=['Visual observation',...C.EQUIPMENT.filter((e:any)=>investigationTools(currentScience.target,prep.equipment).includes(e.id)).map((e:any)=>e.name)];
  $('science').close();
  if(consumption(usage).reserve<=0)finish('Modeled suit resources exhausted during field work.');
}
function scienceNavigation() {
  const next=targets.find(t=>!t.visited);
  const heading=((yaw*-180/Math.PI)%360+360)%360;
  $('heading').textContent=`Heading ${fmt(heading,0)} degrees [S]`;
  if(!next){$('science-nav').innerHTML='<b>Science stops complete</b><span>Follow the route back to base.</span>';return;}
  const dx=next.x-x,dz=next.z-z,distance=Math.hypot(dx,dz);
  const bearing=(Math.atan2(dx,-dz)*180/Math.PI+360)%360;
  const turn=((bearing-heading+540)%360)-180;
  $('science-nav').innerHTML=`<small>${scienceFor(next.target)?.focus ?? 'Science waypoint'}</small><b>${next.target.name}</b><span>${fmt(distance,0)} m | bearing ${fmt(bearing,0)} degrees [S]</span><span>${distance<C.ARRIVAL_RADIUS_M?'Press E to inspect':Math.abs(turn)<15?'Ahead':turn>0?'Turn right':'Turn left'} | approximate science location [H]</span>`;
}
async function boot() {
  const raw=sessionStorage.getItem('mars-eva-preparation'); if(!raw) throw Error('No prepared mission found. Complete the planner first.'); prep=JSON.parse(raw); if(!Array.isArray(prep.equipment)||!Array.isArray(prep.essentials)||!Number.isFinite(prep.crew)||!/^\d{2}:\d{2}$/.test(prep.start)) throw Error('Invalid mission preparation. Return to planner.');
  const sites=preparedSites(await json('data/sites.json')); site=sites.find((s:any)=>s.id===prep.site && s.hasSim); route=site?.routes.find((r:any)=>r.id===prep.route);
  if(!route) throw Error('Choose a prepared Jezero or Gale route in the planner.');
  const essentials=new Set<string>(prep.essentials); if(C.ESSENTIALS.some((e:any)=>!essentials.has(e.id))) throw Error('Essential life-support systems are missing. Return to preparation.');
  prep.loadKg=C.EQUIPMENT.filter((e:any)=>prep.equipment.includes(e.id)).reduce((sum:number,e:any)=>sum+e.kg,0);
  weather=(await json(site.weather)).find((w:any)=>w.sol===prep.sol);
  const plan=assessMission(site,route,{crew:prep.crew,rover:prep.rover,loadKg:prep.loadKg,start:prep.start},weather,essentials); if(!plan.go) throw Error('This mission is blocked by planner checks. Return to preparation.');
  const meta=await json(`data/${site.id}/terrain.json`); const r=await fetch(`data/${site.id}/terrain.bin`); if(!r.ok)throw Error('Terrain unavailable'); terrain=parseTerrain(meta,await r.arrayBuffer());
  points=[site.habitat,...route.waypoints,site.habitat].map((p:any)=>({...p,...lonLatToLocal(terrain,p.lat,p.lon)}));
  const halfX=(terrain.width-1)*terrain.m_per_px_x/2, halfZ=(terrain.height-1)*terrain.m_per_px_y/2;
  if(points.some((p)=>Math.abs(p.x)>halfX||Math.abs(p.z)>halfZ))throw Error('Route exceeds the available elevation grid.');
  targets=points.filter((p)=>p.target).map((p)=>({...p,visited:false})); x=points[0].x; z=points[0].z; baseHeight=terrain.elev_min;
  scene=new THREE.Scene(); scene.background=new THREE.Color('#b67b52'); scene.fog=new THREE.FogExp2('#bd8159',.0004);
  renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,C.SIM_DETAIL.pixelRatio)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
  camera=new THREE.PerspectiveCamera(C.SIM.fov,innerWidth/innerHeight,.1,C.SIM.far); camera.rotation.order='YXZ';
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1; renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.add(new THREE.HemisphereLight('#e8d4bc','#493b30',1.3)); const sun=new THREE.DirectionalLight('#fff0cf',2.5); sun.position.set(x-120,180,z+90);sun.target.position.set(x+C.HABITAT_VISUAL.offsetM,0,z);scene.add(sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.far=900;sun.shadow.normalBias=.05;scene.add(sun);
  const geometry=new THREE.PlaneGeometry(halfX*2,halfZ*2,C.SIM.meshSegments,C.SIM.meshSegments); geometry.rotateX(-Math.PI/2);
  const pos=geometry.attributes.position; for(let i=0;i<pos.count;i++)pos.setY(i,heightAt(terrain,pos.getX(i),pos.getZ(i))-baseHeight); geometry.computeVertexNormals();
  const texture=await new THREE.TextureLoader().loadAsync(`data/${site.id}/texture.jpg`); texture.colorSpace=THREE.SRGBColorSpace; image=texture.image; texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const groundMesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,color:site.id==='gale'?'#c2ab91':'#d7a47d',roughness:1}));groundMesh.receiveShadow=true;scene.add(groundMesh);sun.target.position.y=renderedHeight(terrain,x,z)-baseHeight;sun.position.y+=sun.target.position.y;
  const ribbon = new THREE.BufferGeometry(); const positions = drapeRoute(terrain,points); for(let i=1;i<positions.length;i+=3) positions[i]-=baseHeight;
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  scene.add(new THREE.Mesh(ribbon,new THREE.MeshBasicMaterial({color:'#ffe5a0',side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1})));

  const field=addFieldObjects(scene,terrain,baseHeight,targets,points[0],prep,points);fieldSpecimens=field.specimens;habitat=field.habitat; manifest();
  for(const p of [points[0],...targets]) {
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.7,48),new THREE.MeshBasicMaterial({color:p.target?'#e8ca8e':'#95c5d7',side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2;ring.position.set(p.x,renderedHeight(terrain,p.x,p.z)-baseHeight+.12,p.z);scene.add(ring);
  }
  yaw=Math.atan2(-(points[1].x-x),-(points[1].z-z)); $('mission-name').textContent=route.name; $('terrain-name').textContent=`${site.name} | HiRISE [R/D]`; $('sim-title').textContent=`${site.name} EVA`;  $('hud').hidden=false; $('loading').textContent=`${site.name}: terrain ready. Orbital relief [R/D]; field objects [H].`; $('controls').hidden=false; requestAnimationFrame(frame);
}
function frame(now:number) {
  if(!active && now-lastHud<C.SIM_DETAIL.hudIntervalMs){last=now;requestAnimationFrame(frame);return;}
  const dt=Math.min((now-last)/1000,C.SIM.maxFrameSeconds); last=now;
  if(active&&!ended){ const scale=Number($('speed').value), seconds=dt*scale; const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0); const side=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0); const length=Math.hypot(forward,side); let multiplier=1; message='';
    if(length){ const localSlope=slopeAt(terrain,x,z); const riding=prep.rover&&localSlope<=C.ROVER_MAX_SLOPE_DEG; const speed=walkSpeedKmh(localSlope,prep.loadKg,riding)/3.6; const step=speed*seconds; const nx=x+(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/length*step, nz=z+(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/length*step;
      const hx=(terrain.width-1)*terrain.m_per_px_x/2, hz=(terrain.height-1)*terrain.m_per_px_y/2;
      if(Math.abs(nx)>hx||Math.abs(nz)>hz)message='Terrain boundary: no elevation data beyond this point.';
      else if(habitat&&Math.hypot(nx-habitat.x,nz-habitat.z)<habitat.radius)message='Habitat pressure shell: walk around to the airlock.';
      else if(slopeAt(terrain,nx,nz)>C.SLOPE_NOGO_DEG)message='Movement blocked: sampled slope exceeds the project limit [S].';
      else{ const oldY=heightAt(terrain,x,z),newY=heightAt(terrain,nx,nz); const slope=Math.atan2(newY-oldY,step)*180/Math.PI; multiplier=riding?1:effort(slope,prep.loadKg); usage.distance+=Math.hypot(nx-x,nz-z); x=nx; z=nz; }
    } usage.seconds+=seconds; usage.effortSeconds+=seconds*multiplier;
    while(nextPoint<points.length&&Math.hypot(points[nextPoint].x-x,points[nextPoint].z-z)<C.SIM.waypointRadius)nextPoint++;
    const c=consumption(usage); if(c.reserve<=0)finish('Modeled suit resources exhausted.'); else if(nextPoint>=points.length)finish('Returned to base along the route.');
  }
  y=renderedHeight(terrain,x,z); camera.position.set(x,y-baseHeight+C.SIM.eyeHeight,z); camera.rotation.set(pitch,yaw,0);
  if(now-lastHud>=C.SIM_DETAIL.hudIntervalMs){ lastHud=now; scienceNavigation();
  const c=consumption(usage); const start=prep.start.split(':').map(Number); const time=clockTime((start[0]*60+start[1]+marsMinutes(usage.seconds))%1440);
  if(now-lastRadiation>=C.RADIATION_TERRAIN.refreshMs){
    lastRadiation=now;
    const exposure=terrainExposure(terrain,x,z);
    $('radiation-panel').innerHTML=`<h2>Radiation exposure</h2><p class="rad-dose">${fmt(c.dose,3)} <small>mSv [S]</small></p><p>Accumulated Gale-reference dose</p><dl><dt>Hourly reference [D]</dt><dd>${fmt(C.RAD_MSV_PER_DAY/24,4)} mSv/h</dd><dt>Sky visible in sampled terrain [D]</dt><dd>${fmt(exposure.visibleFraction*100,1)}%</dd></dl><p>${exposure.visibleFraction>=C.RADIATION_TERRAIN.openSkyFraction?'More open sky: less surrounding terrain shielding.':'Terrain obstructs part of the sky: potential shielding context.'}</p><small>${exposure.complete?'':'Scan reaches the data boundary; obstruction is incomplete. '}${site.id==='gale'?'Historical RAD reference from Gale; not a reading at this point.':'Gale RAD reference transferred to Jezero; no local dosimetry.'} Sky visibility does not quantify dose reduction or solar-event risk. Reference dose is not adjusted by terrain.</small>`;
  }
  $('clock').textContent=`${time} local [S]`; const readings=[['Oxygen',100-c.oxygenUsed],['Cooling water',100-c.waterUsed],['Battery',100-c.batteryUsed]];
  $('readouts').innerHTML=readings.map(([name,value])=>`<div class="reading">${name} ${fmt(Math.max(0,Number(value)))}% [S]<meter min="0" max="100" value="${Math.max(0,Number(value))}"></meter></div>`).join('')+`<div class="reading">${fmt(airTempAt(weather,time))} C air [S]<br>RAD reference dose: ${fmt(c.dose,3)} mSv [S]<br>Extra load: ${prep.loadKg} kg [S]</div>`;
  const lat=terrain.center_lat-z/C.MARS_RADIUS_M*180/Math.PI, lon=terrain.center_lon+x/(C.MARS_RADIUS_M*Math.cos(terrain.center_lat*Math.PI/180))*180/Math.PI;
  const target=points[Math.min(nextPoint,points.length-1)]; $('navigation').textContent=`${fmt(lat,5)}, ${fmt(lon,5)} [S] | Next waypoint ${Math.min(nextPoint,points.length-1)}/${points.length-1}: ${fmt(Math.hypot(target.x-x,target.z-z))} m [S] | ${prep.rover?'Support rover model [S]':'On foot'} | Esc: mission manifest`;
  const sunset=weather.sunset.split(':').map(Number); const late=start[0]*60+start[1]+marsMinutes(usage.seconds)>sunset[0]*60+sunset[1]-C.DAYLIGHT_MARGIN_MIN;
  $('notice').textContent=message||(late?'Return daylight margin exceeded [S].':c.reserve<C.RESERVE_PCT?'Reserve below the project return margin [S].':nearbyScience()?'Press E to inspect the nearby rock or science stop.':habitat&&Math.hypot(habitat.inspectX-x,habitat.inspectZ-z)<C.HABITAT_VISUAL.inspectionRadiusM?'Press E to inspect your habitat configuration.':'Follow the amber route. Radiation is a Gale reference, not a local forecast.'); } if(now-lastScan>C.SIM_GUIDANCE.scanIntervalMs){scanAhead();lastScan=now;} renderer.render(scene,camera); requestAnimationFrame(frame);
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
    if(slope>C.SLOPE_WARN_DEG){detected={x:tx,z:tz,name:slope>C.SLOPE_NOGO_DEG?'STEEP TERRAIN AHEAD':'SLOPE CAUTION',detail:`${fmt(slope)} degrees [D] | ${distance} m [S]. ${slope>C.SLOPE_NOGO_DEG?'Avoid this slope; stay on the planned corridor.':'Slow down and inspect footing.'}`,key:'slope',kind:'hazard'};break;}
  }
  if(!detected){
    const direction=new THREE.Vector3();camera.getWorldDirection(direction);
    for(const target of targets){
      const delta=new THREE.Vector3(target.x-x,renderedHeight(terrain,target.x,target.z)-y,target.z-z);
      const distance=delta.length();
      if(distance<C.SIM_GUIDANCE.targetRangeM&&direction.dot(delta.normalize())>.8){detected={...target,name:target.target.name,detail:`Science stop [R/H] | ${fmt(distance)} m [S]. Follow the route; press E within ${C.ARRIVAL_RADIUS_M} m to inspect.`,key:target.target.name,kind:'science'};break;}
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
$('inspect-habitat').onclick=inspectHabitat; $('record-science').onclick=recordScience; $('start').onclick=enter; $('resume').onclick=enter; $('finish').onclick=()=>finish(); $('projection').oninput=forecast; $('close-science').onclick=()=>$('science').close(); $('science').addEventListener('close',()=>{if(!ended)$('pause').hidden=false;});
window.addEventListener('resize',()=>{if(renderer){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}});
window.addEventListener('error',()=>{ if(!terrain) $('loading').textContent='The 3D module could not start. Check WebGL support and CDN connectivity, then reload.'; });
boot().catch((e)=>{$('loading').textContent=`Simulator unavailable: ${e.message}`; $('controls').hidden=true;});
