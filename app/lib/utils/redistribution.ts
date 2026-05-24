import { Activity } from '@/app/types';

import { getFloor, round2 } from './floor';

// Defensive cap guaranteeing termination; the proportional spread clamps many entries per
// pass, so the loop converges in a few passes even at the 20-activity chart cap.
const MAX_ITERATIONS = 20;

export interface WeightEntry {
  id: string;
  weight: number;
}

// Chart-drag and ArrowKey commit: transfer `deltaWeight` from `donorIndex` to
// `receiverIndex`, leaving every other entry untouched. `deltaWeight` is a
// non-negative absolute amount; direction is encoded by which index is which.
// On floor underflow, both sides are clamped so the pair sum is preserved exactly
// under rounding (R13). Returns a fresh array; non-target entries pass through
// as shallow clones.
export function redistributeTwoDonor(entries: WeightEntry[], receiverIndex: number, donorIndex: number, deltaWeight: number, floor: number): WeightEntry[] {
  const next = entries.map(e => ({ ...e }));
  if (receiverIndex === donorIndex || receiverIndex < 0 || donorIndex < 0 || receiverIndex >= next.length || donorIndex >= next.length) {
    return next;
  }

  const pairSum = next[receiverIndex].weight + next[donorIndex].weight;
  let receiverWeight = next[receiverIndex].weight + deltaWeight;
  let donorWeight = next[donorIndex].weight - deltaWeight;

  if (donorWeight < floor) {
    donorWeight = floor;
    receiverWeight = pairSum - floor;
  }
  if (receiverWeight < floor) {
    receiverWeight = floor;
    donorWeight = pairSum - floor;
  }

  let roundedReceiver = round2(receiverWeight);
  let roundedDonor = round2(pairSum - roundedReceiver);

  if (roundedDonor < floor) {
    roundedDonor = floor;
    roundedReceiver = round2(pairSum - floor);
  }
  if (roundedReceiver < floor) {
    roundedReceiver = floor;
    roundedDonor = round2(pairSum - floor);
  }

  next[receiverIndex].weight = roundedReceiver;
  next[donorIndex].weight = roundedDonor;
  return next;
}

// Modal-slider commit: shift weight to `targetId` and absorb the delta proportionally
// from every other entry in proportion to its current weight, clamping any entry that
// would drop below `floor`.
export function redistributeProportionalAll(entries: WeightEntry[], targetId: string, targetWeight: number, floor: number): WeightEntry[] {
  const targetIndex = entries.findIndex(e => e.id === targetId);
  if (targetIndex === -1) {
    return entries.map(e => ({ ...e }));
  }

  const totalOld = entries.reduce((sum, e) => sum + e.weight, 0);
  const sumOthersOld = totalOld - entries[targetIndex].weight;

  if (sumOthersOld <= 0) {
    return entries.map((e, i) => ({ id: e.id, weight: i === targetIndex ? targetWeight : e.weight }));
  }

  const working = entries.map(e => ({ ...e }));
  working[targetIndex].weight = targetWeight;

  // Iterative proportional shrink/grow with floor clamping.
  const clamped = new Set<number>();
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const currentTotal = working.reduce((sum, e) => sum + e.weight, 0);
    const residual = totalOld - currentTotal;
    if (Math.abs(residual) < 1e-9) break;

    const eligible = working.map((entry, index) => ({ entry, index })).filter(({ index }) => index !== targetIndex && !clamped.has(index));
    const eligibleSum = eligible.reduce((sum, { entry }) => sum + entry.weight, 0);
    if (eligibleSum <= 0) break;

    let newlyClamped = false;
    for (const { entry, index } of eligible) {
      const share = (entry.weight / eligibleSum) * residual;
      const next = entry.weight + share;
      if (next < floor) {
        working[index].weight = floor;
        clamped.add(index);
        newlyClamped = true;
      } else {
        working[index].weight = next;
      }
    }

    if (!newlyClamped) break;
  }

  // Round to 2 decimals, then settle the rounding residual across the non-clamped,
  // non-target entries one cent at a time so both the chart total and the per-entry floor
  // hold. A negative residual only draws from entries that stay at or above floor; the
  // target is the fallback recipient only when no non-target entry is eligible.
  const rounded = working.map(e => ({ id: e.id, weight: round2(e.weight) }));
  const roundedSum = rounded.reduce((sum, e) => sum + e.weight, 0);
  let residualCents = Math.round((totalOld - roundedSum) * 100);

  if (residualCents !== 0) {
    const eligible: number[] = [];
    for (let i = 0; i < rounded.length; i++) {
      if (i !== targetIndex && !clamped.has(i)) eligible.push(i);
    }
    if (eligible.length === 0) eligible.push(targetIndex);

    const stepCents = residualCents > 0 ? 1 : -1;
    const step = stepCents / 100;
    while (residualCents !== 0) {
      let bestIndex = -1;
      let bestWeight = -Infinity;
      for (const i of eligible) {
        // post-round2 subtraction can dip just under floor by an ulp (e.g. floor 0.02, entry 0.03: 0.03 - 0.01 = 0.0199…).
        if (stepCents < 0 && rounded[i].weight - 0.01 < floor - 1e-9) continue;
        if (rounded[i].weight > bestWeight) {
          bestWeight = rounded[i].weight;
          bestIndex = i;
        }
      }
      if (bestIndex === -1) break;
      rounded[bestIndex] = { ...rounded[bestIndex], weight: round2(rounded[bestIndex].weight + step) };
      residualCents -= stepCents;
    }
  }

  return rounded;
}

// Chart-level floor renormalization (R36). Pulls below-floor weights up to the floor
// and re-pro-rates the deficit across above-floor weights. Two scale-up branches handle
// degenerate imports where the chart total is too small to fit n slices at floor.
export function renormalizeToFloor(activities: Activity[]): Activity[] {
  const n = activities.length;
  if (n === 0) return activities.map(a => ({ ...a }));

  if (n === 1) {
    // Single activity occupies the full pie regardless of stored weight (R15).
    // Clamp post-round to 0.01 so a sub-floor input (e.g. 0.001 → round2 = 0) never persists as 0.
    return [{ ...activities[0], weight: Math.max(0.01, round2(activities[0].weight)) }];
  }

  let working = activities.map(a => ({ ...a }));
  let total = working.reduce((sum, a) => sum + a.weight, 0);
  if (total <= 0) {
    // Fully degenerate: seed equal weights so renormalization has something to operate on.
    working = working.map(a => ({ ...a, weight: 1 }));
    total = working.length;
  }

  let floor = getFloor(total);

  // Scale-up branch 1: chart total cannot hold n slices each at floor.
  if (n * floor > total) {
    const factor = Math.ceil(((n * floor) / total) * 100) / 100;
    working = working.map(a => ({ ...a, weight: a.weight * factor }));
    total = working.reduce((sum, a) => sum + a.weight, 0);
    floor = getFloor(total);
  }

  // Scale-up branch 2: integer-percentage floor multiplied by n exceeds 100 so the
  // modal slider's domain would be invalid. Doubling each round terminates quickly.
  let safety = 0;
  while (Math.ceil((floor / total) * 100) * n > 100 && safety < 32) {
    working = working.map(a => ({ ...a, weight: a.weight * 2 }));
    total = working.reduce((sum, a) => sum + a.weight, 0);
    floor = getFloor(total);
    safety++;
  }

  // Clamp below-floor weights up and redistribute the deficit proportionally.
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const below = working.filter(a => a.weight < floor);
    if (below.length === 0) break;

    const deficit = below.reduce((sum, a) => sum + (floor - a.weight), 0);
    const above = working.filter(a => a.weight >= floor);
    const aboveSum = above.reduce((sum, a) => sum + (a.weight - floor), 0);
    if (aboveSum <= 0) {
      // Can't redistribute further without dropping someone else below floor.
      working = working.map(a => (a.weight < floor ? { ...a, weight: floor } : a));
      break;
    }

    working = working.map(a => {
      if (a.weight < floor) return { ...a, weight: floor };
      const share = ((a.weight - floor) / aboveSum) * deficit;
      return { ...a, weight: a.weight - share };
    });
  }

  // After rounding, the rounded total can shift `floor` by ≤ 0.01. Re-check and clamp
  // so the persisted invariant (every weight ≥ getFloor(persistedTotal)) actually holds.
  const rounded = working.map(a => ({ ...a, weight: round2(a.weight) }));
  const roundedTotal = rounded.reduce((sum, a) => sum + a.weight, 0);
  const roundedFloor = getFloor(roundedTotal);
  return rounded.map(a => (a.weight < roundedFloor ? { ...a, weight: roundedFloor } : a));
}
