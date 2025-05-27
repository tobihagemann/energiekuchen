# Testing Learnings: React, Jest, and Business Logic Testing

## Overview

During the process of developing and maintaining unit tests for the Energiekuchen React application's business logic layer, several key challenges emerged that required multiple iterations and deep learning. This document captures the main insights and patterns discovered while testing hooks, contexts, and utility functions.

**Note:** This application follows a focused testing strategy where unit tests cover only business logic (utils, hooks, contexts), while UI components are tested via E2E tests for real user interactions.

## Key Challenges and Learnings

### 1. React act() Warnings in Modern React (18+)

**The Mistake Pattern:**

- Initially tried to fix act() warnings by only wrapping user interactions in hook tests
- Missed that `renderHook()` calls can trigger state updates that also need act() wrapping
- Assumed act() was only needed for explicit state changes, not initial hook mounting

**The Learning:**

```javascript
// ❌ Wrong: Only wrapping state updates
const { result } = renderHook(() => useEnergy(), { wrapper });
act(() => {
  result.current.addActivity('positive', { name: 'Sport', value: 50, color: '#10B981' });
});

// ✅ Correct: Wrapping hook renders that trigger effects
act(() => {
  const { result } = renderHook(() => useLocalStorage('key', 'default'));
});
```

**Key Insight:** In React 18+, ANY state update - including those from useEffect hooks during initial hook mounting - must be wrapped in act(). This is especially important when testing custom hooks that initialize with localStorage or trigger side effects.

### 2. Mock Timing and Async Hook Logic

**The Mistake Pattern:**

- Wrote tests expecting to see intermediate states in context or hook tests, but mocked async operations resolved immediately
- Didn't account for how mocking changes the timing of operations in business logic
- Tests failed because async operations completed before assertions could run

**The Learning:**

```javascript
// ❌ Wrong: Expecting to catch intermediate state with immediate mock resolution
StorageManager.save = jest.fn().mockResolvedValue(undefined);
const { result } = renderHook(() => useEnergy(), { wrapper });
act(() => {
  result.current.saveData();
});
expect(result.current.isSaving).toBe(true); // Fails - already completed!

// ✅ Correct: Test the final state or use delayed mocks
StorageManager.save = jest.fn().mockResolvedValue(undefined);
const { result } = renderHook(() => useEnergy(), { wrapper });
act(() => {
  result.current.saveData();
});
// Test the final state after async operation
expect(StorageManager.save).toHaveBeenCalled();
```

**Key Insight:** When mocking async operations to resolve immediately, test logic must account for the changed timing. Focus on testing the final state and side effects rather than intermediate loading states.

### 3. Test Isolation and Mock Cleanup

**The Mistake Pattern:**

- Forgot to properly clean up mocks between tests
- localStorage state persisted between test cases
- Mock implementations from one test affected others

**The Learning:**

```javascript
// ❌ Wrong: No cleanup between tests
beforeEach(() => {
  // Setup but no cleanup
});

// ✅ Correct: Proper cleanup ensures test isolation
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

**Key Insight:** Test isolation is critical. Each test should start with a clean slate, especially when dealing with global objects like localStorage or when using mocks.

### 4. YAGNI Principle: Don't Test What Doesn't Exist

**The Mistake Pattern:**

- Spent significant time testing SSR scenarios that don't exist in the codebase
- The app explicitly uses client-side rendering (`'use client'` directives everywhere)
- Product specification clearly states "Client-side rendering (CSR) - keine Server-side Rendering"
- Tested defensive `typeof window === 'undefined'` checks that never execute in production

**The Learning:**

```javascript
// ❌ Wrong: Testing scenarios that don't exist in your app
it('should handle SSR environment', () => {
  // This will never happen in a CSR-only app!
  Object.defineProperty(global, 'window', { value: undefined });
  // Complex test setup for non-existent scenario
});

// ✅ Correct: Focus on actual use cases
it('should persist user preferences in localStorage', () => {
  // Test what actually happens in your app
  const { result } = renderHook(() => useLocalStorage('theme', 'light'));

  act(() => {
    result.current[1]('dark');
  });

  expect(result.current[0]).toBe('dark');
  expect(localStorage.setItem).toHaveBeenCalledWith('theme', '"dark"');
});
```

**Key Insight:** **YAGNI applies to testing too!** Don't write tests for theoretical scenarios that don't exist in your current architecture. The SSR checks in `useLocalStorage` are defensive programming that may never execute in a CSR-only application. Testing them adds complexity without value.

**Better Approach:**

- Remove or simplify tests for non-existent scenarios
- Focus testing effort on actual user flows and edge cases that can happen
- Test business logic behavior, not defensive edge cases that don't occur in your app
- If you later add SSR, then add the tests - not before

### 5. Context Provider Testing Patterns

**The Mistake Pattern:**

- Tried to test context providers in isolation without proper wrapper setup
- Forgot that hooks using context must be wrapped with the provider during testing
- Didn't realize that context state changes need proper act() wrapping

**The Learning:**

```javascript
// ❌ Wrong: Testing context hook without provider
const { result } = renderHook(() => useEnergy());
// Error: useEnergy must be used within a EnergyProvider

// ✅ Correct: Provide proper wrapper for context tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyProvider>{children}</EnergyProvider>
);

const { result } = renderHook(() => useEnergy(), { wrapper });

act(() => {
  result.current.addActivity('positive', {
    name: 'Sport',
    value: 50,
    color: '#10B981'
  });
});

expect(result.current.state.data.positive.activities).toHaveLength(1);
```

**Key Insight:** Context providers require proper wrapper setup in tests. Always wrap context hook tests with the appropriate provider, and remember that context state changes must be wrapped in act().

## Best Practices Discovered

1. **act() Everything**: When in doubt, wrap state-changing operations in act(), especially for hooks and context tests
2. **Test Business Logic Behavior**: Focus on what the hook/utility/context does, not implementation details
3. **Clean Slate Testing**: Always ensure proper mock cleanup between tests, especially localStorage and other global state
4. **Understand Your Mocks**: Know how mocking changes timing and behavior in async operations
5. **Apply YAGNI to Testing**: Don't test scenarios that don't exist in your current architecture
6. **Context Wrapper Pattern**: Always provide proper context wrappers when testing hooks that depend on context
7. **Focus on Edge Cases**: Test error handling, validation, and boundary conditions in utility functions
8. **Mock External Dependencies**: Mock localStorage, external APIs, and other side effects consistently
9. **Leverage Jest Configuration**: Use Jest's built-in `clearMocks` and `restoreMocks` settings to avoid redundant manual cleanup

## Current Testing Scope

This application follows a focused testing strategy:

- **✅ Unit Tests Cover:** Utils, hooks, contexts (business logic)
- **❌ Unit Tests Don't Cover:** UI components, visual elements, user interactions
- **🎭 E2E Tests Cover:** Complete user journeys, UI interactions, visual testing

**Why This Approach Works:**

- Business logic is the core value and most error-prone area
- UI components are better tested through real user interactions
- Reduced testing complexity and maintenance overhead
- Higher confidence in critical application logic

## Conclusion

These learnings highlight the importance of understanding modern React testing patterns when testing business logic components like hooks, contexts, and utilities. The focused approach of testing only business logic while using E2E tests for UI interactions has proven effective, reducing complexity while maintaining high confidence in critical application functionality.

Key takeaways:

- **Modern React testing** requires understanding act() patterns for hooks and contexts
- **Business logic focus** reduces maintenance overhead while ensuring core functionality
- **Proper test isolation** is critical when dealing with global state and localStorage
- **YAGNI principle** applies to testing - don't test theoretical scenarios
- **Context testing patterns** require proper wrapper setup and act() usage
