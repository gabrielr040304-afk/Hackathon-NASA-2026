import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assessMission, compareRoutes, daylightWindow, terrainCautions, budgetSummary } from '../js/mission.js';
import { ESSENTIALS } from '../js/config.js';

const sites = JSON.parse(readFileSync(new URL('../data/sites.json', import.meta.url)));
const jezero = sites.find((site) => site.id === 'jezero');
const weather = JSON.parse(readFileSync(new URL('../data/weather/jezero.json', import.meta.url))).at(-1);
const inputs = { crew: 2, rover: false, loadKg: 9, start: '09:00' };
const ready = new Set(ESSENTIALS.map((item) => item.id));

test('oxygen without CO2 removal blocks the mission even with adequate reserves', () => {
  const essentials = new Set(ready); essentials.delete('scrubber');
  const plan = assessMission(jezero, jezero.routes[0], inputs, weather, essentials);
  assert.ok(plan.reserve_pct > 30);
  assert.equal(plan.go, false);
  assert.ok(plan.alerts.some((alert) => alert.code === 'missing-scrubber'));
  assert.equal(essentials.size, ready.size - 1);
});

test('complete checklist passes ordinary scenario, but pre-sunrise departure blocks it', () => {
  assert.equal(assessMission(jezero, jezero.routes[0], inputs, weather, ready).go, true);
  assert.equal(assessMission(jezero, jezero.routes[0], { ...inputs, start: '02:00' }, weather, ready).go, false);
});

test('unknown weather and hypothetical route never become a cleared candidate', () => {
  const arcadia = sites.find((site) => site.id === 'meridiani');
  assert.equal(assessMission(arcadia, arcadia.routes[0], inputs, null, ready).go, false);
  assert.equal(compareRoutes(arcadia, inputs, null, ready).some((entry) => entry.plan.go), false);
});

test('daylight window allows exact margin and rejects long and overnight durations', () => {
  assert.deepEqual(daylightWindow({ sunrise: '06:00', sunset: '18:00' }, 2), { earliest: 360, latest: 900, feasible: true });
  assert.equal(daylightWindow({ sunrise: '06:00', sunset: '18:00' }, 12).feasible, false);
  assert.equal(daylightWindow({ sunrise: '06:00', sunset: '18:00' }, 26).feasible, false);
  assert.equal(daylightWindow(null, 2), null);
});

test('route comparison explains lower sampled slope; caution coordinates belong to route', () => {
  const ranked = compareRoutes(jezero, inputs, weather, ready);
  assert.equal(ranked[0].route.id, 'cheyava-falls');
  assert.ok(ranked[0].plan.stats.max_slope_deg < ranked[1].plan.stats.max_slope_deg);
  const cautions = terrainCautions(jezero, ranked[1].route, ranked[1].plan);
  assert.ok(cautions.length > 0);
  const points = [jezero.habitat, ...ranked[1].route.waypoints];
  assert.ok(cautions.every((caution) => points.includes(caution.from) && points.includes(caution.to)));
});

test('unknown budget is not zero; complete budget sums assumptions and rejects invalid amounts', () => {
  assert.equal(budgetSummary({}).total, null);
  assert.equal(budgetSummary({ transport: 2, habitat: 3, support: 4, operations: 1 }).total, 10);
  assert.equal(budgetSummary({ transport: 0, habitat: 0, support: 0, operations: 0 }).total, 0);
  for (const invalid of ['', -1, 'NaN', Infinity]) {
    assert.equal(budgetSummary({ transport: invalid, habitat: 3, support: 4, operations: 1 }).total, null);
  }
});


test('preparation colors require all essentials and distinguish minimum from recommendations', async () => {
  const { preparationLevel } = await import('../js/mission.js');
  const roles = new Set(['medical', 'engineering', 'science']);
  assert.equal(preparationLevel(new Set(), new Set(['medico']), 4, roles, 'polymer').level, 'red');
  assert.equal(preparationLevel(ready, new Set(), 4, roles, 'polymer').level, 'yellow');
  assert.equal(preparationLevel(ready, new Set(['medico']), 4, roles, 'polymer').level, 'green');
  assert.equal(preparationLevel(ready, new Set(['medico']), 4, new Set(), 'shell').level, 'yellow');
});
