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

test('uphill walking (~15 degrees, ~0.25 m/s modeled) still reaches the visual walking speed, and that speed is at least 5 m/s', () => {
  const modeled = 0.25;
  const seconds = explorationSeconds(.1, modeled, false, 1);
  assert.ok(C.maxFootVisualMps >= 5);
  assert.ok(Math.abs(modeled * seconds - .1 * C.maxFootVisualMps) < 1e-9, `visual ${modeled * seconds / .1} m/s`);
});

import { consumption } from '../js/sim/model.js';
import { walkSpeedKmh, effort } from '../js/calc.js';
import { SUIT_CAPACITY_H } from '../js/config.js';
test('faster on-screen walking does not change oxygen used per meter: simulator matches the planner model at any pace', () => {
  for (const slope of [0, 10, 15]) for (const pace of C.paceMultipliers) {
    const load = 9, speed = walkSpeedKmh(slope, load, false) / 3.6, usage = { seconds: 0, effortSeconds: 0, distance: 0 };
    while (usage.distance < 1000) { // same per-frame update as js/sim/main.ts, at 30 fps
      const s = explorationSeconds(1 / 30, speed, false, pace);
      usage.distance += speed * s; usage.seconds += s; usage.effortSeconds += s * effort(slope, load);
    }
    const expectedO2 = (usage.distance / speed) * effort(slope, load) / (SUIT_CAPACITY_H * 3600) * 100; // planner: hours x effort / capacity
    assert.ok(Math.abs(consumption(usage).oxygenUsed - expectedO2) < 1e-9, `slope ${slope}, pace ${pace}`);
    assert.ok(Math.abs(usage.seconds - usage.distance / speed) < 1e-6); // clock advances by modeled walking time, not by screen time
  }
});
