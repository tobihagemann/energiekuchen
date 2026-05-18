'use client';

import { useEffect, useRef, useState } from 'react';

import type { RenderedEntry } from '@/app/lib/hooks/useChartData';
import { normalizeAngle } from '@/app/lib/utils/polar';
import type { LabelOffset } from '@/app/types';

const DEFAULT_DURATION_MS = 150;
const GHOST_EPSILON = 1e-3;

export interface AnimatedRenderedEntry extends RenderedEntry {
  // True while the entry is fading out (no longer in target, weight animating to 0).
  // Consumers should suppress interactivity for ghosts and drop them at animation end.
  isGhost: boolean;
}

interface AnimationOptions {
  durationMs?: number;
  // Snap to target without animating. Use during pointer drags so the chart tracks the
  // cursor 1:1 rather than lagging behind.
  bypass: boolean;
}

interface Snapshot {
  weight: number;
  offset: LabelOffset;
  // Static fields preserved for ghosts so we can keep rendering after the activity is gone.
  name: string;
  polarity: RenderedEntry['polarity'];
  details: string | undefined;
}

interface AnimationTarget {
  id: string;
  weight: number;
  offset: LabelOffset;
  // Original labelOffset (may be undefined). At t=1 for non-ghosts, we restore undefined
  // so EnergyContext's "no offset" state is preserved across animations.
  rawOffset: LabelOffset | undefined;
  name: string;
  polarity: RenderedEntry['polarity'];
  details: string | undefined;
  isGhost: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function materializeOffset(o: LabelOffset | undefined): LabelOffset {
  return o ?? { radial: 0, angular: 0 };
}

function snapshot(e: RenderedEntry): Snapshot {
  return {
    weight: e.weight,
    offset: materializeOffset(e.labelOffset),
    name: e.name,
    polarity: e.polarity,
    details: e.details,
  };
}

// Build the ordered animation set: target entries in target order, with ghosts (ids that
// were present last frame but aren't in target) re-inserted after their previous predecessor
// to preserve their relative position around the pie while they shrink away.
function buildTargets(target: RenderedEntry[], current: AnimatedRenderedEntry[]): AnimationTarget[] {
  const targetIds = new Set(target.map(e => e.id));
  const ghostsByPredecessor: Record<string, AnimationTarget[]> = {};
  const headGhosts: AnimationTarget[] = [];
  let prevTargetId: string | null = null;
  for (const c of current) {
    if (targetIds.has(c.id)) {
      prevTargetId = c.id;
      continue;
    }
    if (c.weight <= GHOST_EPSILON) continue;
    const ghost: AnimationTarget = {
      id: c.id,
      weight: 0,
      offset: materializeOffset(c.labelOffset),
      rawOffset: c.labelOffset,
      name: c.name,
      polarity: c.polarity,
      details: c.details,
      isGhost: true,
    };
    if (prevTargetId === null) headGhosts.push(ghost);
    else (ghostsByPredecessor[prevTargetId] ??= []).push(ghost);
  }

  const out: AnimationTarget[] = [...headGhosts];
  for (const e of target) {
    out.push(targetFromEntry(e));
    const trailing = ghostsByPredecessor[e.id];
    if (trailing) for (const g of trailing) out.push(g);
  }
  return out;
}

function targetsEqual(a: AnimationTarget[], b: AnimationTarget[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].isGhost !== b[i].isGhost) return false;
    if (a[i].weight !== b[i].weight) return false;
    if (a[i].offset.radial !== b[i].offset.radial) return false;
    if (a[i].offset.angular !== b[i].offset.angular) return false;
    // Metadata is rendered from `displayed`, so a rename, details edit, or in-place
    // polarity flip must propagate even when nothing geometric changes.
    if (a[i].name !== b[i].name) return false;
    if (a[i].polarity !== b[i].polarity) return false;
    if (a[i].details !== b[i].details) return false;
  }
  return true;
}

function snapToTarget(target: RenderedEntry[]): AnimatedRenderedEntry[] {
  return target.map(e => ({ ...e, isGhost: false }));
}

// Live (non-ghost) AnimationTarget for an entry. Centralizing the construction here keeps
// the three sites that need it (initial toRef, bypass reset, buildTargets's live pass) in
// lock-step when a new metadata field is added to the target shape.
function targetFromEntry(e: RenderedEntry): AnimationTarget {
  return {
    id: e.id,
    weight: e.weight,
    offset: materializeOffset(e.labelOffset),
    rawOffset: e.labelOffset,
    name: e.name,
    polarity: e.polarity,
    details: e.details,
    isGhost: false,
  };
}

export function useAnimatedRenderedEntries(target: RenderedEntry[], { bypass, durationMs = DEFAULT_DURATION_MS }: AnimationOptions): AnimatedRenderedEntry[] {
  const [displayed, setDisplayed] = useState<AnimatedRenderedEntry[]>(() => snapToTarget(target));
  const rafIdRef = useRef<number | null>(null);
  const fromRef = useRef<Map<string, Snapshot>>(new Map(target.map(e => [e.id, snapshot(e)])));
  const toRef = useRef<AnimationTarget[]>(target.map(targetFromEntry));
  const startRef = useRef<number>(0);
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  useEffect(() => {
    if (bypass) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      const snapped = snapToTarget(target);
      setDisplayed(snapped);
      fromRef.current = new Map(target.map(e => [e.id, snapshot(e)]));
      toRef.current = target.map(targetFromEntry);
      return;
    }

    const newTargets = buildTargets(target, displayedRef.current);
    if (rafIdRef.current === null && targetsEqual(newTargets, toRef.current)) {
      return;
    }

    const newFrom = new Map<string, Snapshot>();
    const currentById = new Map(displayedRef.current.map(d => [d.id, d]));
    for (const t of newTargets) {
      const existing = currentById.get(t.id);
      if (existing) {
        newFrom.set(t.id, snapshot(existing));
      } else {
        // New entry: grow from weight 0 with a zero-offset baseline.
        newFrom.set(t.id, {
          weight: 0,
          offset: { radial: 0, angular: 0 },
          name: t.name,
          polarity: t.polarity,
          details: t.details,
        });
      }
    }
    fromRef.current = newFrom;
    toRef.current = newTargets;
    startRef.current = performance.now();

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeInOutCubic(t);
      const next: AnimatedRenderedEntry[] = [];
      for (const to of toRef.current) {
        const from = fromRef.current.get(to.id);
        if (!from) continue;
        // Ghost gets dropped at the end of the animation; until then it renders with a
        // shrinking weight so its slice fades away geometrically.
        if (t >= 1 && to.isGhost) continue;
        const weight = from.weight + (to.weight - from.weight) * eased;
        const angularDelta = normalizeAngle(to.offset.angular - from.offset.angular);
        const radial = from.offset.radial + (to.offset.radial - from.offset.radial) * eased;
        const angular = normalizeAngle(from.offset.angular + angularDelta * eased);
        // Restore the raw undefined-vs-defined offset at t=1 so a target of "no offset"
        // doesn't leave a phantom {radial:0,angular:0} in place.
        const labelOffset: LabelOffset | undefined = t >= 1 ? to.rawOffset : { radial, angular };
        next.push({
          id: to.id,
          name: to.name,
          polarity: to.polarity,
          details: to.details,
          weight,
          labelOffset,
          isGhost: to.isGhost && t < 1,
        });
      }
      setDisplayed(next);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- displayedRef captures current displayed only at retarget time
  }, [target, bypass, durationMs]);

  useEffect(
    () => () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    },
    []
  );

  return displayed;
}
