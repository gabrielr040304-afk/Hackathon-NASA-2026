import test from 'node:test';
import assert from 'node:assert/strict';
import { consumption, projectUsage } from '../js/sim/model.js';
test('sim resources accumulate effort and never return a negative reserve', () => {
  const c=consumption({ seconds:3600, effortSeconds:7200, distance:100 });
  assert.equal(c.oxygenUsed,25); assert.equal(c.waterUsed,25); assert.equal(c.batteryUsed,12.5);
  assert.equal(consumption({seconds:100000,effortSeconds:100000,distance:1}).reserve,0);
});
test('duration projection preserves observed average effort; handles empty session',()=>{
  const p=projectUsage({seconds:3600,effortSeconds:7200,distance:100},2);
  assert.equal(p.effortSeconds,14400); assert.equal(p.distance,200);
  assert.equal(projectUsage({seconds:0,effortSeconds:0,distance:0},2).effortSeconds,7200);
});

import { renderedHeight, drapeRoute } from '../js/sim/model.js';
import { SIM_GUIDANCE } from '../js/config.js';
test('route is densified and follows a ridge instead of cutting through it',()=>{
  const terrain={width:3,height:3,m_per_px_x:10,m_per_px_y:10,heights:Float32Array.from([0,10,0,0,10,0,0,10,0])};
  const route=drapeRoute(terrain,[{x:-9,z:0},{x:9,z:0}]);
  assert.ok(route.length>18);
  for(let i=0;i<route.length;i+=3) assert.ok(Math.abs(route[i+1]-renderedHeight(terrain,route[i],route[i+2])-SIM_GUIDANCE.routeLiftM)<1e-9);
  assert.ok(Math.max(...route.filter((_,i)=>i%3===1))>9);
});
test('coincident route stops generate no invalid geometry',()=>{
  assert.deepEqual(drapeRoute({},[{x:0,z:0},{x:0,z:0}]),[]);
});
