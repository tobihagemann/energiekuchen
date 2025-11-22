'use client';

import { UIAction, UIContextType, UIState } from '@/app/types/context';
import { createContext, ReactNode, useContext, useReducer } from 'react';

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'OPEN_SHARE_MODAL':
      return { ...state, isShareModalOpen: true };

    case 'CLOSE_SHARE_MODAL':
      return { ...state, isShareModalOpen: false };

    case 'OPEN_IMPORT_MODAL':
      return { ...state, isImportModalOpen: true };

    case 'CLOSE_IMPORT_MODAL':
      return { ...state, isImportModalOpen: false };

    case 'OPEN_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: true };

    case 'CLOSE_DELETE_MODAL':
      return { ...state, isDeleteModalOpen: false };

    case 'OPEN_EDIT_MODAL':
      return { ...state, isEditModalOpen: true };

    case 'CLOSE_EDIT_MODAL':
      return { ...state, isEditModalOpen: false };

    case 'SET_DELETE_CONFIRMATION':
      return { ...state, deleteConfirmation: action.payload };

    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };

    case 'SET_EDITING_ACTIVITY':
      return { ...state, editingActivity: action.payload };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };

    case 'SET_IS_MOBILE':
      return { ...state, isMobile: action.payload };

    case 'CLOSE_ALL_MODALS':
      return {
        ...state,
        isShareModalOpen: false,
        isImportModalOpen: false,
        isDeleteModalOpen: false,
        isEditModalOpen: false,
        deleteConfirmation: null,
      };

    default:
      return state;
  }
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, {
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

  const openShareModal = () => dispatch({ type: 'OPEN_SHARE_MODAL' });
  const closeShareModal = () => dispatch({ type: 'CLOSE_SHARE_MODAL' });
  const openImportModal = () => dispatch({ type: 'OPEN_IMPORT_MODAL' });
  const closeImportModal = () => dispatch({ type: 'CLOSE_IMPORT_MODAL' });
  const openDeleteModal = () => dispatch({ type: 'OPEN_DELETE_MODAL' });
  const closeDeleteModal = () => dispatch({ type: 'CLOSE_DELETE_MODAL' });
  const openEditModal = () => dispatch({ type: 'OPEN_EDIT_MODAL' });
  const closeEditModal = () => dispatch({ type: 'CLOSE_EDIT_MODAL' });
  const setDeleteConfirmation: UIContextType['setDeleteConfirmation'] = confirmation => dispatch({ type: 'SET_DELETE_CONFIRMATION', payload: confirmation });
  const setCurrentView: UIContextType['setCurrentView'] = view => dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  const setEditingActivity: UIContextType['setEditingActivity'] = activity => dispatch({ type: 'SET_EDITING_ACTIVITY', payload: activity });
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const setSidebarOpen = (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  const setIsMobile = (isMobile: boolean) => dispatch({ type: 'SET_IS_MOBILE', payload: isMobile });
  const closeAllModals = () => dispatch({ type: 'CLOSE_ALL_MODALS' });

  const value: UIContextType = {
    state,
    openShareModal,
    closeShareModal,
    openImportModal,
    closeImportModal,
    openDeleteModal,
    closeDeleteModal,
    openEditModal,
    closeEditModal,
    setDeleteConfirmation,
    setCurrentView,
    setEditingActivity,
    toggleSidebar,
    setSidebarOpen,
    setIsMobile,
    closeAllModals,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
