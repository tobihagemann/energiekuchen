import { cartesianToPolar, clientToSvgPoint, normalizeAngle, polarToCartesian, sliceCentroid } from '../polar';

describe('polarToCartesian', () => {
  test('places (r, 0) on the +x axis', () => {
    const point = polarToCartesian(0, 0, 10, 0);
    expect(point.x).toBeCloseTo(10);
    expect(point.y).toBeCloseTo(0);
  });

  test('places (r, π/2) on the +y axis (SVG y-down)', () => {
    const point = polarToCartesian(0, 0, 10, Math.PI / 2);
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(10);
  });

  test('respects the chart center offset', () => {
    const point = polarToCartesian(100, 50, 5, 0);
    expect(point.x).toBeCloseTo(105);
    expect(point.y).toBeCloseTo(50);
  });
});

describe('cartesianToPolar', () => {
  test('round-trips through polarToCartesian', () => {
    const cx = 50;
    const cy = 50;
    const radius = 30;
    const angle = Math.PI / 3;
    const point = polarToCartesian(cx, cy, radius, angle);
    const polar = cartesianToPolar(cx, cy, point.x, point.y);
    expect(polar.r).toBeCloseTo(radius);
    expect(polar.angle).toBeCloseTo(angle);
  });

  test('reports r=0 at the center', () => {
    const polar = cartesianToPolar(10, 10, 10, 10);
    expect(polar.r).toBe(0);
  });

  test('wraps angle into (-π, π]', () => {
    const polar = cartesianToPolar(0, 0, -1, 0);
    expect(polar.angle).toBeCloseTo(Math.PI);
  });
});

describe('normalizeAngle', () => {
  test('passes through values inside (-π, π]', () => {
    expect(normalizeAngle(1)).toBeCloseTo(1);
    expect(normalizeAngle(-Math.PI + 0.1)).toBeCloseTo(-Math.PI + 0.1);
  });

  test('wraps +3π to π', () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  test('wraps -3π to π (matches validateLabelOffset)', () => {
    expect(normalizeAngle(-3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  test('wraps a value just below -π up to +π', () => {
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI);
  });

  test('large positive wraps consistently', () => {
    expect(normalizeAngle(Math.PI * 2 + 0.5)).toBeCloseTo(0.5);
  });

  test('large negative wraps consistently', () => {
    expect(normalizeAngle(-Math.PI * 2 - 0.5)).toBeCloseTo(-0.5);
  });
});

describe('sliceCentroid', () => {
  test('defaults to r = 0.6 of pie radius', () => {
    const centroid = sliceCentroid(0, 0, 100, 0);
    expect(centroid.x).toBeCloseTo(60);
    expect(centroid.y).toBeCloseTo(0);
  });

  test('respects an explicit fraction', () => {
    const centroid = sliceCentroid(0, 0, 100, Math.PI / 2, 0.5);
    expect(centroid.x).toBeCloseTo(0);
    expect(centroid.y).toBeCloseTo(50);
  });
});

describe('clientToSvgPoint', () => {
  function makeSvg(scale: number, viewBoxSize = 200): SVGSVGElement {
    const rect = { left: 0, top: 0, width: viewBoxSize * scale, height: viewBoxSize * scale };
    const svg = {
      getScreenCTM: () => ({
        a: scale,
        b: 0,
        c: 0,
        d: scale,
        e: 0,
        f: 0,
        inverse: () => ({ a: 1 / scale, b: 0, c: 0, d: 1 / scale, e: 0, f: 0 }),
      }),
      getBoundingClientRect: () => rect,
      viewBox: { baseVal: { x: 0, y: 0, width: viewBoxSize, height: viewBoxSize } },
    } as unknown as SVGSVGElement;
    return svg;
  }

  test('scale-invariant: a half-size SVG maps a client point to the same viewBox point', () => {
    const full = makeSvg(1);
    const half = makeSvg(0.5);
    const fullPoint = clientToSvgPoint(full, 50, 50);
    const halfPoint = clientToSvgPoint(half, 25, 25);
    expect(halfPoint.x).toBeCloseTo(fullPoint.x);
    expect(halfPoint.y).toBeCloseTo(fullPoint.y);
  });

  test('falls back to getBoundingClientRect when getScreenCTM returns null', () => {
    const svg = {
      getScreenCTM: () => null,
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 100, height: 100 }),
      viewBox: { baseVal: { x: 0, y: 0, width: 200, height: 200 } },
    } as unknown as SVGSVGElement;
    const point = clientToSvgPoint(svg, 60, 70);
    expect(point.x).toBeCloseTo(100);
    expect(point.y).toBeCloseTo(100);
  });
});
