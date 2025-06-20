# Energiekuchen - Personal Energy Management Visualization

A German-language web application that helps users visualize and balance their personal energy through interactive pie charts. Users create dual charts comparing energy sources (positive activities) against energy drains (negative activities).

## Common Development Commands

```bash
# Development
npm run dev -- -p 3001 # Start dev server (default port is 3000, use 3001 or higher to avoid conflicts)

# Code Quality
npm run lint           # Run TypeScript + ESLint + Prettier checks
npm run format         # Format code with Prettier + ESLint
npm run knip           # Check for unused dependencies, exports, and types

# Testing
npm run test           # Run unit tests (Jest)
npm run test:coverage  # Run tests with coverage report
npm run test:e2e       # Run end-to-end tests (Playwright)
npm run test:all       # Run all tests (unit + e2e)

# Production Build
npm run build          # Build for production
```

## High-Level Architecture

### Tech Stack

- **Next.js 15** with App Router for static site generation
- **React 19** with TypeScript for component development
- **Chart.js** for interactive pie chart visualizations
- **React Context API** with useReducer for state management
- **Tailwind CSS** for responsive styling
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
  name: string; // 1-50 chars, German characters
  value: number; // 1-5 energy level
  // Note: color is computed from value and chart type, not stored
}
```

### Validation Rules

- Maximum 20 activities per chart (positive/negative)
- Activity values must be integers 1-5 (energy levels)
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

- While troubleshooting, you can use a development server and puppeteer to interact with it
- Use tests to verify results instead of running a development server
- Run `npm run format` at the very end
