# app/components — UI

## E2E specs

Coverage lives in Playwright specs at `e2e/*.spec.ts` (kebab-case, e.g. `e2e/chart-keyboard.spec.ts`), run with `pnpm test:e2e`. When you change UI behavior, update or add the matching spec.

## Gotchas

- **Chart announcer:** debounced and coalescing, so you can't assert "nothing was announced". `getPercentage` rounds to an integer, so ~1% steps may not move the displayed value.
- **SVG `touch-action: none`** belongs on the **outer** `<svg>` — WebKit ignores it on inner SVG elements.
- **oxlint `jsx-a11y/prefer-tag-over-role`** blocks `role="group"`/`role="button"` on SVG. Disable it inline, adjacent to the attribute.
- **Custom `role="radio"` buttons** need focus-follows-selection for both keyboard arrows and clicks.
- **Measuring chart content:** `getBoundingClientRect` on foreignObject labels returns screen CSS px, but `labelLayout` consumes bboxes as SVG user units and the chart can render at scale < 1. Convert via `svgUserUnitsPerCssPx` (in `app/lib/utils/polar.ts`) before feeding any measured DOM size into chart geometry.
- **Rasterizing the chart to an image:** chart labels live in `<foreignObject>` HTML (`PieLabel.tsx`), which **blanks out when the SVG is serialized and rasterized via `<img>`→canvas in WebKit/Safari**. Any image/PNG export must render labels as native SVG `<text>` (not reuse the live foreignObject). `useChartData` is a pure `useMemo` with no DOM dependency, so it can be reused headlessly with `labelBBoxes: {}` (falls back to `estimateBBox`) — but that estimate is too crude for export fidelity, so measure the rendered `<text>` via `getBBox` and re-run the hook (two-pass).
