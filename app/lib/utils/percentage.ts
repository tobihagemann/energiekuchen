// Rounded integer percentage of a single weight against the chart total.
// Returns 0 when total is non-positive so callers never divide by zero.
export function getPercentage(weight: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((weight / total) * 100);
}
