'use client';

import { generateUniqueId } from '@/app/lib/utils/calculations';
import { StorageManager } from '@/app/lib/utils/storage';
import { Activity, AppSettings, ChartSize, EnergyKuchen } from '@/app/types';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

// Energy Reducer Actions
type EnergyAction = 
  | { type: 'SET_DATA'; payload: EnergyKuchen }
  | { type: 'ADD_ACTIVITY'; payload: { chartType: 'positive' | 'negative'; activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_ACTIVITY'; payload: { chartType: 'positive' | 'negative'; activityId: string; updates: Partial<Activity> } }
  | { type: 'DELETE_ACTIVITY'; payload: { chartType: 'positive' | 'negative'; activityId: string } }
  | { type: 'REORDER_ACTIVITIES'; payload: { chartType: 'positive' | 'negative'; fromIndex: number; toIndex: number } }
  | { type: 'UPDATE_CHART_SIZE'; payload: { chartType: 'positive' | 'negative'; size: ChartSize } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'RESET_DATA' }
  | { type: 'IMPORT_DATA'; payload: EnergyKuchen }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'RESET_SETTINGS' }
  | { type: 'SET_LOADING'; payload: boolean };

interface EnergyState {
  data: EnergyKuchen;
  isLoading: boolean;
  lastSaved: string | null;
}

function createDefaultData(): EnergyKuchen {
  const now = new Date().toISOString();
  
  return {
    version: '1.0',
    lastModified: now,
    positive: {
      id: 'positive',
      type: 'positive',
      activities: [],
      size: 'medium'
    },
    negative: {
      id: 'negative',
      type: 'negative',
      activities: [],
      size: 'medium'
    },
    settings: {
      chartSize: 'medium',
      colorScheme: 'default',
      showTooltips: true,
      showLegends: true,
      language: 'de'
    }
  };
}

// Energy Reducer
function energyReducer(state: EnergyState, action: EnergyAction): EnergyState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        lastSaved: new Date().toISOString()
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'ADD_ACTIVITY': {
      const now = new Date().toISOString();
      const newActivity: Activity = {
        ...action.payload.activity,
        id: generateUniqueId(),
        createdAt: now,
        updatedAt: now
      };

      const updatedData = {
        ...state.data,
        lastModified: now,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: [...state.data[action.payload.chartType].activities, newActivity]
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    case 'UPDATE_ACTIVITY': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        lastModified: now,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: state.data[action.payload.chartType].activities.map(activity =>
            activity.id === action.payload.activityId
              ? { ...activity, ...action.payload.updates, updatedAt: now }
              : activity
          )
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    case 'DELETE_ACTIVITY': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        lastModified: now,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: state.data[action.payload.chartType].activities.filter(
            activity => activity.id !== action.payload.activityId
          )
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    case 'REORDER_ACTIVITIES': {
      const now = new Date().toISOString();
      const activities = [...state.data[action.payload.chartType].activities];
      const [movedActivity] = activities.splice(action.payload.fromIndex, 1);
      activities.splice(action.payload.toIndex, 0, movedActivity);

      const updatedData = {
        ...state.data,
        lastModified: now,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    case 'UPDATE_CHART_SIZE': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        lastModified: now,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          size: action.payload.size
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    case 'UPDATE_SETTINGS': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        lastModified: now,
        settings: {
          ...state.data.settings,
          ...action.payload
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    case 'RESET_DATA': {
      return {
        ...state,
        data: createDefaultData(),
        lastSaved: null
      };
    }

    case 'IMPORT_DATA': {
      return {
        ...state,
        data: action.payload,
        lastSaved: new Date().toISOString()
      };
    }

    case 'CLEAR_ALL_DATA': {
      return {
        ...state,
        data: createDefaultData(),
        lastSaved: new Date().toISOString()
      };
    }

    case 'RESET_SETTINGS': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        lastModified: now,
        settings: {
          chartSize: 'medium' as ChartSize,
          colorScheme: 'default' as const,
          showTooltips: true,
          showLegends: true,
          language: 'de' as const
        }
      };

      return {
        ...state,
        data: updatedData
      };
    }

    default:
      return state;
  }
}

// Context Definition
interface EnergyContextType {
  state: EnergyState;
  dispatch: React.Dispatch<EnergyAction>;
  addActivity: (chartType: 'positive' | 'negative', activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (chartType: 'positive' | 'negative', activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (chartType: 'positive' | 'negative', activityId: string) => void;
  reorderActivities: (chartType: 'positive' | 'negative', fromIndex: number, toIndex: number) => void;
  updateChartSize: (chartType: 'positive' | 'negative', size: ChartSize) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetData: () => void;
  saveData: () => void;
  loadData: () => void;
  importData: (jsonString: string) => void;
  exportData: () => string;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

// Provider Component
export function EnergyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(energyReducer, {
    data: createDefaultData(),
    isLoading: false,
    lastSaved: null
  });

  // Auto-save on data changes
  useEffect(() => {
    if (state.lastSaved) {
      StorageManager.save(state.data);
    }
  }, [state.data, state.lastSaved]);

  // Load data on mount
  useEffect(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const savedData = StorageManager.load();
      if (savedData) {
        dispatch({ type: 'SET_DATA', payload: savedData });
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addActivity = (chartType: 'positive' | 'negative', activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: { chartType, activity } });
  };

  const updateActivity = (chartType: 'positive' | 'negative', activityId: string, updates: Partial<Activity>) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { chartType, activityId, updates } });
  };

  const deleteActivity = (chartType: 'positive' | 'negative', activityId: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', payload: { chartType, activityId } });
  };

  const reorderActivities = (chartType: 'positive' | 'negative', fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_ACTIVITIES', payload: { chartType, fromIndex, toIndex } });
  };

  const updateChartSize = (chartType: 'positive' | 'negative', size: ChartSize) => {
    dispatch({ type: 'UPDATE_CHART_SIZE', payload: { chartType, size } });
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const resetData = () => {
    dispatch({ type: 'RESET_DATA' });
  };

  const saveData = () => {
    StorageManager.save(state.data);
  };

  const loadData = () => {
    const savedData = StorageManager.load();
    if (savedData) {
      dispatch({ type: 'SET_DATA', payload: savedData });
    }
  };

  const importData = (jsonString: string) => {
    const importedData = StorageManager.import(jsonString);
    dispatch({ type: 'SET_DATA', payload: importedData });
  };

  const exportData = () => {
    return StorageManager.export();
  };

  const value: EnergyContextType = {
    state,
    dispatch,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    updateChartSize,
    updateSettings,
    resetData,
    saveData,
    loadData,
    importData,
    exportData
  };

  return (
    <EnergyContext.Provider value={value}>
      {children}
    </EnergyContext.Provider>
  );
}

// Custom Hook
export function useEnergy() {
  const context = useContext(EnergyContext);
  if (context === undefined) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
}
