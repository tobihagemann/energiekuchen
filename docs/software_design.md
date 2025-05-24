# Energiekuchen - Software Design Document

## 1. Überblick

### 1.1 Zweck
Dieses Software Design Document beschreibt die technische Architektur und Implementierungsdetails für die Energiekuchen-Anwendung. Es dient als technische Referenz für die Implementierung der in der Produktspezifikation definierten Anforderungen.

### 1.2 Scope
Das Design umfasst:
- Frontend-Architektur mit Next.js App Router
- Komponentenstruktur und State Management
- Datenmodellierung und lokale Persistierung
- URL-basiertes Sharing-System
- Responsive UI/UX Implementation

### 1.3 Technologie-Stack
- **Framework:** Next.js 15.x mit App Router
- **UI:** React 19.x mit TypeScript
- **Styling:** Tailwind CSS 4.x
- **Charts:** Chart.js mit react-chartjs-2
- **State Management:** React useState/useReducer mit Context API
- **Icons:** Heroicons
- **Notifications:** react-hot-toast
- **QR Codes:** qrcode
- **Color Picker:** react-colorful

## 2. Architektur

### 2.1 Ordnerstruktur
```
/app
  /(main)                 # Hauptanwendung (grouped route)
    page.tsx             # Dashboard
    layout.tsx           # Layout wrapper
  /share
    /[data]
      page.tsx           # Shared energy charts viewer
  /hilfe
    page.tsx            # Help page
  /datenschutz
    page.tsx            # Privacy policy
  /impressum
    page.tsx            # Imprint
  /components
    /ui                 # Basis UI-Komponenten
      Button.tsx
      Input.tsx
      Modal.tsx
      Slider.tsx
      ColorPicker.tsx
      Toast.tsx
    /charts             # Chart-spezifische Komponenten
      EnergyChart.tsx
      ChartLegend.tsx
      ChartTooltip.tsx
    /forms              # Formular-Komponenten
      ActivityForm.tsx
      SettingsForm.tsx
    /layout             # Layout-Komponenten
      Header.tsx
      Sidebar.tsx
      Footer.tsx
    /features           # Feature-spezifische Komponenten
      ActivityList.tsx
      ShareModal.tsx
      ImportExportPanel.tsx
  /lib
    /contexts           # React Context providers
      EnergyContext.tsx
      UIContext.tsx
    /utils              # Utility-Funktionen
      storage.ts
      sharing.ts
      validation.ts
      calculations.ts
      constants.ts
    /hooks              # Custom React hooks
      useLocalStorage.ts
      useChartData.ts
      useResponsive.ts
  /types                # TypeScript-Definitionen
    index.ts
    chart.ts
    storage.ts
  globals.css
  layout.tsx
  page.tsx             # Root redirect to /(main)
```

### 2.2 Komponentenhierarchie
```
RootLayout
├── Header
├── Main Content
│   ├── EnergyChart (Positive)
│   │   ├── ChartLegend
│   │   └── ChartTooltip
│   ├── EnergyChart (Negative)
│   │   ├── ChartLegend
│   │   └── ChartTooltip
│   ├── ActivityList (for each chart)
│   └── ActivityForm
├── Sidebar
│   ├── SettingsForm
│   └── ImportExportPanel
├── ShareModal
└── Toast Notifications
```

## 3. Datenmodellierung

### 3.1 TypeScript Interfaces

```typescript
// types/index.ts
export interface Activity {
  id: string;
  name: string;
  value: number; // 1-100
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnergyChart {
  id: string;
  type: 'positive' | 'negative';
  activities: Activity[];
  size: ChartSize;
  title?: string;
}

export interface EnergyKuchen {
  version: string;
  lastModified: string;
  positive: EnergyChart;
  negative: EnergyChart;
  settings: AppSettings;
}

export interface AppSettings {
  chartSize: ChartSize;
  colorScheme: ColorScheme;
  showTooltips: boolean;
  showLegends: boolean;
  language: 'de';
}

export type ChartSize = 'small' | 'medium' | 'large';
export type ColorScheme = 'default' | 'high-contrast' | 'colorblind-friendly';

// types/chart.ts
export interface ChartConfiguration {
  type: 'doughnut';
  data: ChartData;
  options: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface Dataset {
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  borderWidth: number;
  hoverBackgroundColor: string[];
  hoverBorderColor: string[];
}

// types/storage.ts
export interface StorageManager {
  save: (data: EnergyKuchen) => void;
  load: () => EnergyKuchen | null;
  clear: () => void;
  export: () => string;
  import: (data: string) => EnergyKuchen;
}

export interface ShareData {
  encoded: string;
  url: string;
  qrCode: string;
}
```

### 3.2 Datenvalidation Schema

```typescript
// lib/utils/validation.ts
export const VALIDATION_RULES = {
  activity: {
    name: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-ZäöüÄÖÜß0-9\s\-_.,!?]+$/
    },
    value: {
      min: 1,
      max: 100,
      type: 'integer'
    },
    color: {
      pattern: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    }
  },
  chart: {
    maxActivities: 20,
    minActivities: 0
  }
} as const;

export function validateActivity(activity: Partial<Activity>): ValidationResult {
  const errors: string[] = [];
  
  if (!activity.name || activity.name.length < VALIDATION_RULES.activity.name.minLength) {
    errors.push('Aktivitätsname ist erforderlich');
  }
  
  if (activity.name && activity.name.length > VALIDATION_RULES.activity.name.maxLength) {
    errors.push(`Aktivitätsname darf maximal ${VALIDATION_RULES.activity.name.maxLength} Zeichen haben`);
  }
  
  if (!activity.value || activity.value < VALIDATION_RULES.activity.value.min || activity.value > VALIDATION_RULES.activity.value.max) {
    errors.push('Energiewert muss zwischen 1 und 100 liegen');
  }
  
  if (!activity.color || !VALIDATION_RULES.activity.color.pattern.test(activity.color)) {
    errors.push('Ungültige Farbe');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 4. State Management

### 4.1 React Context API Architecture

Die Anwendung verwendet React's eingebaute State Management Lösung mit `useReducer` für komplexe Zustandsübergänge und Context API für globale Zustandsverwaltung.

```typescript
// lib/contexts/EnergyContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

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
  | { type: 'SET_LOADING'; payload: boolean };

interface EnergyState {
  data: EnergyKuchen;
  isLoading: boolean;
  lastSaved: string | null;
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
    
    case 'ADD_ACTIVITY': {
      const { chartType, activity } = action.payload;
      const newActivity: Activity = {
        id: crypto.randomUUID(),
        ...activity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        data: {
          ...state.data,
          [chartType]: {
            ...state.data[chartType],
            activities: [...state.data[chartType].activities, newActivity]
          },
          lastModified: new Date().toISOString()
        },
        lastSaved: new Date().toISOString()
      };
    }
    
    case 'UPDATE_ACTIVITY': {
      const { chartType, activityId, updates } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [chartType]: {
            ...state.data[chartType],
            activities: state.data[chartType].activities.map(activity =>
              activity.id === activityId
                ? { ...activity, ...updates, updatedAt: new Date().toISOString() }
                : activity
            )
          },
          lastModified: new Date().toISOString()
        },
        lastSaved: new Date().toISOString()
      };
    }
    
    case 'DELETE_ACTIVITY': {
      const { chartType, activityId } = action.payload;
      return {
        ...state,
        data: {
          ...state.data,
          [chartType]: {
            ...state.data[chartType],
            activities: state.data[chartType].activities.filter(activity => activity.id !== activityId)
          },
          lastModified: new Date().toISOString()
        },
        lastSaved: new Date().toISOString()
      };
    }
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        data: {
          ...state.data,
          settings: { ...state.data.settings, ...action.payload },
          lastModified: new Date().toISOString()
        },
        lastSaved: new Date().toISOString()
      };
    
    case 'RESET_DATA':
      return {
        ...state,
        data: getDefaultEnergyKuchen(),
        lastSaved: new Date().toISOString()
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    default:
      return state;
  }
}

// Context Definition
interface EnergyContextType {
  state: EnergyState;
  dispatch: React.Dispatch<EnergyAction>;
  actions: {
    addActivity: (chartType: 'positive' | 'negative', activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateActivity: (chartType: 'positive' | 'negative', activityId: string, updates: Partial<Activity>) => void;
    deleteActivity: (chartType: 'positive' | 'negative', activityId: string) => void;
    reorderActivities: (chartType: 'positive' | 'negative', fromIndex: number, toIndex: number) => void;
    updateChartSize: (chartType: 'positive' | 'negative', size: ChartSize) => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    resetData: () => void;
    importData: (data: EnergyKuchen) => void;
    exportData: () => string;
  };
}

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

// Provider Component
export function EnergyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(energyReducer, {
    data: getDefaultEnergyKuchen(),
    isLoading: false,
    lastSaved: null
  });
  
  // LocalStorage persistence
  useEffect(() => {
    const savedData = localStorage.getItem('energiekuchen-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'SET_DATA', payload: parsedData });
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('energiekuchen-data', JSON.stringify(state.data));
  }, [state.data]);
  
  // Action creators
  const actions = {
    addActivity: (chartType: 'positive' | 'negative', activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
      dispatch({ type: 'ADD_ACTIVITY', payload: { chartType, activity } });
    },
    updateActivity: (chartType: 'positive' | 'negative', activityId: string, updates: Partial<Activity>) => {
      dispatch({ type: 'UPDATE_ACTIVITY', payload: { chartType, activityId, updates } });
    },
    deleteActivity: (chartType: 'positive' | 'negative', activityId: string) => {
      dispatch({ type: 'DELETE_ACTIVITY', payload: { chartType, activityId } });
    },
    reorderActivities: (chartType: 'positive' | 'negative', fromIndex: number, toIndex: number) => {
      dispatch({ type: 'REORDER_ACTIVITIES', payload: { chartType, fromIndex, toIndex } });
    },
    updateChartSize: (chartType: 'positive' | 'negative', size: ChartSize) => {
      dispatch({ type: 'UPDATE_CHART_SIZE', payload: { chartType, size } });
    },
    updateSettings: (settings: Partial<AppSettings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
    },
    resetData: () => {
      dispatch({ type: 'RESET_DATA' });
    },
    importData: (data: EnergyKuchen) => {
      dispatch({ type: 'SET_DATA', payload: data });
    },
    exportData: () => {
      return JSON.stringify(state.data);
    }
  };
  
  return (
    <EnergyContext.Provider value={{ state, dispatch, actions }}>
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

// lib/contexts/UIContext.tsx
interface UIState {
  // Modal states
  isShareModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isImportModalOpen: boolean;
  
  // Form states
  editingActivity: { chartType: 'positive' | 'negative'; activityId: string } | null;
  
  // UI preferences
  sidebarCollapsed: boolean;
  currentView: 'dashboard' | 'settings' | 'help';
}

type UIAction =
  | { type: 'OPEN_SHARE_MODAL' }
  | { type: 'CLOSE_SHARE_MODAL' }
  | { type: 'OPEN_SETTINGS_MODAL' }
  | { type: 'CLOSE_SETTINGS_MODAL' }
  | { type: 'OPEN_IMPORT_MODAL' }
  | { type: 'CLOSE_IMPORT_MODAL' }
  | { type: 'SET_EDITING_ACTIVITY'; payload: { chartType: 'positive' | 'negative'; activityId: string } }
  | { type: 'CLEAR_EDITING_ACTIVITY' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_CURRENT_VIEW'; payload: 'dashboard' | 'settings' | 'help' };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'OPEN_SHARE_MODAL':
      return { ...state, isShareModalOpen: true };
    case 'CLOSE_SHARE_MODAL':
      return { ...state, isShareModalOpen: false };
    case 'SET_EDITING_ACTIVITY':
      return { ...state, editingActivity: action.payload };
    case 'CLEAR_EDITING_ACTIVITY':
      return { ...state, editingActivity: null };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    default:
      return state;
  }
}

interface UIContextType {
  state: UIState;
  actions: {
    openShareModal: () => void;
    closeShareModal: () => void;
    setEditingActivity: (chartType: 'positive' | 'negative', activityId: string) => void;
    clearEditingActivity: () => void;
    toggleSidebar: () => void;
    setCurrentView: (view: 'dashboard' | 'settings' | 'help') => void;
  };
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, {
    isShareModalOpen: false,
    isSettingsModalOpen: false,
    isImportModalOpen: false,
    editingActivity: null,
    sidebarCollapsed: false,
    currentView: 'dashboard'
  });
  
  const actions = {
    openShareModal: () => dispatch({ type: 'OPEN_SHARE_MODAL' }),
    closeShareModal: () => dispatch({ type: 'CLOSE_SHARE_MODAL' }),
    setEditingActivity: (chartType: 'positive' | 'negative', activityId: string) => 
      dispatch({ type: 'SET_EDITING_ACTIVITY', payload: { chartType, activityId } }),
    clearEditingActivity: () => dispatch({ type: 'CLEAR_EDITING_ACTIVITY' }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setCurrentView: (view: 'dashboard' | 'settings' | 'help') => 
      dispatch({ type: 'SET_CURRENT_VIEW', payload: view })
  };
  
  return (
    <UIContext.Provider value={{ state, actions }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
```

### 4.2 App Setup mit Context Providers

```typescript
// app/layout.tsx
import { EnergyProvider } from '@/lib/contexts/EnergyContext';
import { UIProvider } from '@/lib/contexts/UIContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <EnergyProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </EnergyProvider>
      </body>
    </html>
  );
}

// app/page.tsx - Dashboard Component
import { useEnergy } from '@/lib/contexts/EnergyContext';
import { useUI } from '@/lib/contexts/UIContext';

export default function Dashboard() {
  const { state, actions } = useEnergy();
  const { state: uiState, actions: uiActions } = useUI();
  
  const handleAddActivity = (chartType: 'positive' | 'negative') => {
    const newActivity = {
      name: 'Neue Aktivität',
      value: 50,
      color: getDefaultColor(chartType)
    };
    actions.addActivity(chartType, newActivity);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Positive Energy Chart */}
          <ChartSection
            chartType="positive"
            chart={state.data.positive}
            onAddActivity={() => handleAddActivity('positive')}
            onEditActivity={(activityId) => 
              uiActions.setEditingActivity('positive', activityId)
            }
          />
          
          {/* Negative Energy Chart */}
          <ChartSection
            chartType="negative"
            chart={state.data.negative}
            onAddActivity={() => handleAddActivity('negative')}
            onEditActivity={(activityId) => 
              uiActions.setEditingActivity('negative', activityId)
            }
          />
        </div>
      </main>
      
      {/* Modals */}
      {uiState.isShareModalOpen && (
        <ShareModal onClose={uiActions.closeShareModal} />
      )}
      
      {uiState.editingActivity && (
        <EditActivityModal
          activity={uiState.editingActivity}
          onClose={uiActions.clearEditingActivity}
        />
      )}
    </div>
  );
}
```

## 5. Komponenten-Design

### 5.1 EnergyChart Komponente

```typescript
// app/components/charts/EnergyChart.tsx
interface EnergyChartProps {
  chartType: 'positive' | 'negative';
  activities: Activity[];
  size: ChartSize;
  onActivityClick?: (activity: Activity) => void;
  onActivityHover?: (activity: Activity | null) => void;
  className?: string;
}

export function EnergyChart({ 
  chartType, 
  activities, 
  size, 
  onActivityClick, 
  onActivityHover,
  className 
}: EnergyChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const { data, options } = useChartData(activities, chartType, size);
  
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create new chart
    chartInstance.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data,
      options: {
        ...options,
        onClick: (event, elements) => {
          if (elements.length > 0 && onActivityClick) {
            const index = elements[0].index;
            onActivityClick(activities[index]);
          }
        },
        onHover: (event, elements) => {
          if (elements.length > 0 && onActivityHover) {
            const index = elements[0].index;
            onActivityHover(activities[index]);
          } else {
            onActivityHover?.(null);
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, options, activities, onActivityClick, onActivityHover]);
  
  const sizeClasses = {
    small: 'w-64 h-64',
    medium: 'w-80 h-80',
    large: 'w-96 h-96'
  };
  
  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <canvas ref={chartRef} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl mb-1">
            {chartType === 'positive' ? '⚡' : '🔋'}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {chartType === 'positive' ? 'Energie+' : 'Energie-'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5.2 ActivityForm Komponente

```typescript
// app/components/forms/ActivityForm.tsx
import { useEnergy } from '@/lib/contexts/EnergyContext';
import { useUI } from '@/lib/contexts/UIContext';

interface ActivityFormProps {
  activity?: Activity;
  chartType: 'positive' | 'negative';
  onCancel: () => void;
  isLoading?: boolean;
}

export function ActivityForm({ 
  activity, 
  chartType, 
  onCancel, 
  isLoading = false 
}: ActivityFormProps) {
  const { actions } = useEnergy();
  const { actions: uiActions } = useUI();
  
  const [formData, setFormData] = useState({
    name: activity?.name || '',
    value: activity?.value || 50,
    color: activity?.color || getDefaultColor(chartType)
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateActivity(formData);
    if (!validation.isValid) {
      setErrors(validation.errors.reduce((acc, error) => {
        acc[error.field] = error.message;
        return acc;
      }, {}));
      return;
    }
    
    setErrors({});
    
    // Use Context API actions
    if (activity) {
      // Update existing activity
      actions.updateActivity(chartType, activity.id, formData);
    } else {
      // Add new activity
      actions.addActivity(chartType, formData);
    }
    
    // Close form/modal
    uiActions.clearEditingActivity();
    onCancel();
  };
  
  const colorPalette = getColorPalette(chartType);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="activity-name">Aktivitätsname</Label>
        <Input
          id="activity-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="z.B. Sport, Meditation, Überstunden..."
          maxLength={50}
          error={errors.name}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          {formData.name.length}/50 Zeichen
        </div>
      </div>
      
      <div>
        <Label htmlFor="activity-value">
          Energiewert: {formData.value}
        </Label>
        <Slider
          id="activity-value"
          min={1}
          max={100}
          step={1}
          value={formData.value}
          onChange={(value) => setFormData(prev => ({ ...prev, value }))}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Wenig (1)</span>
          <span>Viel (100)</span>
        </div>
      </div>
      
      <div>
        <Label>Farbe</Label>
        <div className="grid grid-cols-6 gap-2 mt-2">
          {colorPalette.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                'w-8 h-8 rounded-full border-2 transition-all',
                formData.color === color
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-200 hover:border-gray-400'
              )}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
              aria-label={`Farbe ${color} auswählen`}
            />
          ))}
        </div>
        <div className="mt-2">
          <ColorPicker
            color={formData.color}
            onChange={(color) => setFormData(prev => ({ ...prev, color }))}
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Speichern...' : activity ? 'Aktualisieren' : 'Hinzufügen'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
```

### 5.3 Custom Hooks für Context Integration

```typescript
// lib/hooks/useEnergyActions.ts
import { useEnergy } from '@/lib/contexts/EnergyContext';
import { useCallback } from 'react';

export function useEnergyActions() {
  const { state, actions } = useEnergy();
  
  const addActivityWithValidation = useCallback(
    (chartType: 'positive' | 'negative', activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => {
      const validation = validateActivity(activityData);
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '));
      }
      actions.addActivity(chartType, activityData);
    },
    [actions]
  );
  
  const getChartBalance = useCallback(() => {
    const positiveTotal = state.data.positive.activities.reduce((sum, act) => sum + act.value, 0);
    const negativeTotal = state.data.negative.activities.reduce((sum, act) => sum + act.value, 0);
    
    return {
      positive: positiveTotal,
      negative: negativeTotal,
      balance: positiveTotal - negativeTotal,
      ratio: negativeTotal > 0 ? positiveTotal / negativeTotal : positiveTotal
    };
  }, [state.data]);
  
  const exportToShare = useCallback(() => {
    return actions.exportData();
  }, [actions]);
  
  return {
    ...actions,
    addActivityWithValidation,
    getChartBalance,
    exportToShare,
    data: state.data,
    isLoading: state.isLoading
  };
}

// lib/hooks/useChartData.ts
import { useEnergy } from '@/lib/contexts/EnergyContext';
import { useMemo } from 'react';

export function useChartData(chartType: 'positive' | 'negative') {
  const { state } = useEnergy();
  const chart = state.data[chartType];
  
  const chartData = useMemo(() => {
    if (!chart.activities.length) {
      return {
        labels: ['Keine Aktivitäten'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderColor: ['#d1d5db'],
          borderWidth: 2,
        }]
      };
    }
    
    return {
      labels: chart.activities.map(activity => activity.name),
      datasets: [{
        data: chart.activities.map(activity => activity.value),
        backgroundColor: chart.activities.map(activity => activity.color),
        borderColor: chart.activities.map(activity => activity.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
      }]
    };
  }, [chart.activities]);
  
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const percentage = ((context.raw / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '50%',
    elements: {
      arc: {
        borderWidth: 2
      }
    }
  }), []);
  
  return {
    data: chartData,
    options: chartOptions,
    activities: chart.activities,
    size: chart.size,
    isEmpty: chart.activities.length === 0
  };
}
```

## 6. Utility-Funktionen

### 6.1 Storage Management

```typescript
// lib/utils/storage.ts
export class StorageManager {
  private static readonly STORAGE_KEY = 'energiekuchen-data';
  private static readonly STORAGE_VERSION = '1.0';
  
  static save(data: EnergyKuchen): void {
    try {
      const dataWithVersion = {
        ...data,
        version: this.STORAGE_VERSION,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataWithVersion));
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      throw new Error('Daten konnten nicht gespeichert werden');
    }
  }
  
  static load(): EnergyKuchen | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Version migration if needed
      if (parsed.version !== this.STORAGE_VERSION) {
        return this.migrateData(parsed);
      }
      
      return this.validateAndClean(parsed);
    } catch (error) {
      console.error('Fehler beim Laden:', error);
      return null;
    }
  }
  
  static export(): string {
    const data = this.load();
    if (!data) throw new Error('Keine Daten zum Exportieren vorhanden');
    
    return JSON.stringify(data, null, 2);
  }
  
  static import(jsonString: string): EnergyKuchen {
    try {
      const data = JSON.parse(jsonString);
      const validated = this.validateAndClean(data);
      this.save(validated);
      return validated;
    } catch (error) {
      throw new Error('Ungültige Daten zum Importieren');
    }
  }
  
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  private static validateAndClean(data: any): EnergyKuchen {
    // Implement validation logic
    if (!data.positive || !data.negative) {
      throw new Error('Ungültige Datenstruktur');
    }
    
    return {
      version: this.STORAGE_VERSION,
      lastModified: data.lastModified || new Date().toISOString(),
      positive: this.validateChart(data.positive, 'positive'),
      negative: this.validateChart(data.negative, 'negative'),
      settings: this.validateSettings(data.settings)
    };
  }
  
  private static validateChart(chart: any, type: 'positive' | 'negative'): EnergyChart {
    return {
      id: chart.id || crypto.randomUUID(),
      type,
      activities: (chart.activities || []).map(this.validateActivity),
      size: ['small', 'medium', 'large'].includes(chart.size) ? chart.size : 'medium',
      title: chart.title
    };
  }
  
  private static validateActivity(activity: any): Activity {
    const validation = validateActivity(activity);
    if (!validation.isValid) {
      throw new Error(`Ungültige Aktivität: ${validation.errors.join(', ')}`);
    }
    
    return {
      id: activity.id || crypto.randomUUID(),
      name: activity.name,
      value: Math.max(1, Math.min(100, activity.value)),
      color: activity.color,
      createdAt: activity.createdAt || new Date().toISOString(),
      updatedAt: activity.updatedAt || new Date().toISOString()
    };
  }
}
```

### 6.2 Sharing System

```typescript
// lib/utils/sharing.ts
export class SharingManager {
  private static readonly MAX_URL_LENGTH = 2000;
  private static readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://energiekuchen.de' 
    : 'http://localhost:3000';
  
  static async generateShareData(data: EnergyKuchen): Promise<ShareData> {
    // Remove unnecessary fields for sharing
    const shareableData = this.prepareShareableData(data);
    
    // Compress and encode
    let encoded = this.encodeData(shareableData);
    
    // Check URL length and compress if necessary
    const url = `${this.BASE_URL}/share/${encoded}`;
    if (url.length > this.MAX_URL_LENGTH) {
      encoded = await this.compressData(shareableData);
    }
    
    const finalUrl = `${this.BASE_URL}/share/${encoded}`;
    const qrCode = await this.generateQRCode(finalUrl);
    
    return {
      encoded,
      url: finalUrl,
      qrCode
    };
  }
  
  static decodeShareData(encoded: string): EnergyKuchen {
    try {
      // Try direct decode first
      let decoded = this.decodeData(encoded);
      
      // If that fails, try decompression
      if (!decoded) {
        decoded = this.decompressData(encoded);
      }
      
      if (!decoded) {
        throw new Error('Ungültige Share-Daten');
      }
      
      return this.validateSharedData(decoded);
    } catch (error) {
      throw new Error('Geteilte Daten konnten nicht geladen werden');
    }
  }
  
  private static prepareShareableData(data: EnergyKuchen) {
    return {
      v: data.version,
      p: {
        a: data.positive.activities.map(a => ({
          n: a.name,
          v: a.value,
          c: a.color
        })),
        s: data.positive.size
      },
      n: {
        a: data.negative.activities.map(a => ({
          n: a.name,
          v: a.value,
          c: a.color
        })),
        s: data.negative.size
      },
      s: {
        cs: data.settings.chartSize,
        sc: data.settings.colorScheme
      }
    };
  }
  
  private static encodeData(data: any): string {
    const json = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  private static decodeData(encoded: string): any {
    try {
      const padded = encoded + '==='.slice(0, 4 - (encoded.length % 4));
      const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
  
  private static async compressData(data: any): Promise<string> {
    // Use compression library or implement simple compression
    const json = JSON.stringify(data);
    
    // Simple compression: remove spaces and use shorter keys
    const compressed = json
      .replace(/\s/g, '')
      .replace(/"name"/g, '"n"')
      .replace(/"value"/g, '"v"')
      .replace(/"color"/g, '"c"')
      .replace(/"activities"/g, '"a"')
      .replace(/"size"/g, '"s"');
    
    return this.encodeData(compressed);
  }
  
  private static async generateQRCode(url: string): Promise<string> {
    const QRCode = await import('qrcode');
    return QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  }
  
  private static validateSharedData(data: any): EnergyKuchen {
    // Convert compressed format back to full format
    return {
      version: data.v || '1.0',
      lastModified: new Date().toISOString(),
      positive: {
        id: crypto.randomUUID(),
        type: 'positive',
        activities: (data.p?.a || []).map((a: any) => ({
          id: crypto.randomUUID(),
          name: a.n,
          value: a.v,
          color: a.c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        size: data.p?.s || 'medium'
      },
      negative: {
        id: crypto.randomUUID(),
        type: 'negative',
        activities: (data.n?.a || []).map((a: any) => ({
          id: crypto.randomUUID(),
          name: a.n,
          value: a.v,
          color: a.c,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        size: data.n?.s || 'medium'
      },
      settings: {
        chartSize: data.s?.cs || 'medium',
        colorScheme: data.s?.sc || 'default',
        showTooltips: true,
        showLegends: true,
        language: 'de'
      }
    };
  }
}
```

## 7. Responsive Design & Accessibility

### 7.1 Responsive Breakpoints

```typescript
// lib/utils/constants.ts
export const BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
} as const;

export const RESPONSIVE_CHART_SIZES = {
  mobile: {
    small: 'w-48 h-48',
    medium: 'w-56 h-56',
    large: 'w-64 h-64'
  },
  tablet: {
    small: 'w-56 h-56',
    medium: 'w-72 h-72',
    large: 'w-80 h-80'
  },
  desktop: {
    small: 'w-64 h-64',
    medium: 'w-80 h-80',
    large: 'w-96 h-96'
  }
} as const;

export const TOUCH_TARGET_SIZE = '44px';
```

### 7.2 Accessibility Features

```typescript
// lib/hooks/useAccessibility.ts
export function useAccessibility() {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  
  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    // Clear after announcement
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  }, []);
  
  const getAriaLabel = useCallback((activity: Activity, chartType: 'positive' | 'negative') => {
    const typeLabel = chartType === 'positive' ? 'energiegebend' : 'energiezehrend';
    return `${activity.name}, ${typeLabel}, Wert ${activity.value} von 100`;
  }, []);
  
  const getChartDescription = useCallback((activities: Activity[], chartType: 'positive' | 'negative') => {
    const typeLabel = chartType === 'positive' ? 'Energiequellen' : 'Energieverbraucher';
    const total = activities.reduce((sum, activity) => sum + activity.value, 0);
    return `${typeLabel} Diagramm mit ${activities.length} Aktivitäten, Gesamtwert ${total}`;
  }, []);
  
  return {
    announcements,
    announce,
    getAriaLabel,
    getChartDescription
  };
}
```

## 8. Performance & Optimierung

### 8.1 Code Splitting Strategy

```typescript
// app/(main)/page.tsx - Lazy loading for better performance
const EnergyChart = lazy(() => import('@/components/charts/EnergyChart'));
const ShareModal = lazy(() => import('@/components/features/ShareModal'));
const SettingsPanel = lazy(() => import('@/components/features/SettingsPanel'));

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<ChartSkeleton />}>
        <EnergyChart chartType="positive" />
        <EnergyChart chartType="negative" />
      </Suspense>
      
      <Suspense fallback={null}>
        <ShareModal />
        <SettingsPanel />
      </Suspense>
    </div>
  );
}
```

### 8.2 Memoization Strategy

```typescript
// lib/hooks/useChartData.ts
export function useChartData(activities: Activity[], chartType: 'positive' | 'negative', size: ChartSize) {
  const data = useMemo(() => {
    if (activities.length === 0) {
      return getEmptyChartData(chartType);
    }
    
    return {
      labels: activities.map(a => a.name),
      datasets: [{
        data: activities.map(a => a.value),
        backgroundColor: activities.map(a => a.color),
        borderColor: activities.map(a => lightenColor(a.color, 0.2)),
        borderWidth: 2,
        hoverBackgroundColor: activities.map(a => lightenColor(a.color, 0.1)),
        hoverBorderColor: activities.map(a => darkenColor(a.color, 0.1)),
      }]
    };
  }, [activities, chartType]);
  
  const options = useMemo(() => {
    return getChartOptions(chartType, size);
  }, [chartType, size]);
  
  return { data, options };
}
```

## 9. Testing-Strategie

### 9.1 Unit Tests Structure

```typescript
// __tests__/utils/storage.test.ts
describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  describe('save and load', () => {
    it('should save and load data correctly', () => {
      const testData = createTestEnergyKuchen();
      StorageManager.save(testData);
      
      const loaded = StorageManager.load();
      expect(loaded).toEqual(testData);
    });
    
    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('energiekuchen-data', 'invalid json');
      
      const loaded = StorageManager.load();
      expect(loaded).toBeNull();
    });
  });
  
  describe('validation', () => {
    it('should validate activity data', () => {
      const invalidActivity = { name: '', value: -1, color: 'invalid' };
      const result = validateActivity(invalidActivity);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});

// __tests__/components/EnergyChart.test.tsx
describe('EnergyChart', () => {
  it('should render chart with activities', () => {
    const activities = [
      createTestActivity({ name: 'Test Activity', value: 50 })
    ];
    
    render(
      <EnergyChart 
        chartType="positive" 
        activities={activities} 
        size="medium" 
      />
    );
    
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.getByText('Energie+')).toBeInTheDocument();
  });
  
  it('should handle click events', () => {
    const onActivityClick = jest.fn();
    const activities = [createTestActivity()];
    
    render(
      <EnergyChart 
        chartType="positive" 
        activities={activities} 
        size="medium"
        onActivityClick={onActivityClick}
      />
    );
    
    fireEvent.click(screen.getByRole('img'));
    expect(onActivityClick).toHaveBeenCalledWith(activities[0]);
  });
});
```

### 9.2 E2E Tests with Playwright

```typescript
// e2e/energy-chart.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Energy Chart Management', () => {
  test('should create and edit activities', async ({ page }) => {
    await page.goto('/');
    
    // Add positive activity
    await page.click('[data-testid="add-positive-activity"]');
    await page.fill('[data-testid="activity-name"]', 'Sport');
    await page.fill('[data-testid="activity-value"]', '75');
    await page.click('[data-testid="color-green"]');
    await page.click('[data-testid="save-activity"]');
    
    // Verify activity appears in chart
    await expect(page.locator('[data-testid="positive-chart"]')).toContainText('Sport');
    
    // Edit activity
    await page.click('[data-testid="activity-sport"] [data-testid="edit-button"]');
    await page.fill('[data-testid="activity-name"]', 'Fitness');
    await page.click('[data-testid="save-activity"]');
    
    await expect(page.locator('[data-testid="positive-chart"]')).toContainText('Fitness');
  });
  
  test('should share energy chart', async ({ page }) => {
    // Create some test data
    await createTestActivities(page);
    
    // Open share modal
    await page.click('[data-testid="share-button"]');
    
    // Verify share URL is generated
    const shareUrl = await page.locator('[data-testid="share-url"]').textContent();
    expect(shareUrl).toContain('/share/');
    
    // Test share URL works
    await page.goto(shareUrl!);
    await expect(page.locator('[data-testid="positive-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="negative-chart"]')).toBeVisible();
  });
});
```

## 10. Deployment & Build Configuration

### 10.1 Build Configuration

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // PWA configuration for offline usage
  experimental: {
    appDir: true
  },
  
  // Optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

### 10.2 Error Handling

```typescript
// lib/utils/errorHandling.ts
export class ErrorHandler {
  static handleError(error: Error, context: string) {
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly message
    toast.error(this.getUserMessage(error));
  }
  
  private static getUserMessage(error: Error): string {
    if (error.message.includes('storage')) {
      return 'Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.';
    }
    
    if (error.message.includes('share')) {
      return 'Fehler beim Teilen. Bitte überprüfen Sie Ihre Internetverbindung.';
    }
    
    return 'Ein unerwarteter Fehler ist aufgetreten. Bitte laden Sie die Seite neu.';
  }
}

// Global error boundary
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        ErrorHandler.handleError(error, 'React Error Boundary');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

## 11. Implementation Roadmap

### Phase 1: Core Functionality
1. Setup Next.js project with TypeScript and Tailwind
2. Implement basic data models and validation
3. Create EnergyChart component with Chart.js
4. Implement basic CRUD operations for activities
5. Add localStorage persistence

### Phase 2: UI/UX Enhancement
1. Implement responsive design
2. Add drag & drop functionality
3. Create comprehensive form validation
4. Implement accessibility features
5. Add animations and transitions

### Phase 3: Sharing & Advanced Features
1. Implement URL-based sharing system
2. Add import/export functionality
3. Create QR code generation
4. Implement settings management
5. Add comprehensive error handling

### Phase 4: Testing & Optimization
1. Write comprehensive unit tests
2. Implement E2E testing
3. Performance optimization
4. Accessibility auditing
5. Browser compatibility testing

### Phase 5: Deployment
1. Setup production deployment on Vercel
2. Configure domain and SSL
3. Final testing and bug fixes
4. Documentation and user guide

## 12. Dependencies

### Required Package Installation

```bash
# Core dependencies
npm install next@latest react@latest react-dom@latest
npm install @types/node @types/react @types/react-dom typescript

# UI and Styling
npm install tailwindcss
npm install @heroicons/react

# Charts and Visualization
npm install chart.js react-chartjs-2
npm install qrcode @types/qrcode

# Form and Input
npm install react-colorful
npm install react-hot-toast

# Development and Testing
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test
npm install --save-dev jest jest-environment-jsdom
```

Diese umfassende Software Design Document bietet eine detaillierte technische Roadmap für die Implementation der Energiekuchen-Anwendung. Sie deckt alle Aspekte von der Architektur über die Komponenten bis hin zu Testing und Deployment ab und bietet genügend Details für eine erfolgreiche Umsetzung.
