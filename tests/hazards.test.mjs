import test from 'node:test';
import assert from 'node:assert/strict';
import { terrainHazards } from '../js/hazards.js';
const terrain = (rise) => ({ width: 3, height: 3, m_per_px_x: 1, m_per_px_y: 1, bbox: [0, 0, 2, 2], heights: Float32Array.from([0,rise,2*rise,0,rise,2*rise,0,rise,2*rise]) });
test('terrain cells flag measured gradients, not flat terrain', () => {
  assert.equal(terrainHazards(terrain(0))[0].status, 'green');
  const cells = terrainHazards(terrain(Math.tan(Math.PI / 6)));
  assert.equal(cells.length, 1);
  assert.ok(Math.abs(cells[0].slope - 30) < .001);
  assert.equal(cells[0].blocked, true);
  assert.deepEqual(cells[0].bounds, [[0,1],[1,2]]);
});
test('unknown terrain samples are not assigned a hazard class', () => {
  const t = terrain(1); t.heights[3] = NaN;
  assert.equal(terrainHazards(t)[0].status, 'unknown');
});
