import test from 'node:test';
import assert from 'node:assert/strict';
import { moneyMillions } from '../js/money.js';
import { terrainExposure } from '../js/radiation.js';
test('money uses B at one billion and preserves unknown values',()=>{
  assert.equal(moneyMillions(1408),'$1.41B');
  assert.equal(moneyMillions(1000),'$1B');
  assert.equal(moneyMillions(568),'$568M');
  assert.equal(moneyMillions(null),'Price unavailable');
  assert.equal(moneyMillions(NaN),'Price unavailable');
});
const grid=(fn)=>({width:101,height:101,m_per_px_x:10,m_per_px_y:10,heights:Float32Array.from({length:10201},(_,i)=>fn(i%101-50,Math.floor(i/101)-50))});
test('sky visibility is open on a plain and reduced inside surrounding high terrain',()=>{
  const plain=terrainExposure(grid(()=>0),0,0);
  const valley=terrainExposure(grid((x,z)=>Math.hypot(x,z)>10?100:0),0,0);
  assert.equal(plain.visibleFraction,1);assert.equal(plain.complete,true);
  assert.ok(valley.visibleFraction<plain.visibleFraction);
  assert.ok(valley.visibleFraction>=0);
});
test('terrain scan marks boundary coverage incomplete rather than assuming known shielding',()=>{
  assert.equal(terrainExposure(grid(()=>0),490,0).complete,false);
});
