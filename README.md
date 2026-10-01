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
pnpm lint             # Run tsgo + oxlint + oxfmt checks
pnpm format           # Format code with oxfmt + oxlint
pnpm knip             # Check for unused dependencies, exports, and types

# Testing
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run end-to-end tests
pnpm test:all         # Run all tests
```

## Deployment

The application is deployed as a static site on GitHub Pages at [energiekuchen.de](https://energiekuchen.de).

```bash
# Build for production
pnpm build

# The built application creates static files in the 'out' directory
```

## License

Distributed under the MIT license. See the LICENSE file for more info.
