'use client';

import { createContext, ReactNode, useContext, useEffect, useReducer, useRef } from 'react';

import { renormalizeToFloor, WeightEntry } from '@/app/lib/utils/redistribution';
import { StorageManager } from '@/app/lib/utils/storage';
import { validateLabelOffset } from '@/app/lib/utils/validation';
import { Activity, EnergyPie, LabelOffset } from '@/app/types';
import { ChartType, EnergyAction, EnergyContextType, EnergyState } from '@/app/types/context';

function createDefaultData(): EnergyPie {
  return {
    version: '3.0',
    current: {
      activities: [],
    },
    desired: {
      activities: [],
    },
  };
}

function renormalizeChart(chart: { activities: Activity[] }): { activities: Activity[] } {
  return { activities: renormalizeToFloor(chart.activities) };
}

function energyReducer(state: EnergyState, action: EnergyAction): EnergyState {
  switch (action.type) {
    case 'SET_DATA': {
      const newState = {
        ...state,
        data: action.payload,
        lastSaved: action.shouldSave !== false ? new Date().toISOString() : state.lastSaved,
        isLoading: action.shouldSave === false ? false : state.isLoading,
      };
      return newState;
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'ADD_ACTIVITY': {
      const now = new Date().toISOString();
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        ...action.payload.activity,
      };

      const targetChart = state.data[action.payload.chartType];
      const withNew = { activities: [...targetChart.activities, newActivity] };
      const updatedData = {
        ...state.data,
        [action.payload.chartType]: renormalizeChart(withNew),
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
      const targetChart = state.data[action.payload.chartType];
      const filtered = { activities: targetChart.activities.filter(a => a.id !== action.payload.activityId) };
      const updatedData = {
        ...state.data,
        [action.payload.chartType]: renormalizeChart(filtered),
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

    case 'SET_ACTIVITY_WEIGHTS': {
      const now = new Date().toISOString();
      const weightById = new Map(action.payload.newWeights.map(w => [w.id, w.weight]));
      const updatedData = {
        ...state.data,
        [action.payload.chartType]: {
          ...state.data[action.payload.chartType],
          activities: state.data[action.payload.chartType].activities.map(a => (weightById.has(a.id) ? { ...a, weight: weightById.get(a.id) as number } : a)),
        },
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: now,
      };
    }

    case 'TOGGLE_POLARITY': {
      const now = new Date().toISOString();
      const chart = state.data[action.payload.chartType];
      const targetIdx = chart.activities.findIndex(a => a.id === action.payload.activityId);
      if (targetIdx === -1) return state;

      const target = chart.activities[targetIdx];
      const destinationPolarity = target.polarity === 'positive' ? 'negative' : 'positive';
      const wasEmptyDestination = chart.activities.every((a, i) => i === targetIdx || a.polarity !== destinationPolarity);

      // Flip polarity in place so the pie keeps the activity at its current ring
      // position. Renormalize when the destination group was previously empty, since
      // the now-shared total can drive the flipped slice below the floor.
      const flipped: Activity = { ...target, polarity: destinationPolarity };
      const nextActivities = chart.activities.map((a, i) => (i === targetIdx ? flipped : a));
      const nextChart = wasEmptyDestination ? renormalizeChart({ activities: nextActivities }) : { activities: nextActivities };

      const updatedData = {
        ...state.data,
        [action.payload.chartType]: nextChart,
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: now,
      };
    }

    case 'SET_LABEL_OFFSET': {
      const chart = state.data[action.payload.chartType];
      const target = chart.activities.find(a => a.id === action.payload.activityId);
      if (!target) return state;

      let nextActivity: Activity;
      if (action.payload.offset === null) {
        if (!target.labelOffset) return state;
        const { labelOffset: _unused, ...rest } = target;
        nextActivity = rest;
      } else {
        const result = validateLabelOffset(action.payload.offset);
        if (!result.isValid || !result.normalized) return state;
        nextActivity = { ...target, labelOffset: result.normalized };
      }

      const updatedData = {
        ...state.data,
        [action.payload.chartType]: {
          ...chart,
          activities: chart.activities.map(a => (a.id === action.payload.activityId ? nextActivity : a)),
        },
      };

      return {
        ...state,
        data: updatedData,
        lastSaved: new Date().toISOString(),
      };
    }

    case 'COPY_ACTIVITIES_FROM_CURRENT': {
      const now = new Date().toISOString();
      const currentActivities = state.data.current.activities;

      const copiedActivities: Activity[] = currentActivities.map(activity => ({
        ...activity,
        id: crypto.randomUUID(),
      }));

      const updatedData = {
        ...state.data,
        desired: {
          ...state.data.desired,
          activities: copiedActivities,
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

      let resultData: EnergyPie;

      if (replaceExisting) {
        resultData = {
          ...importedData,
          current: renormalizeChart(importedData.current),
          desired: renormalizeChart(importedData.desired),
        };
      } else {
        const existingCurrentIds = new Set(state.data.current.activities.map(a => a.id));
        const existingDesiredIds = new Set(state.data.desired.activities.map(a => a.id));

        resultData = {
          ...importedData,
          current: renormalizeChart({
            activities: [...state.data.current.activities, ...importedData.current.activities.filter(a => !existingCurrentIds.has(a.id))],
          }),
          desired: renormalizeChart({
            activities: [...state.data.desired.activities, ...importedData.desired.activities.filter(a => !existingDesiredIds.has(a.id))],
          }),
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

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export function EnergyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(energyReducer, {
    data: createDefaultData(),
    isLoading: false,
    lastSaved: null,
  });

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (state.lastSaved) {
      StorageManager.save(state.data);
    }
  }, [state.data, state.lastSaved]);

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

  const addActivity = (chartType: ChartType, activity: Omit<Activity, 'id'>) => {
    dispatch({ type: 'ADD_ACTIVITY', payload: { chartType, activity } });
  };

  const updateActivity = (chartType: ChartType, activityId: string, updates: Partial<Activity>) => {
    dispatch({ type: 'UPDATE_ACTIVITY', payload: { chartType, activityId, updates } });
  };

  const deleteActivity = (chartType: ChartType, activityId: string) => {
    dispatch({ type: 'DELETE_ACTIVITY', payload: { chartType, activityId } });
  };

  const reorderActivities = (chartType: ChartType, fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_ACTIVITIES', payload: { chartType, fromIndex, toIndex } });
  };

  const setActivityWeights = (chartType: ChartType, newWeights: WeightEntry[]) => {
    dispatch({ type: 'SET_ACTIVITY_WEIGHTS', payload: { chartType, newWeights } });
  };

  const togglePolarity = (chartType: ChartType, activityId: string) => {
    dispatch({ type: 'TOGGLE_POLARITY', payload: { chartType, activityId } });
  };

  const setLabelOffset = (chartType: ChartType, activityId: string, offset: LabelOffset | null) => {
    dispatch({ type: 'SET_LABEL_OFFSET', payload: { chartType, activityId, offset } });
  };

  const copyActivitiesFromCurrent = () => {
    dispatch({ type: 'COPY_ACTIVITIES_FROM_CURRENT' });
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
    setActivityWeights,
    togglePolarity,
    setLabelOffset,
    copyActivitiesFromCurrent,
    resetData,
    saveData,
    loadData,
    importData,
    exportData,
  };

  return <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>;
}

export function useEnergy() {
  const context = useContext(EnergyContext);
  if (context === undefined) {
    throw new Error('useEnergy must be used within an EnergyProvider');
  }
  return context;
}
