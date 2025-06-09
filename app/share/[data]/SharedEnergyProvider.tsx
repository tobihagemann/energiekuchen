'use client';

import { Activity, EnergyKuchen } from '@/app/types';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';

// Simplified Energy Reducer Actions for shared pages
type EnergyAction = { type: 'SET_DATA'; payload: EnergyKuchen; shouldSave?: boolean } | { type: 'SET_LOADING'; payload: boolean };

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
    },
    negative: {
      id: 'negative',
      type: 'negative',
      activities: [],
    },
  };
}

// Simplified Energy Reducer for shared pages
function energyReducer(state: EnergyState, action: EnergyAction): EnergyState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        lastSaved: action.shouldSave !== false ? new Date().toISOString() : state.lastSaved,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

interface EnergyContextType {
  state: EnergyState;
  dispatch: React.Dispatch<EnergyAction>;
  // Simplified interface - only what we need for shared pages
  addActivity: (chartType: 'positive' | 'negative', activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (chartType: 'positive' | 'negative', activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (chartType: 'positive' | 'negative', activityId: string) => void;
  reorderActivities: (chartType: 'positive' | 'negative', fromIndex: number, toIndex: number) => void;
  resetData: () => void;
  saveData: () => void;
  loadData: () => void;
  importData: (jsonString: string) => void;
  exportData: () => string;
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

// Shared Provider Component (does not auto-load from localStorage)
export function EnergyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(energyReducer, {
    data: createDefaultData(),
    isLoading: false, // Start with loading false for shared pages
    lastSaved: null,
  });

  // Simplified implementation - only methods needed for chart rendering
  const addActivity = () => {
    // Not implemented for shared pages
  };

  const updateActivity = () => {
    // Not implemented for shared pages
  };

  const deleteActivity = () => {
    // Not implemented for shared pages
  };

  const reorderActivities = () => {
    // Not implemented for shared pages
  };

  const resetData = () => {
    // Not implemented for shared pages
  };

  const saveData = () => {
    // Not implemented for shared pages
  };

  const loadData = () => {
    // Not implemented for shared pages
  };

  const importData = () => {
    // Not implemented for shared pages
  };

  const exportData = () => {
    return JSON.stringify(state.data);
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
