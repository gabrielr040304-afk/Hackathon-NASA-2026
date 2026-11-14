// Planner: 5-step questionnaire + result on the map (plan tasks 5 and 6).
import { planEva } from './calc.js';
import { RESERVE_PCT, DAYLIGHT_MARGIN_MIN } from './config.js';
import { baseLayers, localLayer } from './layers.js';

const $ = (id) => document.getElementById(id);
const tag = (t) => `<b class="tag t-${t}" title="${{ R: 'real', D: 'derived', S: 'simulated', H: 'hypothetical' }[t]}">${t}</b>`;
const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const hhmm = (h) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')} min`;

const OBJECTIVES = [
  { id: 'vida-antiga', name: 'Signs of ancient life', text: 'Rocks that may hold traces of microbes from billions of years ago.',
    why: 'Jezero was a lake about 3.5 billion years ago. In 2024 Perseverance found textures in the Cheyava Falls rock that may have a biological origin.', src: 'NASA/JPL, July 2024' },
  { id: 'sedimentos', name: 'Water and sediments', text: 'Layers left by ancient rivers tell us what the climate was like.',
    why: 'Rocks laid down by water record how long it lasted. The Neretva Vallis channel carried the river that filled Jezero lake.', src: 'NASA Mars 2020' },
  { id: 'boxwork', name: 'Boxwork formations', text: 'Honeycomb-shaped ridges made by minerals from groundwater.',
    why: 'The ridges show where water flowed underground while Mars was drying out. Curiosity studied these formations in 2025.', src: 'Curiosity blog, NASA, 2025' },
  { id: 'gelo', name: 'Ice for a human base', text: 'Find shallow water ice to drink, breathe and make fuel.',
    why: 'Ice a few meters below the surface can become water, oxygen and rocket fuel, which makes a human base feasible.', src: 'SWIM project (NASA)' },
];
const EQUIPMENT = [
  { id: 'amostrador', name: 'Sample collection kit', kg: 4 },
  { id: 'camera', name: 'Field camera', kg: 2 },
  { id: 'espectrometro', name: 'Handheld spectrometer', kg: 5 },
  { id: 'perfuratriz', name: 'Hand drill', kg: 12 },
  { id: 'medico', name: 'Emergency medical kit', kg: 3 },
];

const state = { step: 0, objective: null, siteId: null, crew: 2, rover: false, equipment: new Set(['amostrador', 'camera', 'medico']), sol: null, start: '09:00' };
let sites = [];
const weatherCache = {};

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
}
const site = () => sites.find((s) => s.id === state.siteId);
const loadKg = () => EQUIPMENT.filter((e) => state.equipment.has(e.id)).reduce((a, e) => a + e.kg, 0);
async function weatherOf(s) {
  if (!s.weather) return [];
  return (weatherCache[s.id] ??= await getJSON(s.weather));
}

function option({ title, text, hint, pressed, onClick }) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'opt';
  b.setAttribute('aria-pressed', String(!!pressed));
  b.innerHTML = `<b>${title}</b><small>${text}</small>${hint ? `<span class="hint">${hint}</span>` : ''}`;
  b.onclick = onClick;
  return b;
}
function why(text, src) {
  const el = $('q-why');
  el.hidden = !text;
  if (text) el.innerHTML = `<p><b>Why it matters:</b> ${text}</p>${src ? `<cite>Source: ${src}</cite>` : ''}`;
}

const STEPS = [
  {
    title: 'What do you want to discover?', lead: 'At NASA the science goal comes first. It decides where the walk goes.',
    ready: () => state.objective,
    render(body) {
      for (const o of OBJECTIVES) body.append(option({ title: o.name, text: o.text, pressed: state.objective === o.id,
        onClick: () => { state.objective = o.id; state.siteId = sites.find((s) => s.objectives.includes(o.id))?.id ?? state.siteId; render(); } }));
      const o = OBJECTIVES.find((x) => x.id === state.objective);
      why(o?.why, o?.src);
    },
  },
  {
    title: 'Where will we walk?', lead: 'Three places with different amounts of data. The more a rover explored, the better we know the terrain.',
    ready: () => state.siteId,
    render(body) {
      const notes = {
        jezero: ['Route along real Perseverance stops. 3D simulation available.', 'The terrain is known down to 1 meter by the HiRISE camera in orbit.'],
        gale: ['Route along real Curiosity stops. The only site with radiation measured on the ground.', 'Curiosity has measured radiation since 2012; it is the best reference we have for astronauts.'],
        arcadia: ['No rover has been here. Hypothetical route.', 'It is one of the plains considered for a human base because of its shallow ice. The trade-off: no ground photos and no measured weather.'],
      };
      for (const s of sites) body.append(option({ title: s.name, text: `${s.mission}. ${notes[s.id]?.[0] ?? ''}`,
        hint: s.objectives.includes(state.objective) ? 'Matches your goal' : '', pressed: state.siteId === s.id,
        onClick: () => { state.siteId = s.id; state.sol = null; render(); } }));
      why(notes[state.siteId]?.[1]);
    },
  },
  {
    title: 'Who goes, and how?', lead: 'A pair or alone, on foot or with a support rover.',
    ready: () => true,
    render(body) {
      body.append(
        option({ title: 'Two astronauts', text: 'Each one can help the other if something goes wrong.', pressed: state.crew === 2, onClick: () => { state.crew = 2; render(); } }),
        option({ title: 'One astronaut', text: 'Quicker to organize, riskier.', pressed: state.crew === 1, onClick: () => { state.crew = 1; render(); } }),
        option({ title: 'With a support rover', text: 'Carries the crew on stretches up to 15° of slope.', pressed: state.rover, onClick: () => { state.rover = !state.rover; render(); } }),
      );
      why('NASA spacewalks are always done in pairs. A rover saves effort and oxygen, but it cannot climb steep slopes.', 'NASA; Apollo Lunar Roving Vehicle');
    },
  },
  {
    title: 'What will you carry?', lead: 'Every extra kilogram raises effort and the suit’s oxygen use.',
    ready: () => true,
    render(body) {
      const f = document.createElement('div'); f.className = 'field';
      for (const e of EQUIPMENT) {
        const l = document.createElement('label');
        l.innerHTML = `<input type="checkbox" ${state.equipment.has(e.id) ? 'checked' : ''}> ${e.name} <small>(${e.kg} kg)</small>`;
        l.querySelector('input').onchange = (ev) => { ev.target.checked ? state.equipment.add(e.id) : state.equipment.delete(e.id); render(); };
        f.append(l);
      }
      const t = document.createElement('div'); t.className = 'field';
      t.innerHTML = `<span>Total load</span><span class="total">${loadKg()} kg</span><small>Mars gravity is 38% of Earth’s, but the suit and the load still tire you out. ${tag('S')}</small>`;
      body.append(f, t);
      why('Load is part of the effort model: +1% consumption per kilogram. This is our estimate, not a NASA measurement.');
    },
  },
  {
    title: 'When do you leave?', lead: 'Weather comes from the rovers’ weather stations. You must be back before dark.',
    ready: () => true,
    async render(body) {
      const s = site(); const list = await weatherOf(s);
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
      why(`You must be back ${DAYLIGHT_MARGIN_MIN} minutes before sunset: at night the temperature drops to around −80 °C and solar power is gone.`);
    },
  },
];

async function render() {
  const step = STEPS[state.step];
  $('progress').innerHTML = STEPS.map((_, i) => `<li class="${i <= state.step ? 'done' : ''}" aria-current="${i === state.step ? 'step' : 'false'}"></li>`).join('');
  $('q-title').textContent = step.title;
  $('q-lead').textContent = step.lead;
  const body = $('q-body'); body.replaceChildren();
  await step.render(body);
  $('back').style.visibility = state.step === 0 ? 'hidden' : 'visible';
  $('next').textContent = state.step === STEPS.length - 1 ? 'Plan the walk' : 'Next';
  $('next').disabled = !step.ready();
}

$('back').onclick = () => { state.step--; render(); };
$('next').onclick = () => { if (state.step < STEPS.length - 1) { state.step++; render(); } else showResult(); };

// ---------- result ----------
let map, routeLayer;

async function showResult() {
  $('quiz').hidden = true; $('result').hidden = false;
  const s = site();
  const route = s.routes.find((r) => r.objective === state.objective) ?? s.routes[0];
  if (!map) initMap();
  await drawSite(s);
  drawPlan(s, route);
}

function initMap() {
  let loaded = 0, failed = 0;
  const onError = () => { failed++; if (failed >= 8 && loaded === 0) $('tile-notice').hidden = false; };
  map = L.map('map', { crs: L.CRS.EPSG4326, zoomControl: true, worldCopyJump: false });
  const bases = baseLayers(onError);
  bases.forEach((b) => b.layer.on('tileload', () => { loaded++; $('tile-notice').hidden = true; }));
  bases[0].layer.addTo(map);
  const ctl = L.control.layers(Object.fromEntries(bases.map((b) => [b.name, b.layer])), {}, { collapsed: window.innerWidth < 860 }).addTo(map);
  const legend = (layer) => { $('legend').innerHTML = bases.find((b) => b.layer === layer)?.about ?? ''; };
  legend(bases[0].layer);
  map.on('baselayerchange', (e) => legend(e.layer));
  map._ctl = ctl;
  $('opacity').oninput = (e) => map._local?.setOpacity(e.target.value / 100);
}

let siteLayers = [];
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

async function drawPlan(s, route) {
  const list = await weatherOf(s);
  const w = list.find((x) => x.sol === state.sol) ?? null;
  const inputs = { crew: state.crew, rover: state.rover, loadKg: loadKg(), start: state.start };
  const p = planEva(s, route, inputs, w);

  // map
  if (routeLayer) { map.removeLayer(routeLayer); map._ctl.removeLayer(routeLayer); }
  const pts = [s.habitat, ...route.waypoints, s.habitat].map((x) => [x.lat, x.lon]);
  // dark casing + ochre line: the route shows on every layer (including the orange geology map)
  routeLayer = L.layerGroup([L.polyline(pts, { color: '#18202e', weight: 8, opacity: .85 }), L.polyline(pts, { color: '#d9a35f', weight: 4 })]);
  const baseIcon = L.divIcon({ className: 'pin pin-base', iconSize: [16, 16] });
  L.marker([s.habitat.lat, s.habitat.lon], { icon: baseIcon, title: 'Base' }).bindPopup(`<b>Base</b> ${tag(s.habitat.tag ?? 'H')}<br>Start and end of the walk.`).addTo(routeLayer);
  for (const wp of route.waypoints.filter((x) => x.target)) {
    const t = wp.target;
    L.marker([wp.lat, wp.lon], { icon: L.divIcon({ className: 'pin', iconSize: [16, 16] }), title: t.name })
      .bindPopup(`<b>${t.name}</b> ${tag(route.tag)}<br>${t.why}${t.sol ? `<br><small>Sol ${t.sol}</small>` : ''}${t.photo ? `<br><img src="${t.photo}" alt="${t.name}" width="240"><br><small>${t.credit}</small>` : ''}`, { maxWidth: 260, maxHeight: 320 })
      .addTo(routeLayer);
  }
  routeLayer.addTo(map);
  map._ctl.addOverlay(routeLayer, 'Planned route');
  map.fitBounds(L.latLngBounds(pts).pad(0.25));

  // panel
  const q = new URLSearchParams({ site: s.id, route: route.id, crew: state.crew, rover: state.rover ? 1 : 0, load: inputs.loadKg, start: state.start });
  if (state.sol != null) q.set('sol', state.sol);
  const nogo = p.alerts.filter((a) => a.level === 'proibido').length, warn = p.alerts.length - nogo;
  const rad = s.id === 'gale' ? 'average measured here by Curiosity' : 'reference value measured by Curiosity in Gale crater';
  $('panel').innerHTML = `
    <h2>${route.name}</h2>
    <p class="sub">${s.name} ${tag(route.tag)}</p>
    ${s.routes.length > 1 ? `<label class="route-pick">Change route<select id="route">${s.routes.map((r) => `<option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>` : ''}
    <div class="verdict ${p.go ? 'go' : 'nogo'}" role="status"><b>${p.go ? 'GO' : 'NO-GO'}</b>
      <span>${p.go ? `Walk approved${warn ? `, with ${warn} ${warn > 1 ? 'warnings' : 'warning'}` : ''}.` : `${nogo} ${nogo > 1 ? 'reasons block' : 'reason blocks'} this walk.`}</span></div>
    <ul class="alerts">${p.alerts.map((a) => `<li class="${a.level}">${a.msg}</li>`).join('')}</ul>
    <dl class="stats">
      <dt class="grp">Route</dt>
      <dt>Distance, round trip</dt><dd>${fmt(p.stats.distance_m / 1000, 2)} km ${tag('D')}</dd>
      <dt>Total climb</dt><dd>${fmt(p.stats.ascent_m)} m ${tag('D')}</dd>
      <dt>Steepest slope</dt><dd>${fmt(p.stats.max_slope_deg, 1)}° ${tag('D')}</dd>
      <dt>Science stops</dt><dd>${route.waypoints.filter((x) => x.target).length}</dd>
      <dt class="grp">Time</dt>
      <dt>Total duration</dt><dd>${hhmm(p.total_h)} ${tag('S')}</dd>
      <dt>Leave and return</dt><dd>${state.start} → ${p.end_time} ${tag('S')}</dd>
      ${w ? `<dt>Sunset</dt><dd>${w.sunset} ${tag('R')}</dd>` : ''}
      <dt class="grp">Suit (minimum reserve ${RESERVE_PCT}%)</dt>
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
    </dl>
    <p class="note">Radiation: ${rad} (0.64 mSv per day; Hassler et al., Science, 2014).</p>
    <div class="actions">
      ${s.hasSim ? `<a class="btn" href="sim.html?${q}">Walk it in the 3D visor</a>`
        : `<a class="btn" aria-disabled="true" tabindex="-1">Walk it in the 3D visor</a><p class="note">The 3D simulation is only available for Jezero in this prototype.</p>`}
      <button type="button" class="btn ghost" id="redo">Plan again</button>
    </div>`;
  $('route')?.addEventListener('change', (e) => drawPlan(s, s.routes.find((r) => r.id === e.target.value)));
  $('redo').onclick = () => { $('result').hidden = true; $('quiz').hidden = false; state.step = 0; render(); window.scrollTo(0, 0); };
}

getJSON('data/sites.json')
  .then((d) => { sites = d; render(); })
  .catch((e) => { $('q-title').textContent = 'Could not load the site data.'; $('q-lead').textContent = `Open the site through a web server (npm run dev). Details: ${e.message}`; });
