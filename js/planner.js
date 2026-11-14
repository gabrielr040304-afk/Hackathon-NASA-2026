// Planner: purpose-first questionnaire (7 steps) that recommends options, shows trade-offs and costs,
// then builds the route plan, timeline, cost comparison, risk analysis and space weather report.
import { planEva, evaTimeline, evaCost, recommendMobility, routeStats, spaceWeatherRisk } from './calc.js';
import * as C from './config.js';
import { baseLayers, localLayer } from './layers.js';

const $ = (id) => document.getElementById(id);
const tag = (t) => `<b class="tag t-${t}" title="${{ R: 'real', D: 'derived', S: 'simulated', H: 'hypothetical' }[t]}">${t}</b>`;
const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const hhmm = (h) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')} min`;
const usd = (v) => (v >= 1e9 ? `$${fmt(v / 1e9, 2)}B` : v >= 1e6 ? `$${fmt(v / 1e6, 1)}M` : `$${fmt(v / 1e3, 0)}k`);
const delta = (v, unit = '') => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${unit}${Math.abs(v)}`;

// ---------- content ----------
const PURPOSES = [
  { id: 'vida-antiga', name: 'Search for signs of ancient life', text: 'Rocks that may hold traces of microbes from billions of years ago.',
    why: 'Jezero was a lake about 3.5 billion years ago. In 2024 Perseverance found textures in the Cheyava Falls rock that may have a biological origin.', src: 'NASA/JPL, July 2024' },
  { id: 'sedimentos', name: 'Read the history of water', text: 'Layers left by ancient rivers tell us what the climate was like.',
    why: 'Rocks laid down by water record how long it lasted. The Neretva Vallis channel carried the river that filled Jezero lake.', src: 'NASA Mars 2020' },
  { id: 'boxwork', name: 'Study groundwater ridges (boxwork)', text: 'Honeycomb-shaped ridges made by minerals from groundwater.',
    why: 'The ridges show where water flowed underground while Mars was drying out. Curiosity studied these formations in 2025.', src: 'Curiosity blog, NASA, 2025' },
  { id: 'gelo', name: 'Scout ice for a human base', text: 'Find shallow water ice to drink, breathe and make fuel.',
    why: 'Ice a few meters below the surface can become water, oxygen and rocket fuel, which makes a human base feasible.', src: 'SWIM project (NASA)' },
];
const SITE_INFO = {
  jezero: { pros: ['Terrain known to 1 m (HiRISE)', 'Rover photos of every stop', 'Measured weather', '3D rehearsal available'], cons: ['Radiation not measured here (reference value)', 'Rugged channel walls'] },
  gale: { pros: ['Only site with radiation measured on the ground', 'Rover photos and long weather record', 'Short, well-mapped route'], cons: ['Boxwork ridges and hollows: uneven footing', 'No 3D rehearsal yet'] },
  arcadia: { pros: ['Flat plains: easy, safe walking', 'Shallow ice for a future base'], cons: ['No rover has been here: route is hypothetical', 'No weather station or ground photos'] },
};
const CREW = [
  { n: 1, name: 'One astronaut', pros: ['Lowest crew-time cost'], cons: ['No one to help in an emergency', 'Against NASA practice'] },
  { n: 2, name: 'Two astronauts', pros: ['NASA standard: buddy system', 'One works, one documents and watches'], cons: [] },
  { n: 3, name: 'Three astronauts', pros: ['More samples and observations per hour'], cons: ['Higher crew-time cost', 'Fewer people left at the base'] },
  { n: 4, name: 'Four astronauts', pros: ['Two teams can split at targets'], cons: ['Highest crew-time cost', 'Base left unattended'] },
];
const GEAR = [
  { id: 'amostrador', name: 'Sample collection kit', kg: 4, benefit: 'Brings rock and soil back to the base lab.', for: ['vida-antiga', 'sedimentos', 'boxwork', 'gelo'] },
  { id: 'camera', name: 'Field camera', kg: 2, benefit: 'Documents context and scale for scientists on Earth.', for: ['vida-antiga', 'sedimentos', 'boxwork', 'gelo'] },
  { id: 'espectrometro', name: 'Handheld X-ray spectrometer', kg: 5, benefit: 'Reads rock chemistry on the spot, like Perseverance’s PIXL.', for: ['vida-antiga', 'sedimentos', 'boxwork'] },
  { id: 'perfuratriz', name: 'Hand drill', kg: 12, benefit: 'Reaches fresh rock below the weathered, radiation-damaged surface.', for: ['vida-antiga', 'boxwork'] },
  { id: 'radar', name: 'Ground-penetrating radar', kg: 8, benefit: 'Sees layers and ice below the surface, like Perseverance’s RIMFAX.', for: ['sedimentos', 'gelo'] },
  { id: 'trado', name: 'Ice auger', kg: 7, benefit: 'Digs down to confirm and sample shallow ice.', for: ['gelo'] },
  { id: 'medico', name: 'Emergency medical kit', kg: 3, benefit: 'Treats injuries and suit leaks until you are back.', for: ['vida-antiga', 'sedimentos', 'boxwork', 'gelo'] },
];
const SAFETY = [
  { id: 'extraO2', name: `Extended life-support pack (+${C.EXTRA_O2_H} h)`, kg: C.EXTRA_O2_KG, benefit: `Adds ${C.EXTRA_O2_H} hours of oxygen, water and battery.` },
  { id: 'relay', name: 'Radio relay beacon', kg: 3, benefit: 'Keeps the voice link to the base when ridges block the line of sight.' },
];

// ---------- state ----------
const state = { step: 0, purpose: null, siteId: null, routeId: null, crew: 2, rover: false, gear: new Set(), safety: new Set(['relay']), sol: null, start: '09:00' };
let sites = [];
const weatherCache = {};
const getJSON = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); };
const site = () => sites.find((s) => s.id === state.siteId);
const route = () => { const s = site(); return s.routes.find((r) => r.id === state.routeId) ?? s.routes.find((r) => r.objective === state.purpose) ?? s.routes[0]; };
const loadKg = () => GEAR.filter((g) => state.gear.has(g.id)).reduce((a, g) => a + g.kg, 0) + (state.safety.has('relay') ? 3 : 0);
const inputs = (o = {}) => ({ crew: state.crew, rover: state.rover, loadKg: loadKg(), start: state.start, extraO2: state.safety.has('extraO2'), ...o });
const weatherOf = async (s) => (s.weather ? (weatherCache[s.id] ??= await getJSON(s.weather)) : []);
const solWeather = async (s) => (await weatherOf(s)).find((w) => w.sol === state.sol) ?? null;

// ---------- space weather (live DONKI, snapshot as fallback) ----------
let spaceWx = null;
async function loadSpaceWeather() {
  if (spaceWx) return spaceWx;
  const end = new Date(), start = new Date(end - C.DONKI_DAYS * 864e5), d = (x) => x.toISOString().slice(0, 10);
  const api = (k) => `https://api.nasa.gov/DONKI/${k}?startDate=${d(start)}&endDate=${d(end)}&api_key=DEMO_KEY`;
  const get = async (k) => { try { const ctl = new AbortController(); setTimeout(() => ctl.abort(), 6000); const r = await fetch(api(k), { signal: ctl.signal }); return r.ok ? r.json() : null; } catch { return null; } };
  const [cme, flr, sep] = await Promise.all(['CME', 'FLR', 'SEP'].map(get));
  if (cme) {
    const events = [
      ...cme.map((c) => ({ type: 'CME', time: c.startTime, speed_kms: c.cmeAnalyses?.[0]?.speed })),
      ...(flr ?? []).map((f) => ({ type: 'FLR', time: f.peakTime ?? f.beginTime, class: f.classType })),
      ...(sep ?? []).map((s) => ({ type: 'SEP', time: s.eventTime })),
    ];
    spaceWx = { live: true, when: end.toISOString(), events };
  } else {
    const snap = await getJSON('data/spaceweather.json').catch(() => ({ events: [], fetched: null }));
    spaceWx = { live: false, when: snap.fetched, events: snap.events };
  }
  spaceWx.risk = spaceWeatherRisk(spaceWx.events, spaceWx.live ? spaceWx.when : (spaceWx.when ?? new Date().toISOString()));
  return spaceWx;
}

// ---------- UI helpers ----------
function card({ title, text, pros = [], cons = [], meta, recommended, pressed, onClick, multi }) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'opt';
  b.setAttribute('aria-pressed', String(!!pressed));
  b.innerHTML = `${recommended ? '<span class="rec">Recommended</span>' : ''}${multi ? `<span class="check" aria-hidden="true">${pressed ? '✓' : ''}</span>` : ''}
    <b>${title}</b>${text ? `<small>${text}</small>` : ''}
    ${pros.length || cons.length ? `<ul class="pc">${pros.map((p) => `<li class="pro">${p}</li>`).join('')}${cons.map((c) => `<li class="con">${c}</li>`).join('')}</ul>` : ''}
    ${meta ? `<span class="meta">${meta}</span>` : ''}`;
  b.onclick = onClick;
  return b;
}
function why(text, src) {
  const el = $('q-why');
  el.hidden = !text;
  if (text) el.innerHTML = `<p><b>Why it matters:</b> ${text}</p>${src ? `<cite>Source: ${src}</cite>` : ''}`;
}
const summary = (html) => { const el = document.createElement('div'); el.className = 'field summary'; el.innerHTML = html; return el; };

// ---------- steps ----------
const STEPS = [
  {
    title: 'What is the purpose of this exploration?', lead: 'At NASA the science goal comes first. Every recommendation that follows is tuned to it.',
    ready: () => state.purpose,
    render(body) {
      for (const p of PURPOSES) body.append(card({ title: p.name, text: p.text, pressed: state.purpose === p.id, onClick: () => {
        state.purpose = p.id; state.routeId = null;
        state.siteId = sites.find((s) => s.objectives.includes(p.id))?.id ?? state.siteId;
        state.gear = new Set(GEAR.filter((g) => g.for.includes(p.id)).map((g) => g.id));
        render();
      } }));
      const p = PURPOSES.find((x) => x.id === state.purpose);
      why(p?.why, p?.src);
    },
  },
  {
    title: 'Where will we walk?', lead: 'The recommended site fits your purpose. The more a rover explored a site, the better we know its terrain.',
    ready: () => state.siteId,
    render(body) {
      for (const s of sites) {
        const r = s.routes.find((x) => x.objective === state.purpose) ?? s.routes[0];
        const st = routeStats([s.habitat, ...r.waypoints, s.habitat]);
        body.append(card({ title: s.name, text: `${s.mission}. Route: ${r.name}.`, ...SITE_INFO[s.id],
          meta: `${fmt(st.distance_m / 1000, 1)} km round trip · steepest ${fmt(st.max_slope_deg)}° ${tag('D')}`,
          recommended: s.objectives.includes(state.purpose), pressed: state.siteId === s.id,
          onClick: () => { state.siteId = s.id; state.routeId = null; state.sol = null; render(); } }));
      }
      why('Routes follow the real stops of NASA rovers wherever a rover has been, so every step is on terrain a rover already crossed.');
    },
  },
  {
    title: 'How big is the crew?', lead: 'More people means more science per hour, but crew time is the most expensive resource in space.',
    ready: () => true,
    render(body) {
      const base = planEva(site(), route(), inputs({ crew: 2 }), null);
      for (const c of CREW) body.append(card({ title: c.name, pros: c.pros, cons: c.cons,
        meta: `Crew time: ${usd(c.n * C.CREW_HOUR_USD)}/h · this walk ${usd(c.n * base.total_h * C.CREW_HOUR_USD)} ${tag('D')}`,
        recommended: c.n === 2, pressed: state.crew === c.n, onClick: () => { state.crew = c.n; render(); } }));
      why(`NASA spacewalks are always done in pairs. Cost reference: NASA prices ISS crew time at ${usd(C.CREW_HOUR_USD)} per hour.`, 'NASA ISS commercial pricing policy');
    },
  },
  {
    title: 'How will you move?', lead: 'We compare both options on your route.',
    ready: () => true,
    render(body) {
      const s = site(), r = route();
      const foot = planEva(s, r, inputs({ rover: false }), null), car = planEva(s, r, inputs({ rover: true }), null);
      const rec = recommendMobility(foot.stats);
      const roverCost = C.ROVER_UNIT_USD + C.ROVER_MASS_KG * C.USD_PER_KG_TO_MARS;
      body.append(
        card({ title: 'On foot', pros: ['No extra hardware to land', 'Goes anywhere up to 25° slopes'], cons: ['Slower, more tiring', 'Uses more oxygen'],
          meta: `${hhmm(foot.total_h)} · suit reserve ${fmt(foot.reserve_pct)}% ${tag('S')}`, recommended: rec === 'foot', pressed: !state.rover,
          onClick: () => { state.rover = false; render(); } }),
        card({ title: 'Unpressurized rover', text: 'Like the Apollo Lunar Roving Vehicle.', pros: [`Drives at ${C.ROVER_KMH} km/h`, 'Crew rests while driving: less oxygen'], cons: [`Cannot climb above ${C.ROVER_MAX_SLOPE_DEG}°`, `One-time cost ~${usd(roverCost)} to build and land`],
          meta: `${hhmm(car.total_h)} (${delta(Math.round((car.total_h - foot.total_h) * 60))} min) · suit reserve ${fmt(car.reserve_pct)}% ${tag('S')}`, recommended: rec === 'rover', pressed: state.rover,
          onClick: () => { state.rover = true; render(); } }),
      );
      why(`A rover pays off on long, gentle routes. Cost: Apollo’s 4 rovers cost $38M in 1971 (~${usd(C.ROVER_UNIT_USD)} each today) plus landing ${C.ROVER_MASS_KG} kg on Mars at ~${usd(C.USD_PER_KG_TO_MARS)}/kg.`, 'NASA Apollo LRV; Mars 2020 mission cost and rover mass');
    },
  },
  {
    title: 'What science gear will you carry?', lead: 'We pre-selected what your purpose needs. Every kilogram costs effort on the walk and money to land on Mars.',
    ready: () => true,
    render(body) {
      for (const g of GEAR) body.append(card({ title: g.name, text: g.benefit, multi: true,
        meta: `${g.kg} kg · ~${usd(g.kg * C.USD_PER_KG_TO_MARS)} to land ${tag('D')}`, recommended: g.for.includes(state.purpose), pressed: state.gear.has(g.id),
        onClick: () => { state.gear.has(g.id) ? state.gear.delete(g.id) : state.gear.add(g.id); render(); } }));
      body.append(summary(`<span>Total carried</span><span class="total">${loadKg()} kg</span><small>Effort +1% per kg ${tag('S')}. Landing cost ~${usd(C.USD_PER_KG_TO_MARS)}/kg, from Mars 2020 (~$2.7B for a 1,025 kg rover) ${tag('D')}</small>`));
      why('Mars gravity is 38% of Earth’s, but the suit and the load still tire you out, and every kilogram has to be launched and landed.');
    },
  },
  {
    title: 'What safety margins do you add?', lead: 'Margins cost mass, but they buy time when something goes wrong.',
    ready: () => true,
    async render(body) {
      const s = site(), r = route();
      const without = planEva(s, r, inputs({ extraO2: false }), null), withO2 = planEva(s, r, inputs({ extraO2: true }), null);
      for (const x of SAFETY) {
        const meta = x.id === 'extraO2' ? `${x.kg} kg · suit reserve ${fmt(without.reserve_pct)}% → ${fmt(withO2.reserve_pct)}% ${tag('S')}` : `${x.kg} kg ${tag('S')}`;
        body.append(card({ title: x.name, text: x.benefit, multi: true, meta,
          recommended: x.id === 'relay' || without.reserve_pct < C.RESERVE_PCT + 15, pressed: state.safety.has(x.id),
          onClick: () => { state.safety.has(x.id) ? state.safety.delete(x.id) : state.safety.add(x.id); render(); } }));
      }
      const wx = await loadSpaceWeather();
      body.append(summary(spaceWxHtml(wx, true)));
      why('Solar storms can raise the radiation dose in hours. Before every walk the crew checks NASA’s space weather alerts and stays close to shelter if a storm is coming.', 'NASA DONKI');
    },
  },
  {
    title: 'When do you leave?', lead: 'Weather comes from the rovers’ weather stations. You must be back before dark.',
    ready: () => true,
    async render(body) {
      const list = await weatherOf(site());
      const f = document.createElement('div'); f.className = 'field';
      if (list.length) {
        state.sol ??= list.at(-1).sol;
        f.innerHTML = `<label for="sol">Martian day (sol) with measured weather ${tag('R')}</label>
          <select id="sol">${list.map((w) => `<option value="${w.sol}" ${w.sol === state.sol ? 'selected' : ''}>Sol ${w.sol} (${w.terrestrial_date}): ${fmt(w.min_temp)} to ${fmt(w.max_temp)} °C, sunrise ${w.sunrise}, sunset ${w.sunset}</option>`).join('')}</select>`;
        f.querySelector('select').onchange = (e) => { state.sol = Number(e.target.value); };
      } else {
        state.sol = null;
        f.innerHTML = `<p>This site has no weather station, so sunset time cannot be checked. ${tag('H')}</p>`;
      }
      const t = document.createElement('div'); t.className = 'field';
      t.innerHTML = `<label for="start">Departure time (Mars local time)</label><input type="time" id="start" value="${state.start}">`;
      t.querySelector('input').onchange = (e) => { state.start = e.target.value || '09:00'; };
      body.append(f, t);
      why(`You must be back ${C.DAYLIGHT_MARGIN_MIN} minutes before sunset: at night the temperature drops to around −80 °C and solar power is gone.`);
    },
  },
];

async function render() {
  const step = STEPS[state.step];
  $('progress').innerHTML = STEPS.map((_, i) => `<li class="${i <= state.step ? 'done' : ''}" aria-current="${i === state.step ? 'step' : 'false'}"></li>`).join('');
  $('q-step').textContent = `Step ${state.step + 1} of ${STEPS.length}`;
  $('q-title').textContent = step.title;
  $('q-lead').textContent = step.lead;
  const body = $('q-body'); body.replaceChildren();
  await step.render(body);
  $('back').style.visibility = state.step === 0 ? 'hidden' : 'visible';
  $('next').textContent = state.step === STEPS.length - 1 ? 'Build the walk plan' : 'Next';
  $('next').disabled = !step.ready();
}
$('back').onclick = () => { state.step--; render(); };
$('next').onclick = () => { if (state.step < STEPS.length - 1) { state.step++; render(); window.scrollTo(0, 0); } else showResult(); };

// ---------- result ----------
let map, routeLayer, siteLayers = [];

async function showResult() {
  $('quiz').hidden = true; $('result').hidden = false; $('report').hidden = false;
  if (!map) initMap();
  await drawSite(site());
  await drawPlan();
}

function initMap() {
  let loaded = 0, failed = 0;
  const onError = () => { failed++; if (failed >= 8 && loaded === 0) $('tile-notice').hidden = false; };
  map = L.map('map', { crs: L.CRS.EPSG4326 });
  const bases = baseLayers(onError);
  bases.forEach((b) => b.layer.on('tileload', () => { loaded++; $('tile-notice').hidden = true; }));
  bases[0].layer.addTo(map);
  map._ctl = L.control.layers(Object.fromEntries(bases.map((b) => [b.name, b.layer])), {}, { collapsed: window.innerWidth < 860 }).addTo(map);
  const legend = (layer) => { $('legend').innerHTML = bases.find((b) => b.layer === layer)?.about ?? ''; };
  legend(bases[0].layer);
  map.on('baselayerchange', (e) => legend(e.layer));
  $('opacity').oninput = (e) => map._local?.setOpacity(e.target.value / 100);
}

async function drawSite(s) {
  siteLayers.forEach((l) => { map.removeLayer(l); map._ctl.removeLayer(l); });
  siteLayers = [];
  const local = localLayer(s.localLayer);
  map._local = local?.layer;
  $('opacity-wrap').hidden = !local;
  if (local) { local.layer.addTo(map); map._ctl.addOverlay(local.layer, local.name); siteLayers.push(local.layer); }
  if (s.traverse) {
    const t = L.geoJSON(await getJSON(s.traverse), { style: { color: '#9cc9e6', weight: 2, opacity: .7, dashArray: '4 4' }, interactive: false });
    t.addTo(map); map._ctl.addOverlay(t, `Real ${s.mission.split(' ')[0]} traverse`); siteLayers.push(t);
  }
}

async function drawPlan() {
  const s = site(), r = route(), w = await solWeather(s), inp = inputs();
  const p = planEva(s, r, inp, w), tl = evaTimeline(s, r, inp), cost = evaCost(p, inp), wx = await loadSpaceWeather();

  // map
  if (routeLayer) { map.removeLayer(routeLayer); map._ctl.removeLayer(routeLayer); }
  const pts = [s.habitat, ...r.waypoints, s.habitat].map((x) => [x.lat, x.lon]);
  // dark casing + ochre line: the route shows on every layer (including the orange geology map)
  routeLayer = L.layerGroup([L.polyline(pts, { color: '#18202e', weight: 8, opacity: .85 }), L.polyline(pts, { color: '#d9a35f', weight: 4 })]);
  L.marker([s.habitat.lat, s.habitat.lon], { icon: L.divIcon({ className: 'pin pin-base', iconSize: [16, 16] }), title: 'Base' })
    .bindPopup(`<b>Base</b> ${tag(s.habitat.tag ?? 'H')}<br>Start and end of the walk.`).addTo(routeLayer);
  for (const wp of r.waypoints.filter((x) => x.target)) {
    const t = wp.target;
    L.marker([wp.lat, wp.lon], { icon: L.divIcon({ className: 'pin', iconSize: [16, 16] }), title: t.name })
      .bindPopup(`<b>${t.name}</b> ${tag(r.tag)}<br>${t.why}${t.sol ? `<br><small>Sol ${t.sol}</small>` : ''}${t.photo ? `<br><img src="${t.photo}" alt="${t.name}" width="240"><br><small>${t.credit}</small>` : ''}`, { maxWidth: 260, maxHeight: 320 })
      .addTo(routeLayer);
  }
  routeLayer.addTo(map);
  map._ctl.addOverlay(routeLayer, 'Planned route');
  map.fitBounds(L.latLngBounds(pts).pad(0.25));

  // risks: plan alerts + space weather + recommendations from the choices
  const risks = [...p.alerts.map((a) => ({ level: a.level, text: a.msg }))];
  if (wx.risk.level === 'high') risks.push({ level: 'proibido', text: 'Space weather: solar particle event or X-class flare in the last week. Postpone the walk.' });
  else if (wx.risk.level === 'watch') risks.push({ level: 'aviso', text: `Space weather: fast CME (${fmt(wx.risk.fastest_kms)} km/s) this week. Stay within quick reach of the base.` });
  const go = !risks.some((x) => x.level === 'proibido');
  const recs = [];
  if (state.crew === 1) recs.push(['Add a second astronaut', 'NASA practice: one astronaut can help the other with a suit problem.']);
  if (p.reserve_pct < C.RESERVE_PCT + 15 && !inp.extraO2) recs.push(['Take the extended life-support pack', `It raises the suit reserve on return above ${C.RESERVE_PCT + 15}%.`]);
  if (!state.safety.has('relay') && p.stats.distance_m > 2000) recs.push(['Carry the radio relay beacon', 'Ridges and channel walls can block the voice link to the base.']);
  if (!state.gear.has('medico')) recs.push(['Pack the medical kit', 'There is no quick rescue on Mars.']);
  if (!state.rover && recommendMobility(p.stats) === 'rover') recs.push(['Use the rover', 'This route is long and gentle enough for it.']);
  if (s.id !== 'gale') recs.push(['Treat the radiation number as a reference', 'It was measured by Curiosity in Gale crater; there is no ground radiation sensor at this site.']);

  // panel
  const q = new URLSearchParams({ site: s.id, route: r.id, crew: state.crew, rover: state.rover ? 1 : 0, load: inp.loadKg, start: state.start });
  if (state.sol != null) q.set('sol', state.sol);
  const nogo = risks.filter((x) => x.level === 'proibido').length, warn = risks.length - nogo;
  $('panel').innerHTML = `
    <h2>${r.name}</h2>
    <p class="sub">${s.name} ${tag(r.tag)} · ${PURPOSES.find((x) => x.id === state.purpose)?.name ?? ''}</p>
    ${s.routes.length > 1 ? `<label class="route-pick">Change route<select id="route">${s.routes.map((x) => `<option value="${x.id}" ${x.id === r.id ? 'selected' : ''}>${x.name}</option>`).join('')}</select></label>` : ''}
    <div class="verdict ${go ? 'go' : 'nogo'}" role="status"><b>${go ? 'GO' : 'NO-GO'}</b>
      <span>${go ? `Walk approved${warn ? `, with ${warn} ${warn > 1 ? 'warnings' : 'warning'}` : ''}.` : `${nogo} ${nogo > 1 ? 'reasons block' : 'reason blocks'} this walk.`}</span></div>
    <dl class="stats">
      <dt class="grp">Route</dt>
      <dt>Distance, round trip</dt><dd>${fmt(p.stats.distance_m / 1000, 2)} km ${tag('D')}</dd>
      <dt>Total climb</dt><dd>${fmt(p.stats.ascent_m)} m ${tag('D')}</dd>
      <dt>Steepest slope</dt><dd>${fmt(p.stats.max_slope_deg, 1)}° ${tag('D')}</dd>
      <dt>Crew · mobility · load</dt><dd>${state.crew} · ${state.rover ? 'rover' : 'on foot'} · ${inp.loadKg + (inp.extraO2 ? C.EXTRA_O2_KG : 0)} kg</dd>
      <dt class="grp">Time</dt>
      <dt>Total duration</dt><dd>${hhmm(p.total_h)} ${tag('S')}</dd>
      <dt>Leave and return</dt><dd>${state.start} → ${p.end_time} ${tag('S')}</dd>
      ${w ? `<dt>Sunset</dt><dd>${w.sunset} ${tag('R')}</dd>` : ''}
      <dt class="grp">Suit (minimum reserve ${C.RESERVE_PCT}%)</dt>
      <dt>Oxygen used</dt><dd>${fmt(p.used_pct.o2)}% ${tag('S')}</dd>
      <dt>Water used</dt><dd>${fmt(p.used_pct.water)}% ${tag('S')}</dd>
      <dt>Battery used</dt><dd>${fmt(p.used_pct.battery)}% ${tag('S')}</dd>
      <dt>Reserve on return</dt><dd>${fmt(p.reserve_pct)}% ${tag('S')}</dd>
      ${w ? `<dt class="grp">Weather on sol ${w.sol}</dt>
      <dt>Air temperature</dt><dd>${fmt(w.min_temp)} to ${fmt(w.max_temp)} °C ${tag('R')}</dd>
      <dt>Pressure</dt><dd>${fmt(w.pressure)} Pa ${tag('R')}</dd>` : ''}
      <dt class="grp">Radiation</dt>
      <dt>Dose during the walk</dt><dd>${fmt(p.dose_mSv, 3)} mSv ${tag('D')}</dd>
      <dt>Share of career limit (600 mSv)</dt><dd>${fmt(p.career_pct, 3)}% ${tag('D')}</dd>
      <dt class="grp">Cost</dt>
      <dt>Crew time, this walk</dt><dd>${usd(cost.crew_time_usd)} ${tag('D')}</dd>
      <dt>Landing the gear (one-time)</dt><dd>${usd(cost.one_time_usd)} ${tag('D')}</dd>
    </dl>
    <div class="actions">
      ${s.hasSim ? `<a class="btn" href="sim.html?${q}">Walk it in the 3D visor</a>`
        : `<a class="btn" aria-disabled="true" tabindex="-1">Walk it in the 3D visor</a><p class="note">The 3D simulation is only available for Jezero in this prototype.</p>`}
      <button type="button" class="btn ghost" id="redo">Plan again</button>
    </div>`;
  $('route')?.addEventListener('change', (e) => { state.routeId = e.target.value; drawPlan(); });
  $('redo').onclick = () => { $('result').hidden = true; $('report').hidden = true; $('quiz').hidden = false; state.step = 0; render(); window.scrollTo(0, 0); };

  // report: timeline, cost comparison, risks & recommendations, space weather
  const alt = (o, label) => { const i2 = inputs(o), p2 = planEva(s, r, i2, w), c2 = evaCost(p2, i2); return { label, p: p2, c: c2 }; };
  const rows = [
    { label: 'Your plan', p, c: cost, mine: true },
    alt({ rover: !state.rover }, state.rover ? 'Same, on foot' : 'Same, with rover'),
    alt({ crew: state.crew === 2 ? 3 : 2 }, state.crew === 2 ? 'Same, crew of 3' : 'Same, crew of 2'),
    alt({ extraO2: !inp.extraO2 }, inp.extraO2 ? 'Without extended pack' : 'With extended pack'),
  ];
  $('report').innerHTML = `
    <section class="rcard">
      <h3>Walk timeline</h3>
      <table class="tl"><thead><tr><th>Time</th><th>Event</th><th>Oxygen left ${tag('S')}</th></tr></thead><tbody>
      ${tl.map((e) => `<tr><td>${e.time}</td><td>${e.kind === 'depart' ? 'Leave the base' : e.kind === 'return' ? 'Back at the base' : `Arrive at <b>${e.name}</b>, ${C.SCIENCE_MIN_PER_TARGET} min of science`}</td><td><span class="bar"><i style="width:${e.o2_left_pct}%"></i></span>${fmt(e.o2_left_pct)}%</td></tr>`).join('')}
      </tbody></table>
    </section>
    <section class="rcard">
      <h3>Cost and time compared</h3>
      <table class="cmp"><thead><tr><th></th><th>Duration</th><th>Reserve</th><th>Crew time</th><th>One-time landing</th></tr></thead><tbody>
      ${rows.map((x) => `<tr class="${x.mine ? 'mine' : ''}"><td>${x.label}</td><td>${hhmm(x.p.total_h)}</td><td>${fmt(x.p.reserve_pct)}%</td><td>${usd(x.c.crew_time_usd)}</td><td>${usd(x.c.one_time_usd)}</td></tr>`).join('')}
      </tbody></table>
      <p class="note">Estimates ${tag('D')}: crew time at NASA’s ISS price of ${usd(C.CREW_HOUR_USD)}/h per astronaut; landing at ~${usd(C.USD_PER_KG_TO_MARS)}/kg (Mars 2020 cost ÷ rover mass); rover at Apollo LRV cost adjusted for inflation. Order-of-magnitude figures to compare choices, not a budget.</p>
    </section>
    <section class="rcard">
      <h3>Risk analysis and recommendations</h3>
      <p class="level ${go ? (warn > 1 ? 'mod' : 'low') : 'high'}">Overall risk: <b>${go ? (warn > 1 ? 'MODERATE' : 'LOW') : 'HIGH'}</b></p>
      <ul class="alerts">${risks.map((x) => `<li class="${x.level}">${x.text}</li>`).join('') || '<li class="ok">No safety rule triggered.</li>'}</ul>
      ${recs.length ? `<h4>Recommended actions</h4><ul class="recs">${recs.map(([a, b]) => `<li><b>${a}.</b> ${b}</li>`).join('')}</ul>` : ''}
    </section>
    <section class="rcard">
      <h3>Space weather</h3>
      ${spaceWxHtml(wx)}
    </section>`;
}

function spaceWxHtml(wx, short) {
  const label = { low: 'Quiet', watch: 'Watch', high: 'Storm' }[wx.risk.level];
  const recent = wx.events.slice().sort((a, b) => (b.time ?? '').localeCompare(a.time ?? '')).slice(0, short ? 0 : 5);
  return `<p><b>Space weather (NASA DONKI): <span class="wx ${wx.risk.level}">${label}</span></b> ${tag('R')}
    <br><small>${wx.risk.recent} events in the last ${C.DONKI_DAYS} days · fastest CME ${fmt(wx.risk.fastest_kms)} km/s · ${wx.risk.sep} solar particle events.
    ${wx.live ? 'Live data.' : `Saved copy from ${wx.when?.slice(0, 10) ?? 'unknown date'} (live API unavailable).`}
    Events are measured near Earth; Mars may face a different side of the Sun.</small></p>
    ${recent.length ? `<ul class="wxlist">${recent.map((e) => `<li>${e.time?.replace('T', ' ').replace('Z', ' UTC')} · ${e.type === 'CME' ? `Coronal mass ejection, ${e.speed_kms ? `${fmt(e.speed_kms)} km/s` : 'speed not measured'}` : e.type === 'FLR' ? `Solar flare, class ${e.class}` : 'Solar energetic particle event'}</li>`).join('')}</ul>` : ''}`;
}

getJSON('data/sites.json')
  .then((d) => { sites = d; render(); loadSpaceWeather(); })
  .catch((e) => { $('q-title').textContent = 'Could not load the site data.'; $('q-lead').textContent = `Open the site through a web server (npm run dev). Details: ${e.message}`; });
