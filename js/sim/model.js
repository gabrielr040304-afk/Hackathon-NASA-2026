// Generated from TypeScript by tools/compile_sim.mjs
import { SUIT_CAPACITY_H, RAD_MSV_PER_DAY } from '../config.js';
import { SIM, SIM_GUIDANCE } from '../config.js';
import { heightAt } from './terrain.js';
// Interpolate the actual rendered triangles, not the higher-resolution source grid.
export function renderedHeight(t     , x        , z        )         {
  const width = (t.width - 1) * t.m_per_px_x, depth = (t.height - 1) * t.m_per_px_y;
  const dx = width / SIM.meshSegments, dz = depth / SIM.meshSegments;
  const fx = Math.max(0, Math.min(SIM.meshSegments, (x + width / 2) / dx));
  const fz = Math.max(0, Math.min(SIM.meshSegments, (z + depth / 2) / dz));
  const i = Math.min(SIM.meshSegments - 1, Math.floor(fx)), j = Math.min(SIM.meshSegments - 1, Math.floor(fz));
  const u = fx - i, v = fz - j;
  const at = (a        , b        ) => heightAt(t, -width / 2 + a * dx, -depth / 2 + b * dz);
  const a = at(i,j), b = at(i+1,j), c = at(i,j+1), d = at(i+1,j+1);
  return u+v <= 1 ? a+u*(b-a)+v*(c-a) : d+(1-u)*(c-d)+(1-v)*(b-d);
}
export function drapeRoute(t     , points                       ) {
  const vertices           = [];
  for (let i=1;i<points.length;i++) {
    const a=points[i-1], b=points[i], length=Math.hypot(b.x-a.x,b.z-a.z);
    if (!length) continue;
    const count=Math.ceil(length/SIM_GUIDANCE.routeStepM);
    const nx=-(b.z-a.z)/length*SIM_GUIDANCE.routeWidthM/2, nz=(b.x-a.x)/length*SIM_GUIDANCE.routeWidthM/2;
    const edge=(u       ,side       )=> {const x=a.x+(b.x-a.x)*u+nx*side,z=a.z+(b.z-a.z)*u+nz*side;return [x,renderedHeight(t,x,z)+SIM_GUIDANCE.routeLiftM,z];};
    for(let k=0;k<count;k++){const p=edge(k/count,-1),q=edge(k/count,1),r=edge((k+1)/count,-1),s=edge((k+1)/count,1);vertices.push(...p,...q,...r,...q,...s,...r);}
  }
  return vertices;
}
                                                                                 
export function consumption(usage       ) {
  const metabolic = usage.effortSeconds / (SUIT_CAPACITY_H * 3600) * 100;
  const battery = usage.seconds / (SUIT_CAPACITY_H * 3600) * 100;
  return { oxygenUsed: metabolic, waterUsed: metabolic, batteryUsed: battery,
    reserve: Math.max(0, 100 - Math.max(metabolic, battery)), dose: RAD_MSV_PER_DAY * usage.seconds / 86400 };
}
export function projectUsage(usage       , hours        )        {
  const seconds = Math.max(0, Number.isFinite(hours) ? hours : 0) * 3600;
  return { seconds, effortSeconds: seconds * (usage.seconds > 0 ? usage.effortSeconds / usage.seconds : 1), distance: usage.seconds > 0 ? usage.distance / usage.seconds * seconds : 0 };
}
