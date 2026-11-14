// Planejador: questionário em 5 passos + resultado no mapa (Tarefas 5 e 6 do plano).
import { planEva } from './calc.js';
import { RESERVE_PCT, DAYLIGHT_MARGIN_MIN } from './config.js';
import { baseLayers, localLayer } from './layers.js';

const $ = (id) => document.getElementById(id);
const tag = (t) => `<b class="tag t-${t}" title="${{ R: 'real', D: 'derivado', S: 'simulado', H: 'hipotético' }[t]}">${t}</b>`;
const fmt = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const hhmm = (h) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')} min`;

const OBJECTIVES = [
  { id: 'vida-antiga', name: 'Sinais de vida antiga', text: 'Rochas que podem guardar marcas de micróbios de bilhões de anos atrás.',
    why: 'Jezero foi um lago há cerca de 3,5 bilhões de anos. Em 2024 o Perseverance achou em Cheyava Falls texturas que podem ter origem biológica.', src: 'NASA/JPL, julho de 2024' },
  { id: 'sedimentos', name: 'Água e sedimentos', text: 'Camadas deixadas por rios antigos contam como era o clima.',
    why: 'Rochas depositadas pela água registram quanto tempo ela existiu. O canal Neretva Vallis levava o rio que enchia o lago de Jezero.', src: 'NASA Mars 2020' },
  { id: 'boxwork', name: 'Formações boxwork', text: 'Cristas em forma de favo, feitas por minerais de água subterrânea.',
    why: 'As cristas mostram por onde a água correu sob a superfície, num tempo em que Marte já secava. O Curiosity estudou essas formações em 2025.', src: 'Blog do Curiosity, NASA, 2025' },
  { id: 'gelo', name: 'Gelo para uma base humana', text: 'Encontrar gelo de água raso para beber, respirar e fazer combustível.',
    why: 'Gelo a poucos metros da superfície pode virar água, oxigênio e combustível, o que torna uma base humana viável.', src: 'Projeto SWIM (NASA)' },
];
const EQUIPMENT = [
  { id: 'amostrador', name: 'Kit de coleta de amostras', kg: 4 },
  { id: 'camera', name: 'Câmera de campo', kg: 2 },
  { id: 'espectrometro', name: 'Espectrômetro portátil', kg: 5 },
  { id: 'perfuratriz', name: 'Perfuratriz manual', kg: 12 },
  { id: 'medico', name: 'Kit médico de emergência', kg: 3 },
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
  if (text) el.innerHTML = `<p><b>Por que importa:</b> ${text}</p>${src ? `<cite>Fonte: ${src}</cite>` : ''}`;
}

const STEPS = [
  {
    title: 'O que você quer descobrir?', lead: 'Na NASA o objetivo científico vem primeiro. Ele define para onde a caminhada vai.',
    ready: () => state.objective,
    render(body) {
      for (const o of OBJECTIVES) body.append(option({ title: o.name, text: o.text, pressed: state.objective === o.id,
        onClick: () => { state.objective = o.id; state.siteId = sites.find((s) => s.objectives.includes(o.id))?.id ?? state.siteId; render(); } }));
      const o = OBJECTIVES.find((x) => x.id === state.objective);
      why(o?.why, o?.src);
    },
  },
  {
    title: 'Onde vamos caminhar?', lead: 'Três lugares com níveis diferentes de dados. Quanto mais um rover explorou, mais certeza temos do terreno.',
    ready: () => state.siteId,
    render(body) {
      const notes = {
        jezero: ['Rota pelas paradas reais do Perseverance. Simulação 3D disponível.', 'O terreno é conhecido com 1 metro de detalhe pelo satélite HiRISE.'],
        gale: ['Rota pelas paradas reais do Curiosity. Único local com radiação medida no solo.', 'O Curiosity mede radiação desde 2012; é a melhor referência que existe para astronautas.'],
        arcadia: ['Nenhum rover esteve aqui. Rota hipotética.', 'É uma das planícies candidatas a base humana por ter gelo raso. Em compensação, não há fotos de solo nem clima medido.'],
      };
      for (const s of sites) body.append(option({ title: s.name, text: `${s.mission}. ${notes[s.id]?.[0] ?? ''}`,
        hint: s.objectives.includes(state.objective) ? 'Combina com o seu objetivo' : '', pressed: state.siteId === s.id,
        onClick: () => { state.siteId = s.id; state.sol = null; render(); } }));
      why(notes[state.siteId]?.[1]);
    },
  },
  {
    title: 'Quem vai e como?', lead: 'Dupla ou sozinho, a pé ou com rover de apoio.',
    ready: () => true,
    render(body) {
      body.append(
        option({ title: 'Dupla de astronautas', text: 'Um ajuda o outro se algo der errado.', pressed: state.crew === 2, onClick: () => { state.crew = 2; render(); } }),
        option({ title: 'Astronauta sozinho', text: 'Mais rápido de organizar, mais arriscado.', pressed: state.crew === 1, onClick: () => { state.crew = 1; render(); } }),
        option({ title: 'Com rover de apoio', text: 'Carrega a equipe em trechos de até 15° de inclinação.', pressed: state.rover, onClick: () => { state.rover = !state.rover; render(); } }),
      );
      why('Todas as caminhadas espaciais da NASA são feitas em dupla. O rover poupa esforço e oxigênio, mas não sobe encostas íngremes.', 'NASA; rover lunar da Apollo');
    },
  },
  {
    title: 'O que você vai levar?', lead: 'Cada quilo a mais aumenta o esforço e o consumo de oxigênio do traje.',
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
      t.innerHTML = `<span>Carga total</span><span class="total">${loadKg()} kg</span><small>Em Marte a gravidade é 38% da Terra, mas o traje e a carga ainda cansam. ${tag('S')}</small>`;
      body.append(f, t);
      why('A carga entra no cálculo de esforço: +1% de consumo por quilo. É uma estimativa nossa, não uma medida da NASA.');
    },
  },
  {
    title: 'Quando sair?', lead: 'O clima vem das estações meteorológicas dos rovers. É preciso voltar antes de escurecer.',
    ready: () => true,
    async render(body) {
      const s = site(); const list = await weatherOf(s);
      const f = document.createElement('div'); f.className = 'field';
      if (list.length) {
        state.sol ??= list.at(-1).sol;
        f.innerHTML = `<label for="sol">Dia marciano (sol) com clima medido ${tag('R')}</label>
          <select id="sol">${list.map((w) => `<option value="${w.sol}" ${w.sol === state.sol ? 'selected' : ''}>Sol ${w.sol} (${w.terrestrial_date}): ${fmt(w.min_temp)} a ${fmt(w.max_temp)} °C, sol nasce ${w.sunrise} e se põe ${w.sunset}</option>`).join('')}</select>`;
        f.querySelector('select').onchange = (e) => { state.sol = Number(e.target.value); };
      } else {
        state.sol = null;
        f.innerHTML = `<p>Este local não tem estação meteorológica. O horário do pôr do sol não poderá ser conferido. ${tag('H')}</p>`;
      }
      const t = document.createElement('div'); t.className = 'field';
      t.innerHTML = `<label for="start">Hora de saída (hora local de Marte)</label><input type="time" id="start" value="${state.start}">`;
      t.querySelector('input').onchange = (e) => { state.start = e.target.value || '09:00'; };
      body.append(f, t);
      why(`É preciso voltar ${DAYLIGHT_MARGIN_MIN} minutos antes do pôr do sol: à noite a temperatura cai para perto de −80 °C e a energia solar acaba.`);
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
  $('next').textContent = state.step === STEPS.length - 1 ? 'Planejar caminhada' : 'Avançar';
  $('next').disabled = !step.ready();
}

$('back').onclick = () => { state.step--; render(); };
$('next').onclick = () => { if (state.step < STEPS.length - 1) { state.step++; render(); } else showResult(); };

// ---------- resultado ----------
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
    t.addTo(map); map._ctl.addOverlay(t, `Trajeto real do ${s.mission.split(' ')[0]}`); siteLayers.push(t);
  }
}

async function drawPlan(s, route) {
  const list = await weatherOf(s);
  const w = list.find((x) => x.sol === state.sol) ?? null;
  const inputs = { crew: state.crew, rover: state.rover, loadKg: loadKg(), start: state.start };
  const p = planEva(s, route, inputs, w);

  // mapa
  if (routeLayer) { map.removeLayer(routeLayer); map._ctl.removeLayer(routeLayer); }
  const pts = [s.habitat, ...route.waypoints, s.habitat].map((x) => [x.lat, x.lon]);
  // contorno escuro + linha ocre: a rota aparece sobre qualquer camada (inclusive a geologia, que é laranja)
  routeLayer = L.layerGroup([L.polyline(pts, { color: '#18202e', weight: 8, opacity: .85 }), L.polyline(pts, { color: '#d9a35f', weight: 4 })]);
  const baseIcon = L.divIcon({ className: 'pin pin-base', iconSize: [16, 16] });
  L.marker([s.habitat.lat, s.habitat.lon], { icon: baseIcon, title: 'Base' }).bindPopup(`<b>Base</b> ${tag(s.habitat.tag ?? 'H')}<br>Ponto de partida e de volta.`).addTo(routeLayer);
  for (const wp of route.waypoints.filter((x) => x.target)) {
    const t = wp.target;
    L.marker([wp.lat, wp.lon], { icon: L.divIcon({ className: 'pin', iconSize: [16, 16] }), title: t.name })
      .bindPopup(`<b>${t.name}</b> ${tag(route.tag)}<br>${t.why}${t.sol ? `<br><small>Sol ${t.sol}</small>` : ''}${t.photo ? `<br><img src="${t.photo}" alt="${t.name}" width="240"><br><small>${t.credit}</small>` : ''}`)
      .addTo(routeLayer);
  }
  routeLayer.addTo(map);
  map._ctl.addOverlay(routeLayer, 'Rota planejada');
  map.fitBounds(L.latLngBounds(pts).pad(0.25));

  // painel
  const q = new URLSearchParams({ site: s.id, route: route.id, crew: state.crew, rover: state.rover ? 1 : 0, load: inputs.loadKg, start: state.start });
  if (state.sol != null) q.set('sol', state.sol);
  const nogo = p.alerts.filter((a) => a.level === 'proibido').length, warn = p.alerts.length - nogo;
  const rad = s.id === 'gale' ? 'média medida aqui pelo Curiosity' : 'referência medida em Gale pelo Curiosity';
  $('panel').innerHTML = `
    <h2>${route.name}</h2>
    <p class="sub">${s.name} ${tag(route.tag)}</p>
    ${s.routes.length > 1 ? `<label class="route-pick">Trocar rota<select id="route">${s.routes.map((r) => `<option value="${r.id}" ${r.id === route.id ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>` : ''}
    <div class="verdict ${p.go ? 'go' : 'nogo'}" role="status"><b>${p.go ? 'GO' : 'NÃO RECOMENDADO'}</b>
      <span>${p.go ? `Caminhada liberada${warn ? `, com ${warn} ${warn > 1 ? 'avisos' : 'aviso'}` : ''}.` : `${nogo} ${nogo > 1 ? 'motivos impedem' : 'motivo impede'} a saída.`}</span></div>
    <ul class="alerts">${p.alerts.map((a) => `<li class="${a.level}">${a.msg}</li>`).join('')}</ul>
    <dl class="stats">
      <dt class="grp">Percurso</dt>
      <dt>Distância, ida e volta</dt><dd>${fmt(p.stats.distance_m / 1000, 2)} km ${tag('D')}</dd>
      <dt>Subida acumulada</dt><dd>${fmt(p.stats.ascent_m)} m ${tag('D')}</dd>
      <dt>Inclinação máxima</dt><dd>${fmt(p.stats.max_slope_deg, 1)}° ${tag('D')}</dd>
      <dt>Paradas científicas</dt><dd>${route.waypoints.filter((x) => x.target).length}</dd>
      <dt class="grp">Tempo</dt>
      <dt>Duração total</dt><dd>${hhmm(p.total_h)} ${tag('S')}</dd>
      <dt>Saída e volta</dt><dd>${state.start} → ${p.end_time} ${tag('S')}</dd>
      ${w ? `<dt>Pôr do sol</dt><dd>${w.sunset} ${tag('R')}</dd>` : ''}
      <dt class="grp">Traje (reserva mínima ${RESERVE_PCT}%)</dt>
      <dt>Oxigênio usado</dt><dd>${fmt(p.used_pct.o2)}% ${tag('S')}</dd>
      <dt>Água usada</dt><dd>${fmt(p.used_pct.water)}% ${tag('S')}</dd>
      <dt>Bateria usada</dt><dd>${fmt(p.used_pct.battery)}% ${tag('S')}</dd>
      <dt>Reserva na volta</dt><dd>${fmt(p.reserve_pct)}% ${tag('S')}</dd>
      ${w ? `<dt class="grp">Clima do sol ${w.sol}</dt>
      <dt>Temperatura do ar</dt><dd>${fmt(w.min_temp)} a ${fmt(w.max_temp)} °C ${tag('R')}</dd>
      <dt>Pressão</dt><dd>${fmt(w.pressure)} Pa ${tag('R')}</dd>` : ''}
      <dt class="grp">Radiação</dt>
      <dt>Dose na caminhada</dt><dd>${fmt(p.dose_mSv, 3)} mSv ${tag('D')}</dd>
      <dt>Do limite de carreira (600 mSv)</dt><dd>${fmt(p.career_pct, 3)}% ${tag('D')}</dd>
    </dl>
    <p class="note">Radiação: ${rad} (0,64 mSv por dia; Hassler et al., 2014).</p>
    <div class="actions">
      ${s.hasSim ? `<a class="btn" href="sim.html?${q}">Simular no visor 3D</a>`
        : `<a class="btn" aria-disabled="true" tabindex="-1">Simular no visor 3D</a><p class="note">Simulação 3D disponível só para Jezero neste protótipo.</p>`}
      <button type="button" class="btn ghost" id="redo">Refazer o planejamento</button>
    </div>`;
  $('route')?.addEventListener('change', (e) => drawPlan(s, s.routes.find((r) => r.id === e.target.value)));
  $('redo').onclick = () => { $('result').hidden = true; $('quiz').hidden = false; state.step = 0; render(); window.scrollTo(0, 0); };
}

getJSON('data/sites.json')
  .then((d) => { sites = d; render(); })
  .catch((e) => { $('q-title').textContent = 'Não foi possível carregar os dados dos locais.'; $('q-lead').textContent = `Abra o site por um servidor (npm run dev). Detalhe: ${e.message}`; });
