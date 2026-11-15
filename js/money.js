// All inputs are millions of USD. Unknown prices remain unknown.
export function moneyMillions(value) {
  if (value == null || !Number.isFinite(value) || value < 0) return 'Price unavailable';
  const rounded = Math.round(value * 100) / 100;
  const billions = rounded >= 1000;
  return '$' + (billions ? rounded / 1000 : rounded).toLocaleString('en-US', {maximumFractionDigits: 2}) + (billions ? 'B' : 'M');
}
