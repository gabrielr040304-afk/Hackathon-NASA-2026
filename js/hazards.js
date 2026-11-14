// Local terrain-derived cautions. A flagged square contains a steep sample;
// it does not imply that every point in that square is impassable.
import { HAZARD_CELL_PIXELS, SLOPE_WARN_DEG, SLOPE_NOGO_DEG } from './config.js';
export function terrainHazards(t) {
  const cells = [];
  const { width: w, height: h, heights: z, bbox } = t;
  for (let y = 1; y < h - 1; y += HAZARD_CELL_PIXELS) {
    for (let x = 1; x < w - 1; x += HAZARD_CELL_PIXELS) {
      const endX = Math.min(x + HAZARD_CELL_PIXELS, w - 1);
      const endY = Math.min(y + HAZARD_CELL_PIXELS, h - 1);
      let max = 0, valid = true;
      for (let j = y; j < endY; j++) for (let i = x; i < endX; i++) {
        const dx = (z[j * w + i + 1] - z[j * w + i - 1]) / (2 * t.m_per_px_x);
        const dy = (z[(j + 1) * w + i] - z[(j - 1) * w + i]) / (2 * t.m_per_px_y);
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) valid = false;
        else max = Math.max(max, Math.atan(Math.hypot(dx, dy)) * 180 / Math.PI);
      }
      if (!valid || max <= SLOPE_WARN_DEG) continue;
      const lon = (col) => bbox[0] + col / (w - 1) * (bbox[2] - bbox[0]);
      const lat = (row) => bbox[3] - row / (h - 1) * (bbox[3] - bbox[1]);
      cells.push({ bounds: [[lat(endY), lon(x)], [lat(y), lon(endX)]], slope: max, blocked: max > SLOPE_NOGO_DEG });
    }
  }
  return cells;
}
