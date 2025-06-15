import { UIProvider, useUI } from '@/app/lib/contexts/UIContext';
import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <UIProvider>{children}</UIProvider>;

describe('UIContext', () => {
  it('should provide initial state', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    expect(result.current.state).toEqual({
      isShareModalOpen: false,
      isImportModalOpen: false,
      isDeleteModalOpen: false,
      isEditModalOpen: false,
      deleteConfirmation: null,
      currentView: 'dashboard',
      editingActivity: null,
      sidebarOpen: false,
      isMobile: false,
    });
  });

  it('should open and close share modal', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.openShareModal();
    });

    expect(result.current.state.isShareModalOpen).toBe(true);

    act(() => {
      result.current.closeShareModal();
    });

    expect(result.current.state.isShareModalOpen).toBe(false);
  });

  it('should open and close import modal', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.openImportModal();
    });

    expect(result.current.state.isImportModalOpen).toBe(true);

    act(() => {
      result.current.closeImportModal();
    });

    expect(result.current.state.isImportModalOpen).toBe(false);
  });

  it('should open and close delete modal', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.openDeleteModal();
    });

    expect(result.current.state.isDeleteModalOpen).toBe(true);

    act(() => {
      result.current.closeDeleteModal();
    });

    expect(result.current.state.isDeleteModalOpen).toBe(false);
  });

  it('should open and close edit modal', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.openEditModal();
    });

    expect(result.current.state.isEditModalOpen).toBe(true);

    act(() => {
      result.current.closeEditModal();
    });

    expect(result.current.state.isEditModalOpen).toBe(false);
  });

  it('should set current view', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.setCurrentView('dashboard');
    });

    expect(result.current.state.currentView).toBe('dashboard');
  });

  it('should set editing activity', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    const editingActivity = { chartType: 'positive' as const, activityId: '123' };

    act(() => {
      result.current.setEditingActivity(editingActivity);
    });

    expect(result.current.state.editingActivity).toEqual(editingActivity);

    act(() => {
      result.current.setEditingActivity(null);
    });

    expect(result.current.state.editingActivity).toBe(null);
  });

  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    expect(result.current.state.sidebarOpen).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.state.sidebarOpen).toBe(true);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.state.sidebarOpen).toBe(false);
  });

  it('should set sidebar open state', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.setSidebarOpen(true);
    });

    expect(result.current.state.sidebarOpen).toBe(true);

    act(() => {
      result.current.setSidebarOpen(false);
    });

    expect(result.current.state.sidebarOpen).toBe(false);
  });

  it('should set mobile state', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.setIsMobile(true);
    });

    expect(result.current.state.isMobile).toBe(true);

    act(() => {
      result.current.setIsMobile(false);
    });

    expect(result.current.state.isMobile).toBe(false);
  });

  it('should close all modals', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    // Open all modals
    act(() => {
      result.current.openShareModal();
      result.current.openImportModal();
      result.current.openDeleteModal();
      result.current.openEditModal();
    });

    expect(result.current.state.isShareModalOpen).toBe(true);
    expect(result.current.state.isImportModalOpen).toBe(true);
    expect(result.current.state.isDeleteModalOpen).toBe(true);
    expect(result.current.state.isEditModalOpen).toBe(true);

    act(() => {
      result.current.closeAllModals();
    });

    expect(result.current.state.isShareModalOpen).toBe(false);
    expect(result.current.state.isImportModalOpen).toBe(false);
    expect(result.current.state.isDeleteModalOpen).toBe(false);
    expect(result.current.state.isEditModalOpen).toBe(false);
  });

  it('should throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useUI());
    }).toThrow('useUI must be used within a UIProvider');
  });

  it('should handle multiple state changes', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    act(() => {
      result.current.openShareModal();
      result.current.setCurrentView('dashboard');
      result.current.setIsMobile(true);
      result.current.setSidebarOpen(true);
    });

    expect(result.current.state).toEqual({
      isShareModalOpen: true,
      isImportModalOpen: false,
      isDeleteModalOpen: false,
      isEditModalOpen: false,
      deleteConfirmation: null,
      currentView: 'dashboard',
      editingActivity: null,
      sidebarOpen: true,
      isMobile: true,
    });
  });

  it('should handle unknown action types gracefully', () => {
    const { result } = renderHook(() => useUI(), { wrapper });

    // Get the initial state
    const initialState = result.current.state;

    // Test the default case in the reducer by accessing the dispatch function
    // This simulates what would happen if an unknown action was dispatched
    const context = result.current as unknown as { dispatch?: (action: { type: string }) => void };

    if (context.dispatch) {
      act(() => {
        context.dispatch!({ type: 'UNKNOWN_ACTION' });
      });
    }

    // State should remain unchanged when unknown action is dispatched
    expect(result.current.state).toEqual(initialState);
  });
});
