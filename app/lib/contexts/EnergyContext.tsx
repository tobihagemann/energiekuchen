'use client';

import { StorageManager } from '@/app/lib/utils/storage';
import { Activity, EnergyPie } from '@/app/types';
import React, { createContext, ReactNode, useContext, useEffect, useReducer, useRef } from 'react';

// Energy Reducer Actions
type EnergyAction =
  | { type: 'SET_DATA'; payload: EnergyPie; shouldSave?: boolean }
  | { type: 'ADD_ACTIVITY'; payload: { chartType: 'current' | 'desired'; activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'> } }
  | { type: 'UPDATE_ACTIVITY'; payload: { chartType: 'current' | 'desired'; activityId: string; updates: Partial<Activity> } }
  | { type: 'DELETE_ACTIVITY'; payload: { chartType: 'current' | 'desired'; activityId: string } }
  | { type: 'REORDER_ACTIVITIES'; payload: { chartType: 'current' | 'desired'; fromIndex: number; toIndex: number } }
  | { type: 'RESET_DATA' }
  | { type: 'IMPORT_DATA'; payload: { data: EnergyPie; replaceExisting: boolean } }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'SET_LOADING'; payload: boolean };

interface EnergyState {
  data: EnergyPie;
  isLoading: boolean;
  lastSaved: string | null;
}

function createDefaultData(): EnergyPie {
  return {
    version: '2.0',
    current: {
      activities: [],
    },
    desired: {
      activities: [],
    },
  };
}

// Energy Reducer
function energyReducer(state: EnergyState, action: EnergyAction): EnergyState {
  switch (action.type) {
    case 'SET_DATA':
      const newState = {
        ...state,
        data: action.payload,
        lastSaved: action.shouldSave !== false ? new Date().toISOString() : state.lastSaved,
        // When loading data (shouldSave=false), also set loading to false
        isLoading: action.shouldSave === false ? false : state.isLoading,
      };
      return newState;

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'ADD_ACTIVITY': {
      // Validate chart type before processing
      if (action.payload.chartType !== 'current' && action.payload.chartType !== 'desired') {
        return state;
      }

      const now = new Date().toISOString();
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        ...action.payload.activity,
      };

      const updatedData = {
        ...state.data,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: [...state.data[action.payload.chartType].activities, newActivity],
        },
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: now,
      };
    }

    case 'UPDATE_ACTIVITY': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: state.data[action.payload.chartType].activities.map(activity =>
            activity.id === action.payload.activityId ? { ...activity, ...action.payload.updates } : activity
          ),
        },
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: now,
      };
    }

    case 'DELETE_ACTIVITY': {
      const now = new Date().toISOString();
      const updatedData = {
        ...state.data,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: state.data[action.payload.chartType].activities.filter(activity => activity.id !== action.payload.activityId),
        },
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: now,
      };
    }

    case 'REORDER_ACTIVITIES': {
      const now = new Date().toISOString();
      const activities = [...state.data[action.payload.chartType].activities];
      const [movedActivity] = activities.splice(action.payload.fromIndex, 1);
      activities.splice(action.payload.toIndex, 0, movedActivity);

      const updatedData = {
        ...state.data,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities,
        },
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: now,
      };
    }

    case 'RESET_DATA': {
      return {
        ...state,
        data: createDefaultData(),
        lastSaved: null,
      };
    }

    case 'IMPORT_DATA': {
      const now = new Date().toISOString();
      const { data: importedData, replaceExisting } = action.payload;

      let resultData;

      if (replaceExisting) {
        // Replace existing data with imported data
        resultData = {
          ...importedData,
        };
      } else {
        // Merge imported activities with existing activities, avoiding duplicates by ID
        const existingCurrentIds = new Set(state.data.current.activities.map(a => a.id));
        const existingDesiredIds = new Set(state.data.desired.activities.map(a => a.id));

        resultData = {
          ...importedData,
          current: {
            ...importedData.current,
            activities: [...state.data.current.activities, ...importedData.current.activities.filter(a => !existingCurrentIds.has(a.id))],
          },
          desired: {
            ...importedData.desired,
            activities: [...state.data.desired.activities, ...importedData.desired.activities.filter(a => !existingDesiredIds.has(a.id))],
          },
        };
      }

      return {
        ...state,
        data: resultData,
        lastSaved: now,
      };
    }

    case 'CLEAR_ALL_DATA': {
      return {
        ...state,
        data: createDefaultData(),
        lastSaved: new Date().toISOString(),
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
  addActivity: (chartType: 'current' | 'desired', activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (chartType: 'current' | 'desired', activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (chartType: 'current' | 'desired', activityId: string) => void;
  reorderActivities: (chartType: 'current' | 'desired', fromIndex: number, toIndex: number) => void;
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
    lastSaved: null,
  });

  const hasLoadedRef = useRef(false);

  // Auto-save on data changes
  useEffect(() => {
    if (state.lastSaved) {
      StorageManager.save(state.data);
    }
  }, [state.data, state.lastSaved]);

  // Load data on mount (skip for shared routes)
  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const savedData = StorageManager.load();
      if (savedData) {
        dispatch({ type: 'SET_DATA', payload: savedData, shouldSave: false });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addActivity = (chartType: 'current' | 'desired', activity: Omit<Activity, 'id'>) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: { chartType, activity } });
  };

  const updateActivity = (chartType: 'current' | 'desired', activityId: string, updates: Partial<Activity>) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { chartType, activityId, updates } });
  };

  const deleteActivity = (chartType: 'current' | 'desired', activityId: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', payload: { chartType, activityId } });
  };

  const reorderActivities = (chartType: 'current' | 'desired', fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_ACTIVITIES', payload: { chartType, fromIndex, toIndex } });
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
    resetData,
    saveData,
    loadData,
    importData,
    exportData,
  };

  return <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>;
}

// Custom Hook
export function useEnergy() {
  const context = useContext(EnergyContext);
  if (context === undefined) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
}
