import type { Polarity } from '@/app/types';

// Within each polarity the slices are ranked by weight (biggest darkest) and a slice's fill
// is interpolated piecewise across the real Tailwind 200→800 oklch stops from
// docs/color-palette.md. depth ∈ [0,1] indexes the ramp: 0 = 200 (pale), 0.5 = 500 (the vivid
// mid-tone), 1 = 800 (dark). Following the real stops keeps the chroma peak near 500 — a
// straight 200↔800 line would cut under it and wash the mid-band out.
type Oklch = [number, number, number];
const SHADE_RAMP: Record<Polarity, Oklch[]> = {
  positive: [
    [0.925, 0.084, 155.995], // green-200
    [0.871, 0.15, 154.449], // green-300
    [0.792, 0.209, 151.711], // green-400
    [0.723, 0.219, 149.579], // green-500
    [0.627, 0.194, 149.214], // green-600
    [0.527, 0.154, 150.069], // green-700
    [0.448, 0.119, 151.328], // green-800
  ],
  negative: [
    [0.885, 0.062, 18.334], // red-200
    [0.808, 0.114, 19.571], // red-300
    [0.704, 0.191, 22.216], // red-400
    [0.637, 0.237, 25.331], // red-500
    [0.577, 0.245, 27.325], // red-600
    [0.505, 0.213, 27.518], // red-700
    [0.444, 0.177, 26.899], // red-800
  ],
};

// Inside-label text and the active-slice border adapt to fill lightness so both stay
// legible across the band: depth ≥ this threshold is a dark fill (white text, lightened
// border), below it a pale fill (gray-900 text, darkened border).
const DARK_FILL_THRESHOLD = 0.5;
const INSIDE_TEXT_DARK_FILL = 'oklch(1 0 0)'; // white
const INSIDE_TEXT_PALE_FILL = 'oklch(0.21 0.034 264.665)'; // gray-900

// Ranked depths don't span the full 200↔800 ramp outright — they fan out from the 500 midpoint
// as a polarity group grows, so a small group stays a gentle band around 500 and only a near-full
// group reaches the pale/dark extremes. MIN_SPREAD = 1/3 keeps a 2-slice group within one ramp
// stop of 500; spread climbs linearly to the full ramp at FULL_SPREAD_COUNT slices. The count is
// per polarity, so a few negatives stay gentle even when the positives are many.
const FULL_SPREAD_COUNT = 20; // slice count at which the band reaches the full ramp
const MIN_SPREAD = 1 / 3;
function bandSpread(n: number): number {
  const t = Math.min(1, Math.max(0, (n - 2) / (FULL_SPREAD_COUNT - 2)));
  return MIN_SPREAD + (1 - MIN_SPREAD) * t;
}

// Rank each polarity's slices by weight descending (ties keep input order) and map rank to a
// depth that fans out symmetrically from the 500 midpoint: biggest darkest, smallest palest. A
// lone slice maps to the midpoint (0.5), the vivid 500 shade.
export function assignShadeDepths(entries: { id: string; polarity: Polarity; weight: number }[]): Record<string, number> {
  // Null-prototype: activity ids are user-controlled (import/share), and a literal "__proto__"
  // key would be swallowed by the setter on a plain object, yielding a non-numeric depth.
  const depths: Record<string, number> = Object.create(null);
  for (const polarity of ['positive', 'negative'] as const) {
    const group = entries.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.polarity === polarity);
    group.sort((a, b) => b.entry.weight - a.entry.weight || a.index - b.index);
    const n = group.length;
    const spread = bandSpread(n);
    group.forEach(({ entry }, rank) => {
      const raw = n === 1 ? 0.5 : 1 - rank / (n - 1);
      depths[entry.id] = 0.5 + (raw - 0.5) * spread;
    });
  }
  return depths;
}

export function getShadeColor(polarity: Polarity, depth: number): string {
  const ramp = SHADE_RAMP[polarity];
  // Clamp to [0,1] so an out-of-range depth resolves to an endpoint stop rather than
  // extrapolating past the ramp (which could push lightness/chroma out of gamut).
  const segment = Math.min(1, Math.max(0, depth)) * (ramp.length - 1);
  const i = Math.min(Math.floor(segment), ramp.length - 2);
  const frac = segment - i;
  const lo = ramp[i];
  const hi = ramp[i + 1];
  const l = round3(lo[0] + (hi[0] - lo[0]) * frac);
  const c = round3(lo[1] + (hi[1] - lo[1]) * frac);
  const h = round3(lo[2] + (hi[2] - lo[2]) * frac);
  return `oklch(${l} ${c} ${h})`;
}

export function getInsideTextColor(depth: number): string {
  return depth >= DARK_FILL_THRESHOLD ? INSIDE_TEXT_DARK_FILL : INSIDE_TEXT_PALE_FILL;
}

export function getActiveBorderExpr(baseColor: string, depth: number): string {
  const sign = depth >= DARK_FILL_THRESHOLD ? '+' : '-';
  return `oklch(from ${baseColor} calc(l ${sign} 0.1) c h)`;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
