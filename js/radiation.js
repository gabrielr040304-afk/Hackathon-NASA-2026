import { RADIATION_TERRAIN as C } from './config.js';
import { heightAt } from './sim/terrain.js';

// Geometric sky obstruction [D], not a radiation transport/dose-rate model.
// Fraction of unobstructed upper-hemisphere solid angle, sampled in azimuth.
export function terrainExposure(terrain, x, z) {
  const hx=(terrain.width-1)*terrain.m_per_px_x/2, hz=(terrain.height-1)*terrain.m_per_px_y/2;
  const observer=heightAt(terrain,x,z)+C.eyeHeightM;
  let blocked=0, complete=true;
  for(let i=0;i<C.azimuths;i++) {
    const angle=i*Math.PI*2/C.azimuths;
    let horizon=0;
    for(let distance=C.stepM;distance<=C.rangeM;distance+=C.stepM) {
      const tx=x+Math.cos(angle)*distance,tz=z+Math.sin(angle)*distance;
      if(Math.abs(tx)>hx||Math.abs(tz)>hz){complete=false;break;}
      horizon=Math.max(horizon,Math.atan2(heightAt(terrain,tx,tz)-observer,distance));
    }
    blocked+=Math.sin(horizon);
  }
  return {visibleFraction:Math.max(0,Math.min(1,1-blocked/C.azimuths)),complete};
}
