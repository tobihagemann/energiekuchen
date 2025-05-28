'use client';

import { createContext, ReactNode, useContext, useReducer } from 'react';

// UI State
interface UIState {
  // Modal states
  isShareModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isImportModalOpen: boolean;
  isHelpModalOpen: boolean;
  importModalMode: 'full' | 'import-only';

  // Current view
  currentView: 'dashboard' | 'settings' | 'help';

  // Form states
  editingActivity: { chartType: 'positive' | 'negative'; activityId: string } | null;

  // UI preferences
  sidebarOpen: boolean;
  isMobile: boolean;
}

type UIAction =
  | { type: 'OPEN_SHARE_MODAL' }
  | { type: 'CLOSE_SHARE_MODAL' }
  | { type: 'OPEN_SETTINGS_MODAL' }
  | { type: 'CLOSE_SETTINGS_MODAL' }
  | { type: 'OPEN_IMPORT_MODAL'; payload?: 'full' | 'import-only' }
  | { type: 'CLOSE_IMPORT_MODAL' }
  | { type: 'OPEN_HELP_MODAL' }
  | { type: 'CLOSE_HELP_MODAL' }
  | { type: 'SET_CURRENT_VIEW'; payload: 'dashboard' | 'settings' | 'help' }
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

    case 'OPEN_SETTINGS_MODAL':
      return { ...state, isSettingsModalOpen: true };

    case 'CLOSE_SETTINGS_MODAL':
      return { ...state, isSettingsModalOpen: false };

    case 'OPEN_IMPORT_MODAL':
      return { ...state, isImportModalOpen: true, importModalMode: action.payload || 'full' };

    case 'CLOSE_IMPORT_MODAL':
      return { ...state, isImportModalOpen: false };

    case 'OPEN_HELP_MODAL':
      return { ...state, isHelpModalOpen: true };

    case 'CLOSE_HELP_MODAL':
      return { ...state, isHelpModalOpen: false };

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
        isSettingsModalOpen: false,
        isImportModalOpen: false,
        isHelpModalOpen: false,
      };

    default:
      return state;
  }
}

interface UIContextType {
  state: UIState;
  openShareModal: () => void;
  closeShareModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openImportModal: (mode?: 'full' | 'import-only') => void;
  closeImportModal: () => void;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  setCurrentView: (view: 'dashboard' | 'settings' | 'help') => void;
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
    isSettingsModalOpen: false,
    isImportModalOpen: false,
    isHelpModalOpen: false,
    importModalMode: 'full',
    currentView: 'dashboard',
    editingActivity: null,
    sidebarOpen: false,
    isMobile: false,
  });

  const openShareModal = () => dispatch({ type: 'OPEN_SHARE_MODAL' });
  const closeShareModal = () => dispatch({ type: 'CLOSE_SHARE_MODAL' });
  const openSettingsModal = () => dispatch({ type: 'OPEN_SETTINGS_MODAL' });
  const closeSettingsModal = () => dispatch({ type: 'CLOSE_SETTINGS_MODAL' });
  const openImportModal = (mode: 'full' | 'import-only' = 'full') => dispatch({ type: 'OPEN_IMPORT_MODAL', payload: mode });
  const closeImportModal = () => dispatch({ type: 'CLOSE_IMPORT_MODAL' });
  const openHelpModal = () => dispatch({ type: 'OPEN_HELP_MODAL' });
  const closeHelpModal = () => dispatch({ type: 'CLOSE_HELP_MODAL' });
  const setCurrentView = (view: 'dashboard' | 'settings' | 'help') => dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
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
    openSettingsModal,
    closeSettingsModal,
    openImportModal,
    closeImportModal,
    openHelpModal,
    closeHelpModal,
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
