// Pure polar/Cartesian helpers. SVG coordinates use a y-down convention; all
// angle math here matches that so callers can pass results straight into <path>
// arc commands and centroid offsets without sign flips.

export interface Point {
  x: number;
  y: number;
}

export interface PolarPoint {
  r: number;
  angle: number;
}

const TWO_PI = Math.PI * 2;

export function polarToCartesian(cx: number, cy: number, r: number, angle: number): Point {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export function cartesianToPolar(cx: number, cy: number, x: number, y: number): PolarPoint {
  const dx = x - cx;
  const dy = y - cy;
  return {
    r: Math.hypot(dx, dy),
    angle: normalizeAngle(Math.atan2(dy, dx)),
  };
}

// Wrap any finite angle into (-π, π]. Mirrors the arithmetic in
// validateLabelOffset so persisted and live values agree at the seam.
export function normalizeAngle(angle: number): number {
  let normalized = ((((angle + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  if (normalized <= -Math.PI) normalized += TWO_PI;
  return normalized;
}

export function sliceCentroid(cx: number, cy: number, radius: number, midAngle: number, fraction = 0.6): Point {
  return polarToCartesian(cx, cy, radius * fraction, midAngle);
}

// Convert a pointer event's client coordinates into the SVG's user-coordinate
// (viewBox) space so geometry math is independent of how the SVG is scaled by CSS.
export function clientToSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const inverse = ctm.inverse();
    return {
      x: clientX * inverse.a + clientY * inverse.c + inverse.e,
      y: clientX * inverse.b + clientY * inverse.d + inverse.f,
    };
  }

  // Fallback path for environments where getScreenCTM is unavailable (older jsdom).
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  const scaleX = viewBox.width / rect.width;
  const scaleY = viewBox.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX + viewBox.x,
    y: (clientY - rect.top) * scaleY + viewBox.y,
  };
}

// getBoundingClientRect on foreignObject content returns screen CSS px, but labelLayout
// consumes label bboxes as SVG user units; this per-axis factor reconciles the two.
export function svgUserUnitsPerCssPx(svg: SVGSVGElement): Point {
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const sx = Math.hypot(ctm.a, ctm.b);
    const sy = Math.hypot(ctm.c, ctm.d);
    if (sx > 0 && sy > 0) return { x: 1 / sx, y: 1 / sy };
  }

  // Fallback path for environments where getScreenCTM is unavailable (older jsdom).
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;
  return {
    x: rect.width > 0 ? viewBox.width / rect.width : 1,
    y: rect.height > 0 ? viewBox.height / rect.height : 1,
  };
}
