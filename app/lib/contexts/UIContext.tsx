'use client';

import { createContext, ReactNode, useContext, useReducer } from 'react';

// UI State
interface UIState {
  // Modal states
  isShareModalOpen: boolean;
  isImportExportModalOpen: boolean;
  deleteConfirmation: { chartType: 'positive' | 'negative'; activityId: string } | null;

  // Current view
  currentView: 'dashboard';

  // Form states
  editingActivity: { chartType: 'positive' | 'negative'; activityId: string } | null;

  // UI preferences
  sidebarOpen: boolean;
  isMobile: boolean;
}

type UIAction =
  | { type: 'OPEN_SHARE_MODAL' }
  | { type: 'CLOSE_SHARE_MODAL' }
  | { type: 'OPEN_IMPORT_EXPORT_MODAL' }
  | { type: 'CLOSE_IMPORT_EXPORT_MODAL' }
  | { type: 'SET_DELETE_CONFIRMATION'; payload: { chartType: 'positive' | 'negative'; activityId: string } | null }
  | { type: 'SET_CURRENT_VIEW'; payload: 'dashboard' }
  | { type: 'SET_EDITING_ACTIVITY'; payload: { chartType: 'positive' | 'negative'; activityId: string } | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'CLOSE_ALL_MODALS' };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'OPEN_SHARE_MODAL':
      return { ...state, isShareModalOpen: true };

    case 'CLOSE_SHARE_MODAL':
      return { ...state, isShareModalOpen: false };

    case 'OPEN_IMPORT_EXPORT_MODAL':
      return { ...state, isImportExportModalOpen: true };

    case 'CLOSE_IMPORT_EXPORT_MODAL':
      return { ...state, isImportExportModalOpen: false };

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
        isImportExportModalOpen: false,
        deleteConfirmation: null,
      };

    default:
      return state;
  }
}

interface UIContextType {
  state: UIState;
  openShareModal: () => void;
  closeShareModal: () => void;
  openImportExportModal: () => void;
  closeImportExportModal: () => void;
  setDeleteConfirmation: (confirmation: { chartType: 'positive' | 'negative'; activityId: string } | null) => void;
  setCurrentView: (view: 'dashboard') => void;
  setEditingActivity: (activity: { chartType: 'positive' | 'negative'; activityId: string } | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  closeAllModals: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, {
    isShareModalOpen: false,
    isImportExportModalOpen: false,
    deleteConfirmation: null,
    currentView: 'dashboard',
    editingActivity: null,
    sidebarOpen: false,
    isMobile: false,
  });

  const openShareModal = () => dispatch({ type: 'OPEN_SHARE_MODAL' });
  const closeShareModal = () => dispatch({ type: 'CLOSE_SHARE_MODAL' });
  const openImportExportModal = () => dispatch({ type: 'OPEN_IMPORT_EXPORT_MODAL' });
  const closeImportExportModal = () => dispatch({ type: 'CLOSE_IMPORT_EXPORT_MODAL' });
  const setDeleteConfirmation = (confirmation: { chartType: 'positive' | 'negative'; activityId: string } | null) =>
    dispatch({ type: 'SET_DELETE_CONFIRMATION', payload: confirmation });
  const setCurrentView = (view: 'dashboard') => dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  const setEditingActivity = (activity: { chartType: 'positive' | 'negative'; activityId: string } | null) =>
    dispatch({ type: 'SET_EDITING_ACTIVITY', payload: activity });
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const setSidebarOpen = (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  const setIsMobile = (isMobile: boolean) => dispatch({ type: 'SET_IS_MOBILE', payload: isMobile });
  const closeAllModals = () => dispatch({ type: 'CLOSE_ALL_MODALS' });

  const value: UIContextType = {
    state,
    openShareModal,
    closeShareModal,
    openImportExportModal,
    closeImportExportModal,
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
