// Computes the 1% chart-total floor, rounded up to 2 decimal places so it remains
// representable in the persisted weight model. See spec R12.
export function getFloor(total: number): number {
  return Math.max(0.01, Math.ceil(total * 0.01 * 100) / 100);
}

// Two-decimal weight rounding used by every persistence/redistribution path.
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
