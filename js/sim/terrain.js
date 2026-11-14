// Leitura do relevo (data/jezero/terrain.*) — puro, sem Three.js.
// Coordenadas locais em metros a partir do centro: x para Leste, z para o Sul (Norte = -z).
import { MARS_RADIUS_M } from '../config.js';

const RAD = Math.PI / 180;

export function parseTerrain(meta, arrayBuffer) {
  return { ...meta, heights: new Float32Array(arrayBuffer) };
}

export function lonLatToLocal(t, lat, lon) {
  return {
    x: (lon - t.center_lon) * RAD * MARS_RADIUS_M * Math.cos(t.center_lat * RAD),
    z: -(lat - t.center_lat) * RAD * MARS_RADIUS_M,
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function heightAt(t, x, z) {
  const W = t.width, H = t.height;
  const fx = clamp(x / t.m_per_px_x + (W - 1) / 2, 0, W - 1);
  const fz = clamp(z / t.m_per_px_y + (H - 1) / 2, 0, H - 1);
  const j = Math.min(Math.floor(fx), W - 2), i = Math.min(Math.floor(fz), H - 2);
  const u = fx - j, v = fz - i, h = t.heights;
  const top = h[i * W + j] * (1 - u) + h[i * W + j + 1] * u;
  const bot = h[(i + 1) * W + j] * (1 - u) + h[(i + 1) * W + j + 1] * u;
  return top * (1 - v) + bot * v;
}

export function slopeAt(t, x, z) {
  const dx = t.m_per_px_x, dz = t.m_per_px_y;
  const gx = (heightAt(t, x + dx, z) - heightAt(t, x - dx, z)) / (2 * dx);
  const gz = (heightAt(t, x, z + dz) - heightAt(t, x, z - dz)) / (2 * dz);
  return Math.atan(Math.hypot(gx, gz)) / RAD;
}
