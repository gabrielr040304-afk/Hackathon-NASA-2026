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
