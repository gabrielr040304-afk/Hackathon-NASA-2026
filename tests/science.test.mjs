import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { objectivesForSite, scienceFor, investigationTools } from '../js/science.js';
import { marsMinutes } from '../js/mars-time.js';
import { MARS_SOL_SECONDS, EQUIPMENT } from '../js/config.js';
import { daylightWindow, assessMission } from '../js/mission.js';
import { ESSENTIALS } from '../js/config.js';
const sites=JSON.parse(readFileSync(new URL('../data/sites.json',import.meta.url)));

test('site objectives cannot offer Meridiani or Gale science in Jezero',()=>{
  const choices=['vida-antiga','sedimentos','boxwork','agua-meridiani'].map(id=>({id}));
  assert.deepEqual(objectivesForSite(sites[0],choices).map(o=>o.id),['vida-antiga','sedimentos']);
  assert.deepEqual(objectivesForSite(sites[1],choices).map(o=>o.id),['boxwork']);
  assert.deepEqual(objectivesForSite(null,choices),[]);
});
test('every offered rover science stop has evidence, an official source and supported tools',()=>{
  for(const site of sites.filter(s=>s.id!=='meridiani')) for(const route of site.routes) {
    for(const {target} of route.waypoints.filter(p=>p.target)) {
      const science=scienceFor(target);
      assert.ok(science.evidence && science.look);
      assert.ok(new URL(science.source).hostname.endsWith('nasa.gov'));
      assert.ok(science.tools.every(id=>EQUIPMENT.some(e=>e.id===id)));
      assert.deepEqual(investigationTools(target,[]),[]);
      assert.deepEqual(investigationTools(target,['medico']),[]);
    }
  }
});
test('one mean sol advances a Mars clock by 24 hours, with SI suit durations unchanged',()=>{
  assert.equal(marsMinutes(MARS_SOL_SECONDS),1440);
  assert.ok(marsMinutes(3600)<60);
});
test('latest departure agrees with route checks after converting SI duration to Mars minutes',()=>{
  const site=sites[0], route=site.routes[0], essentials=new Set(ESSENTIALS.map(e=>e.id));
  const weather={sunrise:'06:00',sunset:'18:00'};
  const inputs={crew:4,rover:false,loadKg:9,start:'09:00'};
  const duration=assessMission(site,route,inputs,weather,essentials).total_h;
  const {latest}=daylightWindow(weather,duration);
  const clock=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
  assert.equal(assessMission(site,route,{...inputs,start:clock(latest)},weather,essentials).go,true);
  assert.equal(assessMission(site,route,{...inputs,start:clock(latest+1)},weather,essentials).go,false);
});
