// Cálculos puros da caminhada (sem DOM). Usado pelo planejador e pelo simulador.
import * as C from './config.js';

const RAD = Math.PI / 180;
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export function distanceM(a, b) {
  const dLat = (b.lat - a.lat) * RAD, dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * C.MARS_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function routeStats(points) {
  const segments = [];
  let distance_m = 0, ascent_m = 0, descent_m = 0, max_slope_deg = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distanceM(points[i - 1], points[i]);
    const dh = points[i].elev_m - points[i - 1].elev_m;
    const slope_deg = d > 0 ? Math.atan2(dh, d) / RAD : 0;
    segments.push({ distance_m: d, slope_deg });
    distance_m += d;
    if (dh > 0) ascent_m += dh; else descent_m -= dh;
    max_slope_deg = Math.max(max_slope_deg, Math.abs(slope_deg));
  }
  return { distance_m, ascent_m, descent_m, max_slope_deg, segments };
}

export function effort(slopeDeg, loadKg) {
  return 1 + C.SLOPE_FACTOR_PER_DEG * Math.max(0, slopeDeg) + C.LOAD_FACTOR_PER_KG * loadKg;
}

export function walkSpeedKmh(slopeDeg, loadKg, rover) {
  if (rover && Math.abs(slopeDeg) <= C.ROVER_MAX_SLOPE_DEG) return C.ROVER_KMH;
  const tobler = 6 * Math.exp(-3.5 * Math.abs(Math.tan(slopeDeg * RAD) + 0.05)); // Tobler (1993), km/h
  return (tobler * C.SUIT_SPEED_FACTOR) / effort(0, loadKg);
}

// Massa total levada (equipamentos + pacote extra de suporte de vida) e capacidade do traje.
const totalLoad = (inputs) => inputs.loadKg + (inputs.extraO2 ? C.EXTRA_O2_KG : 0);
const suitHours = (inputs) => C.SUIT_CAPACITY_H + (inputs.extraO2 ? C.EXTRA_O2_H : 0);

// Caminhada como sequência de eventos (fonte única para planEva e evaTimeline).
function legs(site, route, inputs) {
  const load = totalLoad(inputs), rover = inputs.rover;
  const pts = [site.habitat, ...route.waypoints, site.habitat];
  const stats = routeStats(pts);
  const events = [];
  let t = 0, eff = 0, walk_h = 0, science_h = 0;
  stats.segments.forEach((s, i) => {
    const h = s.distance_m / 1000 / walkSpeedKmh(s.slope_deg, load, rover);
    const riding = rover && Math.abs(s.slope_deg) <= C.ROVER_MAX_SLOPE_DEG; // no rover o esforço é de repouso
    t += h; walk_h += h; eff += h * (riding ? 1 : effort(s.slope_deg, load));
    const wp = pts[i + 1];
    if (wp.target) {
      events.push({ kind: 'target', name: wp.target.name, t_h: t, eff });
      const sh = C.SCIENCE_MIN_PER_TARGET / 60;
      t += sh; science_h += sh; eff += sh * effort(0, load);
    }
  });
  events.push({ kind: 'return', name: 'Base', t_h: t, eff });
  return { stats, events, walk_h, science_h, total_h: t, effortHours: eff };
}

export function evaTimeline(site, route, inputs) {
  const { events } = legs(site, route, inputs);
  const cap = suitHours(inputs), s0 = toMin(inputs.start);
  const row = (e) => ({ ...e, time: toHHMM(s0 + e.t_h * 60), o2_left_pct: Math.max(0, 100 - (e.eff / cap) * 100) });
  return [row({ kind: 'depart', name: 'Base', t_h: 0, eff: 0 }), ...events.map(row)];
}

export function recommendMobility(stats) {
  return stats.distance_m / 1000 > C.ROVER_RECOMMEND_KM && stats.max_slope_deg <= C.ROVER_MAX_SLOPE_DEG ? 'rover' : 'foot';
}

// Custo por caminhada (hora de tripulação) e custos únicos (levar equipamento e rover até Marte).
export function evaCost(plan, inputs) {
  const crew_time_usd = inputs.crew * plan.total_h * C.CREW_HOUR_USD;
  const gear_delivery_usd = totalLoad(inputs) * C.USD_PER_KG_TO_MARS;
  const rover_usd = inputs.rover ? C.ROVER_UNIT_USD + C.ROVER_MASS_KG * C.USD_PER_KG_TO_MARS : 0;
  return { crew_time_usd, gear_delivery_usd, rover_usd, one_time_usd: gear_delivery_usd + rover_usd };
}

export function planEva(site, route, inputs, weatherSol) {
  const { crew, start } = inputs;
  const { stats, walk_h, science_h, total_h, effortHours } = legs(site, route, inputs);
  const cap = suitHours(inputs);

  const metabolic = (effortHours / cap) * 100;
  const used_pct = { o2: metabolic, water: metabolic, battery: (total_h / cap) * 100 };
  const reserve_pct = Math.max(0, 100 - Math.max(used_pct.o2, used_pct.water, used_pct.battery));
  const dose_mSv = (C.RAD_MSV_PER_DAY * total_h) / 24;
  const endMin = toMin(start) + total_h * 60;

  const alerts = [];
  if (crew === 1) alerts.push({ level: 'aviso', code: 'solo', msg: 'NASA spacewalks are always done in pairs.' });
  if (stats.max_slope_deg > C.SLOPE_NOGO_DEG) {
    alerts.push({ level: 'proibido', code: 'inclinacao', msg: `A stretch has a ${stats.max_slope_deg.toFixed(0)}° slope (limit ${C.SLOPE_NOGO_DEG}°).` });
  } else if (stats.max_slope_deg > C.SLOPE_WARN_DEG) {
    alerts.push({ level: 'aviso', code: 'inclinacao', msg: `A stretch has a ${stats.max_slope_deg.toFixed(0)}° slope: slow down.` });
  }
  if (reserve_pct < C.RESERVE_PCT) {
    alerts.push({ level: 'proibido', code: 'consumivel', msg: `Suit reserve on return: ${reserve_pct.toFixed(0)}% (minimum ${C.RESERVE_PCT}%).` });
  }
  if (!weatherSol) {
    alerts.push({ level: 'aviso', code: 'sem-clima', msg: 'No weather station at this site: sunset time not checked.' });
  } else if (endMin > toMin(weatherSol.sunset) - C.DAYLIGHT_MARGIN_MIN) {
    alerts.push({ level: 'proibido', code: 'por-do-sol', msg: `Return at ${toHHMM(endMin)}; you must be back ${C.DAYLIGHT_MARGIN_MIN} min before sunset (${weatherSol.sunset.slice(0, 5)}).` });
  }
  if (site.id !== 'gale') {
    alerts.push({ level: 'aviso', code: 'radiacao-ref', msg: 'Radiation: reference value measured by Curiosity in Gale crater, not at this site.' });
  }

  return {
    stats, walk_h, science_h, total_h, used_pct, reserve_pct, dose_mSv,
    career_pct: (dose_mSv / C.CAREER_LIMIT_MSV) * 100,
    end_time: toHHMM(endMin), alerts, go: !alerts.some((a) => a.level === 'proibido'),
  };
}

// [D] interpolação: mínima no nascer do sol, máxima às PEAK_TEMP_HOUR, volta à mínima no próximo nascer.
export function airTempAt(weatherSol, hhmm) {
  if (!weatherSol) return null;
  const { min_temp: lo, max_temp: hi } = weatherSol;
  const rise = toMin(weatherSol.sunrise), peak = C.PEAK_TEMP_HOUR * 60;
  let t = toMin(hhmm);
  if (t < rise) t += 1440;
  if (t <= peak) return lo + ((hi - lo) * (t - rise)) / (peak - rise);
  return hi - ((hi - lo) * (t - peak)) / (rise + 1440 - peak);
}

// Clima espacial (eventos DONKI medidos perto da Terra; Marte pode estar do outro lado do Sol).
export function spaceWeatherRisk(events, nowIso, days = C.DONKI_DAYS) {
  const now = Date.parse(nowIso), recent = events.filter((e) => e.time && now - Date.parse(e.time) <= days * 864e5 && Date.parse(e.time) <= now);
  const sep = recent.filter((e) => e.type === 'SEP').length;
  const xflr = recent.filter((e) => e.type === 'FLR' && /^X/.test(e.class ?? '')).length;
  const fastest = Math.max(0, ...recent.filter((e) => e.type === 'CME').map((e) => e.speed_kms ?? 0));
  const level = sep || xflr ? 'high' : fastest >= C.CME_FAST_KMS ? 'watch' : 'low';
  return { level, recent: recent.length, sep, xflr, fastest_kms: fastest };
}
