import { marsMinutes } from './mars-time.js';
// Pure planning helpers. Does not change the simulator's calc.js contract.
import { planEva } from './calc.js';
import { ESSENTIALS, DAYLIGHT_MARGIN_MIN, SLOPE_WARN_DEG, SLOPE_NOGO_DEG, BUDGET_CATEGORIES } from './config.js';

const minutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
export const clockTime = (value) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;

export function assessMission(site, route, inputs, weather, essentials) {
  const plan = planEva(site, route, inputs, weather);
  // Copy: consumers of calc.js retain the original object/contract.
  const alerts = [...plan.alerts];
  const missing = ESSENTIALS.filter((item) => !essentials.has(item.id));
  for (const item of missing) alerts.push({ level: 'proibido', code: `missing-${item.id}`, msg: `Not confirmed: ${item.name}.` });
  if (weather && minutes(inputs.start) < minutes(weather.sunrise)) {
    alerts.push({ level: 'proibido', code: 'before-sunrise', msg: `Departure before recorded sunrise (${weather.sunrise}).` });
  }
  if (!weather || route.tag === 'H') alerts.push({ level: 'proibido', code: 'unverified', msg: 'Insufficient local evidence: this route remains an exploratory concept.' });
  return { ...plan, alerts, missing, go: !alerts.some((alert) => alert.level === 'proibido') };
}

// Latest departure uses unwrapped elapsed minutes, so overnight walks cannot pass.
export function daylightWindow(weather, durationHours) {
  if (!weather) return null;
  const earliest = minutes(weather.sunrise);
  const latest = Math.floor(minutes(weather.sunset) - DAYLIGHT_MARGIN_MIN - marsMinutes(durationHours * 3600));
  return { earliest, latest, feasible: latest >= earliest };
}

// Transparent lexicographic comparison: blockers, slope, duration, then reserve.
export function compareRoutes(site, inputs, weather, essentials) {
  return site.routes.map((route) => ({ route, plan: assessMission(site, route, inputs, weather, essentials) }))
    .sort((a, b) => Number(b.plan.go) - Number(a.plan.go)
      || a.plan.alerts.filter((x) => x.level === 'proibido').length - b.plan.alerts.filter((x) => x.level === 'proibido').length
      || a.plan.stats.max_slope_deg - b.plan.stats.max_slope_deg
      || a.plan.total_h - b.plan.total_h || b.plan.reserve_pct - a.plan.reserve_pct);
}

export function terrainCautions(site, route, plan) {
  const points = [site.habitat, ...route.waypoints, site.habitat];
  return plan.stats.segments.flatMap((segment, i) => Math.abs(segment.slope_deg) > SLOPE_WARN_DEG ? [{
    from: points[i], to: points[i + 1], slope: Math.abs(segment.slope_deg),
    blocked: Math.abs(segment.slope_deg) > SLOPE_NOGO_DEG,
  }] : []);
}

export function budgetSummary(budget) {
  const entries = BUDGET_CATEGORIES.map(({ id, name }) => {
    const raw = budget[id];
    const value = raw === '' || raw == null ? null : Number(raw);
    return { id, name, value: Number.isFinite(value) && value >= 0 ? value : null };
  });
  const complete = entries.every((entry) => entry.value !== null);
  const subtotal = entries.reduce((total, entry) => total + (entry.value ?? 0), 0);
  return { entries, complete, subtotal, total: complete && Number.isFinite(subtotal) ? subtotal : null };
}

// Readiness colors describe a project checklist, never a NASA flight clearance.
export function preparationLevel(essentials, equipment, crew, roles, shelter) {
  const missing = ESSENTIALS.filter((item) => !essentials.has(item.id));
  const improvements = [];
  if (!equipment.has('medico')) improvements.push('Add an emergency medical kit.');
  if (crew < 4) improvements.push('Plan at least four surface crew for this mission concept.');
  for (const role of ['medical', 'engineering', 'science']) if (!roles.has(role)) improvements.push(`Assign ${role} capability; cross-training may cover multiple roles.`);
  if (shelter === 'shell') improvements.push('Review added shielding for the pressure habitat.');
  return { level: missing.length ? 'red' : improvements.length ? 'yellow' : 'green', missing, improvements };
}
