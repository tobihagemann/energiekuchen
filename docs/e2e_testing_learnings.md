# E2E Testing Learnings: Playwright and React SPA Testing

## Overview

During the development and maintenance of end-to-end tests for the Energiekuchen React SPA using Playwright, several critical challenges emerged that required iterative solutions and deep learning. This document captures the main insights and patterns discovered while testing complex user interactions, state persistence, and cross-browser compatibility.

**Note:** This application uses E2E tests as the primary method for testing UI components and user interactions, while unit tests focus exclusively on business logic (utils, hooks, contexts).

## Key Challenges and Learnings

### 1. State Persistence and Page Reload Testing

**The Challenge:**

- Testing localStorage persistence across page reloads revealed race conditions
- Initial attempts failed because UI loading states weren't properly handled
- Data would load correctly but tests would assert against transitional states

**The Learning:**

```typescript
// ❌ Wrong: Not waiting for data loading to complete
await page.reload();
await expect(page.locator('[data-testid="activity-list"]')).toContainText('Meditation');
// Fails because it catches the empty loading state

// ✅ Correct: Wait for loading to complete and UI to stabilize
await page.reload();
await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();
await page.waitForTimeout(1000); // Allow data loading to complete

// Wait for either data or stable empty state
await expect(async () => {
  const activitiesText = await page.locator('[data-testid="activity-list-positive"]').textContent();
  const hasEmptyState = activitiesText?.includes('Noch keine Aktivitäten') || false;
  const hasActivities = activitiesText?.includes('Meditation') || false;
  expect(hasEmptyState || hasActivities).toBe(true);
}).toPass({ timeout: 5000 });
```

**Key Insight:** React SPAs with async data loading require explicit waiting for both data loading and UI stabilization. Don't assert against loading states - wait for the final rendered state.

### 2. Cross-Browser Mobile Testing Complexities

**The Challenge:**

- Tests passed on desktop Chrome but failed on Mobile Chrome
- Slider interactions worked differently between desktop and mobile
- Touch events vs mouse events required different handling approaches

**The Learning:**

```typescript
// ❌ Wrong: Desktop-only interaction patterns
const slider = page.locator('[data-testid="activity-value-slider"]');
await slider.click(); // Works on desktop, unreliable on mobile

// ✅ Correct: Cross-platform interaction handling
async function setSliderValue(page: Page, testId: string, value: number) {
  const slider = page.locator(`[data-testid="${testId}"]`);
  const sliderBounds = await slider.boundingBox();

  if (sliderBounds) {
    const targetX = sliderBounds.x + sliderBounds.width * percentage;
    const targetY = sliderBounds.y + sliderBounds.height / 2;

    // Try both interaction methods for compatibility
    try {
      await page.mouse.click(targetX, targetY);
    } catch {
      // Fallback to touch events for mobile
      await page.touchscreen.tap(targetX, targetY);
    }

    await page.waitForTimeout(100); // Allow UI to update
  }
}
```

**Key Insight:** Mobile browsers handle interactions differently. Always provide fallback interaction methods and test on actual mobile viewports, not just resized desktop browsers.

### 3. Timing and Race Conditions in React State Updates

**The Challenge:**

- Tests intermittently failed because they asserted before React state updates completed
- Energy balance calculations didn't immediately reflect after activity creation
- Form submissions required waiting for state updates to propagate

**The Learning:**

```typescript
// ❌ Wrong: Immediate assertion after action
await page.locator('[data-testid="submit-activity-button"]').click();
await expect(page.locator('[data-testid="positive-energy-total"]')).toContainText('20');
// Fails due to React state update timing

// ✅ Correct: Wait for specific UI updates after actions
await page.locator('[data-testid="submit-activity-button"]').click();

// First wait for the activity to appear in the list
await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Morning Yoga');

// Then wait for energy total to update
await expect(page.locator('[data-testid="positive-energy-total"] div:first-child')).toContainText('20');
```

**Key Insight:** React state updates are asynchronous. Wait for intermediate UI changes before asserting final calculated values. Chain your expectations to follow the natural flow of state updates.

### 4. Test Data Management and Isolation

**The Challenge:**

- localStorage state persisted between tests causing interference
- Shared test utilities led to inconsistent behavior across test files
- Tests became order-dependent due to shared state

**The Learning:**

```typescript
// ❌ Wrong: No state cleanup between tests
test.describe('Data Persistence', () => {
  test('first test', async ({ page }) => {
    // Creates data in localStorage
  });

  test('second test', async ({ page }) => {
    // Affected by data from first test
  });
});

// ✅ Correct: Proper test isolation with cleanup
test.describe('Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Wait for app to load with clean state
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();
  });
});
```

**Key Insight:** Test isolation is critical for reliable E2E tests. Always clean up persistent state (localStorage, sessionStorage, cookies) between tests to prevent interference.

### 5. Helper Function Patterns and Reusability

**The Challenge:**

- Complex interactions (like slider manipulation) were duplicated across test files
- Inconsistent implementations led to flaky tests
- Maintaining multiple copies of similar helper functions

**The Learning:**

```typescript
// ❌ Wrong: Duplicated complex interaction code across files
// In activity-management.spec.ts:
const slider = page.locator('[data-testid="activity-value-slider"]');
const sliderBounds = await slider.boundingBox();
// ... complex slider logic

// In data-persistence.spec.ts:
const slider = page.locator('[data-testid="activity-value-slider"]');
// ... slightly different implementation

// ✅ Correct: Centralized helper functions with robust error handling
// In shared test utilities or each file:
async function setSliderValue(page: Page, testId: string, value: number, min = 1, max = 100) {
  const slider = page.locator(`[data-testid="${testId}"]`);
  await expect(slider).toBeVisible();

  const percentage = (value - min) / (max - min);
  const sliderBounds = await slider.boundingBox();

  if (sliderBounds) {
    const targetX = sliderBounds.x + sliderBounds.width * percentage;
    const targetY = sliderBounds.y + sliderBounds.height / 2;

    try {
      await page.mouse.click(targetX, targetY);
    } catch {
      await page.touchscreen.tap(targetX, targetY);
    }

    await page.waitForTimeout(100);

    // Verify and retry if needed
    // ... verification logic
  }
}
```

**Key Insight:** Extract complex interactions into well-tested helper functions. Include error handling, verification, and retry logic. This reduces test maintenance and improves reliability.

### 6. Debugging Strategy for Flaky Tests

**The Challenge:**

- Tests passed locally but failed in CI
- Difficult to debug failing tests without proper logging
- Race conditions were hard to identify and fix

**The Learning:**

```typescript
// ❌ Wrong: Silent failures with no debugging information
test('should persist activity deletions', async ({ page }) => {
  // ... test steps
  await expect(page.locator('[data-testid="activity-list"]')).toContainText('Meditation');
  // Fails with no context about what actually happened
});

// ✅ Correct: Enhanced debugging with console logging and state inspection
test('should persist activity deletions', async ({ page }) => {
  // Listen for console messages from the app
  page.on('console', msg => {
    if (msg.text().includes('DEBUG')) {
      console.log('BROWSER:', msg.text());
    }
  });

  // ... test steps

  // Debug: Check what's actually in localStorage
  const localStorageData = await page.evaluate(() => {
    return localStorage.getItem('energiekuchen-data');
  });
  console.log('DEBUG: localStorage contains:', localStorageData);

  // Get actual text content for better error messages
  const activitiesText = await page.locator('[data-testid="activity-list-positive"]').textContent();
  console.log('DEBUG: Activities text:', activitiesText);

  await expect(page.locator('[data-testid="activity-list"]')).toContainText('Meditation');
});
```

**Key Insight:** Build debugging into your tests from the start. Use console logging, state inspection, and meaningful error messages. This is especially critical for tests that interact with persistent storage or complex state.

### 7. Progressive Enhancement Testing Strategy

**The Challenge:**

- Need to test on multiple browsers with different capabilities
- Balancing comprehensive testing with development speed
- Managing test suite execution time

**The Learning:**

```typescript
// ❌ Wrong: Running all tests on all browsers during development
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});

// ✅ Correct: Strategic browser selection for development vs CI
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },

    // Commented out for faster development - uncomment for full testing
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

**Key Insight:** Use a progressive testing strategy. Focus on core browsers during development (Chrome + Mobile Chrome) and expand to full browser matrix for CI/release testing. This balances coverage with development velocity.

## Best Practices Discovered

1. **State-First Testing**: Always wait for application state to stabilize before making assertions
2. **Multi-Modal Interactions**: Provide fallback interaction methods for cross-platform compatibility
3. **Debugging by Design**: Build debugging capabilities into tests from the beginning
4. **Helper Function Libraries**: Extract complex interactions into reusable, well-tested helpers
5. **Test Isolation**: Always clean up persistent state between tests
6. **Progressive Browser Testing**: Use strategic browser selection to balance speed and coverage
7. **Async-Aware Assertions**: Chain expectations to follow React's natural state update flow
8. **Real User Patterns**: Test actual user workflows, not just individual component interactions
9. **Error Context**: Provide meaningful debugging information when tests fail
10. **Timing Tolerance**: Build appropriate waits and retries for network and state operations

## E2E vs Unit Testing Strategy

This application successfully demonstrates a complementary testing approach:

- **✅ E2E Tests Cover:** Complete user journeys, UI interactions, cross-browser compatibility, state persistence
- **✅ Unit Tests Cover:** Business logic, utility functions, hooks, contexts
- **❌ Neither Covers:** Visual regression testing (could be added as separate layer)

**Why This Approach Works:**

- E2E tests catch integration issues and real user experience problems
- Unit tests ensure business logic reliability with fast feedback
- Clear separation reduces test maintenance overhead
- Each layer focuses on what it does best

## Common Pitfalls to Avoid

1. **Asserting Against Loading States**: Always wait for final rendered state
2. **Desktop-Only Interaction Patterns**: Test on actual mobile viewports
3. **Immediate Post-Action Assertions**: Wait for React state propagation
4. **Shared Test State**: Clean up localStorage/sessionStorage between tests
5. **Silent Test Failures**: Always include debugging context
6. **Over-Testing Edge Cases**: Focus on real user workflows first
7. **Browser Testing Overhead**: Use progressive browser selection strategy
8. **Complex Selectors**: Prefer data-testid attributes over CSS selectors
9. **Hardcoded Timing**: Use expectation-based waits over fixed timeouts
10. **Test Order Dependencies**: Ensure tests can run independently

## Conclusion

E2E testing for React SPAs with Playwright requires understanding asynchronous state management, cross-platform interaction differences, and proper test isolation patterns. The key is building robust helper functions, implementing progressive testing strategies, and always designing tests with debugging in mind.

The most critical insight: **E2E tests must be designed for the asynchronous, stateful nature of modern React applications**. Wait for state, handle timing properly, and always test the final user-visible state rather than intermediate loading conditions.
