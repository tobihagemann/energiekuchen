import { Activity, EnergyPie } from './index';

// ChartType - used throughout the app to specify current or desired state
export type ChartType = 'current' | 'desired';

// Energy Context Types
export type EnergyAction =
  | { type: 'SET_DATA'; payload: EnergyPie; shouldSave?: boolean }
  | { type: 'ADD_ACTIVITY'; payload: { chartType: ChartType; activity: Omit<Activity, 'id'> } }
  | { type: 'UPDATE_ACTIVITY'; payload: { chartType: ChartType; activityId: string; updates: Partial<Activity> } }
  | { type: 'DELETE_ACTIVITY'; payload: { chartType: ChartType; activityId: string } }
  | { type: 'REORDER_ACTIVITIES'; payload: { chartType: ChartType; fromIndex: number; toIndex: number } }
  | { type: 'COPY_ACTIVITIES_FROM_CURRENT' }
  | { type: 'RESET_DATA' }
  | { type: 'IMPORT_DATA'; payload: { data: EnergyPie; replaceExisting: boolean } }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'SET_LOADING'; payload: boolean };

// Simplified Energy Actions for shared pages (read-only)
export type SharedEnergyAction = { type: 'SET_DATA'; payload: EnergyPie; shouldSave?: boolean } | { type: 'SET_LOADING'; payload: boolean };

export interface EnergyState {
  data: EnergyPie;
  isLoading: boolean;
  lastSaved: string | null;
}

export interface EnergyContextType {
  state: EnergyState;
  dispatch: React.Dispatch<EnergyAction>;
  addActivity: (chartType: ChartType, activity: Omit<Activity, 'id'>) => void;
  updateActivity: (chartType: ChartType, activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (chartType: ChartType, activityId: string) => void;
  reorderActivities: (chartType: ChartType, fromIndex: number, toIndex: number) => void;
  copyActivitiesFromCurrent: () => void;
  resetData: () => void;
  saveData: () => void;
  loadData: () => void;
  importData: (jsonString: string) => void;
  exportData: () => string;
}

// UI Context Types
export interface UIState {
  // Modal states
  isShareModalOpen: boolean;
  isImportModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isEditModalOpen: boolean;
  deleteConfirmation: { chartType: ChartType; activityId: string } | null;

  // Current view
  currentView: 'dashboard';

  // Form states
  editingActivity: { chartType: ChartType; activityId: string } | null;

  // UI preferences
  sidebarOpen: boolean;
  isMobile: boolean;
}

export type UIAction =
  | { type: 'OPEN_SHARE_MODAL' }
  | { type: 'CLOSE_SHARE_MODAL' }
  | { type: 'OPEN_IMPORT_MODAL' }
  | { type: 'CLOSE_IMPORT_MODAL' }
  | { type: 'OPEN_DELETE_MODAL' }
  | { type: 'CLOSE_DELETE_MODAL' }
  | { type: 'OPEN_EDIT_MODAL' }
  | { type: 'CLOSE_EDIT_MODAL' }
  | { type: 'SET_DELETE_CONFIRMATION'; payload: { chartType: ChartType; activityId: string } | null }
  | { type: 'SET_CURRENT_VIEW'; payload: 'dashboard' }
  | { type: 'SET_EDITING_ACTIVITY'; payload: { chartType: ChartType; activityId: string } | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_IS_MOBILE'; payload: boolean }
  | { type: 'CLOSE_ALL_MODALS' };

export interface UIContextType {
  state: UIState;
  openShareModal: () => void;
  closeShareModal: () => void;
  openImportModal: () => void;
  closeImportModal: () => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  openEditModal: () => void;
  closeEditModal: () => void;
  setDeleteConfirmation: (confirmation: { chartType: ChartType; activityId: string } | null) => void;
  setCurrentView: (view: 'dashboard') => void;
  setEditingActivity: (activity: { chartType: ChartType; activityId: string } | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setIsMobile: (isMobile: boolean) => void;
  closeAllModals: () => void;
}
