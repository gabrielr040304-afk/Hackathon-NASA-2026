// One route catalog shared by planner and simulator.
export function preparedSites(data) {
  const sites = structuredClone(data);
  for (const [siteId, routeId, targetName, id, name] of [
    ['jezero', 'neretva-encosta', 'Neretva Vallis channel floor', 'neretva-short', 'Neretva channel floor - short'],
    ['gale', 'boxwork', 'Boxwork ridge', 'boxwork-ridge-short', 'Boxwork ridge - short'],
  ]) {
    const site = sites.find(s => s.id === siteId);
    const route = site?.routes.find(r => r.id === routeId);
    if (!route || site.routes.some(r => r.id === id)) continue;
    const end = route.waypoints.findIndex(p => p.target?.name === targetName);
    if (end < 0) continue;
    const out = route.waypoints.slice(0, end + 1);
    site.routes.push({...route, id, name, waypoints: [...out, ...out.slice(0,-1).reverse().map(({target,...p})=>p)]});
  }
  return sites;
}
