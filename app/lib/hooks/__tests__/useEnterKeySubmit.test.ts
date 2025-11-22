import { useEnterKeySubmit } from '@/app/lib/hooks/useEnterKeySubmit';
import { renderHook } from '@testing-library/react';

describe('useEnterKeySubmit', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should add event listener when isActive is true', () => {
    const onSubmit = jest.fn();

    renderHook(() => useEnterKeySubmit(true, onSubmit));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should not add event listener when isActive is false', () => {
    const onSubmit = jest.fn();

    renderHook(() => useEnterKeySubmit(false, onSubmit));

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should call onSubmit when Enter key is pressed and isActive is true', () => {
    const onSubmit = jest.fn();

    renderHook(() => useEnterKeySubmit(true, onSubmit));

    const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = jest.spyOn(keydownEvent, 'preventDefault');

    document.dispatchEvent(keydownEvent);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not call onSubmit when other keys are pressed', () => {
    const onSubmit = jest.fn();

    renderHook(() => useEnterKeySubmit(true, onSubmit));

    const keydownEvent = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(keydownEvent);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should not call onSubmit when Enter is pressed and isActive is false', () => {
    const onSubmit = jest.fn();

    renderHook(() => useEnterKeySubmit(false, onSubmit));

    const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(keydownEvent);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should remove event listener on cleanup', () => {
    const onSubmit = jest.fn();

    const { unmount } = renderHook(() => useEnterKeySubmit(true, onSubmit));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should update listener when isActive changes', () => {
    const onSubmit = jest.fn();

    const { rerender } = renderHook(({ isActive }) => useEnterKeySubmit(isActive, onSubmit), {
      initialProps: { isActive: false },
    });

    // Initially inactive - no listener
    expect(addEventListenerSpy).not.toHaveBeenCalled();

    // Become active - listener should be added
    rerender({ isActive: true });
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    // Dispatch Enter key
    const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(keydownEvent);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should update listener when onSubmit callback changes', () => {
    const onSubmit1 = jest.fn();
    const onSubmit2 = jest.fn();

    const { rerender } = renderHook(({ callback }) => useEnterKeySubmit(true, callback), {
      initialProps: { callback: onSubmit1 },
    });

    // Dispatch Enter with first callback
    let keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(keydownEvent);
    expect(onSubmit1).toHaveBeenCalledTimes(1);
    expect(onSubmit2).not.toHaveBeenCalled();

    // Change callback
    rerender({ callback: onSubmit2 });

    // Dispatch Enter with second callback
    keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(keydownEvent);

    expect(onSubmit1).toHaveBeenCalledTimes(1); // Still 1
    expect(onSubmit2).toHaveBeenCalledTimes(1); // Now called
  });
});
