// The ring's origin angle: 12-o'clock top. Shared so the animation hook's reorder walk and
// the chart's render walk cannot drift apart.
export const START_ANGLE = -Math.PI / 2;

// Cumulative start angles for a weighted ring; each slice's sweep is (weight / total) * 2π.
export function computeStartAngles(weights: number[], startAngle = START_ANGLE): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0) || 1;
  const starts: number[] = [];
  let cursor = startAngle;
  for (const weight of weights) {
    starts.push(cursor);
    cursor += (weight / total) * Math.PI * 2;
  }
  return starts;
}
