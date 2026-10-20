import type { SVGProps } from 'react';

import { BRAND_MARK_SLICES, BRAND_MARK_VIEWBOX } from '@/app/components/ui/brandMarkGeometry';

// Inline paths rather than an <img>, so the mark also embeds in the image export without tainting its canvas.
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={BRAND_MARK_VIEWBOX}
      // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- an <img> can't draw inline paths, and an image URL would taint the export canvas
      role="img"
      aria-label="Energiekuchen Logo"
      {...props}>
      {BRAND_MARK_SLICES.map(({ layer, transform, d, fill }) => (
        <path key={layer} transform={transform} d={d} fill={fill} />
      ))}
    </svg>
  );
}
