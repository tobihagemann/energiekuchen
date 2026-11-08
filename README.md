# 🥧 Energiekuchen

A visual energy management tool that helps users balance their daily energy sources and drains through interactive pie charts.

## What is Energiekuchen?

Energiekuchen is a client-side web application that serves as a visual coaching tool for energy management. Users can create dual pie charts to visualize:

- **📍 Ist-Zustand** (Current State): How your energy is currently distributed across various activities - both energy-giving (positive) and energy-draining (negative)
- **🎯 Wunsch-Zustand** (Desired State): How you want your energy to be distributed in the future

Each activity is rated on a scale from -5 (strong energy drain) to +5 (strong energy source), allowing you to see the full spectrum of your energy landscape in one place. The application helps identify energy imbalances and plan improvements to achieve better work-life balance.

## Getting Started

### Prerequisites

- Node.js 22.13 or later
- pnpm 11.x or later (or run `corepack enable` to use the version pinned in package.json)

### Installation

```bash
pnpm install
pnpm dev
```

Open [http://localhost:16749](http://localhost:16749) to see the application.

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm prod             # Build and start production server

# Code Quality
pnpm lint             # Run tsc + oxlint + oxfmt checks
pnpm format           # Format code with oxfmt + oxlint
pnpm knip             # Check for unused dependencies, exports, and types

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run end-to-end tests
pnpm test:all         # Run all tests

# Brand
pnpm icon             # Re-render the app icon, favicons, and logo from the Icon Composer document
```

### App Icon

The icon's source is the Icon Composer document `tools/brand/Energiekuchen.icon`. It has a yellow-300 to yellow-500 gradient fill and one glass layer per pie slice, with the pie filling the large circle of Apple's icon grid. The slices are the three subpaths of Font Awesome Free's solid `chart-pie`, unchanged and placed by each path's `transform`.

`icon.json` holds the colors: the gradient and the green and red wedges in Display P3, converted from the palette's oklch values. The big slice is white frosted glass in a group of its own, since yellow would vanish on the yellow fill. The flat mark (favicons, `BrandMark`) takes each wedge's color from `icon.json`, clipped to sRGB. The white slice keeps its flat amber-400 in its layer SVG as sRGB hex, because `ictool` paints `oklch()` fills black.

`pnpm icon` renders the document through the `ictool` inside Xcode's Icon Composer, so it runs only on a Mac with Xcode installed. It writes `apple-touch-icon.png` into `public/`, keeping the render's Display P3 profile because the gradient lies outside sRGB. Its corners are filled, because iOS masks a touch icon itself. The script also draws the layer SVGs flat, without the glass or the squircle, as `favicon.svg` and `favicon.ico`. Last, it writes `app/components/ui/brandMarkGeometry.ts`, the paths that `BrandMark` draws inline in the headers and the image export. Nothing checks these files against the document, so re-render them in the same commit as any edit to it.

## Deployment

The application is deployed as a static site on GitHub Pages at [energiekuchen.de](https://energiekuchen.de).

```bash
# Build for production
pnpm build

# The built application creates static files in the 'out' directory
```

## License

Distributed under the MIT license. See the LICENSE file for more info.

The logo and app icon are based on Font Awesome Free's "chart-pie" icon, licensed under [CC BY 4.0](https://fontawesome.com/license/free).
