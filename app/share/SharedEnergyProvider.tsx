'use client';

import { Activity, EnergyPie } from '@/app/types';
import { ChartType, EnergyState, SharedEnergyAction } from '@/app/types/context';
import React, { createContext, ReactNode, useReducer } from 'react';

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

// Simplified Energy Reducer for shared pages
function energyReducer(state: EnergyState, action: SharedEnergyAction): EnergyState {
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

interface SharedEnergyContextType {
  state: EnergyState;
  dispatch: React.Dispatch<SharedEnergyAction>;
  // Simplified interface - only what we need for shared pages
  addActivity: (chartType: ChartType, activity: Omit<Activity, 'id'>) => void;
  updateActivity: (chartType: ChartType, activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (chartType: ChartType, activityId: string) => void;
  reorderActivities: (chartType: ChartType, fromIndex: number, toIndex: number) => void;
  resetData: () => void;
  saveData: () => void;
  loadData: () => void;
  importData: (jsonString: string) => void;
  exportData: () => string;
}

const EnergyContext = createContext<SharedEnergyContextType | undefined>(undefined);

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

  const value: SharedEnergyContextType = {
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
