# Energiekuchen - Personal Energy Management Visualization

A German-language web application that helps users visualize and balance their personal energy through interactive pie charts. Users create dual charts comparing their current energy state (Ist-Zustand) against their desired energy state (Wunsch-Zustand). Each chart can contain both energy-giving (positive) and energy-draining (negative) activities.

## Common Development Commands

```bash
# Code Quality
pnpm lint             # Run tsgo + oxlint + oxfmt checks
pnpm format           # Format code with oxfmt + oxlint
pnpm knip             # Check for unused dependencies, exports, and types

# Testing
pnpm test             # Run unit tests (Jest)
pnpm test:coverage    # Run tests with coverage report
pnpm test:e2e         # Run end-to-end tests (Playwright)
pnpm test:all         # Run all tests (unit + e2e)

# Production Build
pnpm build            # Build for production
```

## High-Level Architecture

### Tech Stack

- **Next.js 16** with App Router for static site generation
- **React 19** with TypeScript for component development
- **Chart.js** for interactive pie chart visualizations
- **React Context API** with useReducer for state management
- **Tailwind CSS 4** for responsive styling
- **Client-side only** - no server dependencies, all data in localStorage

### Core Architecture Pattern

```
/app
├── components/       # UI components (NOT unit tested, covered by E2E)
│   ├── charts/       # Chart visualization
│   ├── features/     # Feature components (modals, lists)
│   └── ui/           # Base UI components
├── lib/              # Business logic (MUST have unit tests)
│   ├── contexts/     # Global state management
│   ├── hooks/        # Custom React hooks
│   └── utils/        # Pure utility functions
└── share/[data]/     # Dynamic route for URL-based sharing
```

### State Management Architecture

The app uses two main contexts:

1. **EnergyContext**: Manages chart data and persistence
   - Handles all activity CRUD operations
   - Auto-syncs with localStorage on state changes
   - Manages data validation and constraints

2. **UIContext**: Manages UI state
   - Modal visibility states
   - Currently editing activity
   - Form state management

### Testing Philosophy

**Dual-Layer Testing Approach:**

- **Unit Tests (Jest)**: Business logic only - utils, hooks, contexts (90%+ coverage required)
- **E2E Tests (Playwright)**: All UI interactions and user journeys
- UI components are deliberately NOT unit tested

## Key Development Constraints

### Data Structure

```typescript
interface Activity {
  id: string;
  name: string; // 1-50 chars, supports all Unicode (emojis, accents, symbols)
  weight: number; // > 0, persisted to 2 decimals; slice angle = weight / chartTotal
  polarity: 'positive' | 'negative'; // green = positive (Energiequelle), red = negative (Energieräuber)
  details?: string; // Optional details text (max 150 chars, supports multi-line)
  labelOffset?: { radial: number; angular: number }; // Optional polar offset from the slice centroid
  // Note: color is computed from polarity and the slice's weight rank within its polarity
  // (larger = darker shade), not stored; slice size comes directly from weight.
}
```

### Validation Rules

- Maximum 20 activities per chart (current/desired state)
- Activity names: 1-50 characters, supports all Unicode characters (emojis, accented letters, symbols, etc.)
- Activity weights must be finite positive numbers up to 10000 (persisted at 2-decimal precision)
- Activity polarity is either `'positive'` (Energiequelle, green) or `'negative'` (Energieräuber, red)
- Floor: each slice is renormalized to ≥ 1% of the chart total (`getFloor` in `app/lib/utils/floor.ts`); the edit modal's slider works in integer percentages over `[floorPct, 100 - (n-1) * floorPct]`
- Activity details (optional): max 150 characters, supports multi-line text
- URL sharing limited to 2000 characters (`MAX_URL_LENGTH` in `app/lib/utils/constants.ts`)
- All user-facing text must be in German

### Responsive Breakpoints

Two independent responsive systems govern layout:

- **Chart size** (`useResponsive` in `app/lib/hooks/useResponsive.ts`): `isSmall` <640px, `isMedium` 640–1279px, `isLarge` ≥1280px. Drives the chart pixel size (280 / 360 / 440 px).
- **Dashboard grid** (`app/page.tsx`, Tailwind `lg:grid-cols-2`): single column <1024px, two columns ≥1024px.

The breakpoints do not align: the 1024–1279 px window renders two medium-sized (360 px) charts side-by-side. Any work on chart sizing must account for this window.

## Important Development Notes

1. **German Language Required**: All UI text, labels, error messages must be in German using informal "du" (duzen) instead of formal "Sie" (siezen). Code comments can be English.

2. **Client-Side Only**: No API calls or server-side rendering. Everything runs in the browser with localStorage.

3. **Testing Mobile Differences**: Mobile Chrome has different slider precision — for slider interactions in tests, prefer keyboard events (ArrowLeft/Right, Home, End) over pointer drags to avoid flakiness on the integer-percent weight slider.

4. **Accessibility**: WCAG 2.1 AA compliance required. Maintain keyboard navigation and ARIA labels.

5. **Performance**: Keep bundle size minimal for fast initial loads (<3s target).

6. **Color Definitions**: When defining colors in code (not using Tailwind classes), always use oklch color format from `docs/color-palette.md`.

7. **Playwright CI Container**: E2E runs in CI inside the `mcr.microsoft.com/playwright:vX.Y.Z-noble` container pinned in `.github/workflows/test.yml`, which ships pre-baked browsers for that exact Playwright version. When upgrading `@playwright/test`, bump this image tag in lockstep — otherwise CI fails with `browserType.launch: Executable doesn't exist` even though local tests pass (your machine has browsers installed for the new version).

## Common Tasks

When modifying charts:

- Edit `app/lib/hooks/useChartData.ts` for chart configuration
- Update `app/components/charts/EnergyChart.tsx` for rendering
- Test responsive behavior across all breakpoints

When adding features:

- Create feature component in `app/components/features/`
- Add state to appropriate context if needed
- Write E2E tests covering all user interactions
- Ensure German translations for all text

When fixing bugs:

- Check if it's a business logic issue (add unit test)
- Check if it's a UI issue (add E2E test)
- Run `pnpm test:all`

In general:

- Use tests to verify results instead of running a development server
- Run `pnpm format` at the very end
