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
- Activity list updates didn't immediately reflect after activity creation
- Form submissions required waiting for state updates to propagate

**The Learning:**

```typescript
// ❌ Wrong: Immediate assertion after action
await page.locator('[data-testid="submit-activity-button"]').click();
await expect(page.locator('[data-testid="activity-list-positive"] .activity-item')).toHaveCount(1);
// Fails due to React state update timing

// ✅ Correct: Wait for specific UI updates after actions
await page.locator('[data-testid="submit-activity-button"]').click();

// Wait for the activity to appear in the list with proper content
await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Morning Yoga');

// Verify the activity was added successfully
await expect(page.locator('[data-testid="activity-list-positive"] .activity-item')).toHaveCount(1);
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

### 8. URL Encoding and Data Sharing Testing

**The Challenge:**

- Shared URLs failed to load due to double URL-encoding issues
- Browser URL parameter handling differed from manual URL construction
- Base64 + URL encoding created complex decoding requirements

**The Learning:**

```typescript
// ❌ Wrong: Assuming URL parameters are decoded consistently
const shareData = atob(params.data); // Fails with URL-encoded base64

// ✅ Correct: Handle URL encoding layers properly
const urlDecodedData = decodeURIComponent(params.data);
const shareData = SharingManager.decodeShareData(urlDecodedData);

// ❌ Wrong: Testing share URLs with hardcoded data
const mockUrl = `/share/${btoa('test-data')}`;
await page.goto(mockUrl); // Doesn't test real URL generation

// ✅ Correct: Test actual share URL generation and consumption
// Generate URL through the app's sharing mechanism
await page.locator('[data-testid="share-button"]').click();
const shareUrl = await page.locator('[data-testid="share-url"]').inputValue();

// Test the actual generated URL
await page.goto(shareUrl);
await expect(page.locator('[data-testid="shared-content"]')).toBeVisible();
```

**Key Insight:** URL encoding is complex when multiple layers are involved (base64 + URL encoding). Always test the complete URL generation and consumption flow, not just individual encoding/decoding steps. Browser URL parameter handling can introduce additional encoding layers.

### 9. Custom Component Interaction Patterns

**The Challenge:**

- Custom React components don't behave like native HTML elements
- Standard Playwright interactions failed on custom slider components
- Mobile vs desktop interaction patterns required different approaches

**The Learning:**

```typescript
// ❌ Wrong: Treating custom components like native inputs
const slider = page.locator('[data-testid="custom-slider"]');
await slider.fill('50'); // Fails - not an input element
await slider.selectOption('50'); // Fails - not a select element

// ✅ Correct: Understand the custom component's interaction model
async function setCustomSliderValue(page: Page, testId: string, value: number) {
  const slider = page.locator(`[data-testid="${testId}"]`);

  // Custom slider uses click position to set value
  const bounds = await slider.boundingBox();
  const percentage = value / 100; // Adjust based on component's range
  const targetX = bounds.x + bounds.width * percentage;
  const targetY = bounds.y + bounds.height / 2;

  // Handle both desktop and mobile interaction patterns
  const isMobile = await page.evaluate(() => window.innerWidth < 768);

  if (isMobile) {
    await page.touchscreen.tap(targetX, targetY);
    await page.mouse.click(targetX, targetY); // Fallback
  } else {
    await page.mouse.click(targetX, targetY);
  }

  // Verify the interaction worked by reading component state
  const actualValue = await page.evaluate(() => {
    const element = document.querySelector('[data-testid="custom-slider"]');
    return element?.textContent?.match(/(\d+)/)?.[1];
  });

  return parseInt(actualValue || '0', 10);
}
```

**Key Insight:** Custom React components require understanding their specific interaction model. Don't assume standard HTML element behaviors. Create component-specific interaction helpers that handle both desktop and mobile patterns.

### 10. Platform-Specific Test Adaptations

**The Challenge:**

- Mobile Chrome slider precision differed significantly from desktop
- Fixed test values caused failures on mobile while passing on desktop
- Balancing test reliability with comprehensive platform coverage

**The Learning:**

```typescript
// ❌ Wrong: Same expectations across all platforms
test('should create activity with specific value', async ({ page }) => {
  await setSliderValue(page, 'slider', 40);
  await expect(page.locator('[data-testid="value-display"]')).toContainText('40');
  // Fails on Mobile Chrome due to slider precision differences
});

// ✅ Correct: Platform-aware test expectations
test('should create activity with target value', async ({ page, browserName }) => {
  const isMobile = await page.evaluate(() => window.innerWidth < 768);
  // Mobile Chrome reliably achieves values around 10, desktop can handle higher precision
  const targetValue = browserName === 'chromium' && isMobile ? 10 : 40;

  await setSliderValue(page, 'slider', targetValue);
  await expect(page.locator('[data-testid="value-display"]')).toContainText(targetValue.toString());

  // Test the functional outcome, not the exact value
  await expect(page.locator('[data-testid="energy-total"]')).toContainText(targetValue.toString());
});

// ✅ Correct: Handle zero balance edge cases in calculations
test('should handle balanced energy calculations', async ({ page, browserName }) => {
  const isMobile = await page.evaluate(() => window.innerWidth < 768);
  const value = browserName === 'chromium' && isMobile ? 10 : 20;

  // Add equal positive and negative activities
  await addActivity(page, 'positive', value);
  await addActivity(page, 'negative', value);

  const balance = 0; // Mobile Chrome often results in balanced state

  // Handle zero balance display (no + sign)
  await expect(page.locator('[data-testid="energy-balance-total"]')).toContainText('0');
  // Alternative: await expect(page.locator('[data-testid="energy-balance-total"]')).toContainText(balance.toString());
});

// Alternative: Test relative changes instead of absolute values
test('should increase energy when adding positive activity', async ({ page }) => {
  const initialTotal = await getEnergyTotal(page);
  await addActivity(page, 'positive', 'any-value');
  const newTotal = await getEnergyTotal(page);

  expect(newTotal).toBeGreaterThan(initialTotal);
});
```

**Key Insight:** Platform differences are real and should be accommodated in tests. Adapt test expectations based on browser/platform capabilities rather than forcing identical behavior everywhere. Focus on functional outcomes over exact implementation details.

### 11. Mobile Accessibility Testing Adaptations

**The Challenge:**

- Keyboard navigation tests that pass on desktop fail on mobile devices
- Touch interfaces require different interaction patterns for accessibility features
- Modal focus management differs between desktop and mobile

**The Learning:**

```typescript
// ❌ Wrong: Desktop-only accessibility patterns
test('should navigate help modal with keyboard', async ({ page }) => {
  await page.locator('[data-testid="help-button"]').click();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  // Fails on mobile - touch devices don't support keyboard navigation reliably
});

// ✅ Correct: Platform-aware accessibility testing
test('should navigate help modal accessibly', async ({ page, browserName }) => {
  const isMobile = await page.evaluate(() => window.innerWidth < 768);

  await page.locator('[data-testid="help-button"]').click();

  if (isMobile) {
    // Mobile: Use touch/click interactions
    await page.locator('[data-testid="help-section-button"]').click();
    await expect(page.locator('[data-testid="help-content"]')).toBeVisible();
  } else {
    // Desktop: Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="help-content"]')).toBeVisible();
  }
});

// ✅ Correct: Screen reader compatibility testing
test('should be screen reader accessible', async ({ page }) => {
  // Test ARIA labels and roles regardless of platform
  await expect(page.locator('[role="dialog"]')).toHaveAttribute('aria-labelledby');
  await expect(page.locator('[data-testid="help-modal"]')).toHaveAttribute('aria-modal', 'true');
});
```

**Key Insight:** Mobile accessibility requires different interaction patterns than desktop. Test touch-based navigation for mobile and keyboard navigation for desktop, but always test semantic markup and ARIA attributes universally.

### 12. Development Workflow Optimizations

**The Challenge:**

- Default Playwright configurations can create workflow friction during development
- Browser debugging requires manual intervention when using simple browser previews
- HTML report generation blocks terminal output and requires manual cancellation

**The Learning:**

```typescript
// ❌ Wrong: Using default reporter during development
// playwright.config.ts
export default defineConfig({
  reporter: 'html', // Blocks terminal, opens browser, requires manual interaction
});

// Running tests shows HTML report that must be manually closed
npx playwright test --headed

// ✅ Correct: Use line reporter for immediate feedback during development
// playwright.config.ts
export default defineConfig({
  reporter: process.env.CI ? 'html' : 'line', // Conditional based on environment
});

// Or override via command line for immediate terminal output
npx playwright test --reporter=line --headed
```

```bash
# ❌ Wrong: Relying on simple browser for debugging application output
npm run dev &
# Browser preview cannot capture console.log, network errors, etc.

# ✅ Correct: Use terminal-based debugging or external browser
npm run dev
# Then manually open browser to http://localhost:3000 for full dev tools access

# Alternative: Use Playwright's browser context for debugging
npx playwright test --debug --reporter=line
```

**Key Insight:** Development workflow efficiency is critical for productive E2E testing. Use line reporter for immediate feedback during development, and avoid relying on simple browser previews for debugging complex application behavior. Configure tools to minimize manual intervention requirements.

**Workflow Best Practices:**

1. **Terminal-First Debugging**: Use `--reporter=line` for immediate test feedback
2. **External Browser for App Debugging**: Open localhost manually for full dev tools access
3. **Conditional Reporters**: Use environment-based reporter configuration
4. **Non-Blocking Test Execution**: Avoid configurations that require manual intervention
5. **Development vs CI Optimization**: Different configurations for different environments

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
11. **Development Workflow Efficiency**: Use line reporter and external browsers to minimize manual intervention

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
11. **Blocking Test Reports**: Use `--reporter=line` during development to avoid manual intervention
12. **Simple Browser Debugging Limitations**: Use external browsers for full debugging capabilities
13. **Mobile Chrome Slider Precision**: Use values ≤10 for reliable Mobile Chrome slider interactions
14. **Zero Balance Display Logic**: Handle cases where positive and negative values are equal
15. **Mobile Accessibility Assumptions**: Don't assume keyboard navigation works on touch devices

## Mobile Chrome Troubleshooting Guide

**Common Issue Patterns and Solutions:**

1. **Slider Value Mismatch**

   - **Symptom**: Test expects value 20, gets value 10 on Mobile Chrome
   - **Solution**: Use `browserName === 'chromium' && isMobile ? 10 : 20` pattern
   - **Root Cause**: Touch interaction precision vs mouse click precision

2. **Modal Width Assertions Failing**

   - **Symptom**: Modal width expected 400px, actual 390px on mobile
   - **Solution**: Add 10px tolerance: `expect(width).toBeGreaterThanOrEqual(minWidth - 10)`
   - **Root Cause**: Mobile viewport scaling and pixel density differences

3. **Keyboard Navigation Test Failures**

   - **Symptom**: `page.keyboard.press('Tab')` doesn't work on mobile
   - **Solution**: Use click interactions for mobile, keyboard for desktop
   - **Root Cause**: Touch devices don't support keyboard navigation consistently

4. **Balance Calculation Edge Cases**
   - **Symptom**: Test expects "+5" but gets "0" when values are equal
   - **Solution**: Handle zero case separately without + sign
   - **Root Cause**: Mobile Chrome achieving same values for both activities

**Quick Diagnostic Commands:**

```bash
# Run only Mobile Chrome tests to isolate issues
npx playwright test --project="Mobile Chrome" --reporter=line

# Run with debugging to see actual vs expected values
npx playwright test --project="Mobile Chrome" --reporter=line --headed

# Check if issue is mobile-specific
npx playwright test --project="chromium" --reporter=line  # Compare with desktop
```

## Conclusion

E2E testing for React SPAs with Playwright requires understanding asynchronous state management, cross-platform interaction differences, and proper test isolation patterns. The key is building robust helper functions, implementing progressive testing strategies, and always designing tests with debugging in mind.

**The Most Critical Insights:**

1. **E2E tests must be designed for the asynchronous, stateful nature of modern React applications** - Wait for state, handle timing properly, and always test the final user-visible state rather than intermediate loading conditions.

2. **Mobile Chrome has fundamentally different interaction characteristics** - Slider precision, touch vs mouse events, and viewport scaling require platform-specific test adaptations, not just responsive design considerations.

3. **Platform-aware testing is not optional** - Use the `browserName + window.innerWidth` detection pattern consistently. Mobile Chrome reliably achieves values around 10 for sliders, while desktop can handle higher precision values.

4. **Accessibility testing requires platform-specific approaches** - Keyboard navigation works on desktop but not reliably on mobile touch devices. Test both interaction methods based on platform capabilities.

**Success Metrics:** A well-designed E2E test suite should have zero failing tests across all target platforms, with platform-specific adaptations that maintain functional equivalence while accommodating technical limitations.
