import test from 'node:test';
import assert from 'node:assert/strict';
import { explorationSeconds } from '../js/sim/pacing.js';
import { SIM_PACING as C } from '../js/config.js';
test('exploration compresses time without exceeding visual walking and rover limits',()=>{
  for(const riding of [false,true])for(const speed of [.1,.6,1,2,4]) {
    const seconds=explorationSeconds(.1,speed,riding);
    assert.ok(seconds<=.1*C.maxTimeScale);
    assert.ok(speed*seconds<=.1*(riding?C.maxRoverVisualMps:C.maxFootVisualMps)+1e-9);
    assert.ok(seconds>0);
  }
});
test('paused presentation time never advances the model',()=>{
  assert.equal(explorationSeconds(0,.7),0);
  assert.equal(explorationSeconds(-1,.7),0);
});

test("faster pace scales movement and simulated time together and invalid values fall back",()=>{
  const base=explorationSeconds(.1,.7,false,1);
  assert.equal(explorationSeconds(.1,.7,false,2),base*2);
  assert.equal(explorationSeconds(.1,.7,false,99),base);
});
