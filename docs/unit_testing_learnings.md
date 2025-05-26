# Testing Learnings: React, Jest, and Test Debugging

## Overview
During the process of fixing failing tests in the Energiekuchen React application, several key challenges emerged that required multiple iterations and deep learning. This document captures the main insights and patterns discovered.

## Key Challenges and Learnings

### 1. React act() Warnings in Modern React (18+)

**The Mistake Pattern:**
- Initially tried to fix act() warnings by only wrapping user interactions like `fireEvent.click()`
- Missed that `render()` and `renderHook()` calls can trigger state updates that also need act() wrapping
- Assumed act() was only needed for explicit state changes, not initial component mounting

**The Learning:**
```javascript
// ❌ Wrong: Only wrapping user interactions
const { getByText } = render(<Component />);
act(() => {
  fireEvent.click(getByText('Button'));
});

// ✅ Correct: Wrapping renders that trigger state updates
act(() => {
  const { getByText } = render(<Component />);
});
```

**Key Insight:** In React 18+, ANY state update - including those from useEffect hooks during initial render - must be wrapped in act(). The warning appears when React detects state changes outside of act() during testing.

### 2. Modal Portal Testing and DOM Structure Differences

**The Mistake Pattern:**
- Expected all modal tests to work the same way with `screen.getBy*()` queries
- Didn't realize that mocking `createPortal` changes where elements are rendered in the DOM
- Some modals required container queries while others worked fine with screen queries

**The Learning:**
```javascript
// ❌ Wrong: Using screen queries when portal is mocked differently
// In ImportExportModal.test.tsx - createPortal mocked to render to container
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (element: ReactNode) => element, // Renders to test container
}));

render(<ImportExportModal />);
expect(screen.getByRole('dialog')).toBeInTheDocument(); // Fails!

// ✅ Correct: Use container queries when portal mock changes DOM structure
const { container } = render(<ImportExportModal />);
expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
```

**Key Insight:** When `createPortal` is mocked to render directly to the test container instead of `document.body`, the DOM structure differs from normal React Testing Library expectations. This requires using `container.querySelector()` instead of `screen` queries because the elements aren't in the typical query scope.

**Real Example Comparison:**
- **ShareModal**: Uses standard portal behavior → `screen.getByRole('dialog')` works
- **ImportExportModal**: Mocks portal to container → needs `container.querySelector('[role="dialog"]')`

### 3. Mock Timing and Async Test Logic

**The Mistake Pattern:**
- Wrote tests expecting to see loading states, but mocked async operations resolved immediately
- Didn't account for how mocking changes the timing of operations
- Tests failed because loading spinners disappeared before assertions could run

**The Learning:**
```javascript
// ❌ Wrong: Expecting to catch loading state with immediate mock resolution
generateShareData.mockResolvedValue(mockData);
render(<ShareModal />);
expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Fails!

// ✅ Correct: Adjust test logic for immediate resolution
generateShareData.mockResolvedValue(mockData);
act(() => {
  render(<ShareModal />);
});
// Loading state already completed, test the final state instead
expect(screen.getByText('Share Data')).toBeInTheDocument();
```

**Key Insight:** When mocking async operations to resolve immediately, test logic must account for the changed timing. Don't test intermediate states that may not exist with mocked timing.

### 4. Test Isolation and Mock Cleanup

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

### 5. YAGNI Principle: Don't Test What Doesn't Exist

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

**Key Insight:** **YAGNI applies to testing too!** Don't write tests for theoretical scenarios that don't exist in your current architecture. The SSR checks in `useLocalStorage` are defensive programming that may never execute. Testing them adds complexity without value.

**Better Approach:**
- Remove or simplify tests for non-existent scenarios
- Focus testing effort on actual user flows and edge cases that can happen
- If you later add SSR, then add the tests - not before

## Best Practices Discovered

1. **act() Everything**: When in doubt, wrap state-changing operations in act()
2. **Understand Portal Mocking**: When `createPortal` is mocked differently, use container queries instead of screen queries
3. **Test Behavior, Not Implementation**: Focus on what the component/hook does, not how it detects its environment
4. **Clean Slate Testing**: Always ensure proper mock cleanup between tests
5. **Understand Your Mocks**: Know how mocking changes timing and behavior
6. **Apply YAGNI to Testing**: Don't test scenarios that don't exist in your current architecture

## Conclusion

These learnings highlight the importance of understanding modern React testing patterns, the constraints of test environments, and the need to focus on behavior verification rather than environment simulation. Each challenge required multiple iterations to understand the underlying principles and find the right approach.
