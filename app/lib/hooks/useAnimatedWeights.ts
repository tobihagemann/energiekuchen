'use client';

import { useEffect, useRef, useState } from 'react';

import { normalizeAngle } from '@/app/lib/utils/polar';
import type { LabelOffset } from '@/app/types';

const DEFAULT_DURATION_MS = 150;

interface AnimationOptions {
  durationMs?: number;
  bypass: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useAnimatedWeights(targetWeights: number[], { durationMs = DEFAULT_DURATION_MS, bypass }: AnimationOptions): number[] {
  const [displayed, setDisplayed] = useState<number[]>(targetWeights);
  const rafIdRef = useRef<number | null>(null);
  const fromRef = useRef<number[]>(targetWeights);
  const toRef = useRef<number[]>(targetWeights);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (bypass || targetWeights.length !== displayed.length) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      setDisplayed(targetWeights);
      fromRef.current = targetWeights;
      toRef.current = targetWeights;
      return;
    }

    if (arraysEqual(targetWeights, toRef.current) && rafIdRef.current === null) {
      return;
    }

    fromRef.current = displayed.slice();
    toRef.current = targetWeights;
    startRef.current = performance.now();

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeInOutCubic(t);
      const next = fromRef.current.map((from, i) => from + (toRef.current[i] - from) * eased);
      setDisplayed(next);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- displayed is intentionally captured as the from-vector only on retarget
  }, [targetWeights, bypass, durationMs]);

  useEffect(
    () => () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    },
    []
  );

  return displayed;
}

export function useAnimatedLabelOffsets(
  targetOffsets: Array<LabelOffset | undefined>,
  { durationMs = DEFAULT_DURATION_MS, bypass }: AnimationOptions
): Array<LabelOffset | undefined> {
  const [displayed, setDisplayed] = useState<Array<LabelOffset | undefined>>(targetOffsets);
  const rafIdRef = useRef<number | null>(null);
  const fromRef = useRef<Array<LabelOffset>>(targetOffsets.map(materialize));
  const toRef = useRef<Array<LabelOffset | undefined>>(targetOffsets);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (bypass || targetOffsets.length !== displayed.length) {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      setDisplayed(targetOffsets);
      fromRef.current = targetOffsets.map(materialize);
      toRef.current = targetOffsets;
      return;
    }

    if (offsetsEqual(targetOffsets, toRef.current) && rafIdRef.current === null) {
      return;
    }

    fromRef.current = displayed.map(materialize);
    toRef.current = targetOffsets;
    startRef.current = performance.now();

    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);

    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeInOutCubic(t);
      const next = fromRef.current.map<LabelOffset | undefined>((from, i) => {
        const target = toRef.current[i];
        if (t >= 1 && target === undefined) return undefined;
        const targetMaterialized = materialize(target);
        const angularDelta = normalizeAngle(targetMaterialized.angular - from.angular);
        return {
          radial: from.radial + (targetMaterialized.radial - from.radial) * eased,
          angular: normalizeAngle(from.angular + angularDelta * eased),
        };
      });
      setDisplayed(next);
      if (t < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        rafIdRef.current = null;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- displayed is the from-vector only on retarget
  }, [targetOffsets, bypass, durationMs]);

  useEffect(
    () => () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    },
    []
  );

  return displayed;
}

function materialize(offset: LabelOffset | undefined): LabelOffset {
  return offset ?? { radial: 0, angular: 0 };
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function offsetsEqual(a: Array<LabelOffset | undefined>, b: Array<LabelOffset | undefined>): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === bi) continue;
    if (!ai || !bi) return false;
    if (ai.radial !== bi.radial || ai.angular !== bi.angular) return false;
  }
  return true;
}
