// Generated from TypeScript by tools/compile_sim.mjs
import { SUIT_CAPACITY_H, RAD_MSV_PER_DAY } from '../config.js';
                                                                                 
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
