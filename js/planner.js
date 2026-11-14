// Planner: mission readiness, science, resources, shelter, daylight and cost context.
import { RESERVE_PCT, DAYLIGHT_MARGIN_MIN, EQUIPMENT, ESSENTIALS, SHELTERS, BUDGET_CATEGORIES, HISTORICAL_LAUNCH_COST, SOURCE_LINKS, RAD_MSV_PER_DAY, CAREER_LIMIT_MSV, LOAD_FACTOR_PER_KG } from './config.js';
import { assessMission, compareRoutes, daylightWindow, clockTime, terrainCautions, budgetSummary } from './mission.js';
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
const state = { step: 0, objective: null, siteId: null, crew: 2, rover: false, equipment: new Set(['amostrador', 'camera', 'medico']), essentials: new Set(), shelter: 'polymer', budget: {}, sol: null, start: '09:00' };
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
    title: 'Prepare to stay alive on Mars.', lead: 'Start with the systems that keep a crew alive. Confirm what your hypothetical mission provides; unconfirmed essentials will block the plan.',
    ready: () => true,
    render(body) {
      const intro = document.createElement('p'); intro.className = 'wide note';
      intro.innerHTML = 'An educational surface-walk planner, not a flight clearance. Mars has no breathable atmosphere. A rover trail is evidence of a rover traverse, not proof of astronaut safety. Checklist choices are hypothetical. ' + tag('H');
      body.append(intro);
      for (const item of ESSENTIALS) {
        const label = document.createElement('label'); label.className = 'readiness';
        label.innerHTML = `<input type="checkbox" ${state.essentials.has(item.id) ? 'checked' : ''}><span><b>${item.name}</b><small>${item.why}</small></span>`;
        label.querySelector('input').onchange = (e) => { e.target.checked ? state.essentials.add(item.id) : state.essentials.delete(item.id); $('readiness-count').textContent = `${state.essentials.size} / ${ESSENTIALS.length} confirmed [H]`; };
        body.append(label);
      }
      const count = document.createElement('p'); count.id = 'readiness-count'; count.className = 'wide'; count.textContent = `${state.essentials.size} / ${ESSENTIALS.length} confirmed [H]`; body.append(count);
      why(`Based on <a href="${SOURCE_LINKS.suit}" target="_blank" rel="noopener">NASA spacesuit systems</a>. Confirmations describe your scenario; the app cannot verify hardware, health, rescue capability or live space weather.`);
    },
  },
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
      why('A partner provides assistance during an emergency. Support-rover speed and terrain limits are simulated assumptions; this is not a tested Mars crew vehicle.', 'NASA spacesuit guidance; project mobility model [S]');
    },
  },
  {
    title: 'Equip the science walk.', lead: 'Life support comes first. Select additional tools carried by each astronaut; more load increases simulated effort.',
    ready: () => true,
    render(body) {
      const f = document.createElement('div'); f.className = 'field';
      for (const e of EQUIPMENT) {
        const l = document.createElement('label');
        l.innerHTML = `<input type="checkbox" ${state.equipment.has(e.id) ? 'checked' : ''}> ${e.name} <small>(${e.kg} kg) ${tag('S')}</small>`;
        l.querySelector('input').onchange = (ev) => { ev.target.checked ? state.equipment.add(e.id) : state.equipment.delete(e.id); $('load-total').textContent = `${loadKg()} kg`; };
        f.append(l);
      }
      const t = document.createElement('div'); t.className = 'field';
      t.innerHTML = `<span>Additional load per astronaut ${tag('S')}</span><span class="total" id="load-total">${loadKg()} kg</span><small>Illustrative masses. The pressure suit and its life-support system are excluded from this extra load; they remain essential.</small>`;
      body.append(f, t);
      why(`Load adds ${LOAD_FACTOR_PER_KG * 100}% effort per kilogram in our model ${tag('S')}. Oxygen, cooling water and battery have separate readouts but simplified capacities; CO₂ scrubber endurance is not modeled.`);
    },
  },
  {
    title: 'What protects your base?', lead: 'Choose a habitat concept and its shielding approach. These structures stay at the hypothetical base; you do not carry them on the walk.',
    ready: () => state.shelter,
    render(body) {
      for (const shelter of SHELTERS) body.append(option({ title: `${shelter.name} ${tag('H')}`, text: shelter.material, hint: shelter.protection, pressed: state.shelter === shelter.id, onClick: () => { state.shelter = shelter.id; render(); } }));
      why(`${SHELTERS.find((x) => x.id === state.shelter).tradeoff} No shielding percentage or thermal rating can be inferred without thickness, geometry and testing. Habitat choice does not reduce the outdoor dose calculation. <a href="${SOURCE_LINKS.shielding}" target="_blank" rel="noopener">NASA shielding research</a>.`);
    },
  },
  {
    title: 'Choose a daylight window.', lead: 'Explore a recorded weather day, not a live forecast. The report checks daylight and return margin; it cannot choose a radiation-safe hour.',
    ready: () => true,
    async render(body) {
      const s = site(); const list = await weatherOf(s);
      const f = document.createElement('div'); f.className = 'field';
      if (list.length) {
        if (!list.some((entry) => entry.sol === state.sol)) state.sol = list.at(-1).sol;
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
      why(`Our scenario requires departure after recorded sunrise and return ${DAYLIGHT_MARGIN_MIN} minutes before sunset ${tag('S')}. Daily minima and maxima do not predict the exact temperature along a route. No live dust, wind or solar-event forecast is connected.`);
    },
  },
  {
    title: 'Understand the mission cost.', lead: 'NASA has not priced this human Marswalk. Add your own scenario budget, or leave unknown items blank. The report separates your assumptions from a published historical launch estimate.',
    ready: () => !document.querySelector('#q-body input:invalid'),
    render(body) {
      for (const item of BUDGET_CATEGORIES) {
        const field = document.createElement('div'); field.className = 'field';
        field.innerHTML = `<label for="budget-${item.id}">${item.name} ${tag('H')}</label><small>Your estimate in millions of USD; include contingency in operations.</small><input id="budget-${item.id}" type="number" min="0" step="any" placeholder="Unknown" value="${state.budget[item.id] ?? ''}">`;
        field.querySelector('input').oninput = (e) => { state.budget[item.id] = e.target.value; $('next').disabled = !!body.querySelector('input:invalid'); };
        body.append(field);
      }
      why(`Costs cannot be inferred from distance, material names or crew size. Launch, landing, habitat, return and operations have different scopes. <a href="${SOURCE_LINKS.budget}" target="_blank" rel="noopener">NASA OIG IG-22-003 (2021)</a> provides an Artemis comparison, not a Mars price list.`);
    },
  },
];

let renderVersion = 0;
async function render() {
  const version = ++renderVersion;
  $('next').disabled = true;
  const step = STEPS[state.step];
  $('progress').innerHTML = STEPS.map((_, i) => `<li class="${i <= state.step ? 'done' : ''}" aria-current="${i === state.step ? 'step' : 'false'}"></li>`).join('');
  $('q-title').textContent = step.title;
  $('q-lead').textContent = step.lead;
  const body = $('q-body'); body.replaceChildren();
  try { await step.render(body); } catch (e) { $('q-lead').textContent = `Could not load this step. Go back and retry. ${e.message}`; return; }
  if (version !== renderVersion) return;
  $('back').style.visibility = state.step === 0 ? 'hidden' : 'visible';
  $('next').textContent = state.step === STEPS.length - 1 ? 'Plan the walk' : 'Next';
  $('next').disabled = !step.ready();
}

$('back').onclick = () => { state.step--; render(); };
$('next').onclick = () => { if (state.step < STEPS.length - 1) { state.step++; render(); } else showResult().catch(showError); };
function showError(error) { $('panel').textContent = `The plan could not be loaded. Reload the page to retry. ${error.message}`; }

// ---------- result ----------
let map, routeLayer;

async function showResult() {
  $('quiz').hidden = true; $('result').hidden = false;
  $('panel').textContent = 'Analyzing the mission…';
  const s = site();
  const route = s.routes.find((r) => r.objective === state.objective) ?? s.routes[0];
  if (typeof L !== 'undefined') {
    if (!map) initMap();
    await drawSite(s);
    map.invalidateSize();
  } else {
    $('map').textContent = 'Map library unavailable. Reload when the CDN is reachable. The report is available below.';
  }
  await drawPlan(s, route);
  window.scrollTo(0, 0);
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
    try {
      const t = L.geoJSON(await getJSON(s.traverse), { style: { color: '#9cc9e6', weight: 2, opacity: .7, dashArray: '4 4' }, interactive: false });
      t.addTo(map); map._ctl.addOverlay(t, `Real ${s.mission.split(' ')[0]} traverse`); siteLayers.push(t);
    } catch { $('tile-notice').hidden = false; $('tile-notice').textContent = 'Rover traverse could not load. Planned route and report remain available.'; }
  }
}

async function drawPlan(s, route) {
  const list = await weatherOf(s);
  const w = list.find((x) => x.sol === state.sol) ?? null;
  const inputs = { crew: state.crew, rover: state.rover, loadKg: loadKg(), start: state.start };
  const p = assessMission(s, route, inputs, w, state.essentials);

  // map
  if (map) {
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
  for (const hazard of terrainCautions(s, route, p)) {
    const color = hazard.blocked ? '#ef6f5a' : '#d9a35f';
    L.polyline([[hazard.from.lat, hazard.from.lon], [hazard.to.lat, hazard.to.lon]], { color, weight: 7, dashArray: '5 5' })
      .bindPopup(`<b>${hazard.blocked ? 'Slope exceeds scenario limit' : 'Slope caution'}</b><br>${fmt(hazard.slope, 1)}° between sampled waypoints ${tag('D')}<br>May miss smaller, steeper obstacles. Thresholds are simulated. ${tag('S')}`).addTo(routeLayer);
    L.circleMarker([hazard.to.lat, hazard.to.lon], { radius: 7, color, fillOpacity: .8 })
      .bindTooltip(`Slope caution: ${fmt(hazard.slope, 1)}° [D]`).addTo(routeLayer);
  }
  routeLayer.addTo(map);
  map._ctl.addOverlay(routeLayer, 'Planned route');
  map.fitBounds(L.latLngBounds(pts).pad(0.25));
  }

  // panel
  const q = new URLSearchParams({ site: s.id, route: route.id, crew: state.crew, rover: state.rover ? 1 : 0, load: inputs.loadKg, start: state.start });
  if (state.sol != null) q.set('sol', state.sol);
  const nogo = p.alerts.filter((a) => a.level === 'proibido').length, warn = p.alerts.length - nogo;
  const rad = s.id === 'gale' ? 'average measured here by Curiosity' : 'reference value measured by Curiosity in Gale crater';
  $('panel').innerHTML = `
    <h2>${route.name}</h2>
    <p class="sub">${s.name} · Proposed human EVA ${tag('H')} · Waypoints ${tag(route.tag)}</p>
    ${s.routes.length > 1 ? `<label class="route-pick">Change route<select id="route">${s.routes.map((r) => `<option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>` : ''}
    <div class="verdict ${p.go ? 'go' : 'nogo'}" role="status"><b>${p.go ? 'MODEL GO' : 'NO-GO'} ${tag('S')}</b>
      <span>${p.go ? `Passes scenario checks${warn ? `, with ${warn} ${warn > 1 ? 'warnings' : 'warning'}` : ''}. Not a safety clearance.` : `${nogo} ${nogo > 1 ? 'reasons block' : 'reason blocks'} this scenario.`}</span></div>
    <ul class="alerts">${p.alerts.map((a) => `<li class="${a.level}">${a.msg}</li>`).join('')}</ul>
    <dl class="stats">
      <dt class="grp">Route</dt>
      <dt>Distance, round trip</dt><dd>${fmt(p.stats.distance_m / 1000, 2)} km ${tag('D')}</dd>
      <dt>Total climb</dt><dd>${fmt(p.stats.ascent_m)} m ${tag('D')}</dd>
      <dt>Steepest slope</dt><dd>${fmt(p.stats.max_slope_deg, 1)}° ${tag('D')}</dd>
      <dt>Science stops</dt><dd>${route.waypoints.filter((x) => x.target).length} ${tag('H')}</dd>
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
      <dt>Reference dose × modeled duration</dt><dd>${fmt(p.dose_mSv, 3)} mSv ${tag('S')}</dd>
      <dt>Share of career limit (${CAREER_LIMIT_MSV} mSv) ${tag('R')}</dt><dd>${fmt(p.career_pct, 3)}% ${tag('S')}</dd>
    </dl>
    <p class="note">Radiation: ${rad} (${RAD_MSV_PER_DAY} mSv per Earth day ${tag('R')}; Hassler et al., Science, 2014). The modeled dose excludes solar events and is not a local forecast. A small share of a career limit does not establish safety.</p>
    <p><a href="#mission-report">Read survival, route and cost analysis</a></p>
    <div class="actions">
      ${s.hasSim ? `<a class="btn ghost" href="sim.html?${q}">Preview 3D page (under construction)</a>`
        : `<a class="btn" aria-disabled="true" tabindex="-1">Walk it in the 3D visor</a><p class="note">The 3D simulation is only available for Jezero in this prototype.</p>`}
      <button type="button" class="btn ghost" id="redo">Plan again</button>
    </div>`;
  renderReport(s, route, p, inputs, w);
  $('route')?.addEventListener('change', (e) => drawPlan(s, s.routes.find((r) => r.id === e.target.value)).catch(showError));
  $('redo').onclick = () => { $('result').hidden = true; $('quiz').hidden = false; state.step = 0; render(); window.scrollTo(0, 0); };
}

function chart(rows, label, unit, origin) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  return `<figure class="cost-chart"><figcaption>${label}</figcaption>${rows.map((row) => `<div class="chart-row"><span>${row.name}</span><strong>${fmt(row.value, 1)} ${unit} ${tag(origin)}</strong><div class="bar-track"><div class="bar-fill" style="width:${max ? row.value / max * 100 : 0}%"></div></div></div>`).join('')}</figure>`;
}

function renderReport(s, route, p, inputs, weather) {
  const ranked = compareRoutes(s, inputs, weather, state.essentials);
  const preferred = ranked.find((entry) => entry.plan.go);
  const window = daylightWindow(weather, p.total_h);
  const shelter = SHELTERS.find((entry) => entry.id === state.shelter);
  const budget = budgetSummary(state.budget);
  const historicalTotal = HISTORICAL_LAUNCH_COST.reduce((sum, row) => sum + row.millionUSD, 0);
  const timeAdvice = !window ? 'No measured local sunrise or sunset is available. A departure window cannot be established.'
    : !window.feasible ? 'This walk does not fit within the recorded daylight and return margin. Shorten it or change the scenario.'
      : `Daylight-compatible departures: ${clockTime(window.earliest)}–${clockTime(window.latest)} Mars local time [S], using recorded sunrise ${weather.sunrise} and sunset ${weather.sunset} [R]. This is a daylight constraint, not an optimal temperature or radiation forecast.`;
  const recommendation = preferred ? `${preferred.route.name} is the preferred candidate under these assumptions [S]. We first exclude blocked plans, then compare sampled maximum slope, duration and reserve. This ranking does not claim that all hazards have been mapped.`
    : 'No route meets the current scenario checks. Resolve the blockers before comparing candidate walks. The least-blocked route is not a safe-route recommendation.';

  $('mission-report').innerHTML = `
    <div class="report-heading"><div><h2>Mission survival report</h2><p>${s.name} · ${route.name}</p></div><button class="btn ghost" id="download-report">Download summary</button></div>
    <p class="report-intro">${p.go ? 'This scenario passes the modeled checks, with unresolved real-world hazards.' : 'This scenario is blocked. Review the identified risks before proceeding.'} No survival probability is calculated. Historical weather, sparse route elevations and a reference radiation rate cannot certify an astronaut mission.</p>
    <div class="report-grid">
      <section><h3>Readiness and resources</h3>
        <p>${state.essentials.size} of ${ESSENTIALS.length} essential systems confirmed for this concept ${tag('H')}. ${state.crew} crew ${tag('H')}; ${inputs.loadKg} kg extra load per astronaut ${tag('S')}. ${inputs.rover ? 'Support rover selected; human-rated capability and rescue range are unverified.' : 'On foot: remain able to return with the weakest crew member.'}</p>
        <ul>${p.missing.map((item) => `<li class="risk-text">Confirm ${item.name.toLowerCase()}.</li>`).join('') || '<li>Checklist complete. Equipment availability is self-reported, not verified.</li>'}${!state.equipment.has('medico') ? '<li>Medical kit omitted: add it to your equipment and emergency plan.</li>' : ''}</ul>
        <h3>Base structure and protection ${tag('H')}</h3><p><b>${shelter.name}.</b> ${shelter.protection} ${shelter.tradeoff}</p>
        <p>Construction mass and cost are unknown. This selection does not certify a shelter, change suit endurance or reduce outdoor radiation exposure.</p>
      </section>
      <section><h3>Departure and return</h3><p>${timeAdvice}</p>
        <p>Selected departure ${state.start}, modeled return ${p.end_time} ${tag('S')}; duration ${hhmm(p.total_h)} ${tag('S')}. Return reserve ${fmt(p.reserve_pct)}% ${tag('S')} against the scenario minimum ${RESERVE_PCT}% ${tag('S')}.</p>
        ${weather ? `<p>Weather snapshot: sol ${weather.sol}, ${weather.terrestrial_date} ${tag('R')}. This historical sample may come from a different date than the route waypoints.</p>` : ''}
        <h3>Risks still unresolved</h3><ul><li>Solar particle events and local radiation variability: no live alerts or spatial dose map.</li><li>Rocks, sand, dust, traction and small slopes between waypoints: not fully resolved.</li><li>Wind, visibility, communication coverage, human health and rescue timing: not modeled.</li><li>Hypothetical base location and proposed human route: no installed infrastructure.</li></ul>
      </section>
    </div>
    <section class="route-analysis"><h3>Which route is the better candidate?</h3><p>${recommendation}</p>
      <p>Follow the sampled rover corridor where available, check terrain at ground level and plan an abort to base. Do not draw shortcuts across crater walls or assume an existing rover trail is certified for a crew.</p>
      <div class="table-scroll"><table><caption>Same site, crew, load and departure. Waypoint slopes [D]; duration and reserve [S].</caption><thead><tr><th scope="col">Candidate</th><th scope="col">Max slope [D]</th><th scope="col">Duration [S]</th><th scope="col">Reserve [S]</th><th scope="col">Assessment [S]</th></tr></thead><tbody>${ranked.map((entry) => `<tr ${entry.route.id === route.id ? 'class="current-route"' : ''}><th scope="row">${entry.route.name}${entry.route.id === route.id ? ' (selected)' : ''}</th><td>${fmt(entry.plan.stats.max_slope_deg, 1)}°</td><td>${hhmm(entry.plan.total_h)}</td><td>${fmt(entry.plan.reserve_pct)}%</td><td>${entry.plan.go ? 'Passes model checks' : 'Blocked'}</td></tr>`).join('')}</tbody></table></div>
      ${s.routes.length === 1 ? '<p>Only one route is supplied at this site; there is no alternative here to establish which is safest.</p>' : ''}
      <h3>What the map can tell you</h3><p>Slope markers show elevation changes between sampled points ${tag('D')}, using project thresholds ${tag('S')}. They are not crater-wide hazard polygons. Map imagery and geology do not measure radiation. No green “radiation-safe” zones are asserted.</p>
      <p><a href="https://trek.nasa.gov/mars/" target="_blank" rel="noopener">Mars Trek: imagery and terrain</a> · <a href="https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars" target="_blank" rel="noopener">USGS: geology</a> · <a href="https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/" target="_blank" rel="noopener">Curiosity route illustration</a> · <a href="https://mars.nasa.gov/mars2020/multimedia/raw-images/" target="_blank" rel="noopener">Perseverance ground images</a>.</p>
      <p class="note">NASA Worldview shows Earth. It is useful as a visualization reference, not a source of Mars terrain or radiation measurements. Recommendations here are deterministic rules developed with AI assistance, not predictions from a live AI.</p>
    </section>
    <section class="cost-analysis"><h3>Mission cost analysis</h3>
      <div class="report-grid"><div><h4>Your Mars mission scenario ${tag('H')}</h4>
        <p class="cost-total">${budget.total === null ? 'Total not established' : `${fmt(budget.total, 1)} million USD`}</p>
        <p>${budget.complete ? 'Sum of your assumptions, including the contingency you entered. Not a NASA estimate or a quoted price.' : 'Unpriced categories remain unknown, not zero. Complete all categories in the questionnaire to calculate a scenario total.'}</p>
        ${chart(budget.entries.filter((entry) => entry.value !== null), 'Entered assumptions; millions of USD [H]', 'M USD', 'H')}
        <ul>${budget.entries.filter((entry) => entry.value === null).map((entry) => `<li>${entry.name}: unknown.</li>`).join('')}</ul>
        <p>No supported price per kilometer, material multiplier or per-astronaut cost is available for this Marswalk. Your route changes resource use, not a fabricated NASA price.</p>
      </div><div><h4>Historical NASA comparison ${tag('R')}</h4>
        ${chart(HISTORICAL_LAUNCH_COST.map((entry) => ({ name: entry.name, value: entry.millionUSD })), 'SLS / Orion estimate published in 2021; millions of USD [R]', 'M USD', 'R')}
        <p>Component sum: <b>${fmt(historicalTotal, 0)} million USD ${tag('D')}</b>. The OIG rounded the launch-system estimate to about $4.1 billion ${tag('R')}.</p>
        <p>Scope: production and launch operations at an approximately annual cadence. Excludes prior development, lunar landing, a Mars habitat and the selected surface walk. These are historical published estimates, not actual spending for this mission or current prices.</p>
        <p><a href="${SOURCE_LINKS.budget}" target="_blank" rel="noopener">NASA OIG IG-22-003, November 15, 2021, pp. 22–23</a>.</p>
      </div></div>
    </section>`;
  $('download-report').onclick = () => {
    const report = `${$('mission-report').innerText}\n\nIdentified scenario alerts:\n${p.alerts.map((alert) => `- ${alert.msg}`).join('\n')}\n\nNASA sources and methods: ${new URL('SOURCES.md', location.href)}\n`;
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `mars-${s.id}-${route.id}-report.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
}

getJSON('data/sites.json')
  .then((d) => { sites = d; render(); })
  .catch((e) => { $('q-title').textContent = 'Could not load the site data.'; $('q-lead').textContent = `Open the site through a web server (npm run dev). Details: ${e.message}`; });
