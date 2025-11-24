# Energiekuchen - Personal Energy Management Visualization

A German-language web application that helps users visualize and balance their personal energy through interactive pie charts. Users create dual charts comparing their current energy state (Ist-Zustand) against their desired energy state (Wunsch-Zustand). Each chart can contain both energy-giving (positive) and energy-draining (negative) activities.

## Common Development Commands

```bash
# Code Quality
npm run lint          # Run TypeScript + ESLint + Prettier checks
npm run format        # Format code with Prettier + ESLint
npm run knip          # Check for unused dependencies, exports, and types

# Testing
npm run test          # Run unit tests (Jest)
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run end-to-end tests (Playwright)
npm run test:all      # Run all tests (unit + e2e)

# Production Build
npm run build         # Build for production
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
  value: number; // -5 to +5 energy level (excluding 0)
  details?: string; // Optional details text (max 150 chars, supports multi-line)
  // Note: color is computed from value sign (positive = green, negative = red), not stored
  // Chart size is based on exponential transformation: 2^(|value|-1)
  // This creates dramatic visual hierarchy (e.g., value 5 = 16x larger than value 1)
}
```

### Validation Rules

- Maximum 20 activities per chart (current/desired state)
- Activity names: 1-50 characters, supports all Unicode characters (emojis, accented letters, symbols, etc.)
- Activity values must be integers from -5 to +5 (excluding 0)
  - Positive values (+1 to +5): Energy-giving activities (green)
  - Negative values (-5 to -1): Energy-draining activities (red)
  - Zero (0) is selectable in UI but not saveable (validation error)
- Activity details (optional): max 150 characters, supports multi-line text
- URL sharing limited to 2048 characters
- All user-facing text must be in German

### Responsive Breakpoints

- Small: Below 640px (single column)
- Medium: 640px-1279px (two columns)
- Large: 1280px+ (side-by-side charts)

## Important Development Notes

1. **German Language Required**: All UI text, labels, error messages must be in German using informal "du" (duzen) instead of formal "Sie" (siezen). Code comments can be English.

2. **Client-Side Only**: No API calls or server-side rendering. Everything runs in the browser with localStorage.

3. **Testing Mobile Differences**: Mobile Chrome has different slider precision - use values ≤10 in tests to avoid flakiness.

4. **Accessibility**: WCAG 2.1 AA compliance required. Maintain keyboard navigation and ARIA labels.

5. **Performance**: Keep bundle size minimal for fast initial loads (<3s target).

6. **Color Definitions**: When defining colors in code (not using Tailwind classes), always use oklch color format from `docs/color-palette.md`.

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
- Run `npm run test:all`

In general:

- Use tests to verify results instead of running a development server
- Run `npm run format` at the very end
