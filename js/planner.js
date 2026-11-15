import { priceFor, selectedPrices } from './prices.js';
import { PRICE_GROUPS } from './config.js';
import { moneyMillions } from './money.js';
import { preparedSites } from './routes.js';
import { objectivesForSite, scienceFor, POSITION_NOTE } from './science.js';
﻿// Planner: mission readiness, science, resources, shelter, daylight and cost context.
import { RESERVE_PCT, DAYLIGHT_MARGIN_MIN, EQUIPMENT, ESSENTIALS, SHELTERS, BUDGET_CATEGORIES, HISTORICAL_LAUNCH_COST, HISTORICAL_LAUNCH_ROUNDED_MILLION, SOURCE_LINKS, RAD_MSV_PER_DAY, CAREER_LIMIT_MSV, LOAD_FACTOR_PER_KG, PREPARATION_EXTRAS, OPTIONAL_PREPARATION, RADIATION_EVIDENCE_URL } from './config.js';
import { assessMission, compareRoutes, daylightWindow, clockTime, terrainCautions, preparationLevel } from './mission.js';
import { terrainHazards } from './hazards.js';
import { parseTerrain } from './sim/terrain.js';
import { evaTimeline, recommendMobility, planEva } from './calc.js';
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
  { id: 'agua-meridiani', name: 'Ancient water at Meridiani', text: 'Explore the water-altered rocks discovered by Opportunity.', why: 'Opportunity found evidence that liquid water once affected rocks at Meridiani Planum.', src: 'NASA Opportunity mission' },
];
const state = { step: 0, objective: null, siteId: null, crew: 4, rover: false, equipment: new Set(['amostrador', 'camera', 'medico']), essentials: new Set(), extras: new Set(), optional: new Set(), shelter: 'polymer', propulsion: 'chemical', roles: new Set(), touched: false, sol: null, start: '09:00' };
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

function option({ title, text, hint, details, pressed, onClick }) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'opt';
  b.setAttribute('aria-pressed', String(!!pressed));
  b.innerHTML = `<b>${title}</b><small>${text}</small>${hint ? `<span class="hint">${hint}</span>` : ''}${pressed && details ? `<span class="choice-detail">${details}</span>` : ''}`;
  b.onclick = onClick;
  if (!details) return b;
  const wrap = document.createElement('div'); wrap.className = 'option-wrap';
  const more = document.createElement('details'); more.className = 'item-more';
  more.innerHTML = `<summary>+ Learn more</summary><p>${details}</p><p>See the source listed below this step for the applicable data and limitations.</p>`;
  wrap.append(b, more); return wrap;
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
      body.classList.add('preparation-layout');
      for (const item of ESSENTIALS) {
        const label = document.createElement('label'); label.className = `readiness ${state.essentials.has(item.id) ? 'selected' : ''}`;
        label.innerHTML = `<input type="checkbox" ${state.essentials.has(item.id) ? 'checked' : ''}><span><b>${item.name}</b><small>${item.why}</small><span class="choice-price">${priceLabel(item.id)}</span></span>`;
        label.querySelector('input').onchange = (e) => { e.target.checked ? state.essentials.add(item.id) : state.essentials.delete(item.id); updatePreparationCost(); e.target.closest('label').classList.toggle('selected', e.target.checked); updateRisk(); };
        const more = document.createElement('details'); more.className = 'item-more';
        more.innerHTML = `<summary aria-label="More about ${item.name}">+ Learn more</summary><p>${item.why}</p><a href="${SOURCE_LINKS.suit}" target="_blank" rel="noopener">NASA: spacesuit systems</a><p>${priceDetail(item.id)}</p>`;
        const wrap = document.createElement('div'); wrap.className = 'item-wrap'; wrap.append(label, more); body.append(wrap);
      }
      const count = document.createElement('p'); count.id = 'readiness-count'; count.className = 'wide'; count.innerHTML = preparationCostHTML();
      for (const group of [...new Set(PREPARATION_EXTRAS.map((item) => item.group))]) {
        const section = document.createElement('section'); section.className = 'preparation-category wide';
        section.innerHTML = `<h2>${group}</h2><p>Additional recommendations [H]. These procedures strengthen preparation; they do not extend modeled suit endurance.</p>`;
        for (const item of PREPARATION_EXTRAS.filter((entry) => entry.group === group)) {
          const row = document.createElement('div'); row.className = 'extra-row';
          row.innerHTML = `<label><input type="checkbox" ${state.extras.has(item.id) ? 'checked' : ''}><span><b>${item.name}</b><small>${item.why}</small></span><strong class="money">${priceLabel(item.id)}</strong></label><details class="item-more"><summary>+ Learn more</summary><p>${item.why}</p><p>${priceDetail(item.id)}</p><a href="${item.source}" target="_blank" rel="noopener">NASA reference</a></details>`;
          row.querySelector('input').onchange = (e) => { e.target.checked ? state.extras.add(item.id) : state.extras.delete(item.id); updatePreparationCost(); updateRisk(); }; section.append(row);
        }
        body.append(section);
      }
      const optional = document.createElement('section'); optional.className = 'preparation-category wide';
      optional.innerHTML = '<h2>Mission assurance and science operations</h2><p>Optional operational provisions support crew readiness and scientific traceability. Each is funded once per mission [H]. They do not replace essential life support or change modeled resource capacity.</p>';
      for (const item of OPTIONAL_PREPARATION) {
        const row = document.createElement('div'); row.className = 'extra-row';
        row.innerHTML = `<label><input type="checkbox" ${state.optional.has(item.id) ? 'checked' : ''}><span><b>${item.name}</b><small>${item.why}</small></span><strong class="money">${priceLabel(item.id)}</strong></label>`;
        row.querySelector('input').onchange = (e) => { e.target.checked ? state.optional.add(item.id) : state.optional.delete(item.id); updatePreparationCost(); }; optional.append(row);
      }
      body.append(optional, count);
      why(`Based on <a href="${SOURCE_LINKS.suit}" target="_blank" rel="noopener">NASA spacesuit systems</a>. Confirmations describe your scenario; the app cannot verify hardware, health, rescue capability or live space weather.`);
    },
  },
  {
    title: 'What do you want to discover?', lead: 'Choose a science goal supported by the selected destination and its prepared routes.',
    ready: () => state.objective,
    render(body) {
      for (const o of objectivesForSite(site(), OBJECTIVES)) body.append(option({ title: o.name, text: o.text, details: o.why, pressed: state.objective === o.id,
        onClick: () => { state.objective = o.id;  render(); } }));
      const o = OBJECTIVES.find((x) => x.id === state.objective);
      why(o?.why, o?.src);
    },
  },
  {
    title: 'Where will we walk?', lead: 'Choose Jezero or Gale for a terrain-based 3D EVA following recorded rover stops.',
    ready: () => state.siteId,
    render(body) {
      const notes = {
        jezero: ['Route along real Perseverance stops. 3D simulation available.', 'The terrain is known down to 1 meter by the HiRISE camera in orbit.'],
        gale: ['Route along real Curiosity stops. 3D exploration of boxwork ridges and hollows is available.', 'Curiosity has measured radiation since 2012; it is the best reference we have for astronauts.'],
        meridiani: ['Opportunity explored Eagle Crater and Meridiani. Local route data is incomplete.', 'Opportunity discovered evidence of ancient water. Our nearby route is hypothetical; fine-scale terrain and local weather are unavailable.'],
      };
      for (const s of sites) body.append(option({ title: s.name, text: `${s.mission}. ${notes[s.id]?.[0] ?? ''}`,
        hint: s.objectives?.includes(state.objective) ? 'Matches your goal' : '', details: notes[s.id]?.[1], pressed: state.siteId === s.id,
        onClick: () => { state.touched = true; state.siteId = s.id; if (!s.objectives.includes(state.objective)) state.objective = null; state.sol = null; render(); } }));
      // Real rover view of each destination on its card (layout only).
      const DEST_PHOTO = { jezero: ['data/photos/cheyava.jpg', 'Cheyava Falls workspace, Perseverance Mastcam-Z. NASA/JPL-Caltech/ASU/MSSS'], gale: ['data/photos/crista.jpg', 'Boxwork ridges, Curiosity Mastcam. NASA/JPL-Caltech/MSSS'] };
      body.querySelectorAll('.opt').forEach((card, i) => { const ph = DEST_PHOTO[sites[i]?.id]; if (!ph) return; card.classList.add('has-photo'); card.insertAdjacentHTML('afterbegin', `<span class="opt-photo" role="img" aria-label="${ph[1]}" title="${ph[1]}" style="background-image:url('${ph[0]}')"></span>`); });
      const unavailable = document.createElement('details'); unavailable.className = 'wide item-more';
      unavailable.innerHTML = '<summary>Why is Meridiani not offered?</summary><p>Opportunity documented ancient water at Meridiani [R]. Mars24 can calculate solar times, even without a weather station. This project lacks a verified local route and fine terrain grid, so Meridiani is excluded from EVA planning; this does not establish that travel there is physically impossible.</p><a href="https://www.giss.nasa.gov/tools/mars24/help/guide.html" target="_blank" rel="noopener">NASA Mars24: daylight calculations and limitations</a>';
      body.append(unavailable); why(notes[state.siteId]?.[1]);
    },
  },
  {
    title: 'Who goes, and how?', lead: 'Set the surface crew, mobility and cross-trained capabilities.',
    ready: () => true,
    render(body) {
      const field = document.createElement('div'); field.className = 'field';
      field.innerHTML = `<label for="crew-count">Mission crew size [H]</label><input id="crew-count" type="number" min="1" max="50" value="${state.crew}"><small>NASA's 2025 Mars architecture targets at least four surface crew, with six considered for added capability. <a href="https://www.nasa.gov/wp-content/uploads/2025/12/2025-architecture-update-for-publication.pdf">NASA architecture update</a></small><p id="crew-cost">Budget for ${state.crew} crew: ${moneyMillions(selectedPrices(state).total)} [H]</p>`;
      field.querySelector('input').onchange = (e) => { state.crew = Math.max(1, Math.min(50, Number(e.target.value) || 1)); e.target.value = state.crew; $('crew-cost').textContent = `Budget for ${state.crew} crew: ${moneyMillions(selectedPrices(state).total)} [H]`; updateRisk(); };
      const sr = site()?.routes.find((r) => r.objective === state.objective) ?? site()?.routes[0];
      let roverHint = '';
      if (sr) {
        const base = { crew: state.crew, loadKg: loadKg(), start: state.start };
        const foot = planEva(site(), sr, { ...base, rover: false }, null), car = planEva(site(), sr, { ...base, rover: true }, null);
        const dmin = Math.round((car.total_h - foot.total_h) * 60);
        roverHint = `${recommendMobility(foot.stats) === 'rover' ? 'Recommended for this route' : 'Not needed for this route'} [S]: ${fmt(foot.stats.distance_m / 1000, 1)} km, steepest ${fmt(foot.stats.max_slope_deg)}°; rover changes duration by ${dmin > 0 ? '+' : '−'}${Math.abs(dmin)} min.`;
      }
      body.append(field, option({ title: 'Support rover', text: `${moneyMillions(priceFor('rover').million)} [H] / mission. Hypothetical crewed surface vehicle; mobility uses a simulated model.`, hint: roverHint, details: priceDetail('rover'), pressed: state.rover, onClick: () => { state.rover = !state.rover; render(); } }));
      const transport = document.createElement('section'); transport.className = 'transport-section wide';
      transport.innerHTML = '<h2>Transportation</h2><p>Interplanetary propulsion is separate from walking or riding on the surface. Chemical rockets are established technology; nuclear thermal systems remain a research concept. Neither choice represents an available human Mars transport. Select a transport budget scenario [H]. Chemical uses a historical launch-system budget scale; nuclear thermal adds an assumed 50% development provision. These are not equivalent-scope engineering estimates, and travel time is not predicted.</p><a href="https://www.nasa.gov/space-technology-mission-directorate/tdm/space-nuclear-propulsion/">NASA propulsion research</a>';
      const choices = document.createElement('div'); choices.className = 'q-body';
      for (const [id, name, text] of [['chemical', 'Chemical propulsion', 'Established technology; Mars crew architecture still conceptual.'], ['nuclear', 'Nuclear thermal propulsion', 'Research concept; not an operational human Mars vehicle.']]) choices.append(option({ title: name, text: `${text} ${priceLabel(id)}`, details: priceDetail(id), pressed: state.propulsion === id, onClick: () => { state.propulsion = id; render(); } }));
      transport.append(choices); body.append(transport);
      const roles = document.createElement('div'); roles.className = 'field wide';
      roles.innerHTML = '<h3>Crew capabilities</h3><p>Project recommendations [H], not mandatory NASA job titles. Cross-trained crew can cover more than one capability.</p>';
      for (const [id, title] of [['medical','Medical and health'], ['engineering','Engineering and maintenance'], ['science','Science and field geology']]) {
        const label = document.createElement('label'); label.innerHTML = `<input type="checkbox" ${state.roles.has(id) ? 'checked' : ''}>${title}`;
        label.querySelector('input').onchange = (e) => { e.target.checked ? state.roles.add(id) : state.roles.delete(id); updateRisk(); }; roles.append(label);
      }
      body.append(roles);
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
        l.innerHTML = `<input type="checkbox" ${state.equipment.has(e.id) ? 'checked' : ''}> ${e.name} <small>(${e.kg} kg) ${tag('S')} - ${priceLabel(e.id)}</small>`;
        l.querySelector('input').onchange = (ev) => { ev.target.checked ? state.equipment.add(e.id) : state.equipment.delete(e.id); $('load-total').textContent = `${loadKg()} kg`; updateRisk(); };
        const more = document.createElement('details'); more.className = 'item-more';
        more.innerHTML = `<summary aria-label="More about ${e.name}">+ Learn more</summary><p>${e.name}: ${e.id === 'medico' ? 'Supports the emergency-response plan; it does not replace medical training.' : 'Use to document or investigate rock samples. NASA rover instruments combine imaging, spectroscopy and sampling; this handheld concept is not an actual rover instrument.'}</p><p>Mass is a project assumption [S]. ${priceDetail(e.id)}</p><a href="https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/">NASA instrument reference</a>`;
        f.append(l, more);
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
      for (const shelter of SHELTERS) body.append(option({ title: `${shelter.name} ${tag('H')}`, text: `${shelter.material} - ${moneyMillions(priceFor(shelter.id).million)} [H] / mission`, hint: `${shelter.id === 'polymer' ? 'Suggested concept [H]: hydrogen-rich shielding is under NASA study. ' : ''}${shelter.protection}`, details: `<strong>Benefit</strong> ${shelter.protection}<br><strong>Trade-off</strong> ${shelter.tradeoff}<br>${priceDetail(shelter.id)}`, pressed: state.shelter === shelter.id, onClick: () => { state.shelter = shelter.id; render(); } }));
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

];


// Destination precedes readiness and science; preserve the selected site when changing objectives.
const [readinessStep, objectiveStep, destinationStep] = STEPS.splice(0, 3);
STEPS.unshift(destinationStep, readinessStep, objectiveStep);
STEPS.push({
  title: 'Review your mission and cost evidence.',
  lead: 'Review the scenario and its limitations before opening the map.',
  ready: () => true,
  render(body) {
    const box = document.createElement('div'); box.className = 'estimate-preview wide';
    box.innerHTML = priceSummaryHTML()+historicalCostHTML()+priceFinalHTML();
    body.append(box); why('Review your choices before opening the route map. The full breakdown and sources remain in the report.');
  },
});

// ---------- navigation and live summary (layout only; planning logic unchanged) ----------
const STEP_NAMES = [['Where will we walk', 'Destination'], ['Prepare to stay alive', 'Life support'], ['What do you want to discover', 'Science goal'], ['Who goes', 'Crew and mobility'], ['Equip the science walk', 'Equipment'], ['What protects your base', 'Base shelter'], ['Choose a daylight window', 'Daylight'], ['Review your mission', 'Review and cost']];
const stepName = (step) => STEP_NAMES.find(([prefix]) => step.title.startsWith(prefix))?.[1] ?? step.title;
function setMode(result) {
  document.body.classList.toggle('is-result', result);
  $('steps').closest('nav').hidden = result;
  $('result-nav').hidden = !result;
}
function renderNav() {
  $('steps').innerHTML = STEPS.map((step, i) => `<li><button type="button" data-i="${i}" class="${i === state.step ? 'current' : i <= state.maxStep ? 'done' : ''}" ${i > state.maxStep ? 'disabled' : ''} ${i === state.step ? 'aria-current="step"' : ''}><span class="num" aria-hidden="true">${i < state.maxStep && i !== state.step ? '✓' : i + 1}</span><span>${stepName(step)}</span></button></li>`).join('');
  $('steps').querySelectorAll('button:not(:disabled)').forEach((b) => { b.onclick = () => { if (Number(b.dataset.i) !== state.step) { state.step = Number(b.dataset.i); render(); window.scrollTo(0, 0); } }; });
}
async function renderSummary() {
  const el = $('summary'); if (!el) return;
  const s = site(), objective = OBJECTIVES.find((o) => o.id === state.objective);
  const shelter = SHELTERS.find((x) => x.id === state.shelter);
  const done = state.essentials.size, total = ESSENTIALS.length;
  const level = done < total ? 'red' : 'green';
  let check = '<p class="sum-hint">Choose a destination and a science goal to preview the walk.</p>';
  if (s && objective && s.id !== 'meridiani') {
    const route = s.routes.find((r) => r.objective === state.objective) ?? s.routes[0];
    const list = await weatherOf(s);
    const provisional = state.sol == null && list.length > 0; // same default the Daylight step proposes
    const w = list.find((x) => x.sol === state.sol) ?? (provisional ? list.at(-1) : null);
    const p = assessMission(s, route, { crew: state.crew, rover: state.rover, loadKg: loadKg(), start: state.start }, w, state.essentials);
    const blockers = p.alerts.filter((a) => a.level === 'proibido');
    check = `<div class="sum-status ${p.go ? 'ok' : 'blocked'}"><b>${p.go ? 'Passes model checks' : `${blockers.length} ${blockers.length > 1 ? 'blockers' : 'blocker'} so far`} [S]</b>
      <small>${p.go ? '3D walk will unlock at the end. Not a safety clearance.' : blockers.some((a) => a.code.startsWith('missing-')) ? `Confirm the ${p.missing.length} remaining essential ${p.missing.length > 1 ? 'systems' : 'system'} to unlock the 3D walk.` : blockers[0].msg}</small></div>
      <div class="sum-big"><span>${hhmm(p.total_h)}</span><small>${route.name} · ${fmt(p.stats.distance_m / 1000, 1)} km [D] · back ${p.end_time} [S]${provisional ? ` · using sol ${w.sol} until you pick a day` : ''}</small></div>
      <div class="sum-meter"><span>Suit reserve on return [S]</span><b>${fmt(p.reserve_pct)}%</b><i><em style="width:${Math.min(100, p.reserve_pct)}%"></em></i></div>`;
  }
  el.innerHTML = `<h2>Your mission</h2><p class="sum-sub">Updates with every choice</p>${check}
    <dl class="sum-rows">
      <div><dt>Destination</dt><dd>${s ? s.name : '—'}</dd></div>
      <div><dt>Science goal</dt><dd>${objective ? objective.name : '—'}</dd></div>
      <div><dt>Life support</dt><dd><span class="dot ${level}"></span>${done} / ${total} confirmed</dd></div>
      <div><dt>Crew</dt><dd>${state.crew} · ${state.rover ? 'with rover' : 'on foot'}</dd></div>
      <div><dt>Extra load</dt><dd>${loadKg()} kg / astronaut</dd></div>
      <div><dt>Base shelter</dt><dd>${shelter ? shelter.name : '—'}</dd></div>
      <div><dt>Departure</dt><dd>${state.sol != null ? `Sol ${state.sol}, ` : ''}${state.start}</dd></div>
      <div class="sum-money"><dt>Planning budget [H]</dt><dd>${moneyMillions(selectedPrices(state).total)}</dd></div>
    </dl>`;
}

let renderVersion = 0;
async function render() {
  const version = ++renderVersion;
  $('next').disabled = true;
  const step = STEPS[state.step];
  $('progress').innerHTML = STEPS.map((_, i) => `<li class="${i <= state.step ? 'done' : ''}" aria-current="${i === state.step ? 'step' : 'false'}"></li>`).join('');
  state.maxStep = Math.max(state.maxStep ?? 0, state.step);
  $('q-step').textContent = `Step ${state.step + 1} of ${STEPS.length} · ${stepName(step)}`;
  setMode(false); renderNav(); renderSummary();
  $('q-title').textContent = step.title;
  $('q-lead').textContent = step.lead;
  $('readiness-count')?.remove();
  const body = $('q-body'); body.replaceChildren(); body.classList.remove('preparation-layout');
  try { await step.render(body); } catch (e) { $('q-lead').textContent = `Could not load this step. Go back and retry. ${e.message}`; return; }
  if (version !== renderVersion) return;
  $('back').style.visibility = state.step === 0 ? 'hidden' : 'visible';
  $('next').textContent = state.step === STEPS.length - 1 ? 'Plan the walk' : 'Next';
  $('next').disabled = !step.ready();
  updateRisk();
}

function historicalCostHTML() {
  return `<h3>Historical NASA benchmark [R]</h3><p>SLS / Orion production and launch operations: approximately <strong>${moneyMillions(HISTORICAL_LAUNCH_ROUNDED_MILLION)}</strong> per launch, estimated by NASA OIG in 2021 for Artemis I?IV. This is a lunar-program benchmark, not a Mars mission quote.</p><dl>${HISTORICAL_LAUNCH_COST.map(item=>`<dt>${item.name}</dt><dd>${moneyMillions(item.millionUSD)} [R]</dd>`).join('')}</dl><p>Component sum: ${moneyMillions(HISTORICAL_LAUNCH_COST.reduce((sum,item)=>sum+item.millionUSD,0))} [D]; published rounded estimate: ${moneyMillions(HISTORICAL_LAUNCH_ROUNDED_MILLION)} [R]. Historical USD, not inflation-adjusted.</p><a href="${SOURCE_LINKS.budget}" target="_blank" rel="noopener">NASA OIG IG-22-003 (2021), pp. 22?23</a>`;
}
function priceLabel(id) {
  const price=priceFor(id);
  return `${moneyMillions(price.million)} [H] / ${price.personal?'astronaut':'mission'}`;
}
function priceDetail(id) {
  const price=priceFor(id),quantity=price.personal?state.crew:1;
  return `Unit planning allowance [H]: ${moneyMillions(price.million)}. Quantity: ${quantity} ${price.personal?'personal sets':'shared mission provision'}; subtotal ${moneyMillions(price.million*quantity)} [H]. Reference: <a href="${price.reference.url}" target="_blank" rel="noopener">${price.reference.name}</a>. Project allocation/multiplier: ${price.factor.toLocaleString('en-US')}x [H]. ${id==='nuclear'?'The 1.5x factor is an assumed development premium, not a demonstrated economic comparison. ':''}Reference budgets set context; they do not validate these unit prices.`;
}
function priceSummaryHTML() {
  const result=selectedPrices(state);
  const catalog=[...ESSENTIALS,...EQUIPMENT,...PREPARATION_EXTRAS,...OPTIONAL_PREPARATION,...SHELTERS,{id:'rover',name:'Support rover'},{id:'chemical',name:'Chemical transport scenario'},{id:'nuclear',name:'Nuclear thermal transport scenario'}];
  return `<div class="cost-overview"><div><h2>Mission planning budget [H]</h2><p>Personal systems scale with crew. Shared provisions count once.</p></div><strong>${moneyMillions(result.total)}</strong></div><p class="note">Illustrative allowances using published analog budget scales and project assumptions. Includes one transport scenario; excludes a complete Mars landing, return architecture and operations budget. These are not NASA quotations or validated procurement estimates.</p><div class="cost-groups">${Object.entries(PRICE_GROUPS).map(([key,name])=>{
    const rows=result.rows.filter(row=>row.group===key),sum=rows.reduce((total,row)=>total+row.subtotal,0);
    if(!rows.length)return '';
    return `<section class="cost-group"><div class="cost-group-heading"><h3>${name}</h3><strong>${moneyMillions(sum)} [H]</strong></div><div class="cost-share" aria-label="${name}: ${Math.round(sum/result.total*100)} percent of budget"><span style="width:${sum/result.total*100}%"></span></div><div class="table-scroll"><table><thead><tr><th scope="col">Provision</th><th scope="col">Unit [H]</th><th scope="col">Quantity</th><th scope="col">Subtotal [H]</th></tr></thead><tbody>${rows.map(row=>`<tr><th scope="row"><details><summary>${catalog.find(item=>item.id===row.id)?.name ?? row.id}</summary><p>${priceDetail(row.id)}</p></details></th><td>${moneyMillions(row.million)}</td><td>${row.quantity}${row.personal?' crew':' mission'}</td><td>${moneyMillions(row.subtotal)}</td></tr>`).join('')}</tbody></table></div></section>`;
  }).join('')}</div>`;
}
function priceFinalHTML() {
  const total=selectedPrices(state).total;
  return `<section class="final-cost" aria-label="Total mission planning budget"><div><span>Total planning budget [H]</span><strong>${moneyMillions(total)}</strong></div><div><span>Average per crew member [H]</span><strong>${moneyMillions(total/state.crew)}</strong></div><p>Shared and personal allowances divided by ${state.crew} crew. Scenario estimate; not a NASA quote or a complete Mars mission cost.</p></section>`;
}
function preparationCostHTML() {
  const result=selectedPrices({...state,equipment:[],shelter:null,rover:false,propulsion:null});
  return `<span>${state.essentials.size} / ${ESSENTIALS.length} essential systems confirmed [H]</span><span>Preparation allowance for ${state.crew} crew [H]</span><strong class="money">${moneyMillions(result.total)} [H]</strong><small>Personal suit systems and backup oxygen count per astronaut. Rescue, maintenance procedures and mission-assurance provisions count once. Review quantities and references in the budget.</small>`;
}
function updatePreparationCost() { $('readiness-count').innerHTML = preparationCostHTML(); }
function updateRisk() {
  renderSummary();
  let risk = $('risk-advice');
  if (!risk) { risk = document.createElement('aside'); risk.id = 'risk-advice'; $('q-why').after(risk); }
  risk.hidden = !state.touched;
  if (risk.hidden) return;
  let status = preparationLevel(state.essentials, state.equipment, state.crew, state.roles, state.shelter);
  if (state.step === 1) { const remaining = PREPARATION_EXTRAS.filter((item) => !state.extras.has(item.id)); status = { missing: status.missing, improvements: remaining.map((item) => 'Recommended: ' + item.name), level: status.missing.length ? 'red' : remaining.length ? 'yellow' : 'green' }; }
  risk.className = `risk-advice status-${status.level}`;
  const label = status.level === 'red' ? 'Preparation incomplete' : status.level === 'yellow' ? 'Minimum checklist complete' : 'Recommended checklist complete';
  const siteNote = state.siteId === 'meridiani' ? 'Meridiani local fine-scale terrain and rover waypoints are not available in this prototype. Model clearance remains blocked.' : 'Radiation remains an unresolved environmental risk; colors describe preparation, not a radiation forecast.';
  const shelterNote = state.shelter === 'shell' ? 'Metal shell selected: added radiation shielding needs review.' : state.shelter === 'regolith' ? 'Regolith cover selected: construction and load-bearing verification are needed.' : 'Hydrogen-rich shielding selected: thickness and geometry still require validation.';
  risk.innerHTML = `<b>${label} [H]</b><p>${status.level === 'red' ? 'Still required: ' + status.missing.map((item) => item.name).join(', ') : status.level === 'yellow' ? 'These systems cover the minimum project checklist. This does not establish a safe Mars journey.' : 'Your scenario includes the recommended project preparations. Operational approval is still required.'}</p><ul>${status.improvements.map((text) => `<li>${text}</li>`).join('')}</ul><p>${shelterNote} ${siteNote}</p>${state.step > 1 && status.missing.length ? '<button type="button" id="review-essentials" class="btn ghost">Review essential systems</button>' : ''}`;
  if ($('readiness-count')) risk.after($('readiness-count'));
  $('review-essentials')?.addEventListener('click', () => { state.step = 1; render(); });
}

$('q-body').addEventListener('change', () => renderSummary());
$('back').onclick = () => { state.step--; render(); };
$('next').onclick = () => { if (state.step < STEPS.length - 1) { state.step++; render(); } else showResult().catch(showError); };
function showError(error) { $('panel').textContent = `The plan could not be loaded. Reload the page to retry. ${error.message}`; }

// ---------- result ----------
let map, routeLayer;

async function showResult() {
  $('quiz').hidden = true; $('result').hidden = false;
  setMode(true);
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
  if (s.hasSim) {
    try {
      const meta = await getJSON(`data/${s.id}/terrain.json`);
      const response = await fetch(`data/${s.id}/terrain.bin`);
      if (!response.ok) throw new Error('Terrain unavailable');
      const cells = terrainHazards(parseTerrain(meta, await response.arrayBuffer()));
      if (!map.getPane('hazards')) { map.createPane('hazards'); map.getPane('hazards').style.zIndex = 450; }
      const hazards = L.layerGroup(cells.map((cell) => L.rectangle(cell.bounds, {
        pane: 'hazards', color: ({red:'#ff5d63', yellow:'#ffc469', green:'#68d592', unknown:'#a5adb8'})[cell.status], weight: 1, fillOpacity: .14,
      }).bindPopup(`<b>${({red:'Steep samples: avoid', yellow:'Steep samples: caution', green:'Slope criterion passed only', unknown:'Terrain data unknown'})[cell.status]}</b><p>Maximum sampled slope: ${cell.slope === null ? 'Unknown' : fmt(cell.slope, 1) + ' degrees [D]'}. Source: USGS HiRISE terrain, resampled to approximately 4 m.</p><p>Project slope thresholds [S]. Green only means the sampled slope passed the project threshold. Unseen obstacles and radiation are not assessed; no color certifies safety.</p>`)));
      hazards.addTo(map); map._ctl.addOverlay(hazards, `${s.name} terrain cautions [D/S]`); siteLayers.push(hazards);
    } catch { $('tile-notice').hidden = false; $('tile-notice').textContent = 'Terrain caution layer unavailable. Unmarked areas must not be assumed safe.'; }
  }
  if (!s.hasSim) {
    const delta = 0.02; // Display extent only; not a surveyed boundary.
    const c = s.center; const unknown = L.rectangle([[c.lat-delta,c.lon-delta],[c.lat+delta,c.lon+delta]], { color:'#a5adb8', weight:2, dashArray:'4 4', fillOpacity:.18 }).bindPopup('<b>Terrain classification unavailable</b><p>No suitable local elevation grid has been prepared for this area. Gray does not mean safe or unsafe; radiation and obstacles are unknown.</p>');
    unknown.addTo(map); map._ctl.addOverlay(unknown, 'Terrain: no local grid'); siteLayers.push(unknown);
  }
  const scienceStops = L.layerGroup();
  const seen = new Set();
  for (const route of s.routes) for (const point of route.waypoints.filter((p) => p.target)) {
    if (seen.has(point.target.name)) continue; seen.add(point.target.name);
    const science = scienceFor(point.target);
    L.circleMarker([point.lat, point.lon], {radius: 9, color: '#bce8df', fillColor: '#21483f', fillOpacity: .8})
      .bindPopup(`<b>${point.target.name}</b><p>${science?.evidence ?? point.target.why}</p><p>${science?.look ?? ''}</p><small>${POSITION_NOTE}</small>${science ? `<p><a href="${science.source}" target="_blank" rel="noopener">NASA source</a></p>` : ''}`)
      .bindTooltip(point.target.name).addTo(scienceStops);
  }
  scienceStops.addTo(map); map._ctl.addOverlay(scienceStops, `${s.name}: science stops [R/H]`); siteLayers.push(scienceStops);
  const local = localLayer(s.localLayer);
  map._local = local?.layer;
  $('opacity-wrap').hidden = !local;
  if (local) { local.layer.on('tileerror', () => { $('tile-notice').hidden = false; }); local.layer.addTo(map); map._ctl.addOverlay(local.layer, local.name); siteLayers.push(local.layer); }
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
    const t = wp.target; const science = scienceFor(t);
    L.marker([wp.lat, wp.lon], { icon: L.divIcon({ className: 'pin', iconSize: [16, 16] }), title: t.name })
      .bindPopup(`<b>${t.name}</b> ${tag(route.tag)}<br>${science?.evidence ?? t.why}<p>${science?.look ?? ""}</p><small>${POSITION_NOTE}</small>${science ? `<p><a href="${science.source}" target="_blank" rel="noopener">NASA science reference</a></p>` : ""}${t.sol ? `<br><small>Sol ${t.sol}</small>` : ''}${t.photo ? `<br><a href="${t.photo}" target="_blank" rel="noopener" aria-label="Open full image of ${t.name} in a new tab"><img src="${t.photo}" alt="${t.name}" width="240"></a><br><small>${t.credit} ? Select image to enlarge</small>` : ''}`, { maxWidth: 260, maxHeight: 320 })
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
  const statusMarker = L.marker([s.habitat.lat, s.habitat.lon], { icon: L.divIcon({ className: 'map-status', html: `<span style="background:${p.go ? '#275d47' : '#752f35'}">${p.go ? 'Passes scenario checks [S]' : 'Do not start: blockers [S]'}</span>`, iconSize: [210, 40], iconAnchor: [105, 55] }) });
  statusMarker.bindPopup(`<b>${p.go ? 'Candidate route, subject to validation' : 'Do not start this scenario'}</b><p>${p.alerts.map((a) => a.msg).join('<br>')}</p><p>Radiation safety is not established by this assessment.</p>`).addTo(routeLayer);
  map.fitBounds(L.latLngBounds(pts).pad(0.25));
  }

  // panel
  const q = new URLSearchParams({ site: s.id, route: route.id, objective: route.objective, propulsion: state.propulsion, crew: state.crew, rover: state.rover ? 1 : 0, load: inputs.loadKg, start: state.start });
  if (state.sol != null) q.set('sol', state.sol);
  const nogo = p.alerts.filter((a) => a.level === 'proibido').length, warn = p.alerts.length - nogo;
  const rad = s.id === 'gale' ? 'average measured here by Curiosity' : 'reference value measured by Curiosity in Gale crater';
  let evidence = $('radiation-evidence');
  if (!evidence) { evidence = document.createElement('details'); evidence.id = 'radiation-evidence'; evidence.className = 'evidence-note'; $('map').after(evidence); }
  evidence.innerHTML = `<summary>+ Radiation evidence: what is measured, and what is unknown?</summary><p>Curiosity RAD measured about 4% less overall radiation near a cliff in Murray Buttes, Gale, during September 9-21, 2016 [R]. The observation is outside the supplied walking routes and is not a safe-zone boundary.</p><p>Solar events can raise exposure across broad areas. No live event feed or spatial radiation dataset is connected here. Red route marks indicate sampled slope limits, never invented radiation hot spots.</p><a href="${RADIATION_EVIDENCE_URL}" target="_blank" rel="noopener">NASA: measured shielding and radiation variability</a>`;
  if (s.id === 'meridiani') {
    $('panel').innerHTML = `<h2>${s.name}</h2><div class="verdict nogo"><b>NOT RECOMMENDED [H]</b><p>Fine-scale terrain, local weather and verified Opportunity waypoints are unavailable. The nearby line is hypothetical.</p></div><p>Opportunity landed in Eagle Crater in 2004 and studied rocks altered by ancient water [R]. Coarse MOLA altitude cannot establish walking safety.</p><p><a href="https://science.nasa.gov/mission/mer-opportunity/">NASA Opportunity mission</a> ? <a href="https://www.nasa.gov/image-article/opportunitys-final-traverse-map/">NASA rover traverse map</a></p><button class="btn ghost" id="redo">Plan again</button>`;
    $('mission-report').innerHTML = '<h2>Exploration report</h2><p>No route, radiation, slope or resource safety assessment is available for this location. Obtain local terrain and weather data before planning a walk.</p>';
    $('redo').onclick = () => { $('result').hidden = true; $('quiz').hidden = false; state.step = 0; render(); }; return;
  }
  $('panel').innerHTML = `
    <h2>${route.name}</h2>
    <p class="sub">${s.name} · Proposed human EVA ${tag('H')} · Waypoints ${tag(route.id.endsWith('-short') ? 'R' : route.tag)}</p>
    ${s.routes.length > 1 ? `<label class="route-pick">Change route<select id="route">${s.routes.filter((r) => r.objective === state.objective).map((r) => `<option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>` : ''}
    <div class="verdict ${p.go ? 'go' : 'nogo'}" role="status"><b>${p.go ? 'MODEL GO' : 'NOT RECOMMENDED'} ${tag('S')}</b>
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
      ${s.hasSim && p.go ? `<a id="start-sim" class="btn" href="sim.html?${q}">Start the ${s.id === 'gale' ? 'Gale' : 'Jezero'} 3D walk</a>`
        : `<a class="btn" aria-disabled="true" tabindex="-1">Walk it in the 3D visor</a><p class="note">${p.go ? 'No prepared terrain is available for this destination.' : `The 3D walk opens when the plan has no blockers. Still blocking: ${p.alerts.filter((a) => a.level === 'proibido').map((a) => a.msg).join(' ')}`}</p>${p.missing?.length ? `<button type="button" class="btn ghost" id="fix-essentials">Confirm the ${p.missing.length} essential ${p.missing.length > 1 ? 'systems' : 'system'}</button>` : ''}`}
      <button type="button" class="btn ghost" id="redo">Plan again</button>
    </div>`;
  renderReport(s, route, p, inputs, w);
  $('start-sim')?.addEventListener('click', (event) => {
    try { sessionStorage.setItem('mars-eva-preparation', JSON.stringify({ site: s.id, route: route.id, objective: route.objective, propulsion: state.propulsion, crew: state.crew, rover: state.rover, essentials: [...state.essentials], equipment: [...state.equipment], extras: [...state.extras], optional: [...state.optional], shelter: state.shelter, roles: [...state.roles], sol: state.sol, start: state.start, investmentMillion: state.investmentMillion })); }
    catch { event.preventDefault(); alert('Browser storage is unavailable. Enable session storage to transfer your preparation.'); }
  });
  $('fix-essentials')?.addEventListener('click', () => { $('result').hidden = true; $('quiz').hidden = false; state.step = Math.max(0, STEPS.findIndex((x) => x.title.startsWith('Prepare to stay alive'))); render(); window.scrollTo(0, 0); });
  $('route')?.addEventListener('change', (e) => drawPlan(s, s.routes.find((r) => r.id === e.target.value)).catch(showError));
  $('redo').onclick = () => { $('result').hidden = true; $('quiz').hidden = false; state.step = 0; render(); window.scrollTo(0, 0); };
}

function chart(rows, label, unit, origin) {
  const max = Math.max(...rows.map((row) => row.value), 0);
  return `<figure class="cost-chart"><figcaption>${label}</figcaption>${rows.map((row) => `<div class="chart-row"><span>${row.name}</span><strong>${fmt(row.value, 1)} ${unit} ${tag(origin)}</strong><div class="bar-track"><div class="bar-fill" style="width:${max ? row.value / max * 100 : 0}%"></div></div></div>`).join('')}</figure>`;
}

// Restored: minute-by-minute walk timeline (same model as the plan) [S].
function timelineHTML(s, route, inputs) {
  const tl = evaTimeline(s, route, inputs);
  return `<section class="route-analysis" id="walk-timeline"><h3>Walk timeline ${tag('S')}</h3><div class="table-scroll"><table><caption>Mars local time. Oxygen left assumes the modeled suit capacity and effort; not a hardware measurement.</caption><thead><tr><th scope="col">Time</th><th scope="col">Event</th><th scope="col">Oxygen left [S]</th></tr></thead><tbody>${tl.map((e) => `<tr><td>${e.time}</td><td>${e.kind === 'depart' ? 'Leave the base' : e.kind === 'return' ? 'Back at the base' : `Arrive at <b>${e.name}</b>; modeled science stop`}</td><td>${fmt(e.o2_left_pct)}%</td></tr>`).join('')}</tbody></table></div></section>`;
}

// Restored: same route under alternative choices (time, reserve, verdict; no prices) [S].
function alternativesHTML(s, route, inputs, weather) {
  const medicalOnly = EQUIPMENT.filter((e) => e.id === 'medico').reduce((a, e) => a + e.kg, 0);
  const rows = [
    ['Your plan', inputs],
    [inputs.rover ? 'Same, on foot' : 'Same, with support rover', { ...inputs, rover: !inputs.rover }],
    ['Same, carrying only the medical kit', { ...inputs, loadKg: medicalOnly }],
  ].map(([name, inp]) => ({ name, p: assessMission(s, route, inp, weather, state.essentials) }));
  const rec = recommendMobility(rows[0].p.stats);
  return `<section class="route-analysis" id="alternatives"><h3>Alternatives compared ${tag('S')}</h3><p>Mobility suggestion for this route: <b>${rec === 'rover' ? 'support rover' : 'on foot'}</b> [S] (rover suggested only above the project distance threshold and without slopes beyond its limit).</p><div class="table-scroll"><table><caption>Same route, crew and departure. Modeled duration, return time and suit reserve.</caption><thead><tr><th scope="col">Option</th><th scope="col">Duration [S]</th><th scope="col">Return [S]</th><th scope="col">Reserve [S]</th><th scope="col">Assessment [S]</th></tr></thead><tbody>${rows.map((r, i) => `<tr ${i === 0 ? 'class="current-route"' : ''}><th scope="row">${r.name}</th><td>${hhmm(r.p.total_h)}</td><td>${r.p.end_time}</td><td>${fmt(r.p.reserve_pct)}%</td><td>${r.p.go ? 'Passes model checks' : 'Blocked'}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function renderReport(s, route, p, inputs, weather) {
  const ranked = compareRoutes(s, inputs, weather, state.essentials);
  const preferred = ranked.find((entry) => entry.plan.go);
  const window = daylightWindow(weather, p.total_h);
  const shelter = SHELTERS.find((entry) => entry.id === state.shelter);
  state.investmentMillion = selectedPrices(state).total;
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
        <p>Construction mass is unknown; cost is unavailable. This selection does not certify a shelter, change suit endurance or reduce outdoor radiation exposure.</p>
      </section>
      <section><h3>Departure and return</h3><p>${timeAdvice}</p>
        <p>Selected departure ${state.start}, modeled return ${p.end_time} ${tag('S')}; duration ${hhmm(p.total_h)} ${tag('S')}. Return reserve ${fmt(p.reserve_pct)}% ${tag('S')} against the scenario minimum ${RESERVE_PCT}% ${tag('S')}.</p>
        ${weather ? `<p>Weather snapshot: sol ${weather.sol}, ${weather.terrestrial_date} ${tag('R')}. This historical sample may come from a different date than the route waypoints.</p>` : ''}
        <h3>Risks still unresolved</h3><ul><li>Solar particle events and local radiation variability: no live alerts or spatial dose map.</li><li>Rocks, sand, dust, traction and small slopes between waypoints: not fully resolved.</li><li>Wind, visibility, communication coverage, human health and rescue timing: not modeled.</li><li>Hypothetical base location and proposed human route: no installed infrastructure.</li></ul>
      </section>
    </div>
    ${timelineHTML(s, route, inputs)}
    ${alternativesHTML(s, route, inputs, weather)}
    <section class="route-analysis"><h3>Which route is the better candidate?</h3><p>${recommendation}</p>
      <p>Follow the sampled rover corridor where available, check terrain at ground level and plan an abort to base. Do not draw shortcuts across crater walls or assume an existing rover trail is certified for a crew.</p>
      <div class="table-scroll"><table><caption>Same site, crew, load and departure. Waypoint slopes [D]; duration and reserve [S].</caption><thead><tr><th scope="col">Candidate</th><th scope="col">Max slope [D]</th><th scope="col">Duration [S]</th><th scope="col">Reserve [S]</th><th scope="col">Assessment [S]</th></tr></thead><tbody>${ranked.map((entry) => `<tr ${entry.route.id === route.id ? 'class="current-route"' : ''}><th scope="row">${entry.route.name}${entry.route.id === route.id ? ' (selected)' : ''}</th><td>${fmt(entry.plan.stats.max_slope_deg, 1)}°</td><td>${hhmm(entry.plan.total_h)}</td><td>${fmt(entry.plan.reserve_pct)}%</td><td>${entry.plan.go ? 'Passes model checks' : 'Blocked'}</td></tr>`).join('')}</tbody></table></div>
      ${s.routes.length === 1 ? '<p>Only one route is supplied at this site; there is no alternative here to establish which is safest.</p>' : ''}
      <h3>What the map can tell you</h3><p>Slope markers show elevation changes between sampled points ${tag('D')}, using project thresholds ${tag('S')}. They are not crater-wide hazard polygons. Map imagery and geology do not measure radiation. No green “radiation-safe” zones are asserted.</p>
      <p><a href="https://trek.nasa.gov/mars/" target="_blank" rel="noopener">Mars Trek: imagery and terrain</a> · <a href="https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars" target="_blank" rel="noopener">USGS: geology</a> · <a href="https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/" target="_blank" rel="noopener">Curiosity route illustration</a> · <a href="https://mars.nasa.gov/mars2020/multimedia/raw-images/" target="_blank" rel="noopener">Perseverance ground images</a>.</p>
      <p class="note">NASA Worldview shows Earth. It is useful as a visualization reference, not a source of Mars terrain or radiation measurements. Recommendations here are deterministic rules developed with AI assistance, not predictions from a live AI.</p>
    </section>
    <section class="cost-analysis"><h3>Cost evidence</h3>${priceSummaryHTML()}${historicalCostHTML()}${priceFinalHTML()}</section>`;
  $('download-report').onclick = () => {
    const report = `${$('mission-report').innerText}\n\nIdentified scenario alerts:\n${p.alerts.map((alert) => `- ${alert.msg}`).join('\n')}\n\nNASA sources and methods: ${new URL('SOURCES.md', location.href)}\n`;
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `mars-${s.id}-${route.id}-report.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
}

getJSON('data/sites.json')
  .then((d) => { sites = preparedSites(d.filter((s) => s.id !== 'meridiani')); render(); })
  .catch((e) => { $('q-title').textContent = 'Could not load the site data.'; $('q-lead').textContent = `Open the site through a web server (npm run dev). Details: ${e.message}`; });

