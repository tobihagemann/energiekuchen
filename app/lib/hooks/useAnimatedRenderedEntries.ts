'use client';

import { useEffect, useRef, useState } from 'react';

import type { RenderedEntry } from '@/app/lib/hooks/useChartData';
import { DEFAULT_LABEL_OFFSET } from '@/app/lib/utils/constants';
import { normalizeAngle } from '@/app/lib/utils/polar';
import { assignShadeDepths } from '@/app/lib/utils/shade';
import { computeStartAngles } from '@/app/lib/utils/sliceAngles';
import type { LabelOffset } from '@/app/types';

const DEFAULT_DURATION_MS = 150;
const GHOST_EPSILON = 1e-3;

export interface AnimatedRenderedEntry extends RenderedEntry {
  // True while the entry is fading out (no longer in target, weight animating to 0).
  // Consumers should suppress interactivity for ghosts and drop them at animation end.
  isGhost: boolean;
  // Materialized end-to-end ({0,0} = "no offset"), so the hook output carries no
  // undefined-vs-defined ambiguity; consumers read source offsets elsewhere.
  labelOffset: LabelOffset;
  // Rank-within-polarity depth driving the slice's shade. Always present so the chart's
  // getShadeColor never sees undefined; eased like weight so color glides at crossovers.
  shadeDepth: number;
  // Animated start angle, populated only during reorder transitions (undefined otherwise,
  // letting useChartData fall back to its own contiguous walk).
  startAngle?: number;
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
  shadeDepth: number;
  // Set only when the `from` side of a reorder transition; undefined leaves the channel inert.
  startAngle: number | undefined;
  // Static fields preserved for ghosts so we can keep rendering after the activity is gone.
  name: string;
  polarity: RenderedEntry['polarity'];
  details: string | undefined;
}

interface AnimationTarget {
  id: string;
  weight: number;
  offset: LabelOffset;
  shadeDepth: number;
  // Set only during a reorder transition (for every entry, all-or-nothing); undefined otherwise.
  startAngle: number | undefined;
  name: string;
  polarity: RenderedEntry['polarity'];
  details: string | undefined;
  isGhost: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function materializeOffset(o: LabelOffset | undefined): LabelOffset {
  return o ?? DEFAULT_LABEL_OFFSET;
}

function snapshot(e: RenderedEntry, shadeDepth: number, startAngle: number | undefined): Snapshot {
  return {
    weight: e.weight,
    offset: materializeOffset(e.labelOffset),
    shadeDepth,
    startAngle,
    name: e.name,
    polarity: e.polarity,
    details: e.details,
  };
}

// Build the ordered animation set: target entries in target order, with ghosts (ids that
// were present last frame but aren't in target) re-inserted after their previous predecessor
// to preserve their relative position around the pie while they shrink away. Shade depths are
// ranked over the ghost-free target only (a vanishing slice must not perturb the band step or
// inflate n); ghosts carry their last captured depth so `tick` can keep lerping it.
function buildTargets(target: RenderedEntry[], current: AnimatedRenderedEntry[]): AnimationTarget[] {
  // When the chart empties (last activity deleted) there is no surviving slice for the ghost
  // to shrink against — its sweep stays a full 2π and would pop at t=1 — so drop straight to
  // the empty state instead of holding a full-circle ghost.
  if (target.length === 0) return [];
  const depths = assignShadeDepths(target);
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
      shadeDepth: c.shadeDepth,
      startAngle: undefined,
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
    out.push(targetFromEntry(e, depths[e.id]));
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
    if (a[i].shadeDepth !== b[i].shadeDepth) return false;
    if (a[i].startAngle !== b[i].startAngle) return false;
    // Metadata is rendered from `displayed`, so a rename, details edit, or in-place
    // polarity flip must propagate even when nothing geometric changes.
    if (a[i].name !== b[i].name) return false;
    if (a[i].polarity !== b[i].polarity) return false;
    if (a[i].details !== b[i].details) return false;
  }
  return true;
}

// The `depths` map defaults to a fresh ranking but can be passed in by callers (the drag
// bypass path) that build all three of snapped/snapshot/targets from one `target` per frame,
// so the rank-sort runs once instead of three times.
function snapToTarget(target: RenderedEntry[], depths = assignShadeDepths(target)): AnimatedRenderedEntry[] {
  return target.map(e => ({ ...e, labelOffset: materializeOffset(e.labelOffset), shadeDepth: depths[e.id], startAngle: undefined, isGhost: false }));
}

// Live (non-ghost) AnimationTarget for an entry. Single construction site so every caller
// stays in lock-step when a field is added to the target shape; the reorder effect populates
// `startAngle` separately, since it derives from the whole-ring walk, not a per-entry field.
function targetFromEntry(e: RenderedEntry, shadeDepth: number): AnimationTarget {
  return {
    id: e.id,
    weight: e.weight,
    offset: materializeOffset(e.labelOffset),
    shadeDepth,
    startAngle: undefined,
    name: e.name,
    polarity: e.polarity,
    details: e.details,
    isGhost: false,
  };
}

function targetsFromEntries(target: RenderedEntry[], depths = assignShadeDepths(target)): AnimationTarget[] {
  return target.map(e => targetFromEntry(e, depths[e.id]));
}

function snapshotMap(target: RenderedEntry[], depths = assignShadeDepths(target)): Map<string, Snapshot> {
  return new Map(target.map(e => [e.id, snapshot(e, depths[e.id], undefined)]));
}

// A reorder is a same-membership permutation: the displayed (non-ghost) ids and the target
// ids are the same set but in a different order. A membership change (add/delete) is not a
// reorder — the angle channel stays inert and the chart snaps to its contiguous walk.
function isReorder(displayed: AnimatedRenderedEntry[], target: RenderedEntry[]): boolean {
  const displayedIds = displayed.filter(d => !d.isGhost).map(d => d.id);
  const targetIds = target.map(t => t.id);
  if (displayedIds.length !== targetIds.length) return false;
  const displayedSet = new Set(displayedIds);
  if (!targetIds.every(id => displayedSet.has(id))) return false;
  return displayedIds.some((id, i) => id !== targetIds[i]);
}

// Map each entry's id to its start angle from the ghost-inclusive contiguous walk (the same
// set and order useChartData renders), so a moved slice eases from its old slot to its new one.
function startAngleById(entries: { id: string; weight: number }[]): Map<string, number> {
  const starts = computeStartAngles(entries.map(e => e.weight));
  return new Map(entries.map((e, i) => [e.id, starts[i]]));
}

export function useAnimatedRenderedEntries(target: RenderedEntry[], { bypass, durationMs = DEFAULT_DURATION_MS }: AnimationOptions): AnimatedRenderedEntry[] {
  const [displayed, setDisplayed] = useState<AnimatedRenderedEntry[]>(() => snapToTarget(target));
  const rafIdRef = useRef<number | null>(null);
  const fromRef = useRef<Map<string, Snapshot>>(snapshotMap(target));
  const toRef = useRef<AnimationTarget[]>(targetsFromEntries(target));
  const startRef = useRef<number>(0);
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;

  useEffect(() => {
    if (bypass) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      const depths = assignShadeDepths(target);
      setDisplayed(snapToTarget(target, depths));
      fromRef.current = snapshotMap(target, depths);
      toRef.current = targetsFromEntries(target, depths);
      return;
    }

    const newTargets = buildTargets(target, displayedRef.current);
    if (rafIdRef.current === null && targetsEqual(newTargets, toRef.current)) {
      return;
    }

    // Emptying the chart has nothing to animate (buildTargets dropped the lone ghost), so
    // clear immediately rather than holding the old frame for a rAF tick and then spinning an
    // empty animation loop until durationMs elapses.
    if (newTargets.length === 0) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      setDisplayed([]);
      fromRef.current = new Map();
      toRef.current = [];
      return;
    }

    // During a reorder, assign every target an animated start angle (all-or-nothing, so
    // useChartData never mixes animated starts with its contiguous fallback). The `from`
    // walk runs over the previous displayed set (mid-interpolation weights are fine and
    // keep the motion continuous); the `to` walk over the new ghost-inclusive target set.
    const prevDisplayed = displayedRef.current;
    const reordering = isReorder(prevDisplayed, target);
    const fromStarts = reordering ? startAngleById(prevDisplayed) : null;
    if (reordering) {
      const toStarts = startAngleById(newTargets);
      for (const t of newTargets) t.startAngle = toStarts.get(t.id);
    }

    const newFrom = new Map<string, Snapshot>();
    const currentById = new Map(prevDisplayed.map(d => [d.id, d]));
    for (const t of newTargets) {
      const existing = currentById.get(t.id);
      // Existing entries ease from where they actually are on screen — prefer the live
      // `existing.startAngle` so a reorder interrupting an in-flight reorder stays continuous
      // rather than snapping to the contiguous walk; fall back to that walk on a first reorder
      // (no live angle yet), then to the target as the guaranteed-defined floor.
      const startAngle = reordering ? (existing?.startAngle ?? fromStarts!.get(t.id) ?? t.startAngle) : undefined;
      if (existing) {
        newFrom.set(t.id, snapshot(existing, existing.shadeDepth, startAngle));
      } else {
        // New entry: grow from weight 0 with a zero-offset baseline and the final shade.
        newFrom.set(t.id, {
          weight: 0,
          offset: DEFAULT_LABEL_OFFSET,
          shadeDepth: t.shadeDepth,
          startAngle,
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
        const shadeDepth = from.shadeDepth + (to.shadeDepth - from.shadeDepth) * eased;
        // Start angle eases shortest-arc (same form as the offset-angular lerp) only when
        // both ends carry one, i.e. during a reorder; otherwise the channel stays inert.
        let startAngle: number | undefined;
        if (from.startAngle !== undefined && to.startAngle !== undefined) {
          const startDelta = normalizeAngle(to.startAngle - from.startAngle);
          startAngle = from.startAngle + startDelta * eased;
        }
        next.push({
          id: to.id,
          name: to.name,
          polarity: to.polarity,
          details: to.details,
          weight,
          labelOffset: { radial, angular },
          shadeDepth,
          startAngle,
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
