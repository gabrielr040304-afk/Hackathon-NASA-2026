import { SIM_PACING } from '../config.js';
// Shared elapsed time keeps modeled speed, distance and suit consumption consistent.
export function explorationSeconds(realSeconds, modeledMps, riding=false, multiplier=1) {
  const pace=SIM_PACING.paceMultipliers.includes(multiplier)?multiplier:1;
  const cap=riding?SIM_PACING.maxRoverVisualMps:SIM_PACING.maxFootVisualMps;
  const scale=modeledMps>0?Math.min(SIM_PACING.maxTimeScale,cap/modeledMps):SIM_PACING.maxTimeScale;
  return Math.max(0,realSeconds)*scale*pace;
}
