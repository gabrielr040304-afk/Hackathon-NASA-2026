import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceM, routeStats, walkSpeedKmh, planEva, airTempAt } from '../js/calc.js';
import { parseTerrain, heightAt, lonLatToLocal } from '../js/sim/terrain.js';

const M_PER_DEG = 59274.7; // 2*pi*3396190/360

// base em (0,0); um alvo a `km` quilômetros ao norte
function fakeSite(km, id = 'jezero') {
  return {
    site: { id, habitat: { lat: 0, lon: 0, elev_m: 0 } },
    route: { waypoints: [{ lat: (km * 1000) / M_PER_DEG, lon: 0, elev_m: 0, target: { name: 'alvo' } }] },
  };
}
const inputs = (o = {}) => ({ crew: 2, rover: false, loadKg: 10, start: '09:00', ...o });
const weather = (o = {}) => ({ sol: 1, min_temp: -80, max_temp: -10, pressure: 700, sunrise: '06:00:00', sunset: '18:00:00', ...o });
const codes = (plan) => plan.alerts.map((a) => a.code);

test('distanceM: 1 grau de latitude em Marte ~ 59.275 m', () => {
  const d = distanceM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
  assert.ok(d >= 59274 && d <= 59276, `obtido ${d}`);
});

test('routeStats: dois pontos na mesma altura dão inclinação e subida zero', () => {
  const s = routeStats([{ lat: 0, lon: 0, elev_m: 0 }, { lat: 0.01, lon: 0, elev_m: 0 }]);
  assert.equal(s.max_slope_deg, 0);
  assert.equal(s.ascent_m, 0);
});

test('routeStats: subir 100 m em 1000 m dá ~5,7 graus', () => {
  const s = routeStats([{ lat: 0, lon: 0, elev_m: 0 }, { lat: 1000 / M_PER_DEG, lon: 0, elev_m: 100 }]);
  assert.ok(s.max_slope_deg > 5.6 && s.max_slope_deg < 5.8, `obtido ${s.max_slope_deg}`);
  assert.equal(s.ascent_m, 100);
});

test('walkSpeedKmh: cai com a subida e é sempre positiva de -40 a 40 graus', () => {
  const up = [0, 10, 20, 30].map((d) => walkSpeedKmh(d, 10, false));
  for (let i = 1; i < up.length; i++) assert.ok(up[i] < up[i - 1]);
  for (let d = -40; d <= 40; d += 5) assert.ok(walkSpeedKmh(d, 10, false) > 0);
});

test('planEva: astronauta sozinho gera aviso mas continua GO', () => {
  const { site, route } = fakeSite(1);
  const p = planEva(site, route, inputs({ crew: 1 }), weather());
  assert.ok(codes(p).includes('solo'));
  assert.equal(p.go, true);
});

test('planEva: rota de 30 km a pé estoura o traje (NÃO RECOMENDADO, reserva nunca negativa)', () => {
  const { site, route } = fakeSite(15);
  const p = planEva(site, route, inputs(), weather());
  assert.ok(p.alerts.some((a) => a.code === 'consumivel' && a.level === 'proibido'));
  assert.equal(p.go, false);
  assert.ok(p.reserve_pct >= 0);
});

test('planEva: sair 16:30 com pôr do sol 17:11 é proibido', () => {
  const { site, route } = fakeSite(1);
  const p = planEva(site, route, inputs({ start: '16:30' }), weather({ sunset: '17:11:36' }));
  assert.ok(codes(p).includes('por-do-sol'));
  assert.equal(p.go, false);
});

test('planEva: sem clima avisa e não produz NaN', () => {
  const { site, route } = fakeSite(1, 'arcadia');
  const p = planEva(site, route, inputs(), null);
  assert.ok(codes(p).includes('sem-clima'));
  const nums = [p.walk_h, p.science_h, p.total_h, p.used_pct.o2, p.used_pct.water, p.used_pct.battery,
    p.reserve_pct, p.dose_mSv, p.career_pct, p.stats.distance_m, p.stats.ascent_m, p.stats.max_slope_deg];
  for (const n of nums) assert.ok(Number.isFinite(n), `valor não finito: ${n}`);
});

test('planEva: encosta acima de 25 graus é proibida', () => {
  const site = { id: 'jezero', habitat: { lat: 0, lon: 0, elev_m: 0 } };
  const route = { waypoints: [{ lat: 100 / M_PER_DEG, lon: 0, elev_m: 60 }] }; // ~31 graus
  const p = planEva(site, route, inputs(), weather());
  assert.ok(p.alerts.some((a) => a.code === 'inclinacao' && a.level === 'proibido'));
  assert.equal(p.go, false);
});

test('planEva: radiação é "referência" fora de Gale e medida em Gale', () => {
  const j = fakeSite(1, 'jezero'), g = fakeSite(1, 'gale');
  assert.ok(codes(planEva(j.site, j.route, inputs(), weather())).includes('radiacao-ref'));
  assert.ok(!codes(planEva(g.site, g.route, inputs(), weather())).includes('radiacao-ref'));
});

test('airTempAt: mínima no nascer do sol, máxima às 14:00, null sem clima', () => {
  const w = weather();
  assert.equal(airTempAt(w, '06:00'), -80);
  assert.equal(airTempAt(w, '14:00'), -10);
  assert.equal(airTempAt(null, '10:00'), null);
});

test('heightAt: grade 2x2 dá 5 no centro e valor da borda fora da grade', () => {
  const meta = { width: 2, height: 2, m_per_px_x: 1, m_per_px_y: 1, center_lat: 0, center_lon: 0 };
  const t = parseTerrain(meta, new Float32Array([0, 0, 10, 10]).buffer);
  assert.equal(heightAt(t, 0, 0), 5);
  assert.equal(heightAt(t, 0, -100), 0);  // muito ao norte
  assert.equal(heightAt(t, 0, 100), 10);  // muito ao sul
});

test('lonLatToLocal: centro é (0,0) e 1 km ao norte é z = -1000', () => {
  const meta = { width: 2, height: 2, m_per_px_x: 1, m_per_px_y: 1, center_lat: 18.5, center_lon: 77.3 };
  const t = parseTerrain(meta, new Float32Array(4).buffer);
  const c = lonLatToLocal(t, 18.5, 77.3);
  assert.ok(Math.abs(c.x) < 1e-6 && Math.abs(c.z) < 1e-6);
  const n = lonLatToLocal(t, 18.5 + 1000 / M_PER_DEG, 77.3);
  assert.ok(Math.abs(n.z + 1000) < 1, `obtido ${n.z}`);
});

test('sites.json: todas as rotas calculam sem NaN; Jezero e Gale dão GO com entradas padrão', async () => {
  const fs = await import('node:fs');
  const sites = JSON.parse(fs.readFileSync(new URL('../data/sites.json', import.meta.url)));
  for (const site of sites) {
    const w = site.weather ? JSON.parse(fs.readFileSync(new URL('../' + site.weather, import.meta.url)))[0] : null;
    for (const route of site.routes) {
      const p = planEva(site, route, inputs(), w);
      const nums = [p.total_h, p.reserve_pct, p.dose_mSv, p.used_pct.o2, p.stats.distance_m, p.stats.max_slope_deg];
      for (const n of nums) assert.ok(Number.isFinite(n), `${site.id}/${route.id}: valor não finito`);
      if (site.id !== 'arcadia') assert.equal(p.go, true, `${site.id}/${route.id}: ${p.alerts.map((a) => a.msg).join(' | ')}`);
      console.log(`${site.id}/${route.id}: ${(p.stats.distance_m / 1000).toFixed(2)} km, ${p.total_h.toFixed(2)} h, reserva ${p.reserve_pct.toFixed(0)}%, máx ${p.stats.max_slope_deg.toFixed(1)}°, go=${p.go}`);
    }
  }
});

// ---------- planejamento detalhado ----------
import { evaTimeline, evaCost, recommendMobility } from '../js/calc.js';
import * as CFG from '../js/config.js';

test('evaTimeline: começa na saída, passa pelos alvos em ordem e termina na hora de volta do plano', () => {
  const { site, route } = fakeSite(1);
  const p = planEva(site, route, inputs(), weather());
  const tl = evaTimeline(site, route, inputs());
  assert.equal(tl[0].kind, 'depart');
  assert.equal(tl[0].time, '09:00');
  assert.equal(tl.at(-1).kind, 'return');
  assert.equal(tl.at(-1).time, p.end_time);
  assert.ok(tl.some((e) => e.kind === 'target'));
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i].t_h >= tl[i - 1].t_h);
  for (let i = 1; i < tl.length; i++) assert.ok(tl[i].o2_left_pct <= tl[i - 1].o2_left_pct);
});

test('planEva: oxigênio extra aumenta a reserva e o tempo de traje', () => {
  const { site, route } = fakeSite(5);
  const a = planEva(site, route, inputs(), weather());
  const b = planEva(site, route, inputs({ extraO2: true }), weather());
  assert.ok(b.reserve_pct > a.reserve_pct);
});

test('evaCost: hora de tripulação = astronautas × horas × preço; entrega = kg × preço por kg', () => {
  const { site, route } = fakeSite(1);
  const inp = inputs({ crew: 3, loadKg: 10 });
  const p = planEva(site, route, inp, weather());
  const c = evaCost(p, inp);
  assert.equal(c.crew_time_usd, 3 * p.total_h * CFG.CREW_HOUR_USD);
  assert.equal(c.gear_delivery_usd, 10 * CFG.USD_PER_KG_TO_MARS);
  assert.equal(c.rover_usd, 0);
  const r = evaCost(p, { ...inp, rover: true });
  assert.equal(r.rover_usd, CFG.ROVER_UNIT_USD + CFG.ROVER_MASS_KG * CFG.USD_PER_KG_TO_MARS);
});

test('recommendMobility: rover só quando a rota é longa e sem encostas acima do limite do rover', () => {
  assert.equal(recommendMobility({ distance_m: 2000, max_slope_deg: 5 }), 'foot');
  assert.equal(recommendMobility({ distance_m: 6000, max_slope_deg: 5 }), 'rover');
  assert.equal(recommendMobility({ distance_m: 6000, max_slope_deg: 20 }), 'foot');
});

import { spaceWeatherRisk } from '../js/calc.js';
test('spaceWeatherRisk: SEP ou flare classe X recentes = alto; CME rápida = atenção; senão baixo', () => {
  const now = '2026-11-14T12:00Z';
  assert.equal(spaceWeatherRisk([], now).level, 'low');
  assert.equal(spaceWeatherRisk([{ type: 'CME', time: '2026-11-13T00:00Z', speed_kms: 400 }], now).level, 'low');
  assert.equal(spaceWeatherRisk([{ type: 'CME', time: '2026-11-13T00:00Z', speed_kms: 1500 }], now).level, 'watch');
  assert.equal(spaceWeatherRisk([{ type: 'FLR', time: '2026-11-13T00:00Z', class: 'X1.2' }], now).level, 'high');
  assert.equal(spaceWeatherRisk([{ type: 'SEP', time: '2026-11-12T00:00Z' }], now).level, 'high');
  assert.equal(spaceWeatherRisk([{ type: 'SEP', time: '2026-10-01T00:00Z' }], now).level, 'low'); // fora da janela de 7 dias
});
