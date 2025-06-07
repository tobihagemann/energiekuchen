# Energiekuchen - Testing Strategy

## Overview

This document outlines the testing strategy for the Energiekuchen web application, covering unit tests with Jest and end-to-end tests with Playwright.

## Testing Philosophy

- **Business Logic Focus**: Unit tests focus only on pure business logic (utils, hooks, contexts)
- **UI Testing Separation**: UI components are tested via E2E tests for real user interactions
- **Type Safety**: Type testing is handled by TypeScript compiler
- **High Coverage Standards**: High coverage thresholds since we only test critical business logic

## Test Configuration

### Jest Setup (Unit & Integration Tests)

**Required Dependencies:**

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@jest/environment-jsdom": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@types/jest": "^29.5.8"
  }
}
```

**Jest Configuration (`jest.config.js`):**

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  collectCoverageFrom: ['app/**/*.{js,jsx,ts,tsx}', '!app/**/*.d.ts', '!app/layout.tsx', '!app/page.tsx'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

**Jest Setup File (`jest.setup.js`):**

```javascript
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));
```

### Playwright Setup (E2E Tests)

**Installation:**

```bash
npm install -D @playwright/test
npx playwright install
```

**Playwright Configuration (`playwright.config.ts`):**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Unit Tests Structure

### Utility Functions (`app/lib/utils/__tests__/`)

**Storage Tests (`storage.test.ts`):**

```typescript
import { StorageManager, exportData, importData } from '../storage';
import { createMockEnergyKuchen } from './mocks';

describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should save and load data correctly', () => {
    const mockData = createMockEnergyKuchen();
    StorageManager.save(mockData);
    const loaded = StorageManager.load();
    expect(loaded).toEqual(mockData);
  });

  test('should handle export and import', () => {
    const mockData = createMockEnergyKuchen();
    const exported = exportData(mockData);
    const imported = importData(exported);
    expect(imported).toEqual(mockData);
  });

  test('should throw error for invalid import data', () => {
    expect(() => importData('invalid json')).toThrow('Ungültige Datei oder Datenformat');
  });
});
```

**Validation Tests (`validation.test.ts`):**

```typescript
import { validateActivity, validateActivityName, validateActivityValue } from '../validation';

describe('Activity Validation', () => {
  test('should validate correct activity', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 50,
      color: '#10B981',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid activity name', () => {
    const result = validateActivityName('');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Name darf nicht leer sein');
  });

  test('should reject invalid activity value', () => {
    const result = validateActivityValue(101);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Wert muss zwischen 1 und 100 liegen');
  });
});
```

**Sharing Tests (`sharing.test.ts`):**

```typescript
import { SharingManager } from '../sharing';
import { createMockEnergyKuchen } from './mocks';

describe('SharingManager', () => {
  test('should generate and decode share data', async () => {
    const mockData = createMockEnergyKuchen();
    const shareData = await SharingManager.generateShareData(mockData);
    const decoded = SharingManager.decodeShareData(shareData.encoded);

    expect(decoded.positive.activities).toEqual(mockData.positive.activities);
    expect(decoded.negative.activities).toEqual(mockData.negative.activities);
  });

  test('should handle URL length limits', async () => {
    const largeData = createMockEnergyKuchen({ activitiesCount: 20 });
    const shareData = await SharingManager.generateShareData(largeData);
    expect(shareData.url.length).toBeLessThan(2048);
  });
});
```

### Component Tests (`app/components/__tests__/`)

**EnergyChart Tests (`charts/EnergyChart.test.tsx`):**

```typescript
import { render, screen } from '@testing-library/react'
import { EnergyChart } from '../charts/EnergyChart'
import { EnergyProvider } from '@/app/lib/contexts/EnergyContext'

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <EnergyProvider>
      {component}
    </EnergyProvider>
  )
}

describe('EnergyChart', () => {
  test('should render positive chart with activities', () => {
    renderWithProvider(<EnergyChart chartType="positive" />)
    expect(screen.getByLabelText(/Positives Energiediagramm/)).toBeInTheDocument()
  })

  test('should show empty state when no activities', () => {
    renderWithProvider(<EnergyChart chartType="positive" />)
    expect(screen.getByText(/Noch keine Aktivitäten/)).toBeInTheDocument()
  })
})
```

**ActivityForm Tests (`forms/ActivityForm.test.tsx`):**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActivityForm } from '../forms/ActivityForm'

describe('ActivityForm', () => {
  test('should submit valid activity', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()

    render(<ActivityForm chartType="positive" onSubmit={onSubmit} onCancel={jest.fn()} />)

    await user.type(screen.getByLabelText(/Name/), 'Sport')
    await user.click(screen.getByRole('button', { name: /Hinzufügen/ }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Sport',
        value: expect.any(Number),
        color: expect.any(String)
      })
    })
  })

  test('should show validation errors', async () => {
    const user = userEvent.setup()

    render(<ActivityForm chartType="positive" onSubmit={jest.fn()} onCancel={jest.fn()} />)

    await user.click(screen.getByRole('button', { name: /Hinzufügen/ }))

    expect(screen.getByText(/Name darf nicht leer sein/)).toBeInTheDocument()
  })
})
```

### Context Tests (`app/lib/contexts/__tests__/`)

**EnergyContext Tests (`EnergyContext.test.tsx`):**

```typescript
import { renderHook, act } from '@testing-library/react'
import { EnergyProvider, useEnergy } from '../EnergyContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyProvider>{children}</EnergyProvider>
)

describe('EnergyContext', () => {
  test('should add activity to positive chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })

    expect(result.current.state.data.positive.activities).toHaveLength(1)
    expect(result.current.state.data.positive.activities[0].name).toBe('Sport')
  })

  test('should update activity correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })

    const activityId = result.current.state.data.positive.activities[0].id

    act(() => {
      result.current.updateActivity('positive', activityId, { name: 'Fitness' })
    })

    expect(result.current.state.data.positive.activities[0].name).toBe('Fitness')
  })
})
```

### Test Utilities (`app/__tests__/utils/mocks.ts`)

```typescript
import { EnergyKuchen, Activity } from '@/app/types';
import { v4 as uuidv4 } from 'uuid';

export function createMockActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: uuidv4(),
    name: 'Test Activity',
    value: 50,
    color: '#10B981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockEnergyKuchen(options?: { activitiesCount?: number }): EnergyKuchen {
  const activitiesCount = options?.activitiesCount || 2;

  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    positive: {
      id: uuidv4(),
      type: 'positive',
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Positive Activity ${i + 1}` })),
      size: 'medium',
    },
    negative: {
      id: uuidv4(),
      type: 'negative',
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Negative Activity ${i + 1}`, color: '#EF4444' })),
      size: 'medium',
    },
  };
}
```

## E2E Tests Structure

### Core User Journeys (`e2e/`)

**Basic Activity Management (`activity-management.spec.ts`):**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Activity Management', () => {
  test('should add, edit, and delete activities', async ({ page }) => {
    await page.goto('/');

    // Add positive activity
    await page.click('[data-testid="add-positive-activity"]');
    await page.fill('[data-testid="activity-name"]', 'Sport');
    await page.fill('[data-testid="activity-value"]', '75');
    await page.click('[data-testid="submit-activity"]');

    // Verify activity appears in chart
    await expect(page.locator('[data-testid="positive-chart"]')).toContainText('Sport');

    // Edit activity
    await page.click('[data-testid="edit-activity-Sport"]');
    await page.fill('[data-testid="activity-name"]', 'Fitness');
    await page.click('[data-testid="submit-activity"]');

    await expect(page.locator('[data-testid="positive-chart"]')).toContainText('Fitness');

    // Delete activity
    await page.click('[data-testid="delete-activity-Fitness"]');
    await page.click('[data-testid="confirm-delete"]');

    await expect(page.locator('[data-testid="positive-chart"]')).not.toContainText('Fitness');
  });
});
```

**Sharing Workflow (`sharing.spec.ts`):**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sharing Functionality', () => {
  test('should share and load chart via URL', async ({ page, context }) => {
    await page.goto('/');

    // Create activities
    await page.click('[data-testid="add-positive-activity"]');
    await page.fill('[data-testid="activity-name"]', 'Meditation');
    await page.click('[data-testid="submit-activity"]');

    // Generate share URL
    await page.click('[data-testid="share-button"]');
    const shareUrl = await page.inputValue('[data-testid="share-url"]');

    // Open in new tab
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);

    // Verify shared data loaded
    await expect(newPage.locator('[data-testid="positive-chart"]')).toContainText('Meditation');
  });
});
```

**Responsive Design (`responsive.spec.ts`):**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should work correctly on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

    // Test touch interactions
    await page.tap('[data-testid="add-positive-activity"]');
    await expect(page.locator('[data-testid="activity-form"]')).toBeVisible();
  });
});
```

**Data Persistence (`persistence.spec.ts`):**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Data Persistence', () => {
  test('should persist data across page reloads', async ({ page }) => {
    await page.goto('/');

    // Add activity
    await page.click('[data-testid="add-positive-activity"]');
    await page.fill('[data-testid="activity-name"]', 'Yoga');
    await page.click('[data-testid="submit-activity"]');

    // Reload page
    await page.reload();

    // Verify data persisted
    await expect(page.locator('[data-testid="positive-chart"]')).toContainText('Yoga');
  });
});
```

## Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## Coverage Requirements

- **Utility Functions**: 90%+ coverage (critical business logic)
- **Components**: 80%+ coverage (focus on user interactions)
- **Contexts**: 85%+ coverage (state management is crucial)
- **E2E**: Cover all critical user journeys and device types

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Testing Best Practices

1. **Test Names**: Use descriptive German test names that explain the expected behavior
2. **Arrange-Act-Assert**: Structure tests clearly with setup, action, and verification
3. **Mock External Dependencies**: Mock Chart.js, localStorage, and network calls
4. **Test User Behavior**: Focus on what users do, not implementation details
5. **Accessibility**: Include basic accessibility tests in E2E suites
6. **Error States**: Test error handling and edge cases thoroughly
7. **Performance**: Include basic performance assertions in E2E tests

This strategy provides a solid foundation for comprehensive testing while remaining practical to implement.
